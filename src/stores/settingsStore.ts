// Chú thích: Settings Store - Quản lý API keys và provider configuration
import { create } from 'zustand';

const STORAGE_KEY = 'stem-vietnam-settings';

interface SettingsState {
    // API Keys
    openRouterKey: string;
    hfToken: string;

    // Provider & Model Selection
    provider: 'openrouter' | 'huggingface' | 'default';
    selectedModel: string;

    // Status
    hasConfiguredKeys: boolean;
    hasSeenWarning: boolean;

    // Actions
    setOpenRouterKey: (key: string) => void;
    setHfToken: (token: string) => void;
    setProvider: (provider: 'openrouter' | 'huggingface' | 'default') => void;
    setSelectedModel: (model: string) => void;
    setHasSeenWarning: (seen: boolean) => void;
    checkKeysConfigured: () => boolean;
    loadSettings: () => void;
    saveSettings: () => void;
    resetSettings: () => void;
}

// Chú thích: Default state
const defaultSettings = {
    openRouterKey: '',
    hfToken: '',
    provider: 'default' as const,
    selectedModel: 'google/gemini-flash-1.5',
    hasConfiguredKeys: false,
    hasSeenWarning: false,
};

// Chú thích: Load từ localStorage
function loadFromStorage(): Partial<SettingsState> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                ...parsed,
                hasConfiguredKeys: !!(parsed.openRouterKey || parsed.hfToken),
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
            openRouterKey: state.openRouterKey,
            hfToken: state.hfToken,
            provider: state.provider,
            selectedModel: state.selectedModel,
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

    setOpenRouterKey: (key: string) => {
        set({ openRouterKey: key });
        get().saveSettings();
    },

    setHfToken: (token: string) => {
        set({ hfToken: token });
        get().saveSettings();
    },

    setProvider: (provider) => {
        set({ provider });
        get().saveSettings();
    },

    setSelectedModel: (model: string) => {
        set({ selectedModel: model });
        get().saveSettings();
    },

    setHasSeenWarning: (seen: boolean) => {
        set({ hasSeenWarning: seen });
        get().saveSettings();
    },

    checkKeysConfigured: () => {
        const state = get();
        const hasKeys = !!(state.openRouterKey || state.hfToken);
        set({ hasConfiguredKeys: hasKeys });
        return hasKeys;
    },

    loadSettings: () => {
        const loaded = loadFromStorage();
        set(loaded);
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
}));
