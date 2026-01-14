// Synthetic Training Data Generator
// Chú thích: Generate Q&A pairs from crawled SGK content for AI training

import type { Env } from '../index';
import { callOpenRouter, MODEL_ROUTES } from '../openrouter';

/**
 * Generate synthetic Q&A from a text chunk
 */
export async function generateSyntheticQA(
    chunkText: string,
    metadata: {
        grade: number;
        orientation: string;
        chapter?: string;
    },
    apiKey: string
): Promise<Array<{
    question: string;
    answer: string;
    level: 'remember' | 'understand' | 'apply';
    confidence: number;
}>> {
    const prompt = `Dựa trên đoạn text SGK Công nghệ KNTT sau, tạo 3 cặp câu hỏi-đáp án chất lượng cao cho ${metadata.orientation === 'cong-nghiep' ? 'định hướng Công nghiệp' : 'định hướng Nông nghiệp'}, lớp ${metadata.grade}.

ĐOẠN TEXT:
${chunkText}

YÊU CẦU:
1. Câu hỏi phải rõ ràng, có giá trị học thuật
2. Đáp án phải chính xác, đầy đủ, dựa ĐÚNG vào text
3. Cover các mức độ: Nhận biết (remember), Thông hiểu (understand), Vận dụng (apply)
4. Độ tin cậy (confidence): 0.0-1.0 (≥0.8 là tốt)

OUTPUT (JSON):
\`\`\`json
[
  {
    "level": "remember",
    "question": "...",
    "answer": "...",
    "confidence": 0.95
  },
  {
    "level": "understand",
    "question": "...",
    "answer": "...",
    "confidence": 0.90
  },
  {
    "level": "apply",
    "question": "...",
    "answer": "...",
    "confidence": 0.85
  }
]
\`\`\`

CHỈ TRẢ VỀ JSON, KHÔNG GHI CHÚ GÌ THÊM.`;

    try {
        const response = await callOpenRouter(apiKey, {
            messages: [{ role: 'user', content: prompt }],
            model: MODEL_ROUTES.reasoning, // DeepSeek for quality
            temperature: 0.7
        });

        // Extract JSON from response
        const jsonMatch = response.text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.warn('[Synthetic] No valid JSON in response');
            return [];
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Validate & filter
        return parsed.filter((qa: any) =>
            qa.question?.length > 10 &&
            qa.answer?.length > 20 &&
            qa.confidence >= 0.7
        );

    } catch (error) {
        console.error('[Synthetic] Generation failed:', error);
        return [];
    }
}

/**
 * Generate training examples from crawled content
 */
export async function generateTrainingData(env: Env, limit = 100): Promise<number> {
    console.log('[Synthetic] Generating training data from crawled content...');

    // Get GDPT 2018 verified chunks
    const chunks = await env.DB.prepare(`
        SELECT id, content, metadata
        FROM crawled_content 
        WHERE gdpt2018_verified = TRUE
        AND quality_score >= 70
        ORDER BY RANDOM()
        LIMIT ?
    `).bind(limit).all();

    let totalExamples = 0;

    for (const chunk of chunks.results as any[]) {
        try {
            const metadata = JSON.parse(chunk.metadata);
            const apiKey = env.OPENROUTER_API_KEY || env.HF_API_TOKEN;

            // Generate Q&A pairs
            const qaList = await generateSyntheticQA(chunk.content, metadata, apiKey);

            // Store in training_examples table
            for (const qa of qaList) {
                await env.DB.prepare(`
                    INSERT INTO training_examples (
                        id, prompt, completion, example_type, source_content_id,
                        quality_score, metadata, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    `train-${chunk.id}-${qa.level}-${Date.now()}`,
                    `Câu hỏi: ${qa.question}`,
                    `Đáp án: ${qa.answer}`,
                    'chat',
                    chunk.id,
                    qa.confidence * 100,
                    JSON.stringify({ level: qa.level, ...metadata }),
                    Date.now()
                ).run();

                totalExamples++;
            }

            console.log(`[Synthetic] Generated ${qaList.length} examples from chunk ${chunk.id}`);

            // Rate limiting - don't spam OpenRouter
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.warn(`[Synthetic] Failed chunk ${chunk.id}:`, error);
        }
    }

    console.log(`[Synthetic] ✅ Total training examples generated: ${totalExamples}`);

    return totalExamples;
}

/**
 * Export training data for fine-tuning
 */
export async function exportTrainingData(env: Env): Promise<string> {
    console.log('[Synthetic] Exporting training data...');

    const examples = await env.DB.prepare(`
        SELECT prompt, completion, example_type, quality_score, metadata
        FROM training_examples
        WHERE quality_score >= 80
        ORDER BY quality_score DESC
        LIMIT 1000
    `).all();

    // Format as JSONL for fine-tuning
    const jsonl = examples.results.map((ex: any) =>
        JSON.stringify({
            messages: [
                { role: 'user', content: ex.prompt },
                { role: 'assistant', content: ex.completion }
            ],
            metadata: JSON.parse(ex.metadata || '{}')
        })
    ).join('\n');

    // Store in R2
    const filename = `training_data_${new Date().toISOString().split('T')[0]}.jsonl`;
    await env.BOOKS_BUCKET.put(`training/${filename}`, jsonl);

    console.log(`[Synthetic] ✅ Exported ${examples.results.length} examples to ${filename}`);

    return filename;
}
