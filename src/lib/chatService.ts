import type { AIProviderType } from './aiProviders';

// --- Interfaces ---

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    // Đơn giản hóa attachments cho MVP, có thể mở rộng sau nếu cần Multimodal thật sự
    // Hiện tại Google và GPT-4o support image base64/url
    images?: string[];
}

export interface ChatResponse {
    success: boolean;
    response?: string;
    error?: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

interface ChatStrategy {
    id: AIProviderType;
    sendMessage: (
        apiKey: string,
        model: string,
        messages: ChatMessage[],
        options?: { temperature?: number }
    ) => Promise<ChatResponse>;
}

// --- Helper Functions ---

// Google Gemini Config
const GOOGLE_SAFETY_SETTINGS = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];

// --- Strategies ---

const STRATEGIES: Partial<Record<AIProviderType, ChatStrategy>> = {
    openrouter: {
        id: 'openrouter',
        sendMessage: async (apiKey, model, messages, options) => {
            try {
                // OpenRouter tuân thủ OpenAI format
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: messages.map(m => {
                            // Convert images to OpenAI vision format if needed
                            // MVP: Chỉ text trước, hoặc simple image url
                            if (m.images && m.images.length > 0) {
                                return {
                                    role: m.role,
                                    content: [
                                        { type: 'text', text: m.content },
                                        ...m.images.map(img => ({
                                            type: 'image_url',
                                            image_url: { url: img } // Base64 or URL
                                        }))
                                    ]
                                };
                            }
                            return { role: m.role, content: m.content };
                        }),
                        temperature: options?.temperature ?? 0.7,
                    }),
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`OpenRouter Error ${response.status}: ${errText}`);
                }

                const data = await response.json();
                return {
                    success: true,
                    response: data.choices?.[0]?.message?.content || '',
                    usage: data.usage
                };
            } catch (error) {
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
        }
    },
    openai: {
        id: 'openai',
        sendMessage: async (apiKey, model, messages, options) => {
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: messages.map(m => {
                            if (m.images && m.images.length > 0) {
                                return {
                                    role: m.role,
                                    content: [
                                        { type: 'text', text: m.content },
                                        ...m.images.map(img => ({
                                            type: 'image_url',
                                            image_url: { url: img }
                                        }))
                                    ]
                                };
                            }
                            return { role: m.role, content: m.content };
                        }),
                        temperature: options?.temperature ?? 0.7,
                    }),
                });

                if (!response.ok) {
                    const err = await response.text();
                    throw new Error(`OpenAI Error: ${err}`);
                }

                const data = await response.json();
                return {
                    success: true,
                    response: data.choices?.[0]?.message?.content || '',
                    usage: data.usage
                };
            } catch (error) {
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
        }
    },
    google: {
        id: 'google',
        sendMessage: async (apiKey, model, messages, options) => {
            try {
                // Google format: contents: [{ role: 'user'|'model', parts: [{ text: ... }] }]
                // Map roles: user -> user, assistant -> model, system -> user (hoặc system_instruction nếu model support)

                // Tách system prompt nếu có
                const systemMsg = messages.find(m => m.role === 'system');
                const conversation = messages.filter(m => m.role !== 'system');

                let url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

                const contents = conversation.map(m => {
                    const parts: any[] = [{ text: m.content }];
                    if (m.images && m.images.length > 0) {
                        // Google image format: inlineData { mimeType, data }
                        // Cần trích xuất base64 data từ dataURL
                        m.images.forEach(img => {
                            if (img.startsWith('data:')) {
                                const [meta, data] = img.split(',');
                                const mimeMatches = meta.match(/:(.*?);/);
                                const mimeType = mimeMatches ? mimeMatches[1] : 'image/jpeg';
                                parts.push({
                                    inlineData: {
                                        mimeType: mimeType,
                                        data: data
                                    }
                                });
                            }
                        });
                    }

                    return {
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts: parts
                    };
                });

                const body: any = {
                    contents: contents,
                    generationConfig: {
                        temperature: options?.temperature ?? 0.7,
                    },
                    safetySettings: GOOGLE_SAFETY_SETTINGS,
                };

                if (systemMsg) {
                    // Gemini 1.5 support system_instruction
                    body.systemInstruction = {
                        parts: [{ text: systemMsg.content }]
                    };
                }

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Google Error ${response.status}: ${errText}`);
                }

                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

                return {
                    success: true,
                    response: text,
                };
            } catch (error) {
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
        }
    }
    // Các provider khác có thể fallback về OpenAI format nếu họ support compatible endpoint (như Groq, Together, DeepSeek)
    // Sẽ implement sau hoặc định nghĩa generic
};

// --- Fallback Strategy for OpenAI Compatible Providers ---
// DeepSeek, Groq, Together, Mistral, Perplexity thường support OpenAI-compatible API
const OPENAI_COMPATIBLE_PROVIDERS: AIProviderType[] = ['deepseek', 'groq', 'together', 'mistral', 'perplexity'];

const BASE_URLS: Partial<Record<AIProviderType, string>> = {
    deepseek: 'https://api.deepseek.com/v1/chat/completions', // check docs
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    together: 'https://api.together.xyz/v1/chat/completions',
    mistral: 'https://api.mistral.ai/v1/chat/completions',
    perplexity: 'https://api.perplexity.ai/chat/completions'
};

function getGenericStrategy(providerId: AIProviderType): ChatStrategy | undefined {
    if (!OPENAI_COMPATIBLE_PROVIDERS.includes(providerId)) return undefined;

    const baseUrl = BASE_URLS[providerId];
    if (!baseUrl) return undefined;

    return {
        id: providerId,
        sendMessage: async (apiKey, model, messages, options) => {
            try {
                const response = await fetch(baseUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: messages.map(m => ({ role: m.role, content: m.content })), // Attachments handling might vary
                        temperature: options?.temperature ?? 0.7,
                    }),
                });

                if (!response.ok) {
                    const err = await response.text();
                    throw new Error(`${providerId} Error: ${err}`);
                }
                const data = await response.json();
                return {
                    success: true,
                    response: data.choices?.[0]?.message?.content || '',
                };
            } catch (error) {
                return { success: false, error: error instanceof Error ? error.message : 'Error' };
            }
        }
    };
}


// --- Main Function ---

export async function sendClientSideChat(
    providerId: AIProviderType,
    apiKey: string,
    model: string,
    messages: ChatMessage[],
    options?: { temperature?: number }
): Promise<ChatResponse> {

    // 1. Get Strategy
    let strategy = STRATEGIES[providerId];

    // 2. Generic Fallback
    if (!strategy) {
        strategy = getGenericStrategy(providerId);
    }

    // 3. Last resort: Default to OpenRouter if default provider? No, must fail if no strategy.
    if (!strategy) {
        return { success: false, error: `Provider ${providerId} chưa được hỗ trợ Client-side chat.` };
    }

    return await strategy.sendMessage(apiKey, model, messages, options);
}
