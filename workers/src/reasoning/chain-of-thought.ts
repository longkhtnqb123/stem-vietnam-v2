// Chain-of-Thought Prompting - Make AI show its reasoning
// Chú thích: CoT giúp AI suy luận tốt hơn ~30% với math/logic problems

export interface CoTResponse {
    thinking: string; // AI's reasoning process
    answer: string; // Final answer
    confidence: number; // 0-1 confidence score
}

/**
 * Generate response with Chain-of-Thought
 * AI will think step-by-step before answering
 */
export async function generateWithCoT({
    query,
    context,
    systemPrompt,
    model = 'google/gemini-2.0-flash-exp:free',
    apiKey
}: {
    query: string;
    context?: string;
    systemPrompt?: string;
    model?: string;
    apiKey: string;
}): Promise<CoTResponse> {
    const { callOpenRouter } = await import('../openrouter');

    // Build CoT prompt
    const cotPrompt = buildCoTPrompt(query, context, systemPrompt);

    try {
        const response = await callOpenRouter({
            messages: [{ role: 'user', content: cotPrompt }],
            model,
            apiKey,
            temperature: 0.7, // Allow some creativity in reasoning
            max_tokens: 4000
        });

        // Parse thinking and answer from response
        const parsed = parseCoTResponse(response.content);

        console.log('[CoT] Generated:', {
            thinkingLength: parsed.thinking.length,
            answerLength: parsed.answer.length,
            confidence: parsed.confidence
        });

        return parsed;
    } catch (error) {
        console.error('[CoT] Error:', error);

        // Fallback: Return without CoT structure
        return {
            thinking: '',
            answer: `Error generating response: ${error}`,
            confidence: 0
        };
    }
}

/**
 * Build Chain-of-Thought prompt
 */
function buildCoTPrompt(query: string, context?: string, systemPrompt?: string): string {
    return `${systemPrompt || 'Bạn là trợ lý AI thông minh.'}

${context ? `### TÀI LIỆU THAM KHẢO:\n${context}\n\n` : ''}### CÂU HỎI:
${query}

### HƯỚNG DẪN TRẢ LỜI:
Hãy suy nghĩ từng bước rõ ràng trước khi trả lời. Sử dụng format sau:

<thinking>
**Bước 1: Phân tích câu hỏi**
[Xác định câu hỏi đang hỏi gì, yêu cầu gì]

**Bước 2: Thu thập kiến thức**
[Liệt kê các kiến thức/công thức/khái niệm cần thiết]

**Bước 3: Lập kế hoạch giải quyết**
[Vạch ra các bước để trả lời]

**Bước 4: Kiểm tra logic**
[Xem xét xem giải pháp có hợp lý không, có thiếu sót gì không]
</thinking>

<answer>
[Câu trả lời chính thức, rõ ràng, đầy đủ]
</answer>

<confidence>
[Điểm tự tin từ 0.0 đến 1.0]
</confidence>

Bắt đầu!`;
}

/**
 * Parse CoT response into structured format
 */
function parseCoTResponse(rawResponse: string): CoTResponse {
    // Extract thinking section
    const thinkingMatch = rawResponse.match(/<thinking>([\s\S]*?)<\/thinking>/i);
    const thinking = thinkingMatch ? thinkingMatch[1].trim() : '';

    // Extract answer section
    const answerMatch = rawResponse.match(/<answer>([\s\S]*?)<\/answer>/i);
    const answer = answerMatch ? answerMatch[1].trim() : rawResponse;

    // Extract confidence score
    const confidenceMatch = rawResponse.match(/<confidence>([\d.]+)<\/confidence>/i);
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.8;

    return {
        thinking,
        answer: answer || rawResponse, // Fallback to full response if no answer tag
        confidence: Math.max(0, Math.min(1, confidence)) // Clamp 0-1
    };
}

/**
 * Stream CoT response (thinking first, then answer)
 */
export async function* streamCoTResponse({
    query,
    context,
    systemPrompt,
    model = 'google/gemini-2.0-flash-exp:free',
    apiKey
}: {
    query: string;
    context?: string;
    systemPrompt?: string;
    model?: string;
    apiKey: string;
}): AsyncGenerator<{ type: 'thinking' | 'answer' | 'done'; content: string }> {
    const { streamOpenRouter } = await import('../openrouter');

    const cotPrompt = buildCoTPrompt(query, context, systemPrompt);

    let inThinking = false;
    let inAnswer = false;
    let buffer = '';

    try {
        for await (const chunk of streamOpenRouter({
            messages: [{ role: 'user', content: cotPrompt }],
            model,
            apiKey,
            temperature: 0.7,
            max_tokens: 4000
        })) {
            buffer += chunk;

            // Detect thinking start
            if (!inThinking && buffer.includes('<thinking>')) {
                inThinking = true;
                yield { type: 'thinking', content: 'start' };
                buffer = buffer.split('<thinking>')[1] || '';
            }

            // Detect thinking end
            if (inThinking && buffer.includes('</thinking>')) {
                const thinkingContent = buffer.split('</thinking>')[0];
                yield { type: 'thinking', content: thinkingContent };
                inThinking = false;
                buffer = buffer.split('</thinking>')[1] || '';
            }

            // Detect answer start
            if (!inAnswer && buffer.includes('<answer>')) {
                inAnswer = true;
                yield { type: 'answer', content: 'start' };
                buffer = buffer.split('<answer>')[1] || '';
            }

            // Detect answer end
            if (inAnswer && buffer.includes('</answer>')) {
                const answerContent = buffer.split('</answer>')[0];
                yield { type: 'answer', content: answerContent };
                inAnswer = false;
                buffer = '';
                break;
            }

            // Stream content
            if (inThinking && chunk && !chunk.includes('<thinking>') && !chunk.includes('</thinking>')) {
                yield { type: 'thinking', content: chunk };
            }

            if (inAnswer && chunk && !chunk.includes('<answer>') && !chunk.includes('</answer>')) {
                yield { type: 'answer', content: chunk };
            }
        }

        yield { type: 'done', content: '' };
    } catch (error) {
        console.error('[CoT Stream] Error:', error);
        yield { type: 'done', content: `Error: ${error}` };
    }
}

/**
 * Simple CoT for math problems
 */
export async function solveWithCoT({
    problem,
    apiKey
}: {
    problem: string;
    apiKey: string;
}): Promise<{ steps: string[]; answer: string }> {
    const mathPrompt = `
Giải toán từng bước:

**Bài toán**: ${problem}

Hãy:
1. Phân tích đề bài
2. Xác định công thức cần dùng
3. Thực hiện từng bước tính toán
4. Kiểm tra lại kết quả

Format output:
<steps>
Bước 1: ...
Bước 2: ...
</steps>

<answer>
Đáp án cuối cùng
</answer>
`;

    const { callOpenRouter } = await import('../openrouter');

    const response = await callOpenRouter({
        messages: [{ role: 'user', content: mathPrompt }],
        model: 'google/gemini-2.0-flash-exp:free',
        apiKey,
        temperature: 0.3 // Low temp for math
    });

    // Parse steps
    const stepsMatch = response.content.match(/<steps>([\s\S]*?)<\/steps>/i);
    const stepsText = stepsMatch ? stepsMatch[1].trim() : '';
    const steps = stepsText.split(/Bước \d+:/).filter(s => s.trim()).map(s => s.trim());

    // Parse answer
    const answerMatch = response.content.match(/<answer>([\s\S]*?)<\/answer>/i);
    const answer = answerMatch ? answerMatch[1].trim() : response.content;

    return { steps, answer };
}
