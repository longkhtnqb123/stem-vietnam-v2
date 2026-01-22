// Toast Notification System
import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substring(7);
        const toast: Toast = { id, type, message, duration };

        setToasts((prev) => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((toast) => {
                    const label = toast.type === 'success'
                        ? 'OK'
                        : toast.type === 'error'
                            ? 'ERR'
                            : toast.type === 'warning'
                                ? 'WARN'
                                : 'INFO';

                    return (
                        <div
                            key={toast.id}
                            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
              backdrop-blur-sm border animate-slide-in-right
              ${toast.type === 'success' ? 'bg-green-500/90 border-green-400 text-white' : ''}
              ${toast.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' : ''}
              ${toast.type === 'warning' ? 'bg-yellow-500/90 border-yellow-400 text-white' : ''}
              ${toast.type === 'info' ? 'bg-blue-500/90 border-blue-400 text-white' : ''}
            `}
                        >
                            <span className="lms-guide-tag">{label}</span>

                            <span className="font-medium">{toast.message}</span>

                            <button
                                onClick={() => removeToast(toast.id)}
                                className="ml-2 hover:opacity-70 transition-opacity"
                            >
                                Dong
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
