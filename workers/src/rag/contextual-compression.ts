// Contextual Compression - Extract only relevant parts from retrieved documents
// Chú thích: Compression giúp fit context vào token limit và giảm noise

import { callOpenRouter } from '../openrouter';

export interface CompressedContext {
    original: string;
    compressed: string;
    tokensSaved: number;
    compressionRatio: number;
}

/**
 * Compress context using extractive summarization
 * Keeps only sentences relevant to query
 */
export async function compressContext({
    query,
    chunks,
    maxTokens = 2000,
    model = 'google/gemini-2.0-flash-exp:free',
    apiKey
}: {
    query: string;
    chunks: Array<{ content: string; id?: string }>;
    maxTokens?: number;
    model?: string;
    apiKey: string;
}): Promise<CompressedContext[]> {
    const results: CompressedContext[] = [];

    for (const chunk of chunks) {
        const compressed = await compressChunk({
            query,
            content: chunk.content,
            maxTokens: Math.floor(maxTokens / chunks.length),
            model,
            apiKey
        });
        results.push(compressed);
    }

    console.log('[ContextCompression] Results:', {
        originalChunks: chunks.length,
        totalTokensSaved: results.reduce((sum, r) => sum + r.tokensSaved, 0),
        avgCompressionRatio: results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length
    });

    return results;
}

/**
 * Compress a single chunk
 */
async function compressChunk({
    query,
    content,
    maxTokens,
    model,
    apiKey
}: {
    query: string;
    content: string;
    maxTokens: number;
    model: string;
    apiKey: string;
}): Promise<CompressedContext> {
    const originalTokens = estimateTokens(content);

    // If already under limit, no compression needed
    if (originalTokens <= maxTokens) {
        return {
            original: content,
            compressed: content,
            tokensSaved: 0,
            compressionRatio: 1.0
        };
    }

    const prompt = `
Given the user query and a document chunk, extract ONLY the sentences that are directly relevant to answering the query.

**Query**: ${query}

**Document**:
${content}

**Instructions**:
- Extract relevant sentences verbatim (không sửa đổi)
- Maintain original order
- Aim for ~${maxTokens} tokens (~${Math.floor(maxTokens / 4)} Vietnamese words)
- If nothing is relevant, return "N/A"

**Output** (relevant sentences only):`;

    try {
        const response = await callOpenRouter({
            messages: [{ role: 'user', content: prompt }],
            model,
            apiKey,
            max_tokens: maxTokens + 100,
            temperature: 0
        });

        const compressed = response.content.trim();
        const compressedTokens = estimateTokens(compressed);

        return {
            original: content,
            compressed: compressed === 'N/A' ? '' : compressed,
            tokensSaved: originalTokens - compressedTokens,
            compressionRatio: compressedTokens / originalTokens
        };
    } catch (error) {
        console.error('[ContextCompression] Error:', error);

        // Fallback: truncate to maxTokens
        const words = content.split(/\s+/);
        const truncated = words.slice(0, maxTokens / 4).join(' ') + '...';

        return {
            original: content,
            compressed: truncated,
            tokensSaved: originalTokens - estimateTokens(truncated),
            compressionRatio: estimateTokens(truncated) / originalTokens
        };
    }
}

/**
 * Simple token estimation
 * Vietnamese: ~4 characters per token on average
 */
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Alternative: Sentence-level relevance scoring
 * Faster than LLM but less accurate
 */
export function extractiveSummarization(
    query: string,
    content: string,
    maxSentences: number = 5
): string {
    // Split into sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);

    const queryTokens = new Set(
        query.toLowerCase().split(/\s+/).filter(t => t.length > 2)
    );

    // Score each sentence by keyword overlap
    const scored = sentences.map(sentence => {
        const sentenceTokens = sentence.toLowerCase().split(/\s+/);
        const overlap = sentenceTokens.filter(t => queryTokens.has(t)).length;
        return {
            text: sentence.trim(),
            score: overlap
        };
    });

    // Sort by score and take top N
    scored.sort((a, b) => b.score - a.score);
    const topSentences = scored.slice(0, maxSentences);

    // Maintain original order
    const result = sentences.filter(s =>
        topSentences.some(t => t.text === s.trim())
    );

    return result.join('. ') + '.';
}

/**
 * Token budget manager - Dynamically allocate tokens across chunks
 */
export function allocateTokenBudget(
    chunks: Array<{ content: string; score: number }>,
    totalBudget: number
): Array<{ content: string; allocatedTokens: number }> {
    // Allocate proportionally to score
    const totalScore = chunks.reduce((sum, c) => sum + c.score, 0);

    return chunks.map(chunk => ({
        content: chunk.content,
        allocatedTokens: Math.floor((chunk.score / totalScore) * totalBudget)
    }));
}
