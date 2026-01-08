// Self-Reflection - AI critiques and improves its own answers
// Chú thích: Self-reflection giảm hallucination ~25%, tăng accuracy

export interface ReflectionResult {
    hasIssues: boolean;
    feedback: string;
    issues: string[];
    confidence: number;
}

export interface RevisedAnswer {
    original: string;
    revised: string;
    improvements: string[];
    finalConfidence: number;
}

/**
 * Self-critique: AI reviews its own answer for issues
 */
export async function selfCritique({
    query,
    answer,
    context,
    apiKey,
    model = 'google/gemini-2.0-flash-exp:free'
}: {
    query: string;
    answer: string;
    context?: string;
    apiKey: string;
    model?: string;
}): Promise<ReflectionResult> {
    const { callOpenRouter } = await import('../openrouter');

    const critiquePrompt = `
Bạn là một **Thẩm định viên** (Critic) chuyên nghiệp. Nhiệm vụ của bạn là kiểm tra câu trả lời AI vừa tạo ra.

### CÂU HỎI GỐC:
${query}

${context ? `### TÀI LIỆU THAM KHẢO:\n${context}\n\n` : ''}### CÂU TRẢ LỞI CẦN KIỂM TRA:
${answer}

### NHIỆM VỤ KIỂM TRA:
Hãy tìm các vấn đề sau (nếu có):

1. **Ảo giác (Hallucination)**: Thông tin sai lệch, không có trong tài liệu tham khảo
2. **Logic sai**: Suy luận không hợp lý, mâu thuẫn
3. **Thiếu thông tin**: Không trả lời đầy đủ câu hỏi
4. **Không liên quan**: Trả lời sai trọng tâm

### OUTPUT FORMAT (JSON):
{
  "hasIssues": true/false,
  "feedback": "Nhận xét tổng quan",
  "issues": ["Vấn đề 1", "Vấn đề 2"],
  "confidence": 0.85
}

Chỉ trả về JSON, không thêm text khác.`;

    try {
        const response = await callOpenRouter({
            messages: [{ role: 'user', content: critiquePrompt }],
            model,
            apiKey,
            temperature: 0.2, // Low temp for consistent critique
            max_tokens: 1000
        });

        // Parse JSON response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid JSON response from critic');
        }

        const result = JSON.parse(jsonMatch[0]) as ReflectionResult;

        console.log('[SelfReflection] Critique:', {
            hasIssues: result.hasIssues,
            issuesCount: result.issues.length,
            confidence: result.confidence
        });

        return result;
    } catch (error) {
        console.error('[SelfReflection] Critique error:', error);

        // Fallback: assume no issues
        return {
            hasIssues: false,
            feedback: 'Unable to critique (error)',
            issues: [],
            confidence: 0.5
        };
    }
}

/**
 * Revise answer based on critique
 */
export async function reviseAnswer({
    originalAnswer,
    critique,
    query,
    context,
    apiKey,
    model = 'google/gemini-2.0-flash-exp:free'
}: {
    originalAnswer: string;
    critique: ReflectionResult;
    query: string;
    context?: string;
    apiKey: string;
    model?: string;
}): Promise<RevisedAnswer> {
    const { callOpenRouter } = await import('../openrouter');

    const revisionPrompt = `
Bạn là AI cần **sửa lại câu trả lời** dựa trên nhận xét từ Thẩm định viên.

### CÂU HỎI GỐC:
${query}

${context ? `### TÀI LIỆU THAM KHẢO:\n${context}\n\n` : ''}### CÂU TRẢ LỜI CŨ (có vấn đề):
${originalAnswer}

### NHẬN XÉT TỪ THẨM ĐỊNH VIÊN:
${critique.feedback}

**Các vấn đề cần sửa**:
${critique.issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

### NHIỆM VỤ:
Viết lại câu trả lời để:
- Sửa tất cả các vấn đề đã chỉ ra
- Giữ lại phần đúng từ câu trả lời cũ
- Bổ sung thông tin thiếu (nếu có trong tài liệu)
- Đảm bảo logic chặt chẽ

### OUTPUT FORMAT:
<revised>
[Câu trả lời mới đã sửa]
</revised>

<improvements>
- Cải thiện 1
- Cải thiện 2
</improvements>

<confidence>
[Điểm tự tin 0.0-1.0]
</confidence>
`;

    try {
        const response = await callOpenRouter({
            messages: [{ role: 'user', content: revisionPrompt }],
            model,
            apiKey,
            temperature: 0.5,
            max_tokens: 3000
        });

        // Parse revised answer
        const revisedMatch = response.content.match(/<revised>([\s\S]*?)<\/revised>/i);
        const revised = revisedMatch ? revisedMatch[1].trim() : response.content;

        // Parse improvements
        const improvementsMatch = response.content.match(/<improvements>([\s\S]*?)<\/improvements>/i);
        const improvementsText = improvementsMatch ? improvementsMatch[1].trim() : '';
        const improvements = improvementsText
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.trim().substring(1).trim());

        // Parse confidence
        const confidenceMatch = response.content.match(/<confidence>([\d.]+)<\/confidence>/i);
        const finalConfidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.9;

        console.log('[SelfReflection] Revision:', {
            improvementsCount: improvements.length,
            finalConfidence
        });

        return {
            original: originalAnswer,
            revised,
            improvements,
            finalConfidence: Math.max(0, Math.min(1, finalConfidence))
        };
    } catch (error) {
        console.error('[SelfReflection] Revision error:', error);

        // Fallback: return original
        return {
            original: originalAnswer,
            revised: originalAnswer,
            improvements: [],
            finalConfidence: critique.confidence
        };
    }
}

/**
 * Generate with self-reflection (draft → critique → revise)
 */
export async function generateWithReflection({
    query,
    context,
    systemPrompt,
    apiKey,
    model = 'google/gemini-2.0-flash-exp:free',
    maxIterations = 2 // Max số lần revise
}: {
    query: string;
    context?: string;
    systemPrompt?: string;
    apiKey: string;
    model?: string;
    maxIterations?: number;
}): Promise<{
    final: string;
    iterations: Array<{
        answer: string;
        critique: ReflectionResult;
        revised?: string;
    }>;
}> {
    const { callOpenRouter } = await import('../openrouter');
    const iterations: Array<{
        answer: string;
        critique: ReflectionResult;
        revised?: string;
    }> = [];

    // Step 1: Generate initial answer
    let currentAnswer = '';
    try {
        const response = await callOpenRouter({
            messages: [
                { role: 'system', content: systemPrompt || 'Bạn là trợ lý AI thông minh.' },
                { role: 'user', content: context ? `${context}\n\n${query}` : query }
            ],
            model,
            apiKey,
            temperature: 0.7
        });
        currentAnswer = response.content;
    } catch (error) {
        console.error('[SelfReflection] Initial generation error:', error);
        return {
            final: `Error generating answer: ${error}`,
            iterations: []
        };
    }

    // Step 2: Iterate critique → revise loop
    for (let i = 0; i < maxIterations; i++) {
        // Critique current answer
        const critique = await selfCritique({
            query,
            answer: currentAnswer,
            context,
            apiKey,
            model
        });

        iterations.push({
            answer: currentAnswer,
            critique
        });

        // If no issues, done!
        if (!critique.hasIssues || critique.confidence > 0.85) {
            console.log(`[SelfReflection] Converged after ${i + 1} iteration(s)`);
            break;
        }

        // Revise answer
        const revision = await reviseAnswer({
            originalAnswer: currentAnswer,
            critique,
            query,
            context,
            apiKey,
            model
        });

        iterations[iterations.length - 1].revised = revision.revised;
        currentAnswer = revision.revised;

        // If revised answer is confident, done!
        if (revision.finalConfidence > 0.9) {
            console.log(`[SelfReflection] High confidence after revision ${i + 1}`);
            break;
        }
    }

    return {
        final: currentAnswer,
        iterations
    };
}
