// Chú thích: RAG Pipeline - Search context từ Vectorize
// Đã xoá phụ thuộc Vertex AI, Google Drive, Document AI
// Chỉ giữ lại: getRAGContext (search) và processLocalFile (parse file local)

import { createEmbeddingsBatch, insertVectors, searchVectors, buildContextFromResults, type VectorRecord, type SearchResult } from './vectorize';
import { parseFile, isFileSizeValid, MAX_FILE_SIZE, type ParsedDocument } from './file-parser';

// ============================================
// TYPES
// ============================================

// Chú thích: Config cho RAG pipeline (đã đơn giản hoá, xoá GCP)
export interface RAGPipelineConfig {
    chunkOptions?: {
        maxTokens?: number;
        overlapTokens?: number;
    };
}

// Chú thích: Book metadata để extract từ filename hoặc manual input
export interface BookMetadata {
    bookId: string;
    title: string;
    grade: '10' | '11' | '12';
    subject: 'cong_nghiep' | 'nong_nghiep';
    type: 'sgk' | 'chuyen_de' | 'de_mau';
    publisher?: string;
}

// Chú thích: Processing result
export interface ProcessingResult {
    fileId: string;
    fileName: string;
    success: boolean;
    chunksCreated: number;
    vectorsInserted: number;
    error?: string;
    latencyMs: number;
}

// Chú thích: Interface cho text chunk (inline, xoá import từ document-ai.ts)
interface TextChunk {
    id: string;
    content: string;
    startIndex: number;
    endIndex: number;
    metadata: {
        chunkIndex: number;
        totalChunks?: number;
    };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Chú thích: Chunk text thành các đoạn nhỏ hơn (đã copy từ document-ai.ts trước khi xoá)
function chunkText(
    text: string,
    documentId: string,
    options: { maxTokens?: number; overlapTokens?: number } = {}
): TextChunk[] {
    const maxTokens = options.maxTokens || 500;
    const overlapTokens = options.overlapTokens || 100;
    const separators = ['\n\n', '\n', '. ', ' '];

    const maxChars = maxTokens * 4;
    const overlapChars = overlapTokens * 4;

    const chunks: TextChunk[] = [];
    let currentIndex = 0;
    let chunkIndex = 0;

    while (currentIndex < text.length) {
        // Chú thích: Tìm điểm cắt tốt nhất
        let endIndex = Math.min(currentIndex + maxChars, text.length);

        // Chú thích: Nếu chưa hết text, tìm separator gần nhất
        if (endIndex < text.length) {
            let bestSplit = endIndex;
            for (const sep of separators) {
                const lastSep = text.lastIndexOf(sep, endIndex);
                if (lastSep > currentIndex + maxChars * 0.5) {
                    bestSplit = lastSep + sep.length;
                    break;
                }
            }
            endIndex = bestSplit;
        }

        const content = text.slice(currentIndex, endIndex).trim();

        if (content.length > 0) {
            chunks.push({
                id: `${documentId}-chunk-${chunkIndex}`,
                content,
                startIndex: currentIndex,
                endIndex,
                metadata: {
                    chunkIndex,
                },
            });
            chunkIndex++;
        }

        // Chú thích: Move to next chunk với overlap
        currentIndex = endIndex - overlapChars;
        if (currentIndex <= chunks[chunks.length - 1]?.startIndex) {
            currentIndex = endIndex; // Tránh infinite loop
        }
    }

    // Chú thích: Update totalChunks
    for (const chunk of chunks) {
        chunk.metadata.totalChunks = chunks.length;
    }

    console.log('[rag-pipeline] chunked text', {
        documentId,
        totalChunks: chunks.length,
        avgChunkSize: Math.round(text.length / chunks.length),
    });

    return chunks;
}

// ============================================
// MAIN FUNCTIONS
// ============================================

// Chú thích: Search context cho RAG (dùng HuggingFace embeddings)
export async function getRAGContext(
    hfApiToken: string,
    vectorize: VectorizeIndex,
    query: string,
    filters?: {
        grade?: string;
        subject?: string;
        type?: string;
    },
    topK: number = 5
): Promise<{
    context: string;
    sources: SearchResult[];
}> {
    const results = await searchVectors(vectorize, hfApiToken, query, filters, topK);
    const context = buildContextFromResults(results);

    return {
        context,
        sources: results,
    };
}

// Chú thích: Helper - Parse metadata từ filename
// Format expected: "SGK-CN10-CanhDieu.pdf" hoặc "ChuyenDe-CN11-KetNoi.pdf"
export function parseMetadataFromFilename(
    fileId: string,
    fileName: string
): BookMetadata | null {
    try {
        const baseName = fileName.replace('.pdf', '').replace('.PDF', '');
        const parts = baseName.split('-');

        if (parts.length < 3) return null;

        const typeMap: Record<string, 'sgk' | 'chuyen_de' | 'de_mau'> = {
            'sgk': 'sgk',
            'cd': 'chuyen_de',
            'chuyende': 'chuyen_de',
            'de': 'de_mau',
            'demau': 'de_mau',
        };

        const gradeMatch = baseName.match(/(\d{1,2})/);
        const grade = gradeMatch ? gradeMatch[1] : '10';

        const isNongNghiep = baseName.toLowerCase().includes('nn') ||
            baseName.toLowerCase().includes('nong');

        return {
            bookId: `book-${fileId.slice(0, 8)}`,
            title: baseName.replace(/-/g, ' '),
            grade: (grade === '10' || grade === '11' || grade === '12' ? grade : '10') as '10' | '11' | '12',
            subject: isNongNghiep ? 'nong_nghiep' : 'cong_nghiep',
            type: typeMap[parts[0].toLowerCase()] || 'sgk',
        };
    } catch {
        return null;
    }
}

// Chú thích: Process file upload trực tiếp (dùng HuggingFace embeddings)
// Hỗ trợ: txt, md, docx, pdf (limited), html, json
export async function processLocalFile(
    hfApiToken: string,
    vectorize: VectorizeIndex,
    fileBuffer: ArrayBuffer,
    fileName: string,
    metadata: BookMetadata,
    chunkOptions?: { maxTokens?: number; overlapTokens?: number }
): Promise<ProcessingResult> {
    const t0 = Date.now();

    try {
        // Chú thích: Step 1 - Kiểm tra file size
        if (!isFileSizeValid(fileBuffer.byteLength)) {
            throw new Error(`File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
        }

        // Chú thích: Step 2 - Parse file để lấy text
        console.log('[rag-pipeline] parsing local file', { fileName, bookId: metadata.bookId });
        const parsed = await parseFile(fileBuffer, fileName);

        if (!parsed.content || parsed.content.length < 100) {
            throw new Error('Extracted text too short or empty');
        }

        // Chú thích: Step 3 - Chunk text
        console.log('[rag-pipeline] chunking text', { textLength: parsed.content.length });
        const chunks = chunkText(parsed.content, metadata.bookId, chunkOptions);

        // Chú thích: Step 4 - Tạo embeddings (batch) với HuggingFace
        console.log('[rag-pipeline] creating embeddings', { chunks: chunks.length });
        const BATCH_SIZE = 20;
        const allEmbeddings: number[][] = [];

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);
            const texts = batch.map(c => c.content);
            const embeddings = await createEmbeddingsBatch(hfApiToken, texts);
            allEmbeddings.push(...embeddings);
        }

        // Chú thích: Step 5 - Build vector records
        const vectorRecords: VectorRecord[] = chunks.map((chunk, index) => ({
            id: chunk.id,
            values: allEmbeddings[index],
            metadata: {
                bookId: metadata.bookId,
                title: metadata.title,
                grade: metadata.grade,
                subject: metadata.subject,
                type: metadata.type,
                content: chunk.content,
            },
        }));

        // Chú thích: Step 6 - Insert vào Vectorize
        console.log('[rag-pipeline] inserting vectors');
        const insertResult = await insertVectors(vectorize, vectorRecords);

        const latency = Date.now() - t0;
        console.log('[rag-pipeline] local file completed', {
            fileName,
            bookId: metadata.bookId,
            chunks: chunks.length,
            vectors: insertResult.inserted,
            latency,
        });

        return {
            fileId: `local-${Date.now()}`,
            fileName,
            success: true,
            chunksCreated: chunks.length,
            vectorsInserted: insertResult.inserted,
            latencyMs: latency,
        };

    } catch (error) {
        const latency = Date.now() - t0;
        console.error('[rag-pipeline] local file error', { fileName, error });

        return {
            fileId: `local-${Date.now()}`,
            fileName,
            success: false,
            chunksCreated: 0,
            vectorsInserted: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
            latencyMs: latency,
        };
    }
}
