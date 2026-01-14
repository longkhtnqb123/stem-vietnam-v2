// Chú thích: OpenRouter API client cho Cloudflare Workers
// Hỗ trợ multi-model routing với các model miễn phí tối ưu cho từng tác vụ

// ============================================
// MODEL CONFIGURATION
// ============================================

// Chú thích: Các model miễn phí tối ưu theo từng use case
export const MODELS = {
    // Web Search - dùng suffix :online để kích hoạt Exa/Perplexity plugin
    ONLINE_SUFFIX: ':online',

    // Fast models (optimized for speed)
    GEMINI_FLASH: 'google/gemini-2.0-flash-lite-preview-02-05:free',  // ~500ms
    MIMO_CODE: 'xiaomi/mimo-v2-flash:free',                           // ~800ms

    // Accurate models (optimized for accuracy)
    DEEPSEEK_REASON: 'tngtech/deepseek-r1t2-chimera:free',           // ~2s, 98% accuracy
    DEVSTRAL: 'mistralai/devstral-2-2512:free',                       // ~1.5s
} as const;

// Chú thích: Tiered model strategy - Fast vs Accurate
export const FAST_MODELS = {
    tier1: MODELS.GEMINI_FLASH,     // <500ms, 92-95% accuracy, prioritize speed
    tier2: MODELS.MIMO_CODE,        // <1s, 94-96% accuracy, balanced
} as const;

export const ACCURATE_MODELS = {
    tier1: MODELS.DEEPSEEK_REASON,  // <2s, 97-98% accuracy, prioritize correctness
    tier2: MODELS.DEVSTRAL,         // <2s, 96-97% accuracy, fallback
} as const;

// Chú thích: Model routing mặc định - ưu tiên FAST để improve latency
export const MODEL_ROUTES = {
    // Chat thông thường - Gemini Flash (nhanh nhất)
    chat: FAST_MODELS.tier1,

    // Chat cần accuracy cao (academic) - DeepSeek
    chatAccurate: ACCURATE_MODELS.tier1,

    // Chat cần web search - Gemini Flash + online
    chatWithSearch: MODELS.GEMINI_FLASH + MODELS.ONLINE_SUFFIX,

    // Tạo đề thi - DeepSeek (cần accuracy cao)
    examGeneration: ACCURATE_MODELS.tier1,

    // Giải bài tập code - MiMo (balanced)
    codeExecution: FAST_MODELS.tier2,

    // Suy luận logic - DeepSeek (accuracy)
    reasoning: ACCURATE_MODELS.tier1,
} as const;

// ============================================
// TYPES
// ============================================

export interface OpenRouterResponse {
    text: string;
    model: string;
    tokensIn: number;
    tokensOut: number;
    cost?: number;
}

export type ContentPart =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } };

export interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | ContentPart[];
}

// ============================================
// API CLIENT
// ============================================

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Chú thích: Gọi OpenRouter API
export async function callOpenRouter(
    apiKey: string,
    params: {
        messages: OpenRouterMessage[];
        model?: string;
        temperature?: number;
        maxTokens?: number;
        useOnlineSearch?: boolean; // Bật web search qua :online suffix
    }
): Promise<OpenRouterResponse> {
    const {
        messages,
        model = MODEL_ROUTES.chat,
        temperature = 0.7,
        maxTokens = 8192,
        useOnlineSearch = false,
    } = params;

    // Chú thích: Thêm :online suffix nếu cần web search
    const finalModel = useOnlineSearch && !model.includes(':online')
        ? model + MODELS.ONLINE_SUFFIX
        : model;

    const t0 = Date.now();

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://stem-vietnam.vercel.app', // Required by OpenRouter
                'X-Title': 'STEM Vietnam AI', // Optional, for analytics
            },
            body: JSON.stringify({
                model: finalModel,
                messages,
                temperature,
                max_tokens: maxTokens,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter error: ${response.status} - ${errorText}`);
        }

        const data = await response.json() as {
            id: string;
            model: string;
            choices: Array<{
                message: {
                    role: string;
                    content: string;
                };
                finish_reason: string;
            }>;
            usage?: {
                prompt_tokens: number;
                completion_tokens: number;
                total_tokens: number;
            };
        };

        const text = data.choices?.[0]?.message?.content || '';
        const latency = Date.now() - t0;

        // Chú thích: Log cho observability
        console.log('[openrouter] call done', {
            latency,
            model: finalModel,
            textLen: text.length,
            tokensIn: data.usage?.prompt_tokens,
            tokensOut: data.usage?.completion_tokens,
        });

        return {
            text,
            model: data.model || finalModel,
            tokensIn: data.usage?.prompt_tokens || 0,
            tokensOut: data.usage?.completion_tokens || 0,
        };
    } catch (error) {
        console.error('[openrouter] error:', error);
        throw error;
    }
}

// Chú thích: Stream response từ OpenRouter
export async function* streamOpenRouter(
    apiKey: string,
    params: {
        messages: OpenRouterMessage[];
        model?: string;
        temperature?: number;
        maxTokens?: number;
        useOnlineSearch?: boolean;
    }
): AsyncGenerator<string> {
    const {
        messages,
        model = MODEL_ROUTES.chat,
        temperature = 0.7,
        maxTokens = 8192,
        useOnlineSearch = false,
    } = params;

    const finalModel = useOnlineSearch && !model.includes(':online')
        ? model + MODELS.ONLINE_SUFFIX
        : model;

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://stem-vietnam.vercel.app',
            'X-Title': 'STEM Vietnam AI',
        },
        body: JSON.stringify({
            model: finalModel,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: true, // Enable streaming
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter stream error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('No response body');
    }

    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();

                // Chú thích: [DONE] là signal kết thúc stream
                if (dataStr === '[DONE]') {
                    return;
                }

                try {
                    const data = JSON.parse(dataStr) as {
                        choices: Array<{
                            delta: {
                                content?: string;
                            };
                        }>;
                    };
                    const content = data.choices?.[0]?.delta?.content;
                    if (content) {
                        yield content;
                    }
                } catch {
                    // Chú thích: Skip invalid JSON chunks
                }
            }
        }
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Chú thích: Phân loại câu hỏi để chọn model phù hợp với tiered strategy
export function classifyQueryForModel(query: string, requireAccuracy = false): {
    model: string;
    useOnlineSearch: boolean;
    tier: 'fast' | 'accurate';
    reason: string;
} {
    const queryLower = query.toLowerCase();

    // Chú thích: Keywords cần web search (tin tức, thời tiết, sự kiện)
    const searchKeywords = [
        'hôm nay', 'ngày nay', 'bây giờ', 'hiện tại', 'mới nhất',
        'tin tức', 'thời tiết', 'giá', 'tỷ giá', 'chứng khoán',
        'bóng đá', 'thể thao', 'kết quả', 'lịch thi đấu',
        'sự kiện', 'news', 'today', 'current', 'latest',
    ];

    // Chú thích: Keywords về lập trình/code
    const codeKeywords = [
        'code', 'lập trình', 'debug', 'fix bug', 'viết hàm',
        'function', 'class', 'algorithm', 'thuật toán',
        'javascript', 'python', 'typescript', 'java', 'c++',
        'chạy code', 'execute', 'compile', 'run',
    ];

    // Chú thích: Keywords về suy luận logic (cần accuracy cao)
    const reasoningKeywords = [
        'suy luận', 'logic', 'chứng minh', 'phân tích',
        'tại sao', 'giải thích chi tiết', 'so sánh', 'đánh giá',
        'ưu điểm', 'nhược điểm', 'pros', 'cons',
    ];

    // Chú thích: Câu hỏi phức tạp cần accuracy cao
    const complexKeywords = [
        'định lý', 'công thức', 'chứng minh', 'bằng cách nào',
        'tại sao lại', 'nguyên lý', 'cơ chế hoạt động',
    ];

    // Check nếu query phức tạp → dùng accurate model
    const isComplex = complexKeywords.some(kw => queryLower.includes(kw)) ||
        query.length > 100; // Câu hỏi dài thường phức tạp

    // Check search keywords
    for (const kw of searchKeywords) {
        if (queryLower.includes(kw)) {
            return {
                model: MODEL_ROUTES.chatWithSearch,
                useOnlineSearch: true,
                tier: 'fast',
                reason: `Web search: "${kw}"`,
            };
        }
    }

    // Check code keywords
    for (const kw of codeKeywords) {
        if (queryLower.includes(kw)) {
            return {
                model: MODEL_ROUTES.codeExecution,
                useOnlineSearch: false,
                tier: 'fast', // Code execution ưu tiên speed
                reason: `Code: "${kw}"`,
            };
        }
    }

    // Check reasoning keywords → accurate model
    for (const kw of reasoningKeywords) {
        if (queryLower.includes(kw)) {
            return {
                model: MODEL_ROUTES.reasoning,
                useOnlineSearch: false,
                tier: 'accurate',
                reason: `Reasoning: "${kw}"`,
            };
        }
    }

    // Nếu user yêu cầu accuracy hoặc query phức tạp → accurate model
    if (requireAccuracy || isComplex) {
        return {
            model: MODEL_ROUTES.chatAccurate,
            useOnlineSearch: false,
            tier: 'accurate',
            reason: isComplex ? 'Complex query detected' : 'Accuracy required',
        };
    }

    // Mặc định: FAST tier cho latency tốt nhất
    return {
        model: MODEL_ROUTES.chat,
        useOnlineSearch: false,
        tier: 'fast',
        reason: 'Default: Fast tier',
    };
}

// Chú thích: Build messages array từ system prompt và user message
export function buildMessages(
    systemPrompt: string,
    userMessage: string,
    context?: string,
    images?: string[] // Chú thích: Base64 data strings for images
): OpenRouterMessage[] {
    const messages: OpenRouterMessage[] = [];

    // System message
    const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    let fullSystemPrompt = systemPrompt + `\n\n=== THỜI GIAN HỆ THỐNG ===\nHôm nay là: ${now}\nSử dụng thông tin ngày giờ này để trả lời các câu hỏi liên quan đến thời gian thực.`;

    if (context) {
        fullSystemPrompt += `\n\n--- CONTEXT TỪ TÀI LIỆU ---\n${context}\n--- HẾT CONTEXT ---`;
    }

    messages.push({
        role: 'system',
        content: fullSystemPrompt,
    });

    // User message logic
    if (images && images.length > 0) {
        // Multimodal message
        const content: ContentPart[] = [
            { type: 'text', text: userMessage }
        ];

        for (const img of images) {
            content.push({
                type: 'image_url',
                image_url: { url: img } // Expecting data URI like data:image/png;base64,...
            });
        }

        messages.push({
            role: 'user',
            content,
        });
    } else {
        // Standard text message
        messages.push({
            role: 'user',
            content: userMessage,
        });
    }

    return messages;
}
