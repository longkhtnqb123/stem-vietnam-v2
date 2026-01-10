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
    // Chú thích: Badge 2026 - Thông tin xếp hạng
    badge?: string;      // VD: "#1 Versatility", "#1 Coding"
    ranking2026?: number; // 1-10
    pros?: string[];      // Điểm mạnh
    cons?: string[];      // Điểm yếu
}

export interface ModelInfo {
    id: string;
    name: string;
    description?: string;
    contextLength?: number;
    isFree?: boolean;
}

// Chú thích: Danh sách các nhà cung cấp AI được hỗ trợ - Cập nhật 01/2026
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
        badge: '🏆 Best Choice',
        ranking2026: 1,
        pros: ['Nhiều model miễn phí', 'Single API cho tất cả', 'Auto-fallback'],
        cons: ['Cần account riêng'],
    },
    {
        id: 'google',
        name: 'Google Gemini',
        recommended: true,
        description: 'Gemini 3 Pro/Flash - #1 Versatility 2026',
        apiKeyUrl: 'https://aistudio.google.com/apikey',
        apiKeyPlaceholder: 'AIza...',
        colorFrom: '#F59E0B',
        colorTo: '#EF4444',
        badge: '🥇 #1 Versatility',
        ranking2026: 2,
        pros: ['Miễn phí Flash', 'Multimodal tốt nhất', 'Context dài 1M tokens'],
        cons: ['Cần proxy ở VN'],
    },
    {
        id: 'openai',
        name: 'OpenAI',
        recommended: true,
        description: 'GPT-5.2 - #1 Reasoning, 100% Math AIME',
        apiKeyUrl: 'https://platform.openai.com/api-keys',
        apiKeyPlaceholder: 'sk-...',
        colorFrom: '#10B981',
        colorTo: '#059669',
        badge: '🧠 #1 Reasoning',
        ranking2026: 3,
        pros: ['Math benchmark 100%', 'Tốc độ nhanh nhất', 'Suy luận tốt'],
        cons: ['Giá cao', 'Cần proxy ở VN'],
    },
    {
        id: 'anthropic',
        name: 'Anthropic (Claude)',
        recommended: true,
        description: 'Claude Opus 4.5 - #1 Coding 2026',
        apiKeyUrl: 'https://console.anthropic.com/',
        apiKeyPlaceholder: 'sk-ant-...',
        colorFrom: '#EC4899',
        colorTo: '#8B5CF6',
        badge: '💻 #1 Coding',
        ranking2026: 4,
        pros: ['Coding tốt nhất', 'Long-task consistency', 'Agentic tasks'],
        cons: ['Giá cao nhất', 'Chậm hơn GPT'],
    },
    {
        id: 'deepseek',
        name: 'DeepSeek',
        recommended: true,
        description: 'DeepSeek V3/R1 - Giá rẻ nhất, chất lượng cao',
        apiKeyUrl: 'https://platform.deepseek.com/',
        apiKeyPlaceholder: 'sk-...',
        colorFrom: '#06B6D4',
        colorTo: '#3B82F6',
        badge: '💰 Best Value',
        ranking2026: 5,
        pros: ['Giá siêu rẻ', 'R1 reasoning miễn phí', 'Hỗ trợ tiếng Việt tốt'],
        cons: ['Tốc độ trung bình'],
    },
    {
        id: 'groq',
        name: 'Groq',
        recommended: false,
        description: 'LLaMA 4 - Tốc độ cực nhanh, miễn phí',
        apiKeyUrl: 'https://console.groq.com/',
        apiKeyPlaceholder: 'gsk_...',
        colorFrom: '#F97316',
        colorTo: '#F59E0B',
        badge: '⚡ Fastest',
        ranking2026: 6,
        pros: ['Miễn phí', 'Tốc độ nhanh nhất thế giới', 'LPU hardware'],
        cons: ['Giới hạn rate', 'Ít model'],
    },
    {
        id: 'mistral',
        name: 'Mistral AI',
        recommended: false,
        description: 'Mistral Large 2 - AI châu Âu',
        apiKeyUrl: 'https://console.mistral.ai/',
        apiKeyPlaceholder: '...',
        colorFrom: '#6366F1',
        colorTo: '#8B5CF6',
        ranking2026: 7,
        pros: ['EU-based', 'Open-source models', 'Giá tốt'],
        cons: ['Ít tính năng'],
    },
    {
        id: 'perplexity',
        name: 'Perplexity',
        recommended: false,
        description: 'Sonar - Tích hợp web search',
        apiKeyUrl: 'https://www.perplexity.ai/settings/api',
        apiKeyPlaceholder: 'pplx-...',
        colorFrom: '#14B8A6',
        colorTo: '#10B981',
        badge: '🔍 Search Expert',
        ranking2026: 8,
        pros: ['Web search tích hợp', 'Real-time info', 'Deep research'],
        cons: ['Giá cao', 'Chỉ tốt cho search'],
    },
    {
        id: 'together',
        name: 'Together AI',
        recommended: false,
        description: 'Open-source models - LLaMA 4, Qwen 3',
        apiKeyUrl: 'https://api.together.xyz/',
        apiKeyPlaceholder: '...',
        colorFrom: '#A855F7',
        colorTo: '#EC4899',
        ranking2026: 9,
        pros: ['Open-source', 'Fine-tuning', 'Giá tốt'],
        cons: ['Ít hỗ trợ'],
    },
];

// Chú thích: Models mặc định cho mỗi provider (cập nhật 01/2026)
export const DEFAULT_MODELS: Record<AIProviderType, ModelInfo[]> = {
    openrouter: [
        { id: 'google/gemini-3-flash:free', name: '🆓 Gemini 3 Flash', description: '2026 - Miễn phí, #1 Versatility', isFree: true },
        { id: 'google/gemini-3-pro', name: 'Gemini 3 Pro', description: '2026 - Mạnh nhất, 95% AIME', isFree: false },
        { id: 'openai/gpt-5.2', name: 'GPT-5.2', description: '2026 - #1 Reasoning, 100% AIME', isFree: false },
        { id: 'openai/gpt-5.1', name: 'GPT-5.1', description: '2026 - Best Writing', isFree: false },
        { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5', description: '2026 - #1 Coding', isFree: false },
        { id: 'deepseek/deepseek-v3:free', name: '🆓 DeepSeek V3', description: '2026 - Best Value, miễn phí', isFree: true },
        { id: 'tngtech/deepseek-r1t2-chimera:free', name: '🆓 DeepSeek R1 Chimera', description: '2026 - Reasoning miễn phí', isFree: true },
        { id: 'xiaomi/mimo-v2-flash:free', name: '🆓 MiMo V2 Flash', description: '2026 - Coding miễn phí', isFree: true },
        { id: 'meta-llama/llama-4-maverick:free', name: '🆓 LLaMA 4 Maverick', description: '2026 - Meta mới nhất', isFree: true },
        { id: 'qwen/qwen-3-235b:free', name: '🆓 Qwen 3 235B', description: '2026 - Alibaba, tiếng Việt tốt', isFree: true },
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
