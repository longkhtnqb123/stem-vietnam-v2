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

// Chú thích: Models mặc định cho mỗi provider (khi chưa fetch từ API)
export const DEFAULT_MODELS: Record<AIProviderType, ModelInfo[]> = {
    openrouter: [
        { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5', description: 'Nhanh và đa năng', isFree: false },
        { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash', description: 'Miễn phí', isFree: true },
        { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', description: 'Miễn phí, mạnh', isFree: true },
        { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', description: 'Nhanh, rẻ', isFree: false },
        { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'LLaMA 3.2 3B', description: 'Miễn phí, nhẹ', isFree: true },
    ],
    openai: [
        { id: 'gpt-4o', name: 'GPT-4o', description: 'Mạnh nhất', contextLength: 128000 },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Nhanh và rẻ', contextLength: 128000 },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Legacy, rẻ', contextLength: 16385 },
    ],
    google: [
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Nhanh', contextLength: 1000000 },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Mạnh nhất', contextLength: 2000000 },
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', description: 'Mới nhất', contextLength: 1000000 },
    ],
    anthropic: [
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Cân bằng tốt', contextLength: 200000 },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Mạnh nhất', contextLength: 200000 },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Nhanh, rẻ', contextLength: 200000 },
    ],
    deepseek: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat', description: 'Chat đa năng' },
        { id: 'deepseek-coder', name: 'DeepSeek Coder', description: 'Chuyên code' },
    ],
    groq: [
        { id: 'llama-3.3-70b-versatile', name: 'LLaMA 3.3 70B', description: 'Mạnh, nhanh' },
        { id: 'llama-3.1-8b-instant', name: 'LLaMA 3.1 8B', description: 'Siêu nhanh' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'Đa dạng' },
    ],
    mistral: [
        { id: 'mistral-large-latest', name: 'Mistral Large', description: 'Mạnh nhất' },
        { id: 'mistral-medium-latest', name: 'Mistral Medium', description: 'Cân bằng' },
        { id: 'mistral-small-latest', name: 'Mistral Small', description: 'Nhẹ, nhanh' },
    ],
    perplexity: [
        { id: 'llama-3.1-sonar-large-128k-online', name: 'Sonar Large', description: 'Tích hợp web search' },
        { id: 'llama-3.1-sonar-small-128k-online', name: 'Sonar Small', description: 'Nhanh + search' },
    ],
    together: [
        { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'LLaMA 3.3 70B', description: 'Mạnh' },
        { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B', description: 'Đa ngôn ngữ' },
        { id: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B', name: 'DeepSeek R1', description: 'Reasoning' },
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
