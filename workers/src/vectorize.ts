// Chú thích: Cloudflare Vectorize client cho RAG pipeline
// Sử dụng HuggingFace Inference API để tạo embeddings (miễn phí)

import { createEmbedding as hfCreateEmbedding, createEmbeddingsBatch as hfCreateEmbeddingsBatch, EMBEDDING_DIMENSIONS } from './huggingface';

// Chú thích: Re-export dimensions để các module khác biết
export { EMBEDDING_DIMENSIONS };

// Chú thích: Interface cho Vectorize record
export interface VectorRecord {
    id: string;
    values: number[];
    metadata: {
        bookId: string;
        title: string;
        grade: string;
        subject: 'cong_nghiep' | 'nong_nghiep';
        type: 'sgk' | 'chuyen_de' | 'de_mau';
        chapter?: string;
        section?: string;
        page?: number;
        content: string; // Text content để hiển thị
    };
}

// Chú thích: Interface cho search result
export interface SearchResult {
    id: string;
    score: number;
    metadata: VectorRecord['metadata'];
}

// Chú thích: Tạo embedding từ text sử dụng HuggingFace (thay thế Vertex AI)
export async function createEmbedding(
    hfApiToken: string,
    text: string
): Promise<number[]> {
    const result = await hfCreateEmbedding(hfApiToken, text);
    return result.embedding;
}

// Chú thích: Batch tạo embeddings (tiết kiệm API calls)
export async function createEmbeddingsBatch(
    hfApiToken: string,
    texts: string[]
): Promise<number[][]> {
    const results = await hfCreateEmbeddingsBatch(hfApiToken, texts);
    return results.map(r => r.embedding);
}

// Chú thích: Insert vectors vào Vectorize index
export async function insertVectors(
    vectorize: VectorizeIndex,
    records: VectorRecord[]
): Promise<{ inserted: number }> {
    // Chú thích: Cloudflare Vectorize insert API
    const vectors = records.map(record => ({
        id: record.id,
        values: record.values,
        metadata: record.metadata,
    }));

    const result = await vectorize.insert(vectors);

    console.log('[vectorize] inserted', { count: result.count });
    return { inserted: result.count };
}

// Chú thích: Search vectors với filters
export async function searchVectors(
    vectorize: VectorizeIndex,
    hfApiToken: string,
    query: string,
    filters?: {
        grade?: string;
        subject?: string;
        type?: string;
    },
    topK: number = 5
): Promise<SearchResult[]> {
    // Chú thích: Step 1 - Tạo embedding cho query dùng HuggingFace
    const queryVector = await createEmbedding(hfApiToken, query);

    // Chú thích: Step 2 - Build filter object cho Vectorize
    const filterObj: Record<string, string> = {};
    if (filters?.grade) filterObj.grade = filters.grade;
    if (filters?.subject) filterObj.subject = filters.subject;
    if (filters?.type) filterObj.type = filters.type;

    // Chú thích: Step 3 - Query Vectorize
    const results = await vectorize.query(queryVector, {
        topK,
        filter: Object.keys(filterObj).length > 0 ? filterObj : undefined,
        returnMetadata: 'all',
    });

    console.log('[vectorize] search done', {
        query: query.slice(0, 50),
        matches: results.matches.length,
    });

    // Chú thích: Step 4 - Transform results
    return results.matches.map(match => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata as VectorRecord['metadata'],
    }));
}

// Chú thích: Delete vectors by IDs
export async function deleteVectors(
    vectorize: VectorizeIndex,
    ids: string[]
): Promise<{ deleted: number }> {
    const result = await vectorize.deleteByIds(ids);
    console.log('[vectorize] deleted', { count: result.count });
    return { deleted: result.count };
}

// Chú thích: Get vector by ID
export async function getVector(
    vectorize: VectorizeIndex,
    id: string
): Promise<VectorRecord | null> {
    const result = await vectorize.getByIds([id]);
    if (result.length === 0) return null;

    const record = result[0];
    return {
        id: record.id,
        // Chú thích: Convert VectorFloatArray to number[]
        values: Array.from(record.values),
        metadata: record.metadata as VectorRecord['metadata'],
    };
}

// Chú thích: Build context string từ search results
export function buildContextFromResults(results: SearchResult[]): string {
    if (results.length === 0) return '';

    return results.map((result, index) => {
        const meta = result.metadata;
        const source = `[${meta.title}${meta.chapter ? ` - ${meta.chapter}` : ''}]`;
        return `--- Nguồn ${index + 1}: ${source} (relevance: ${(result.score * 100).toFixed(1)}%) ---\n${meta.content}`;
    }).join('\n\n');
}
