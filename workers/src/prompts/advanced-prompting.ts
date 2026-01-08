// Advanced Prompting - Meta-prompting & Few-shot learning
// Chú thích: AI tự tạo prompts tốt hơn + học từ examples

/**
 * Meta-Prompting: AI generates optimal prompt for task
 */
export async function generateMetaPrompt({
    task,
    constraints,
    apiKey
}: {
    task: string;
    constraints?: string[];
    apiKey: string;
}): Promise<string> {
    const { callOpenRouter } = await import('../openrouter');

    const prompt = `Bạn là **Prompt Engineer** chuyên nghiệp.

**Task**: ${task}

${constraints ? `**Constraints**:\n${constraints.map(c => `- ${c}`).join('\n')}\n` : ''}

Hãy tạo system prompt TỐI ƯU nhất để AI hoàn thành task trên.

Prompt nên:
1. Rõ ràng, cụ thể
2. Có ví dụ (nếu cần)
3. Định dạng output rõ ràng
4. Xử lý edge cases

Trả về system prompt hoàn chỉnh:`;

    try {
        const response = await callOpenRouter(apiKey, {
            messages: [{ role: 'user', content: prompt }],
            model: 'google/gemini-2.0-flash-exp:free'
        });

        console.log('[MetaPrompt] Generated for task:', task.substring(0, 50));
        return response.text.trim();
    } catch (error) {
        console.error('[MetaPrompt] Error:', error);
        return 'Bạn là trợ lý AI hữu ích.'; // Fallback
    }
}

/**
 * Few-Shot Learning: Generate with examples
 */
export async function generateWithExamples({
    query,
    examples,
    apiKey
}: {
    query: string;
    examples: Array<{ input: string; output: string }>;
    apiKey: string;
}): Promise<string> {
    const { callOpenRouter } = await import('../openrouter');

    const examplesText = examples
        .map((ex, i) => `**Example ${i + 1}**:\nInput: ${ex.input}\nOutput: ${ex.output}`)
        .join('\n\n');

    const prompt = `Dựa vào các ví dụ sau, hãy trả lời câu hỏi mới theo style tương tự:

${examplesText}

**New Query**:
Input: ${query}
Output:`;

    try {
        const response = await callOpenRouter(apiKey, {
            messages: [{ role: 'user', content: prompt }],
            model: 'google/gemini-2.0-flash-exp:free'
        });

        return response.text.trim();
    } catch (error) {
        console.error('[FewShot] Error:', error);
        return 'Unable to generate response.';
    }
}

/**
 * Dynamic example selection from D1
 */
export async function selectExamples({
    db,
    query,
    topK = 3
}: {
    db: D1Database;
    query: string;
    topK?: number;
}): Promise<Array<{ input: string; output: string }>> {
    try {
        // Simple keyword-based selection
        // TODO: Use semantic similarity with embeddings
        const keywords = query.toLowerCase().split(' ').filter(w => w.length > 3);
        const keywordPattern = keywords.join('|');

        const results = await db.prepare(`
            SELECT input, output FROM few_shot_examples
            WHERE input LIKE ?
            ORDER BY RANDOM()
            LIMIT ?
        `).bind(`%${keywords[0]}%`, topK).all();

        return results.results.map(row => ({
            input: row.input as string,
            output: row.output as string
        }));
    } catch (error) {
        console.error('[FewShot] Select examples error:', error);
        return [];
    }
}

/**
 * Store successful example for future few-shot learning
 */
export async function storeExample({
    db,
    input,
    output,
    category
}: {
    db: D1Database;
    input: string;
    output: string;
    category?: string;
}): Promise<void> {
    try {
        await db.prepare(`
            INSERT INTO few_shot_examples (input, output, category, created_at)
            VALUES (?, ?, ?, ?)
        `).bind(input, output, category || 'general', Date.now()).run();

        console.log('[FewShot] Stored example:', { category, inputLength: input.length });
    } catch (error) {
        console.error('[FewShot] Store example error:', error);
    }
}
