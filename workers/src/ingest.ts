// Chú thích: Script ingest SGK từ R2 vào Vectorize
// Chạy qua wrangler: npx wrangler dev --local (hoặc deploy rồi gọi API)
// Endpoint: POST /api/admin/ingest

import { generateId, JWTPayload } from './auth';
import { createEmbeddingsBatch, insertVectors, VectorRecord, deleteVectors } from './vectorize';

// ==================== Types ====================

interface IngestEnv {
    DB: D1Database;
    VECTORIZE: VectorizeIndex;
    BOOKS_BUCKET: R2Bucket;
    HF_API_TOKEN: string;
    CORS_ORIGIN: string;
}

interface IngestRequest {
    // Lọc files để ingest (optional, nếu không có sẽ ingest tất cả)
    prefix?: string;  // VD: "dulieu/SGK/" để chỉ ingest sách giáo khoa
    grade?: string;   // "10", "11", "12"
    branch?: 'cong_nghiep' | 'nong_nghiep';
    maxFiles?: number; // Giới hạn số file để test
    dryRun?: boolean;  // Chỉ list files, không insert
}

interface IngestResult {
    success: boolean;
    filesProcessed: number;
    chunksInserted: number;
    errors: string[];
    files: string[];
}

// ==================== Helpers ====================

// Chú thích: Parse filename để lấy metadata
function parseFilename(key: string): Partial<VectorRecord['metadata']> {
    const filename = key.split('/').pop() || '';
    const lower = filename.toLowerCase();

    // Xác định grade
    let grade = '10';
    if (lower.includes('lớp 11') || lower.includes('lop 11') || lower.includes('11')) grade = '11';
    if (lower.includes('lớp 12') || lower.includes('lop 12') || lower.includes('12')) grade = '12';

    // Xác định branch/subject
    let subject: 'cong_nghiep' | 'nong_nghiep' = 'cong_nghiep';
    if (lower.includes('nông nghiệp') || lower.includes('nong nghiep') ||
        lower.includes('trồng trọt') || lower.includes('chăn nuôi') ||
        lower.includes('lâm nghiệp') || lower.includes('thủy sản')) {
        subject = 'nong_nghiep';
    }

    // Xác định type
    let type: 'sgk' | 'chuyen_de' | 'de_mau' = 'sgk';
    if (lower.includes('chuyên đề') || lower.includes('chuyen de')) type = 'chuyen_de';
    if (lower.includes('đề thi') || lower.includes('de thi') || lower.includes('ma_de')) type = 'de_mau';

    // Xác định title
    let title = filename.replace('.pdf', '').replace('.docx', '').replace('.txt', '');

    return { grade, subject, type, title };
}

// Chú thích: Split text thành chunks với overlap
function splitIntoChunks(text: string, chunkSize = 1000, overlap = 200): string[] {
    const chunks: string[] = [];

    // Xử lý text trống
    if (!text || text.trim().length === 0) return chunks;

    // Split theo paragraphs trước
    const paragraphs = text.split(/\n\s*\n/);

    let currentChunk = '';

    for (const para of paragraphs) {
        const trimmed = para.trim();
        if (!trimmed) continue;

        if (currentChunk.length + trimmed.length < chunkSize) {
            currentChunk += '\n\n' + trimmed;
        } else {
            if (currentChunk.length >= 100) { // Minimum chunk size
                chunks.push(currentChunk.trim());
            }
            // Bắt đầu chunk mới với overlap
            const words = currentChunk.split(' ');
            const overlapWords = words.slice(-Math.floor(overlap / 5)); // ~5 chars per word
            currentChunk = overlapWords.join(' ') + '\n\n' + trimmed;
        }
    }

    // Chunk cuối
    if (currentChunk.length >= 100) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

// Chú thích: Extract text từ PDF/DOCX (simple extraction)
// Note: Cloudflare Workers không có native PDF parser, cần dùng text-based approach
async function extractTextFromFile(content: ArrayBuffer, filename: string): Promise<string> {
    const lower = filename.toLowerCase();

    // Với DOCX, có thể extract text từ XML
    if (lower.endsWith('.docx')) {
        // DOCX là ZIP chứa XML, nhưng extraction phức tạp trong Workers
        // Fallback: convert ArrayBuffer thành string để tìm text
        try {
            const decoder = new TextDecoder('utf-8', { fatal: false });
            const rawText = decoder.decode(content);
            // Extract text từ XML tags
            const textMatches = rawText.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
            if (textMatches) {
                return textMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
            }
        } catch (e) {
            console.warn('[ingest] DOCX parse failed:', e);
        }
    }

    // Với PDF, text extraction rất khó trong Workers
    // Phải dùng pre-processed text hoặc OCR service
    if (lower.endsWith('.pdf')) {
        // Chú thích: PDF cần pre-process bên ngoài hoặc dùng external API
        // Tạm thời trả về filename để identify
        console.warn('[ingest] PDF needs pre-processing:', filename);
        return `[PDF File] ${filename} - Cần pre-process bằng external tool`;
    }

    // Plain text files
    try {
        const decoder = new TextDecoder('utf-8', { fatal: false });
        return decoder.decode(content);
    } catch (e) {
        return '';
    }
}

// ==================== Main Ingest Function ====================

export async function ingestFromR2(
    request: Request,
    user: JWTPayload,
    env: IngestEnv
): Promise<Response> {
    const origin = env.CORS_ORIGIN?.split(';')[0] || '*';

    try {
        const body = await request.json() as IngestRequest;

        console.info('[ingest] Starting ingest...', body);

        const result: IngestResult = {
            success: true,
            filesProcessed: 0,
            chunksInserted: 0,
            errors: [],
            files: [],
        };

        // 1. List files từ R2
        const listOptions: R2ListOptions = {
            prefix: body.prefix || 'dulieu/',
            limit: body.maxFiles || 100,
        };

        const listed = await env.BOOKS_BUCKET.list(listOptions);

        console.info('[ingest] Found files:', listed.objects.length);

        // Filter theo grade/branch nếu cần
        let filesToProcess = listed.objects.filter(obj => {
            const key = obj.key.toLowerCase();
            // Skip folders
            if (key.endsWith('/')) return false;
            // Only PDFs, DOCXs, and TXTs
            if (!key.endsWith('.pdf') && !key.endsWith('.docx') && !key.endsWith('.txt')) return false;
            // Filter by grade
            if (body.grade && !key.includes(`lớp ${body.grade}`) && !key.includes(`lop ${body.grade}`) && !key.includes(body.grade)) {
                return false;
            }
            // Filter by branch
            if (body.branch) {
                const isAgri = key.includes('nông') || key.includes('trồng') || key.includes('chăn') || key.includes('lâm') || key.includes('thủy');
                if (body.branch === 'nong_nghiep' && !isAgri) return false;
                if (body.branch === 'cong_nghiep' && isAgri) return false;
            }
            return true;
        });

        result.files = filesToProcess.map(f => f.key);

        // Dry run mode - chỉ list files
        if (body.dryRun) {
            return jsonResponse({
                ...result,
                message: 'Dry run - files listed but not processed',
            }, 200, origin);
        }

        // 2. Process từng file
        const allRecords: VectorRecord[] = [];

        for (const obj of filesToProcess) {
            try {
                console.info('[ingest] Processing:', obj.key);

                // Get file content
                const fileObj = await env.BOOKS_BUCKET.get(obj.key);
                if (!fileObj) {
                    result.errors.push(`File not found: ${obj.key}`);
                    continue;
                }

                const content = await fileObj.arrayBuffer();
                const text = await extractTextFromFile(content, obj.key);

                if (!text || text.length < 100) {
                    result.errors.push(`Empty or too short: ${obj.key}`);
                    continue;
                }

                // Split thành chunks
                const chunks = splitIntoChunks(text);

                if (chunks.length === 0) {
                    result.errors.push(`No chunks created: ${obj.key}`);
                    continue;
                }

                // Parse metadata từ filename
                const meta = parseFilename(obj.key);
                const bookId = obj.key.replace(/[^a-zA-Z0-9]/g, '_');

                // Tạo records cho từng chunk
                for (let i = 0; i < chunks.length; i++) {
                    const chunkId = `${bookId}_chunk_${i}`;
                    allRecords.push({
                        id: chunkId,
                        values: [], // Sẽ fill sau khi tạo embeddings
                        metadata: {
                            bookId,
                            title: meta.title || obj.key,
                            grade: meta.grade || '10',
                            subject: meta.subject || 'cong_nghiep',
                            type: meta.type || 'sgk',
                            section: `Chunk ${i + 1}/${chunks.length}`,
                            content: chunks[i],
                        },
                    });
                }

                result.filesProcessed++;

            } catch (err: any) {
                result.errors.push(`Error processing ${obj.key}: ${err.message}`);
                console.error('[ingest] File error:', obj.key, err);
            }
        }

        // 3. Tạo embeddings theo batch
        if (allRecords.length > 0) {
            console.info('[ingest] Creating embeddings for', allRecords.length, 'chunks...');

            const batchSize = 10; // HuggingFace batch limit

            for (let i = 0; i < allRecords.length; i += batchSize) {
                const batch = allRecords.slice(i, i + batchSize);
                const texts = batch.map(r => r.metadata.content);

                try {
                    const embeddings = await createEmbeddingsBatch(env.HF_API_TOKEN, texts);

                    // Fill embeddings vào records
                    for (let j = 0; j < batch.length; j++) {
                        batch[j].values = embeddings[j];
                    }

                    console.info(`[ingest] Embeddings created: ${i + batch.length}/${allRecords.length}`);

                } catch (err: any) {
                    result.errors.push(`Embedding error batch ${i}: ${err.message}`);
                    // Remove records without embeddings
                    for (const rec of batch) {
                        const idx = allRecords.indexOf(rec);
                        if (idx > -1) allRecords.splice(idx, 1);
                    }
                }
            }

            // 4. Insert vào Vectorize
            const validRecords = allRecords.filter(r => r.values.length > 0);

            if (validRecords.length > 0) {
                console.info('[ingest] Inserting', validRecords.length, 'records into Vectorize...');

                // Insert theo batch (Vectorize có limit)
                const insertBatchSize = 50;
                for (let i = 0; i < validRecords.length; i += insertBatchSize) {
                    const insertBatch = validRecords.slice(i, i + insertBatchSize);
                    try {
                        const insertResult = await insertVectors(env.VECTORIZE, insertBatch);
                        result.chunksInserted += insertResult.inserted;
                    } catch (err: any) {
                        result.errors.push(`Insert error batch ${i}: ${err.message}`);
                    }
                }
            }
        }

        console.info('[ingest] Done!', result);

        return jsonResponse(result, 200, origin);

    } catch (error: any) {
        console.error('[ingest] Fatal error:', error);
        return jsonResponse({
            success: false,
            error: error.message,
        }, 500, origin);
    }
}

// Helper response
function jsonResponse(data: unknown, status: number, origin: string): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin || '*',
        },
    });
}
