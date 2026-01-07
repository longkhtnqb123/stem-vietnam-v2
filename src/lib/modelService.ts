// Chú thích: Model Fetching Service - Áp dụng Strategy Pattern
// Hỗ trợ fetch dynamic từ OpenRouter, OpenAI, Google và các providers khác

import type { AIProviderType, ModelInfo } from './aiProviders';
import { DEFAULT_MODELS } from './aiProviders';

// --- Interfaces & Types ---

// Strategy Interface
interface AIProviderStrategy {
    id: AIProviderType;
    name: string;
    // URL fetch models: string cố định hoặc hàm nhận key (cho Google)
    // Nếu null -> dùng danh sách mặc định (chưa support API fetch)
    fetchUrl: string | ((key: string) => string) | null;
    // Hàm tạo headers xác thực
    headers: (key: string) => Record<string, string>;
    // Hàm chuẩn hóa dữ liệu trả về thành ModelInfo[]
    normalize: (data: any) => ModelInfo[];
}

// Response Types
interface OpenRouterModel {
    id: string;
    name: string;
    description?: string;
    context_length?: number;
    pricing?: { prompt: string; completion: string };
}

interface OpenAIModel {
    id: string;
    owned_by: string;
}

interface GoogleModel {
    name: string; // e.g., "models/gemini-pro"
    displayName: string;
    description: string;
    inputTokenLimit: number;
}

// --- Helper Functions ---

function formatOpenRouterDescription(m: OpenRouterModel, isFree: boolean): string {
    const parts: string[] = [];
    if (m.context_length) {
        const ctxK = Math.round(m.context_length / 1000);
        parts.push(`${ctxK}K ctx`);
    }
    if (isFree) {
        parts.push('Miễn phí');
    } else if (m.pricing?.prompt) {
        const price = parseFloat(m.pricing.prompt) * 1000000;
        if (price > 0) parts.push(`$${price.toFixed(2)}/M tokens`);
    }
    if (m.description && parts.length < 3) {
        parts.push(m.description.slice(0, 30));
    }
    return parts.join(' • ');
}

function formatModelName(id: string): string {
    // Map tên đẹp cho các ID phổ biến
    const nameMap: Record<string, string> = {
        'gpt-4o': 'GPT-4o',
        'gpt-4o-mini': 'GPT-4o Mini',
        'gpt-4-turbo': 'GPT-4 Turbo',
        'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    };
    return nameMap[id] || id;
}

export function validateApiKeyFormat(provider: AIProviderType, key: string): boolean {
    if (!key || key.length < 10) return false;
    switch (provider) {
        case 'openrouter': return key.startsWith('sk-or-');
        case 'openai': return key.startsWith('sk-') && !key.startsWith('sk-or-');
        case 'google': return key.startsWith('AIza');
        case 'anthropic': return key.startsWith('sk-ant-');
        case 'groq': return key.startsWith('gsk_');
        case 'perplexity': return key.startsWith('pplx-');
        default: return key.length >= 20;
    }
}

// --- Strategy Definitions ---

const STRATEGIES: Partial<Record<AIProviderType, AIProviderStrategy>> = {
    openrouter: {
        id: 'openrouter',
        name: 'OpenRouter',
        fetchUrl: 'https://openrouter.ai/api/v1/models',
        headers: (key) => ({
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
        }),
        normalize: (data: any) => {
            const list: OpenRouterModel[] = data.data || [];
            return list
                .filter(m => m.id && !m.id.includes('auto')) // Filter auto models if needed
                .map(m => {
                    const isFree = m.pricing?.prompt === '0' || m.id.includes(':free');
                    return {
                        id: m.id,
                        name: m.name || m.id.split('/').pop() || m.id,
                        description: formatOpenRouterDescription(m, isFree),
                        contextLength: m.context_length,
                        isFree,
                    };
                })
                .sort((a, b) => {
                    // Ưu tiên Free lên đầu, sau đó sort theo tên
                    if (a.isFree && !b.isFree) return -1;
                    if (!a.isFree && b.isFree) return 1;
                    return a.name.localeCompare(b.name);
                });
        }
    },
    openai: {
        id: 'openai',
        name: 'OpenAI',
        fetchUrl: 'https://api.openai.com/v1/models',
        headers: (key) => ({ 'Authorization': `Bearer ${key}` }),
        normalize: (data: any) => {
            const list: OpenAIModel[] = data.data || [];
            return list
                .filter(m => m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o3'))
                .map(m => ({
                    id: m.id,
                    name: formatModelName(m.id),
                    description: m.owned_by,
                }))
                .sort((a, b) => b.id.localeCompare(a.id)); // Sort mới nhất lên đầu (tương đối)
        }
    },
    google: {
        id: 'google',
        name: 'Google Gemini',
        fetchUrl: (key) => `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
        headers: () => ({}), // Google dùng query param
        normalize: (data: any) => {
            const list: GoogleModel[] = data.models || [];
            return list
                .filter(m => m.name.includes('gemini'))
                .map(m => ({
                    id: m.name.replace('models/', ''), // remove prefix
                    name: m.displayName || m.name,
                    description: m.description,
                    contextLength: m.inputTokenLimit,
                }));
        }
    },
    // Các provider khác chưa có public API list chuẩn hoặc cần proxy đặc biệt -> dùng default
    anthropic: undefined,
    deepseek: undefined,
    groq: undefined,
    mistral: undefined,
    perplexity: undefined,
    together: undefined,
};

// --- Main Core Function ---

export async function fetchModelsDynamic(
    providerId: AIProviderType,
    apiKey: string
): Promise<{ models: ModelInfo[]; success: boolean; error?: string }> {

    // 1. Validate simple format first
    if (!validateApiKeyFormat(providerId, apiKey)) {
        return {
            models: DEFAULT_MODELS[providerId] || [],
            success: false,
            error: 'Định dạng API Key không hợp lệ',
        };
    }

    const strategy = STRATEGIES[providerId];

    // 2. Nếu không có strategy hoặc fetchUrl -> Dùng Default
    if (!strategy || !strategy.fetchUrl) {
        console.log(`[modelService] No dynamic fetch strategy for ${providerId}, using defaults.`);
        return {
            models: DEFAULT_MODELS[providerId] || [],
            success: true // Coi như success vì fallback về default
        };
    }

    // 3. Thực thi Fetch Dynamic
    try {
        const url = typeof strategy.fetchUrl === 'function'
            ? strategy.fetchUrl(apiKey)
            : strategy.fetchUrl;

        const headers = strategy.headers(apiKey);

        const response = await fetch(url, { headers });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(`API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const models = strategy.normalize(data);

        console.log(`[modelService] Fetched ${models.length} models from ${providerId} dynamically.`);

        return {
            models: models.length > 0 ? models : (DEFAULT_MODELS[providerId] || []),
            success: true
        };

    } catch (error) {
        console.error(`[modelService] Error fetching ${providerId}:`, error);
        return {
            models: DEFAULT_MODELS[providerId] || [],
            success: false,
            error: error instanceof Error ? error.message : 'Unknown fetch error'
        };
    }
}

// Backward compatibility alias nếu cần, hoặc dùng trực tiếp fetchModelsDynamic
export const fetchModelsForProvider = fetchModelsDynamic;

// Test API Key Function (Simple ping)
export async function testApiKey(provider: AIProviderType, apiKey: string): Promise<{ valid: boolean; error?: string }> {
    // Tận dụng fetchModelsDynamic để test luôn
    // Nếu fetch được models -> key valid
    const res = await fetchModelsDynamic(provider, apiKey);
    return {
        valid: res.success,
        error: res.error
    };
}
