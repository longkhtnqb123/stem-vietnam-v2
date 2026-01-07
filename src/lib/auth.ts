// Chú thích: Auth Store - Zustand store cho authentication state
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Chú thích: API base URL
const API_URL = (import.meta.env.VITE_API_URL || 'https://stem-vietnam-api.stu725114073.workers.dev').replace(/\/$/, '');

// Chú thích: User type
export interface User {
    id: string;
    email: string;
    name: string;
    avatar_url?: string | null;
}

// Chú thích: Auth state
interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<boolean>;
    register: (name: string, email: string, password: string) => Promise<boolean>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await fetch(`${API_URL}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password }),
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Đăng nhập thất bại');
                        set({ error: errorMsg, isLoading: false });
                        return false;
                    }

                    set({
                        user: data.user,
                        token: data.token,
                        isLoading: false,
                        error: null
                    });
                    return true;
                } catch (error) {
                    set({ error: 'Lỗi kết nối server', isLoading: false });
                    return false;
                }
            },

            register: async (name: string, email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await fetch(`${API_URL}/api/auth/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, email, password }),
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        set({ error: data.error || 'Đăng ký thất bại', isLoading: false });
                        return false;
                    }

                    // Chú thích: Sau khi đăng ký thành công, tự động login luôn
                    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password }),
                    });

                    const loginData = await loginRes.json();

                    if (loginRes.ok) {
                        // Chú thích: Set user và token để người dùng đã đăng nhập ngay
                        set({
                            user: loginData.user,
                            token: loginData.token,
                            isLoading: false,
                            error: null
                        });
                    } else {
                        // Chú thích: Nếu login thất bại, vẫn trả về true vì đăng ký đã thành công
                        set({ isLoading: false, error: null });
                    }
                    return true;
                } catch (error) {
                    set({ error: 'Lỗi kết nối server', isLoading: false });
                    return false;
                }
            },

            logout: () => {
                set({ user: null, token: null, error: null });
            },

            checkAuth: async () => {
                const { token } = get();
                if (!token) return;

                set({ isLoading: true });
                try {
                    const res = await fetch(`${API_URL}/api/auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });

                    if (!res.ok) {
                        // Token expired or invalid
                        set({ user: null, token: null, isLoading: false });
                        return;
                    }

                    const data = await res.json();
                    set({ user: data.user, isLoading: false });
                } catch (error) {
                    set({ user: null, token: null, isLoading: false });
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'stem-vietnam-auth',
            partialize: (state) => ({ token: state.token, user: state.user }),
        }
    )
);
