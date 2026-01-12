// useSettings Hook - Manage user settings state
import { useState, useEffect } from 'react';
import { useAuthStore } from '../lib/auth';
import { getUserSettings, updateUserSettings, type UserSettings } from '../lib/settingsApi';

export function useSettings() {
    const { token } = useAuthStore();
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load settings on mount
    useEffect(() => {
        if (!token) {
            setIsLoading(false);
            return;
        }

        loadSettings();
    }, [token]);

    const loadSettings = async () => {
        if (!token) return;

        try {
            setIsLoading(true);
            setError(null);
            const data = await getUserSettings(token);
            setSettings(data);
        } catch (err: any) {
            console.error('[useSettings] load error:', err);
            setError(err.message || 'Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const updateSettings = async (updates: Partial<UserSettings>) => {
        if (!token) {
            throw new Error('Not authenticated');
        }

        try {
            setError(null);
            const updated = await updateUserSettings(token, updates);
            setSettings(updated);

            // Chú thích: Apply theme immediately when changed
            if (updates.theme) {
                localStorage.setItem('theme', updates.theme);
                // Remove all theme classes first
                document.documentElement.classList.remove('dark', 'sepia');

                if (updates.theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else if (updates.theme === 'sepia') {
                    document.documentElement.classList.add('sepia');
                } else if (updates.theme === 'auto') {
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        document.documentElement.classList.add('dark');
                    }
                }
                // 'light' = no class needed
            }

            return updated;
        } catch (err: any) {
            console.error('[useSettings] update error:', err);
            setError(err.message || 'Failed to update settings');
            throw err;
        }
    };

    return {
        settings,
        isLoading,
        error,
        updateSettings,
        reload: loadSettings,
    };
}
