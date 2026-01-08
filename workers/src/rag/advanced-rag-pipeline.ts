// Advanced RAG Pipeline - Integrated pipeline with all improvements
// Chú thích: Kết hợp hybrid search, reranking, query expansion, compression

import { hybridSearch, type HybridSearchResult } from './hybrid-search';
import { rerank, type RerankerResult } from './reranker';
import { expandQuery, multiQuerySearch } from './query-expansion';
import { compressContext, type CompressedContext } from './contextual-compression';

export interface AdvancedRAGResult {
    context: string; // Final compressed context
    sources: Array<{
        id: string;
        content: string;
        score: number;
        metadata?: any;
    }>;
    metrics: {
        retrievalTime: number;
        rerankTime: number;
        compressionTime: number;
        totalTime: number;
        documentsRetrieved: number;
        documentsReranked: number;
        tokensCompressed: number;
    };
}

/**
 * Main advanced RAG pipeline
 */
export async function advancedRAGPipeline({
    query,
    vectorIndex,
    db,
    apiKey,
    options = {}
}: {
    query: string;
    vectorIndex: VectorizeIndex;
    db: D1Database;
    apiKey: string;
    options?: {
        useHybrid?: boolean; // Use hybrid search (default: true)
        useReranking?: boolean; // Use reranker (default: true)
        useQueryExpansion?: boolean; // Expand query (default: false, expensive)
        useCompression?: boolean; // Compress context (default: true)
        topK?: number;
        maxContextTokens?: number;
    };
}): Promise<AdvancedRAGResult> {
    const startTime = Date.now();
    const config = {
        useHybrid: options.useHybrid ?? true,
        useReranking: options.useReranking ?? true,
        useQueryExpansion: options.useQueryExpansion ?? false,
        useCompression: options.useCompression ?? true,
        topK: options.topK ?? 5,
        maxContextTokens: options.maxContextTokens ?? 2000
    };

    let retrievedDocs: HybridSearchResult[] = [];
    let rerankedDocs: RerankerResult[] = [];
    let compressedChunks: CompressedContext[] = [];

    // Step 1: Retrieval (with optional query expansion)
    const retrievalStart = Date.now();

    if (config.useQueryExpansion) {
        // Multi-query search
        retrievedDocs = await multiQuerySearch({
            query,
            searchFn: async (q) => {
                if (config.useHybrid) {
                    return hybridSearch({
                        query: q,
                        vectorIndex,
                        db,
                        topK: config.topK * 2 // Get more for reranking
                    });
                } else {
                    // Fallback to simple vector search
                    const { searchVectors } = await import('../vectorize');
                    const vectorResults = await searchVectors(vectorIndex, apiKey, q, undefined, config.topK * 2);
                    // Convert SearchResult to HybridSearchResult
                    return vectorResults.map(r => ({
                        id: r.id,
                        content: r.metadata?.content || '',
                        score: r.score,
                        denseScore: r.score,
                        metadata: r.metadata
                    }));
                }
            },
            topK: config.topK * 2,
            apiKey
        });
    } else {
        // Single query
        if (config.useHybrid) {
            retrievedDocs = await hybridSearch({
                query,
                vectorIndex,
                db,
                topK: config.topK * 2
            });
        } else {
            const { searchVectors } = await import('../vectorize');
            const vectorResults = await searchVectors(vectorIndex, apiKey, query, undefined, config.topK * 2);
            // Convert SearchResult to HybridSearchResult
            retrievedDocs = vectorResults.map(r => ({
                id: r.id,
                content: r.metadata?.content || '',
                score: r.score,
                denseScore: r.score,
                metadata: r.metadata
            }));
        }
    }

    const retrievalTime = Date.now() - retrievalStart;

    // Step 2: Reranking (optional)
    const rerankStart = Date.now();

    if (config.useReranking && retrievedDocs.length > 0) {
        rerankedDocs = await rerank({
            query,
            documents: retrievedDocs,
            topK: config.topK,
            apiKey
        });
    } else {
        // Use retrieved docs as-is
        rerankedDocs = retrievedDocs.slice(0, config.topK).map(doc => ({
            id: doc.id,
            content: doc.content,
            score: doc.score,
            metadata: doc.metadata
        }));
    }

    const rerankTime = Date.now() - rerankStart;

    // Step 3: Contextual compression (optional)
    const compressionStart = Date.now();

    if (config.useCompression && rerankedDocs.length > 0) {
        compressedChunks = await compressContext({
            query,
            chunks: rerankedDocs.map(doc => ({ content: doc.content, id: doc.id })),
            maxTokens: config.maxContextTokens,
            apiKey
        });
    } else {
        // No compression
        compressedChunks = rerankedDocs.map(doc => ({
            original: doc.content,
            compressed: doc.content,
            tokensSaved: 0,
            compressionRatio: 1.0
        }));
    }

    const compressionTime = Date.now() - compressionStart;
    const totalTime = Date.now() - startTime;

    // Build final context
    const context = compressedChunks
        .filter(chunk => chunk.compressed && chunk.compressed !== 'N/A')
        .map(chunk => chunk.compressed)
        .join('\n\n');

    // Prepare sources for citation
    const sources = rerankedDocs.map(doc => ({
        id: doc.id,
        content: doc.content.substring(0, 200) + '...',
        score: doc.score,
        metadata: doc.metadata
    }));

    const metrics = {
        retrievalTime,
        rerankTime,
        compressionTime,
        totalTime,
        documentsRetrieved: retrievedDocs.length,
        documentsReranked: rerankedDocs.length,
        tokensCompressed: compressedChunks.reduce((sum, c) => sum + c.tokensSaved, 0)
    };

    console.log('[AdvancedRAG] Pipeline completed:', metrics);

    return {
        context,
        sources,
        metrics
    };
}

/**
 * Simpler version for backward compatibility
 */
export async function getAdvancedRAGContext(
    apiKey: string,
    vectorIndex: VectorizeIndex,
    query: string,
    db: D1Database
): Promise<{ context: string; sources: any[] }> {
    const result = await advancedRAGPipeline({
        query,
        vectorIndex,
        db,
        apiKey,
        options: {
            useHybrid: true,
            useReranking: true,
            useQueryExpansion: false, // Disabled by default to save cost
            useCompression: true,
            topK: 5,
            maxContextTokens: 2000
        }
    });

    return {
        context: result.context,
        sources: result.sources
    };
}
