// Chú thích: Zustand store cho app state
import { create } from 'zustand';

interface AppState {
    // Theme
    isDarkMode: boolean;
    toggleDarkMode: () => void;

    // RAG settings
    useDefaultLibrary: boolean;
    toggleDefaultLibrary: () => void;

    // Loading states
    isLoading: boolean;
    setLoading: (loading: boolean) => void;

    // Toast/notifications
    notification: { type: 'success' | 'error' | 'info'; message: string } | null;
    showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
    clearNotification: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    // Chú thích: Dark mode với localStorage persist
    isDarkMode: typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark',

    toggleDarkMode: () => set((state) => {
        const newMode = !state.isDarkMode;
        // Chú thích: Persist preference
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
        // Chú thích: Toggle class on document
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        return { isDarkMode: newMode };
    }),

    useDefaultLibrary: true, // Default to true as requested
    toggleDefaultLibrary: () => set((state) => ({ useDefaultLibrary: !state.useDefaultLibrary })),

    isLoading: false,
    setLoading: (loading) => set({ isLoading: loading }),

    notification: null,
    showNotification: (type, message) => {
        set({ notification: { type, message } });
        // Chú thích: Auto clear sau 3s
        setTimeout(() => set({ notification: null }), 3000);
    },
    clearNotification: () => set({ notification: null }),
}));
