// Chú thích: Hugging Face Inference API client cho Cloudflare Workers
// Dùng để tạo embeddings miễn phí thay thế Vertex AI
// Model: sentence-transformers/all-MiniLM-L6-v2 (miễn phí, nhanh, 384 dimensions)

// ============================================
// CONFIGURATION
// ============================================

// Chú thích: Model miễn phí, output 384 dimensions, phù hợp cho tiếng Việt
export const EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
export const EMBEDDING_DIMENSIONS = 384;

// HuggingFace API endpoint
const HF_API_URL = 'https://api-inference.huggingface.co/pipeline/feature-extraction';

// ============================================
// TYPES
// ============================================

export interface EmbeddingResult {
    embedding: number[];
    model: string;
    dimensions: number;
}

// ============================================
// API CLIENT
// ============================================

// Chú thích: Tạo embedding từ text sử dụng HuggingFace Inference API
export async function createEmbedding(
    apiToken: string,
    text: string,
    model: string = EMBEDDING_MODEL
): Promise<EmbeddingResult> {
    const t0 = Date.now();

    try {
        const response = await fetch(`${HF_API_URL}/${model}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: text,
                options: {
                    wait_for_model: true, // Chờ nếu model đang loading
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Chú thích: Response là array của arrays (mỗi token một vector)
        // Với sentence-transformers, lấy mean pooling
        let embedding: number[];

        if (Array.isArray(data) && Array.isArray(data[0])) {
            // Mean pooling: trung bình của tất cả token embeddings
            const numTokens = data.length;
            const dims = data[0].length;
            embedding = new Array(dims).fill(0);

            for (const tokenEmb of data) {
                for (let i = 0; i < dims; i++) {
                    embedding[i] += tokenEmb[i];
                }
            }

            for (let i = 0; i < dims; i++) {
                embedding[i] /= numTokens;
            }
        } else if (Array.isArray(data) && typeof data[0] === 'number') {
            // Đã là vector dạng [number...]
            embedding = data;
        } else {
            throw new Error('Unexpected embedding response format');
        }

        const latency = Date.now() - t0;
        console.log('[huggingface] embedding done', {
            latency,
            model,
            dimensions: embedding.length,
            textLen: text.length,
        });

        return {
            embedding,
            model,
            dimensions: embedding.length,
        };
    } catch (error) {
        console.error('[huggingface] embedding error:', error);
        throw error;
    }
}

// Chú thích: Tạo embeddings cho nhiều texts (batch)
export async function createEmbeddingsBatch(
    apiToken: string,
    texts: string[],
    model: string = EMBEDDING_MODEL
): Promise<EmbeddingResult[]> {
    const t0 = Date.now();

    try {
        const response = await fetch(`${HF_API_URL}/${model}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: texts,
                options: {
                    wait_for_model: true,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json() as number[][][];

        // Chú thích: Response là array của array của arrays
        // Mỗi text -> array of token embeddings -> mean pooling
        const results: EmbeddingResult[] = [];

        for (const textData of data) {
            let embedding: number[];

            if (Array.isArray(textData) && Array.isArray(textData[0])) {
                // Mean pooling
                const numTokens = textData.length;
                const dims = textData[0].length;
                embedding = new Array(dims).fill(0);

                for (const tokenEmb of textData) {
                    for (let i = 0; i < dims; i++) {
                        embedding[i] += tokenEmb[i];
                    }
                }

                for (let i = 0; i < dims; i++) {
                    embedding[i] /= numTokens;
                }
            } else if (Array.isArray(textData) && typeof textData[0] === 'number') {
                embedding = textData as unknown as number[];
            } else {
                throw new Error('Unexpected batch embedding response format');
            }

            results.push({
                embedding,
                model,
                dimensions: embedding.length,
            });
        }

        const latency = Date.now() - t0;
        console.log('[huggingface] batch embedding done', {
            latency,
            model,
            count: results.length,
        });

        return results;
    } catch (error) {
        console.error('[huggingface] batch embedding error:', error);
        throw error;
    }
}
