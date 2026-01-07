import type { RetrievedChunk, Document, DocumentChunk } from '../../types';

// Chú thích: API URL cho RAG search
const API_URL = (import.meta.env.VITE_API_URL || 'https://stem-vietnam-api.stu725114073.workers.dev').replace(/\/$/, '');

// Chú thích: Interface cho filter khi retrieve
export interface RetrieveFilters {
    grade?: '10' | '11' | '12';
    topic?: string;
    source?: string;
}

// Chú thích: Interface cho API response
interface RAGSearchResponse {
    success: boolean;
    context: string;
    sources: Array<{
        bookId: string;
        title: string;
        grade: string;
        subject: string;
        chunkIndex: number;
        content: string;
        score: number;
    }>;
    error?: string;
}

// Chú thích: Retrieve context từ backend Vectorize API
export async function retrieveContext(
    query: string,
    filters?: RetrieveFilters,
    topK: number = 5
): Promise<RetrievedChunk[]> {
    console.info('[rag] retrieving from backend', { query: query.slice(0, 50), filters, topK });

    try {
        const res = await fetch(`${API_URL}/api/admin/rag/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                filters: {
                    grade: filters?.grade,
                    subject: filters?.topic,
                },
                topK,
            }),
        });

        if (!res.ok) {
            console.warn('[rag] API error, falling back to empty context');
            return [];
        }

        const data: RAGSearchResponse = await res.json();

        if (!data.success || !data.sources) {
            console.warn('[rag] No sources in response');
            return [];
        }

        // Chú thích: Transform API response to RetrievedChunk format
        const chunks: RetrievedChunk[] = data.sources.map((source) => ({
            chunk: {
                id: `chunk-${source.bookId}-${source.chunkIndex}`,
                documentId: source.bookId,
                content: source.content,
                chunkIndex: source.chunkIndex,
            } as DocumentChunk,
            document: {
                id: source.bookId,
                title: source.title,
                grade: source.grade as '10' | '11' | '12',
                topic: source.subject,
                source: source.title,
                fileUrl: '',
                createdAt: Date.now(),
            } as Document,
            score: source.score,
        }));

        console.info('[rag] retrieved from backend', { count: chunks.length });
        return chunks;

    } catch (error) {
        console.error('[rag] Fetch error:', error);
        return []; // Graceful fallback
    }
}

// Chú thích: Build context string từ retrieved chunks
export function buildContextString(chunks: RetrievedChunk[]): string {
    if (chunks.length === 0) return '';

    return chunks.map((item, idx) => {
        return `[${idx + 1}] Nguồn: ${item.document.title} (Lớp ${item.document.grade})\n${item.chunk.content}`;
    }).join('\n\n');
}

// Chú thích: Retrieve và build context trong 1 call
export async function getRAGContext(
    query: string,
    filters?: RetrieveFilters
): Promise<{ context: string; chunks: RetrievedChunk[] }> {
    const chunks = await retrieveContext(query, filters);
    const context = buildContextString(chunks);
    return { context, chunks };
}
