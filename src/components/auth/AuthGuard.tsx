// Chú thích: Auth Guard - Bắt buộc đăng nhập với popup thông báo
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
            <div className="lms-page">
                <div className="lms-empty">
                    <div className="lms-spinner" />
                </div>
            </div>
        );
    }

    // Show popup overlay
    return (
        <>
            {/* Blurred background content */}
            <div className="pointer-events-none" style={{ opacity: 0.3, filter: 'blur(4px)' }}>
                {children}
            </div>

            {/* Auth Popup */}
            {showPopup && (
                <div className="lms-modal">
                    <div className="lms-modal-panel" style={{ maxWidth: 420 }}>
                        <div className="lms-modal-body">
                            <div className="lms-auth-header">
                                <div className="lms-user-avatar">SV</div>
                                <h2 className="lms-auth-title">Dang nhap de tiep tuc</h2>
                                <p className="lms-auth-subtitle">
                                    Ban can dang nhap de su dung tinh nang nay. Lich su chat se duoc luu theo tai khoan cua ban.
                                </p>
                            </div>
                            <div className="lms-form">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="lms-button"
                                >
                                    Dang nhap
                                </button>
                                <button
                                    onClick={() => navigate('/register')}
                                    className="lms-button-secondary"
                                >
                                    Tao tai khoan moi
                                </button>
                                <button
                                    onClick={() => navigate('/')}
                                    className="lms-button-ghost"
                                >
                                    Quay ve trang chu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
