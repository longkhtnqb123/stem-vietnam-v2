// Chú thích: Constants cho AI Providers configuration
// Hỗ trợ nhiều nhà cung cấp AI với thông tin icon, URL lấy key, và models mặc định

export type AIProviderType =
    | 'openrouter'
    | 'openai'
    | 'google'
    | 'anthropic'
    | 'deepseek'
    | 'groq'
    | 'mistral'
    | 'perplexity'
    | 'together';

export interface AIProvider {
    id: AIProviderType;
    name: string;
    recommended: boolean;
    description: string;
    apiKeyUrl: string;
    apiKeyPlaceholder: string;
    // Chú thích: Color cho icon background (gradient)
    colorFrom: string;
    colorTo: string;
}

export interface ModelInfo {
    id: string;
    name: string;
    description?: string;
    contextLength?: number;
    isFree?: boolean;
}

// Chú thích: Danh sách các nhà cung cấp AI được hỗ trợ
export const AI_PROVIDERS: AIProvider[] = [
    {
        id: 'openrouter',
        name: 'OpenRouter',
        recommended: true,
        description: 'Truy cập 100+ models từ nhiều providers',
        apiKeyUrl: 'https://openrouter.ai/keys',
        apiKeyPlaceholder: 'sk-or-v1-...',
        colorFrom: '#3B82F6',
        colorTo: '#8B5CF6',
    },
    {
        id: 'openai',
        name: 'OpenAI',
        recommended: true,
        description: 'GPT-4o, GPT-4, ChatGPT models',
        apiKeyUrl: 'https://platform.openai.com/api-keys',
        apiKeyPlaceholder: 'sk-...',
        colorFrom: '#10B981',
        colorTo: '#059669',
    },
    {
        id: 'google',
        name: 'Google Gemini',
        recommended: true,
        description: 'Gemini Pro, Flash, Ultra models',
        apiKeyUrl: 'https://aistudio.google.com/apikey',
        apiKeyPlaceholder: 'AIza...',
        colorFrom: '#F59E0B',
        colorTo: '#EF4444',
    },
    {
        id: 'anthropic',
        name: 'Anthropic (Claude)',
        recommended: true,
        description: 'Claude 3.5 Sonnet, Opus, Haiku',
        apiKeyUrl: 'https://console.anthropic.com/',
        apiKeyPlaceholder: 'sk-ant-...',
        colorFrom: '#EC4899',
        colorTo: '#8B5CF6',
    },
    {
        id: 'deepseek',
        name: 'DeepSeek',
        recommended: false,
        description: 'DeepSeek Chat, Coder models',
        apiKeyUrl: 'https://platform.deepseek.com/',
        apiKeyPlaceholder: 'sk-...',
        colorFrom: '#06B6D4',
        colorTo: '#3B82F6',
    },
    {
        id: 'groq',
        name: 'Groq',
        recommended: false,
        description: 'LLaMA, Mixtral với tốc độ cực nhanh',
        apiKeyUrl: 'https://console.groq.com/',
        apiKeyPlaceholder: 'gsk_...',
        colorFrom: '#F97316',
        colorTo: '#F59E0B',
    },
    {
        id: 'mistral',
        name: 'Mistral AI',
        recommended: false,
        description: 'Mistral, Mixtral models',
        apiKeyUrl: 'https://console.mistral.ai/',
        apiKeyPlaceholder: '...',
        colorFrom: '#6366F1',
        colorTo: '#8B5CF6',
    },
    {
        id: 'perplexity',
        name: 'Perplexity',
        recommended: false,
        description: 'Models tích hợp web search',
        apiKeyUrl: 'https://www.perplexity.ai/settings/api',
        apiKeyPlaceholder: 'pplx-...',
        colorFrom: '#14B8A6',
        colorTo: '#10B981',
    },
    {
        id: 'together',
        name: 'Together AI',
        recommended: false,
        description: 'Open-source models đa dạng',
        apiKeyUrl: 'https://api.together.xyz/',
        apiKeyPlaceholder: '...',
        colorFrom: '#A855F7',
        colorTo: '#EC4899',
    },
];

// Chú thích: Models mặc định cho mỗi provider (cập nhật 2025)
export const DEFAULT_MODELS: Record<AIProviderType, ModelInfo[]> = {
    openrouter: [
        { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash', description: '2025 - Miễn phí, cực mạnh', isFree: true },
        { id: 'google/gemini-2.5-pro-exp-03-25:free', name: 'Gemini 2.5 Pro', description: '2025 - Mới nhất', isFree: true },
        { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', description: '2025 - Claude mới nhất', isFree: false },
        { id: 'openai/gpt-4.1', name: 'GPT-4.1', description: '2025 - OpenAI mới nhất', isFree: false },
        { id: 'openai/o3-mini', name: 'o3 Mini', description: '2025 - Reasoning model', isFree: false },
        { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', description: '2025 - Reasoning miễn phí', isFree: true },
        { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek V3', description: '2025 - Chat mạnh', isFree: true },
        { id: 'meta-llama/llama-4-maverick:free', name: 'LLaMA 4 Maverick', description: '2025 - Meta mới nhất', isFree: true },
        { id: 'qwen/qwen3-235b-a22b:free', name: 'Qwen 3 235B', description: '2025 - Alibaba mới nhất', isFree: true },
        { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1', description: '2025 - Nhẹ, nhanh', isFree: true },
    ],
    openai: [
        { id: 'gpt-4.1', name: 'GPT-4.1', description: '2025 - Mới nhất', contextLength: 1047576 },
        { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', description: '2025 - Nhanh, rẻ', contextLength: 1047576 },
        { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', description: '2025 - Siêu nhẹ', contextLength: 1047576 },
        { id: 'o3-mini', name: 'o3 Mini', description: '2025 - Reasoning', contextLength: 200000 },
        { id: 'o4-mini', name: 'o4 Mini', description: '2025 - Reasoning mới nhất', contextLength: 200000 },
        { id: 'gpt-4o', name: 'GPT-4o', description: 'Multimodal mạnh', contextLength: 128000 },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Nhanh và rẻ', contextLength: 128000 },
    ],
    google: [
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: '2025 - Mạnh nhất', contextLength: 1000000 },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: '2025 - Nhanh nhất', contextLength: 1000000 },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Đa năng', contextLength: 1000000 },
        { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: 'Nhẹ, nhanh', contextLength: 1000000 },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Legacy mạnh', contextLength: 2000000 },
    ],
    anthropic: [
        { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: '2025 - Mới nhất', contextLength: 200000 },
        { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', description: '2025 - Extended thinking', contextLength: 200000 },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Ổn định', contextLength: 200000 },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Nhanh, rẻ', contextLength: 200000 },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Legacy mạnh nhất', contextLength: 200000 },
    ],
    deepseek: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat V3', description: '2025 - Chat mạnh nhất' },
        { id: 'deepseek-reasoner', name: 'DeepSeek R1', description: '2025 - Reasoning' },
        { id: 'deepseek-coder', name: 'DeepSeek Coder V3', description: '2025 - Chuyên code' },
    ],
    groq: [
        { id: 'llama-3.3-70b-versatile', name: 'LLaMA 3.3 70B', description: 'Mạnh, siêu nhanh' },
        { id: 'llama-3.3-70b-specdec', name: 'LLaMA 3.3 70B SpecDec', description: 'Speculative decoding' },
        { id: 'llama-3.1-8b-instant', name: 'LLaMA 3.1 8B', description: 'Instant response' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'MoE model' },
        { id: 'gemma2-9b-it', name: 'Gemma 2 9B', description: 'Google Gemma' },
    ],
    mistral: [
        { id: 'mistral-large-2411', name: 'Mistral Large', description: '2025 - Flagship model' },
        { id: 'mistral-small-2503', name: 'Mistral Small 3.1', description: '2025 - Mới nhất' },
        { id: 'codestral-2501', name: 'Codestral', description: '2025 - Chuyên code' },
        { id: 'pixtral-large-2411', name: 'Pixtral Large', description: 'Multimodal' },
        { id: 'ministral-8b-2410', name: 'Ministral 8B', description: 'Nhẹ, nhanh' },
    ],
    perplexity: [
        { id: 'sonar-pro', name: 'Sonar Pro', description: '2025 - Best for search' },
        { id: 'sonar', name: 'Sonar', description: 'Web search tích hợp' },
        { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', description: 'Reasoning + search' },
        { id: 'sonar-reasoning', name: 'Sonar Reasoning', description: 'Reasoning model' },
        { id: 'sonar-deep-research', name: 'Sonar Deep Research', description: 'Nghiên cứu sâu' },
    ],
    together: [
        { id: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8', name: 'LLaMA 4 Maverick', description: '2025 - Meta mới nhất' },
        { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'LLaMA 3.3 70B Turbo', description: 'Nhanh, mạnh' },
        { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B', description: 'Đa ngôn ngữ' },
        { id: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B', name: 'DeepSeek R1 Distill', description: 'Reasoning' },
        { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', description: '2025 - Chat mạnh' },
    ],
};


// Chú thích: Lấy provider info theo id
export function getProviderById(id: AIProviderType): AIProvider | undefined {
    return AI_PROVIDERS.find(p => p.id === id);
}

// Chú thích: Lấy models mặc định cho provider
export function getDefaultModels(providerId: AIProviderType): ModelInfo[] {
    return DEFAULT_MODELS[providerId] || [];
}

// Chú thích: Icon components cho mỗi provider (SVG paths)
export const PROVIDER_ICONS: Record<AIProviderType, string> = {
    openrouter: '⚡',
    openai: '🤖',
    google: '🌐',
    anthropic: '🧠',
    deepseek: '🔍',
    groq: '⚡',
    mistral: '🌪️',
    perplexity: '🔮',
    together: '🤝',
};
