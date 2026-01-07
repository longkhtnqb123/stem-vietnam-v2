// Chú thích: Settings Store - Quản lý API keys và provider configuration
// Hỗ trợ nhiều AI providers với cấu hình linh hoạt
import { create } from 'zustand';
import type { AIProviderType, ModelInfo } from '../lib/aiProviders';
import { getDefaultModels } from '../lib/aiProviders';

const STORAGE_KEY = 'stem-vietnam-settings';

interface SettingsState {
    // Provider & API Key
    provider: AIProviderType | 'default';
    apiKey: string;  // Generic API key cho provider đã chọn

    // Legacy keys (để backward compatible)
    openRouterKey: string;
    hfToken: string;

    // Model Selection
    selectedModel: string;
    availableModels: ModelInfo[];
    isLoadingModels: boolean;

    // RAG Configuration
    ragEnabled: boolean;

    // Status
    hasConfiguredKeys: boolean;
    hasSeenWarning: boolean;

    // Actions
    setProvider: (provider: AIProviderType | 'default') => void;
    setApiKey: (key: string) => void;
    setOpenRouterKey: (key: string) => void;
    setHfToken: (token: string) => void;
    setSelectedModel: (model: string) => void;
    setAvailableModels: (models: ModelInfo[]) => void;
    setIsLoadingModels: (loading: boolean) => void;
    setRagEnabled: (enabled: boolean) => void;
    setHasSeenWarning: (seen: boolean) => void;
    checkKeysConfigured: () => boolean;
    loadSettings: () => void;
    saveSettings: () => void;
    resetSettings: () => void;
    loadModelsForProvider: () => void;
}

// Chú thích: Default state
const defaultSettings = {
    provider: 'default' as const,
    apiKey: '',
    openRouterKey: '',
    hfToken: '',
    selectedModel: 'google/gemini-flash-1.5',
    availableModels: [] as ModelInfo[],
    isLoadingModels: false,
    ragEnabled: true,
    hasConfiguredKeys: false,
    hasSeenWarning: false,
};

// Chú thích: Load từ localStorage với migration từ cấu trúc cũ
function loadFromStorage(): Partial<SettingsState> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);

            // Chú thích: Migration - nếu có openRouterKey nhưng không có apiKey mới
            let apiKey = parsed.apiKey || '';
            if (!apiKey && parsed.openRouterKey) {
                apiKey = parsed.openRouterKey;
            }

            // Chú thích: Migration provider cũ sang mới
            let provider = parsed.provider || 'default';
            if (provider === 'huggingface') {
                provider = 'default'; // HuggingFace giờ chỉ dùng cho embeddings
            }

            return {
                ...parsed,
                provider,
                apiKey,
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
            ragEnabled: state.ragEnabled,
            hasSeenWarning: state.hasSeenWarning,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
        console.warn('[settingsStore] Failed to save to localStorage:', error);
    }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    // Initial state từ localStorage
    ...defaultSettings,
    ...loadFromStorage(),

    setProvider: (provider) => {
        set({ provider });
        get().loadModelsForProvider();
        get().saveSettings();
    },

    setApiKey: (key: string) => {
        const state = get();
        set({ apiKey: key });

        // Chú thích: Sync với legacy openRouterKey nếu provider là openrouter
        if (state.provider === 'openrouter') {
            set({ openRouterKey: key });
        }

        get().saveSettings();
    },

    setOpenRouterKey: (key: string) => {
        set({ openRouterKey: key });
        // Chú thích: Sync với apiKey mới nếu provider là openrouter
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

    setRagEnabled: (enabled: boolean) => {
        set({ ragEnabled: enabled });
        get().saveSettings();
    },

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

    // Chú thích: Load danh sách models cho provider hiện tại
    loadModelsForProvider: () => {
        const state = get();
        const provider = state.provider;

        if (provider === 'default') {
            // Chú thích: Mặc định load models OpenRouter
            set({ availableModels: getDefaultModels('openrouter') });
        } else {
            set({ availableModels: getDefaultModels(provider) });
        }

        // TODO: Trong tương lai có thể fetch từ API nếu có key
    },
}));

// Chú thích: Initialize models khi app load
if (typeof window !== 'undefined') {
    const store = useSettingsStore.getState();
    store.loadModelsForProvider();
}
