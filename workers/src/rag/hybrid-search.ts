// Hybrid Search - Combine Dense (Vector) + Sparse (BM25) Retrieval
// Chú thích: Hybrid search vượt trội hơn single-method search ~15-20%

import { searchVectors, type VectorSearchResult } from '../vectorize';
import { BM25Scorer, searchWithFTS5, type BM25SearchResult, type BM25Document } from './bm25';

export interface HybridSearchResult {
    id: string;
    content: string;
    score: number; // Fused score
    denseScore?: number; // Original vector score
    sparseScore?: number; // Original BM25 score
    metadata?: Record<string, any>;
}

/**
 * Reciprocal Rank Fusion (RRF)
 * Combines rankings from multiple search methods
 * Formula: RRF(d) = Σ 1 / (k + rank_i(d))
 * where k = 60 (constant), rank_i(d) = position of doc d in ranking i
 */
export function reciprocalRankFusion(
    rankings: Array<Array<{ id: string; score?: number }>>,
    k: number = 60
): Map<string, number> {
    const scores = new Map<string, number>();

    for (const ranking of rankings) {
        ranking.forEach((item, index) => {
            const rank = index + 1; // 1-indexed
            const rrfScore = 1 / (k + rank);
            scores.set(item.id, (scores.get(item.id) || 0) + rrfScore);
        });
    }

    return scores;
}

/**
 * Weighted Sum Fusion
 * Combines normalized scores with weights
 */
export function weightedSumFusion(
    denseResults: VectorSearchResult[],
    sparseResults: BM25SearchResult[],
    denseWeight: number = 0.7,
    sparseWeight: number = 0.3
): Map<string, { score: number; denseScore?: number; sparseScore?: number }> {
    const scores = new Map<string, { score: number; denseScore?: number; sparseScore?: number }>();

    // Normalize dense scores (cosine similarity is already 0-1)
    for (const result of denseResults) {
        scores.set(result.id, {
            score: result.score * denseWeight,
            denseScore: result.score
        });
    }

    // Normalize BM25 scores
    const maxBM25 = Math.max(...sparseResults.map(r => r.score), 1);
    for (const result of sparseResults) {
        const normalizedScore = result.score / maxBM25;
        const existing = scores.get(result.id);

        if (existing) {
            existing.score += normalizedScore * sparseWeight;
            existing.sparseScore = result.score;
        } else {
            scores.set(result.id, {
                score: normalizedScore * sparseWeight,
                sparseScore: result.score
            });
        }
    }

    return scores;
}

/**
 * Main Hybrid Search Function
 */
export async function hybridSearch({
    query,
    vectorIndex,
    db,
    topK = 10,
    useFTS5 = true, // Use D1 FTS5 vs in-memory BM25
    fusionMethod = 'rrf' as 'rrf' | 'weighted',
    denseWeight = 0.7,
    sparseWeight = 0.3
}: {
    query: string;
    vectorIndex: VectorizeIndex;
    db: D1Database;
    topK?: number;
    useFTS5?: boolean;
    fusionMethod?: 'rrf' | 'weighted';
    denseWeight?: number;
    sparseWeight?: number;
}): Promise<HybridSearchResult[]> {
    // 1. Dense search (Vector similarity)
    const denseResults = await searchVectors(query, vectorIndex, topK * 2); // Fetch more candidates

    // 2. Sparse search (BM25 keyword matching)
    let sparseResults: BM25SearchResult[];

    if (useFTS5) {
        // Use D1 FTS5 (production)
        sparseResults = await searchWithFTS5(query, db, topK * 2);
    } else {
        // Use in-memory BM25 (for small datasets or testing)
        const documents: BM25Document[] = await loadDocumentsFromDB(db);
        const bm25 = new BM25Scorer(documents);
        sparseResults = bm25.search(query, documents, topK * 2);
    }

    // 3. Fusion
    let fusedScores: Map<string, { score: number; denseScore?: number; sparseScore?: number }>;

    if (fusionMethod === 'rrf') {
        const rrfScores = reciprocalRankFusion([
            denseResults.map(r => ({ id: r.id, score: r.score })),
            sparseResults.map(r => ({ id: r.id, score: r.score }))
        ]);

        fusedScores = new Map();
        for (const [id, score] of rrfScores) {
            const dense = denseResults.find(r => r.id === id);
            const sparse = sparseResults.find(r => r.id === id);
            fusedScores.set(id, {
                score,
                denseScore: dense?.score,
                sparseScore: sparse?.score
            });
        }
    } else {
        fusedScores = weightedSumFusion(denseResults, sparseResults, denseWeight, sparseWeight);
    }

    // 4. Combine results with metadata
    const allResults = new Map<string, HybridSearchResult>();

    for (const result of denseResults) {
        allResults.set(result.id, {
            id: result.id,
            content: result.metadata?.text || '',
            score: 0,
            metadata: result.metadata
        });
    }

    for (const result of sparseResults) {
        if (!allResults.has(result.id)) {
            allResults.set(result.id, {
                id: result.id,
                content: result.content,
                score: 0,
                metadata: result.metadata
            });
        }
    }

    // 5. Apply fused scores
    for (const [id, scoreData] of fusedScores) {
        const result = allResults.get(id);
        if (result) {
            result.score = scoreData.score;
            result.denseScore = scoreData.denseScore;
            result.sparseScore = scoreData.sparseScore;
        }
    }

    // 6. Sort and return top K
    const sortedResults = Array.from(allResults.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    console.log('[HybridSearch] Results:', {
        query,
        denseCount: denseResults.length,
        sparseCount: sparseResults.length,
        fusedCount: sortedResults.length,
        topScore: sortedResults[0]?.score
    });

    return sortedResults;
}

/**
 * Helper: Load documents from DB for in-memory BM25
 * Only use this for small datasets
 */
async function loadDocumentsFromDB(db: D1Database): Promise<BM25Document[]> {
    const results = await db.prepare(`
        SELECT id, content, metadata FROM book_chunks
        LIMIT 1000
    `).all();

    return results.results.map(row => ({
        id: row.id as string,
        content: row.content as string,
        metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined
    }));
}
