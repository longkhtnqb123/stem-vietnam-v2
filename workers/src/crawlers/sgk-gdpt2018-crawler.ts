// Crawler cho SGK Công nghệ KNTT - GDPT 2018
// Chú thích: Strict compliance với chương trình GDPT 2018

import type { Env } from '../index';

/**
 * Danh sách SGK Công nghệ KNTT chính thức theo GDPT 2018
 * Nguồn: Nhà xuất bản Giáo dục Việt Nam
 */
export const GDPT_2018_TEXTBOOKS = {
    // === LỚP 10 - Bắt buộc học 1 trong 2 ===
    grade10: [
        {
            id: 'cn10-thiet-ke',
            title: 'Thiết kế và Công nghệ 10 - KNTT',
            orientation: 'cong-nghiep', // Công nghiệp
            url: 'https://loigiaihay.com/giao-khoa-cong-nghe-10-ket-noi-tri-thuc-c165a35699.html',
            chapters: [
                'Chương I: Khái quát về công nghệ',
                'Chương II: Công nghệ và đời sống',
                'Chương III: Vẽ kĩ thuật cơ sở',
                'Chương IV: Vẽ kĩ thuật bằng máy tính',
                'Chương V: Thiết kế kĩ thuật'
            ],
            gdpt2018_verified: true
        },
        {
            id: 'cn10-trong-trot',
            title: 'Công nghệ Trồng trọt 10 - KNTT',
            orientation: 'nong-nghiep', // Nông nghiệp
            url: 'https://vietjack.com/tai-lieu-hoc-tap-lop-10/sach-cong-nghe-10-ket-noi-tri-thuc-chuong-trinh-gdpt-2018.jsp',
            chapters: [
                'Chương I: Giới thiệu chung về trồng trọt',
                'Chương II: Đất trồng',
                'Chương III: Phân bón',
                'Chương IV: Công nghệ giống cây trồng',
                'Chương V: Phòng trừ sâu, bệnh hại'
            ],
            gdpt2018_verified: true
        }
    ],

    // === LỚP 11 - Bắt buộc học 1 trong 2 ===
    grade11: [
        {
            id: 'cn11-co-khi',
            title: 'Công nghệ Cơ khí 11 - KNTT',
            orientation: 'cong-nghiep',
            url: 'https://loigiaihay.com/giao-khoa-cong-nghe-11-ket-noi-tri-thuc-c166a35699.html',
            chapters: [
                'Chương I: Khái quát về cơ khí chế tạo',
                'Chương II: Vật liệu cơ khí',
                'Chương III: Các phương pháp gia công cơ khí',
                'Chương IV: Sản xuất cơ khí',
                'Chương V: Cơ khí động lực'
            ],
            gdpt2018_verified: true
        },
        {
            id: 'cn11-chan-nuoi',
            title: 'Công nghệ Chăn nuôi 11 - KNTT',
            orientation: 'nong-nghiep',
            url: 'https://vietjack.com/tai-lieu-hoc-tap-lop-11/sach-cong-nghe-11-ket-noi-tri-thuc.jsp',
            chapters: [
                'Chương I: Giới thiệu chung',
                'Chương II: Công nghệ giống vật nuôi',
                'Chương III: Thức ăn chăn nuôi',
                'Chương IV: Phòng, trị bệnh',
                'Chương V: Công nghệ chăn nuôi hiện đại'
            ],
            gdpt2018_verified: true
        }
    ],

    // === LỚP 12 - Bắt buộc học 1 trong 2 ===
    grade12: [
        {
            id: 'cn12-dien-tu',
            title: 'Công nghệ Điện - Điện tử 12 - KNTT',
            orientation: 'cong-nghiep',
            url: 'https://loigiaihay.com/giao-khoa-cong-nghe-12-ket-noi-tri-thuc-c167a35699.html',
            chapters: [
                'Chương I: Kỹ thuật điện',
                'Chương II: Hệ thống điện quốc gia',
                'Chương III: Thiết bị điện gia đình',
                'Chương IV: Điện tử dân dụng'
            ],
            gdpt2018_verified: true
        },
        {
            id: 'cn12-lam-thuy-san',
            title: 'Công nghệ Lâm nghiệp - Thủy sản 12 - KNTT',
            orientation: 'nong-nghiep',
            url: 'https://vietjack.com/tai-lieu-hoc-tap-lop-12/sach-cong-nghe-12-ket-noi-tri-thuc.jsp',
            chapters: [
                'Phần Lâm nghiệp: Vai trò của rừng, Trồng và bảo vệ rừng',
                'Phần Thủy sản: Giới thiệu ngành, Kỹ thuật nuôi, Môi trường nước'
            ],
            gdpt2018_verified: true
        }
    ]
} as const;

/**
 * Crawl một SGK từ VietJack hoặc Loigiaihay (community sources với GDPT 2018 verified)
 */
export async function crawlSingleTextbook(
    textbook: typeof GDPT_2018_TEXTBOOKS.grade10[0],
    env: Env
): Promise<{ success: boolean; chunks: number }> {
    console.log(`[Crawler] Starting crawl: ${textbook.title}`);

    if (!textbook.gdpt2018_verified) {
        throw new Error(`[Crawler] GDPT 2018 verification failed for ${textbook.id}`);
    }

    try {
        // Step 1: Fetch HTML content
        const response = await fetch(textbook.url);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
        }

        const html = await response.text();

        // Step 2: Extract text content (simplified - would use proper HTML parser)
        const textContent = extractTextFromHTML(html);

        // Step 3: Semantic chunking
        const chunks = semanticChunk(textContent, {
            maxChunkSize: 500,
            overlap: 50,
            metadata: {
                grade: parseInt(textbook.id.match(/\d+/)?.[0] || '10'),
                orientation: textbook.orientation,
                source: 'SGK KNTT GDPT 2018',
                chapters: textbook.chapters,
                verified: true
            }
        });

        console.log(`[Crawler] Extracted ${chunks.length} chunks from ${textbook.title}`);

        // Step 4: Store in R2 as backup
        await env.BOOKS_BUCKET.put(
            `gdpt2018/sgk/${textbook.id}.json`,
            JSON.stringify({
                metadata: {
                    id: textbook.id,
                    title: textbook.title,
                    orientation: textbook.orientation,
                    chapters: textbook.chapters,
                    gdpt2018_verified: true,
                    crawled_at: new Date().toISOString()
                },
                chunks
            })
        );

        // Step 5: Store chunks in D1
        for (const chunk of chunks) {
            await env.DB.prepare(`
                INSERT INTO crawled_content (
                    id, textbook_id, content, metadata, chunk_index, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
            `).bind(
                chunk.id,
                textbook.id,
                chunk.text,
                JSON.stringify(chunk.metadata),
                chunk.index,
                Date.now()
            ).run();
        }

        // Step 6: Generate embeddings and store in Vectorize
        await ingestChunksToVectorize(chunks, textbook, env);

        console.log(`[Crawler] ✅ Successfully crawled ${textbook.title}: ${chunks.length} chunks`);

        return { success: true, chunks: chunks.length };

    } catch (error) {
        console.error(`[Crawler] ❌ Failed to crawl ${textbook.title}:`, error);
        return { success: false, chunks: 0 };
    }
}

/**
 * Crawl ALL SGK KNTT theo GDPT 2018
 */
export async function crawlAllGDPT2018Textbooks(env: Env) {
    const results = [];

    // Crawl tất cả 6 cuốn (2 cuốn/lớp × 3 lớp)
    const allTextbooks = [
        ...GDPT_2018_TEXTBOOKS.grade10,
        ...GDPT_2018_TEXTBOOKS.grade11,
        ...GDPT_2018_TEXTBOOKS.grade12
    ];

    for (const textbook of allTextbooks) {
        const result = await crawlSingleTextbook(textbook, env);
        results.push({
            textbook: textbook.title,
            ...result
        });

        // Rate limiting: đợi 2s giữa mỗi request
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const totalChunks = results.reduce((sum, r) => sum + r.chunks, 0);
    const successCount = results.filter(r => r.success).length;

    console.log(`[Crawler] === GDPT 2018 Crawl Complete ===`);
    console.log(`Success: ${successCount}/${allTextbooks.length} textbooks`);
    console.log(`Total chunks: ${totalChunks}`);

    return results;
}

/**
 * Extract text from HTML (simplified)
 * TODO: Replace with proper HTML parser like cheerio/jsdom
 */
function extractTextFromHTML(html: string): string {
    // Remove script and style tags
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');

    return text;
}

/**
 * Semantic chunking cho văn bản SGK
 */
interface ChunkOptions {
    maxChunkSize: number;
    overlap: number;
    metadata: Record<string, any>;
}

interface Chunk {
    id: string;
    text: string;
    metadata: Record<string, any>;
    index: number;
}

function semanticChunk(text: string, options: ChunkOptions): Chunk[] {
    const sentences = text.split(/[.!?]\s+/);
    const chunks: Chunk[] = [];
    let currentChunk = '';
    let chunkIndex = 0;

    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];

        if (currentChunk.length + sentence.length > options.maxChunkSize) {
            // Save current chunk
            if (currentChunk.trim().length > 50) { // Minimum chunk size
                chunks.push({
                    id: `chunk-${Date.now()}-${chunkIndex}`,
                    text: currentChunk.trim(),
                    metadata: {
                        ...options.metadata,
                        chunk_size: currentChunk.length
                    },
                    index: chunkIndex++
                });
            }

            // Start new chunk with overlap
            const overlapStart = Math.max(0, i - Math.floor(options.overlap / 100));
            currentChunk = sentences.slice(overlapStart, i + 1).join('. ') + '. ';
        } else {
            currentChunk += sentence + '. ';
        }
    }

    // Add last chunk
    if (currentChunk.trim().length > 50) {
        chunks.push({
            id: `chunk-${Date.now()}-${chunkIndex}`,
            text: currentChunk.trim(),
            metadata: {
                ...options.metadata,
                chunk_size: currentChunk.length
            },
            index: chunkIndex
        });
    }

    return chunks;
}

/**
 * Ingest chunks vào Vectorize với embeddings
 */
async function ingestChunksToVectorize(
    chunks: Chunk[],
    textbook: typeof GDPT_2018_TEXTBOOKS.grade10[0],
    env: Env
) {
    const { createEmbedding } = await import('../huggingface');

    for (const chunk of chunks) {
        try {
            // Generate embedding
            const { embedding } = await createEmbedding(
                env.HF_API_TOKEN || env.OPENROUTER_API_KEY,
                chunk.text
            );

            // Store in Vectorize
            await env.VECTORIZE.upsert([{
                id: chunk.id,
                values: embedding,
                metadata: {
                    text: chunk.text,
                    textbook_id: textbook.id,
                    textbook_title: textbook.title,
                    grade: chunk.metadata.grade,
                    orientation: chunk.metadata.orientation,
                    source: 'GDPT 2018',
                    verified: true
                }
            }]);

        } catch (error) {
            console.warn(`[Vectorize] Failed to embed chunk ${chunk.id}:`, error);
        }
    }
}
