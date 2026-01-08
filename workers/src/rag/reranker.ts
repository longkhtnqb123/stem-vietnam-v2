// Reranker - Cross-Encoder for Better Ranking
// Chú thích: Reranking với cross-encoder cải thiện ~20% accuracy so với chỉ dùng cosine similarity

import { callOpenRouter } from '../openrouter';
import type { HybridSearchResult } from './hybrid-search';

export interface RerankerResult {
    id: string;
    content: string;
    score: number; // Reranked score (0-1)
    originalScore?: number;
    metadata?: Record<string, any>;
}

/**
 * Rerank using LLM-based cross-encoder
 * Uses a small, fast model to score query-document relevance
 */
export async function rerank({
    query,
    documents,
    topK = 5,
    model = 'google/gemini-2.0-flash-exp:free', // Fast and free
    apiKey
}: {
    query: string;
    documents: HybridSearchResult[];
    topK?: number;
    model?: string;
    apiKey: string;
}): Promise<RerankerResult[]> {
    if (documents.length === 0) return [];

    // Batch reranking để tăng tốc
    const batchSize = 10;
    const batches: HybridSearchResult[][] = [];

    for (let i = 0; i < documents.length; i += batchSize) {
        batches.push(documents.slice(i, i + batchSize));
    }

    const allScores: RerankerResult[] = [];

    for (const batch of batches) {
        const scores = await rerankBatch(query, batch, model, apiKey);
        allScores.push(...scores);
    }

    // Sort by reranked score và lấy top K
    allScores.sort((a, b) => b.score - a.score);

    console.log('[Reranker] Results:', {
        query,
        inputCount: documents.length,
        outputCount: allScores.length,
        topScore: allScores[0]?.score
    });

    return allScores.slice(0, topK);
}

/**
 * Rerank a batch of documents
 */
async function rerankBatch(
    query: string,
    documents: HybridSearchResult[],
    model: string,
    apiKey: string
): Promise<RerankerResult[]> {
    // Construct prompt for batch scoring
    const prompt = `
You are a relevance scoring system. Given a user query and a list of document snippets, score each document's relevance to the query on a scale of 0.0 to 1.0.

**Query**: ${query}

**Documents**:
${documents.map((doc, i) => `
[${i}] ${doc.content.substring(0, 300)}...
`).join('\n')}

**Instructions**:
- Return ONLY a JSON array of scores
- Each score should be between 0.0 (not relevant) and 1.0 (highly relevant)
- Consider semantic relevance, not just keyword matching
- Format: [0.8, 0.3, 0.9, ...]

**Output**:`;

    try {
        const response = await callOpenRouter({
            messages: [{ role: 'user', content: prompt }],
            model: model,
            apiKey: apiKey,
            max_tokens: 500,
            temperature: 0.1 // Low temperature for consistent scoring
        });

        // Parse JSON response
        const scoresText = response.content.trim();
        const scores: number[] = JSON.parse(scoresText);

        // Map scores to documents
        return documents.map((doc, i) => ({
            id: doc.id,
            content: doc.content,
            score: scores[i] || 0,
            originalScore: doc.score,
            metadata: doc.metadata
        }));
    } catch (error) {
        console.error('[Reranker] Error:', error);

        // Fallback: return original scores
        return documents.map(doc => ({
            id: doc.id,
            content: doc.content,
            score: doc.score, // Use original score as fallback
            originalScore: doc.score,
            metadata: doc.metadata
        }));
    }
}

/**
 * Alternative: Rerank using dedicated reranker model (Jina AI)
 * Requires separate API call to Jina or HuggingFace
 */
export async function rerankWithJina({
    query,
    documents,
    topK = 5,
    apiKey
}: {
    query: string;
    documents: HybridSearchResult[];
    topK?: number;
    apiKey?: string;
}): Promise<RerankerResult[]> {
    try {
        const response = await fetch('https://api.jina.ai/v1/rerank', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'jina-reranker-v2-base-multilingual',
                query: query,
                documents: documents.map(d => d.content),
                top_n: topK
            })
        });

        const data = await response.json() as {
            results: Array<{ index: number; relevance_score: number }>;
        };

        // Map Jina results back to documents
        return data.results.map(result => ({
            id: documents[result.index].id,
            content: documents[result.index].content,
            score: result.relevance_score,
            originalScore: documents[result.index].score,
            metadata: documents[result.index].metadata
        }));
    } catch (error) {
        console.error('[Reranker] Jina API error:', error);

        // Fallback to LLM-based reranking
        return rerank({ query, documents, topK, apiKey: apiKey || '' });
    }
}

/**
 * Lightweight reranking: Just reorder by keyword overlap
 * Fast but less accurate - use only if budget-constrained
 */
export function lightweightRerank(
    query: string,
    documents: HybridSearchResult[],
    topK: number = 5
): RerankerResult[] {
    const queryTokens = new Set(
        query.toLowerCase().split(/\s+/).filter(t => t.length > 2)
    );

    const scored = documents.map(doc => {
        const docTokens = doc.content.toLowerCase().split(/\s+/);
        const overlap = docTokens.filter(t => queryTokens.has(t)).length;
        const score = overlap / queryTokens.size; // Jaccard-like

        return {
            id: doc.id,
            content: doc.content,
            score: score * 0.3 + (doc.score || 0) * 0.7, // Combine with original
            originalScore: doc.score,
            metadata: doc.metadata
        };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
}
