// Chú thích: Auth Guard - Bắt buộc đăng nhập với popup thông báo
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const { user, token, checkAuth, isLoading } = useAuthStore();
    const [showPopup, setShowPopup] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check auth on mount
        if (token) {
            checkAuth();
        }
    }, []);

    useEffect(() => {
        // Show popup if not logged in
        if (!isLoading && !user) {
            setShowPopup(true);
        }
    }, [isLoading, user]);

    // If logged in, render children
    if (user) {
        return <>{children}</>;
    }

    // If loading, show loading state
    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
            </div>
        );
    }

    // Show popup overlay
    return (
        <>
            {/* Blurred background content */}
            <div className="pointer-events-none opacity-30 blur-sm">
                {children}
            </div>

            {/* Auth Popup */}
            {showPopup && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-in">
                        {/* Icon */}
                        <div className="text-center mb-5">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-100 mb-4">
                                <LogIn className="text-primary-600" size={28} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Đăng nhập để tiếp tục</h2>
                            <p className="text-slate-500 text-sm mt-2">
                                Bạn cần đăng nhập để sử dụng tính năng này. Lịch sử chat sẽ được lưu theo tài khoản của bạn.
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-2.5 bg-primary-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-primary-600 transition-all text-sm"
                            >
                                <LogIn size={18} />
                                Đăng nhập
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-slate-200 transition-all text-sm"
                            >
                                <UserPlus size={18} />
                                Tạo tài khoản mới
                            </button>
                        </div>

                        {/* Back to home */}
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => navigate('/')}
                                className="text-sm text-slate-400 hover:text-slate-600"
                            >
                                Quay về trang chủ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
