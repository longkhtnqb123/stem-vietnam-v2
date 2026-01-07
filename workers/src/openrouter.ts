// Chú thích: OpenRouter API client cho Cloudflare Workers
// Hỗ trợ multi-model routing với các model miễn phí tối ưu cho từng tác vụ

// ============================================
// MODEL CONFIGURATION
// ============================================

// Chú thích: Các model miễn phí tối ưu theo từng use case
export const MODELS = {
    // Web Search - dùng suffix :online để kích hoạt Exa/Perplexity plugin
    // Có thể append vào bất kỳ model nào
    ONLINE_SUFFIX: ':online',

    // File Search, URL Context, Multimodal - Gemini 2.0 Flash
    GEMINI_FLASH: 'google/gemini-2.0-flash-exp:free',

    // Code Execution - Xiaomi MiMo (ngang Claude 4.5 Sonnet)
    MIMO_CODE: 'xiaomi/mimo-v2-flash:free',

    // Agentic Coding - Devstral (xử lý codebase lớn)  
    DEVSTRAL: 'mistralai/devstral-2-2512:free',

    // Reasoning/Logic - DeepSeek R1 Chimera
    DEEPSEEK_REASON: 'tngtech/deepseek-r1t2-chimera:free',
} as const;

// Chú thích: Model mặc định cho từng loại tác vụ
export const MODEL_ROUTES = {
    // Chat thông thường - Gemini Flash (nhanh, đa năng)
    chat: MODELS.GEMINI_FLASH,

    // Chat cần web search - thêm :online suffix
    chatWithSearch: MODELS.GEMINI_FLASH + MODELS.ONLINE_SUFFIX,

    // Tạo đề thi - Gemini Flash (cần đọc file/context)
    examGeneration: MODELS.GEMINI_FLASH,

    // Giải bài tập code - MiMo
    codeExecution: MODELS.MIMO_CODE,

    // Suy luận logic phức tạp - DeepSeek
    reasoning: MODELS.DEEPSEEK_REASON,
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

export interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
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

// Chú thích: Phân loại câu hỏi để chọn model phù hợp
export function classifyQueryForModel(query: string): {
    model: string;
    useOnlineSearch: boolean;
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

    // Chú thích: Keywords về suy luận logic
    const reasoningKeywords = [
        'suy luận', 'logic', 'chứng minh', 'phân tích',
        'tại sao', 'giải thích', 'so sánh', 'đánh giá',
        'ưu điểm', 'nhược điểm', 'pros', 'cons',
    ];

    // Check search keywords
    for (const kw of searchKeywords) {
        if (queryLower.includes(kw)) {
            return {
                model: MODEL_ROUTES.chatWithSearch,
                useOnlineSearch: true,
                reason: `Cần web search: "${kw}"`,
            };
        }
    }

    // Check code keywords
    for (const kw of codeKeywords) {
        if (queryLower.includes(kw)) {
            return {
                model: MODEL_ROUTES.codeExecution,
                useOnlineSearch: false,
                reason: `Code execution: "${kw}"`,
            };
        }
    }

    // Check reasoning keywords
    for (const kw of reasoningKeywords) {
        if (queryLower.includes(kw)) {
            return {
                model: MODEL_ROUTES.reasoning,
                useOnlineSearch: false,
                reason: `Reasoning: "${kw}"`,
            };
        }
    }

    // Mặc định: Gemini Flash cho đa năng
    return {
        model: MODEL_ROUTES.chat,
        useOnlineSearch: false,
        reason: 'Default: Gemini Flash',
    };
}

// Chú thích: Build messages array từ system prompt và user message
export function buildMessages(
    systemPrompt: string,
    userMessage: string,
    context?: string
): OpenRouterMessage[] {
    const messages: OpenRouterMessage[] = [];

    // System message
    let fullSystemPrompt = systemPrompt;
    if (context) {
        fullSystemPrompt += `\n\n--- CONTEXT TỪ TÀI LIỆU ---\n${context}\n--- HẾT CONTEXT ---`;
    }

    messages.push({
        role: 'system',
        content: fullSystemPrompt,
    });

    // User message
    messages.push({
        role: 'user',
        content: userMessage,
    });

    return messages;
}
