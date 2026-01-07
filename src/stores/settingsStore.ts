// Chú thích: Settings Store - Quản lý API keys và provider configuration
// Hỗ trợ nhiều AI providers với cấu hình linh hoạt và các tùy chọn AI nâng cao
import { create } from 'zustand';
import type { AIProviderType, ModelInfo } from '../lib/aiProviders';
import { getDefaultModels } from '../lib/aiProviders';

const STORAGE_KEY = 'stem-vietnam-settings';

// Chú thích: Thinking levels cho các models hỗ trợ (Gemini 3, etc.)
export type ThinkingLevel = 'low' | 'high';

interface SettingsState {
    // Provider & API Key
    provider: AIProviderType | 'default';
    apiKey: string;

    // Legacy keys (để backward compatible)
    openRouterKey: string;
    hfToken: string;

    // Model Selection
    selectedModel: string;
    availableModels: ModelInfo[];
    isLoadingModels: boolean;

    // ===== AI Options (Phase 1) =====
    ragEnabled: boolean;           // Tìm kiếm trong tài liệu SGK
    webSearchEnabled: boolean;     // Tìm kiếm web thông tin mới nhất
    costSaverMode: boolean;        // Tối ưu chi phí (model rẻ + cache)
    thinkingLevel: ThinkingLevel;  // Low = nhanh, High = suy luận sâu

    // ===== Advanced Options (Phase 2) =====
    contextCachingEnabled: boolean;   // Cache context giảm tokens
    structuredOutputEnabled: boolean; // Output JSON có schema
    codeExecutionEnabled: boolean;    // Chạy code Python/JS
    urlContext: string;               // URL để đọc context

    // Status
    hasConfiguredKeys: boolean;
    hasSeenWarning: boolean;

    // Actions - Provider & Keys
    setProvider: (provider: AIProviderType | 'default') => void;
    setApiKey: (key: string) => void;
    setOpenRouterKey: (key: string) => void;
    setHfToken: (token: string) => void;
    setSelectedModel: (model: string) => void;
    setAvailableModels: (models: ModelInfo[]) => void;
    setIsLoadingModels: (loading: boolean) => void;

    // Actions - AI Options
    setRagEnabled: (enabled: boolean) => void;
    setWebSearchEnabled: (enabled: boolean) => void;
    setCostSaverMode: (enabled: boolean) => void;
    setThinkingLevel: (level: ThinkingLevel) => void;

    // Actions - Advanced Options
    setContextCachingEnabled: (enabled: boolean) => void;
    setStructuredOutputEnabled: (enabled: boolean) => void;
    setCodeExecutionEnabled: (enabled: boolean) => void;
    setUrlContext: (url: string) => void;

    // Actions - Status & Utilities
    setHasSeenWarning: (seen: boolean) => void;
    checkKeysConfigured: () => boolean;
    loadSettings: () => void;
    saveSettings: () => void;
    resetSettings: () => void;
    loadModelsForProvider: () => void;

    // Chú thích: Helper để lấy model tối ưu dựa trên settings
    getOptimalModel: () => string;
}

// Chú thích: Default state với các options mới
const defaultSettings = {
    provider: 'default' as const,
    apiKey: '',
    openRouterKey: '',
    hfToken: '',
    selectedModel: 'google/gemini-2.0-flash-exp:free',
    availableModels: [] as ModelInfo[],
    isLoadingModels: false,

    // AI Options - defaults thông minh
    ragEnabled: true,
    webSearchEnabled: true,  // Mặc định bật để có thông tin mới nhất
    costSaverMode: false,    // Mặc định tắt để có chất lượng tốt nhất
    thinkingLevel: 'low' as ThinkingLevel, // Mặc định low cho nhanh

    // Advanced Options - mặc định tắt
    contextCachingEnabled: false,
    structuredOutputEnabled: false,
    codeExecutionEnabled: false,
    urlContext: '',

    hasConfiguredKeys: false,
    hasSeenWarning: false,
};

// Chú thích: Models tối ưu cho từng chế độ
const COST_OPTIMIZED_MODELS = {
    // Miễn phí và mạnh
    free: [
        'google/gemini-2.0-flash-exp:free',
        'deepseek/deepseek-r1:free',
        'meta-llama/llama-4-maverick:free',
    ],
    // Rẻ nhưng tốt
    cheap: [
        'openai/gpt-4o-mini',
        'anthropic/claude-3-5-haiku',
        'google/gemini-2.0-flash-exp:free',
    ],
    // Mạnh nhất
    powerful: [
        'anthropic/claude-sonnet-4',
        'openai/gpt-4.1',
        'google/gemini-2.5-pro-exp-03-25:free',
    ],
};

// Chú thích: Load từ localStorage với migration
function loadFromStorage(): Partial<SettingsState> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);

            // Migration từ cấu trúc cũ
            let apiKey = parsed.apiKey || '';
            if (!apiKey && parsed.openRouterKey) {
                apiKey = parsed.openRouterKey;
            }

            let provider = parsed.provider || 'default';
            if (provider === 'huggingface') {
                provider = 'default';
            }

            return {
                ...parsed,
                provider,
                apiKey,
                // Chú thích: Đảm bảo các fields mới có default values
                webSearchEnabled: parsed.webSearchEnabled ?? true,
                costSaverMode: parsed.costSaverMode ?? false,
                thinkingLevel: parsed.thinkingLevel ?? 'low',
                contextCachingEnabled: parsed.contextCachingEnabled ?? false,
                structuredOutputEnabled: parsed.structuredOutputEnabled ?? false,
                codeExecutionEnabled: parsed.codeExecutionEnabled ?? false,
                urlContext: parsed.urlContext ?? '',
                hasConfiguredKeys: !!(apiKey || parsed.openRouterKey || parsed.hfToken),
            };
        }
    } catch (error) {
        console.warn('[settingsStore] Failed to load from localStorage:', error);
    }
    return defaultSettings;
}

// Chú thích: Save vào localStorage
function saveToStorage(state: SettingsState) {
    try {
        const toSave = {
            provider: state.provider,
            apiKey: state.apiKey,
            openRouterKey: state.openRouterKey,
            hfToken: state.hfToken,
            selectedModel: state.selectedModel,
            // AI Options
            ragEnabled: state.ragEnabled,
            webSearchEnabled: state.webSearchEnabled,
            costSaverMode: state.costSaverMode,
            thinkingLevel: state.thinkingLevel,
            // Advanced Options
            contextCachingEnabled: state.contextCachingEnabled,
            structuredOutputEnabled: state.structuredOutputEnabled,
            codeExecutionEnabled: state.codeExecutionEnabled,
            urlContext: state.urlContext,
            hasSeenWarning: state.hasSeenWarning,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
        console.warn('[settingsStore] Failed to save to localStorage:', error);
    }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    ...defaultSettings,
    ...loadFromStorage(),

    // ===== Provider & Keys Actions =====
    setProvider: (provider) => {
        set({ provider });
        get().loadModelsForProvider();
        get().saveSettings();
    },

    setApiKey: (key: string) => {
        const state = get();
        set({ apiKey: key });
        if (state.provider === 'openrouter') {
            set({ openRouterKey: key });
        }
        get().saveSettings();
    },

    setOpenRouterKey: (key: string) => {
        set({ openRouterKey: key });
        const state = get();
        if (state.provider === 'openrouter' || state.provider === 'default') {
            set({ apiKey: key });
        }
        get().saveSettings();
    },

    setHfToken: (token: string) => {
        set({ hfToken: token });
        get().saveSettings();
    },

    setSelectedModel: (model: string) => {
        set({ selectedModel: model });
        get().saveSettings();
    },

    setAvailableModels: (models: ModelInfo[]) => {
        set({ availableModels: models });
    },

    setIsLoadingModels: (loading: boolean) => {
        set({ isLoadingModels: loading });
    },

    // ===== AI Options Actions =====
    setRagEnabled: (enabled: boolean) => {
        set({ ragEnabled: enabled });
        get().saveSettings();
    },

    setWebSearchEnabled: (enabled: boolean) => {
        set({ webSearchEnabled: enabled });
        get().saveSettings();
    },

    setCostSaverMode: (enabled: boolean) => {
        set({ costSaverMode: enabled });
        // Chú thích: Khi bật cost saver, tự động chọn model miễn phí/rẻ
        if (enabled) {
            const freeModel = COST_OPTIMIZED_MODELS.free[0];
            set({ selectedModel: freeModel });
        }
        get().saveSettings();
    },

    setThinkingLevel: (level: ThinkingLevel) => {
        set({ thinkingLevel: level });
        get().saveSettings();
    },

    // ===== Advanced Options Actions =====
    setContextCachingEnabled: (enabled: boolean) => {
        set({ contextCachingEnabled: enabled });
        get().saveSettings();
    },

    setStructuredOutputEnabled: (enabled: boolean) => {
        set({ structuredOutputEnabled: enabled });
        get().saveSettings();
    },

    setCodeExecutionEnabled: (enabled: boolean) => {
        set({ codeExecutionEnabled: enabled });
        get().saveSettings();
    },

    setUrlContext: (url: string) => {
        set({ urlContext: url });
        get().saveSettings();
    },

    // ===== Status & Utilities =====
    setHasSeenWarning: (seen: boolean) => {
        set({ hasSeenWarning: seen });
        get().saveSettings();
    },

    checkKeysConfigured: () => {
        const state = get();
        const hasKeys = !!(state.apiKey || state.openRouterKey || state.hfToken);
        set({ hasConfiguredKeys: hasKeys });
        return hasKeys;
    },

    loadSettings: () => {
        const loaded = loadFromStorage();
        set(loaded);
        get().loadModelsForProvider();
    },

    saveSettings: () => {
        const state = get();
        state.checkKeysConfigured();
        saveToStorage(state);
    },

    resetSettings: () => {
        set(defaultSettings);
        localStorage.removeItem(STORAGE_KEY);
    },

    loadModelsForProvider: () => {
        const state = get();
        const provider = state.provider;

        if (provider === 'default') {
            set({ availableModels: getDefaultModels('openrouter') });
        } else {
            set({ availableModels: getDefaultModels(provider) });
        }
    },

    // Chú thích: Lấy model tối ưu dựa trên settings hiện tại
    getOptimalModel: () => {
        const state = get();

        // Nếu đang ở cost saver mode, ưu tiên model miễn phí
        if (state.costSaverMode) {
            return COST_OPTIMIZED_MODELS.free[0];
        }

        // Nếu cần thinking high, dùng model mạnh
        if (state.thinkingLevel === 'high') {
            return COST_OPTIMIZED_MODELS.powerful[0];
        }

        // Mặc định trả về model đã chọn
        return state.selectedModel;
    },
}));

// Chú thích: Initialize khi app load
if (typeof window !== 'undefined') {
    const store = useSettingsStore.getState();
    store.loadModelsForProvider();
}
