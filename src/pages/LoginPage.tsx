import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../lib/auth';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading, error, clearError } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const success = await login(email, password);
        if (success) {
            navigate('/chat');
        }
    };

    return (
        <div className="lms-auth">
            <div className="lms-auth-shell">
                <section className="lms-auth-hero">
                    <span className="lms-auth-kicker">STEM Vietnam</span>
                    <h1 className="lms-auth-heading">Hoc cong nghe theo cach thuc te.</h1>
                    <p className="lms-auth-copy">
                        Dang nhap de quay lai lop hoc, chat AI va bai luyen tap da luu.
                        Tap trung vao nang luc cong nghe cho THPT.
                    </p>
                    <div className="lms-auth-chips">
                        <span className="lms-auth-chip">Chat AI thong minh</span>
                        <span className="lms-auth-chip">Bai thi theo GDPT</span>
                        <span className="lms-auth-chip">Hoc theo lo trinh</span>
                    </div>
                    <div className="lms-auth-tile">
                        <strong>Goi y nhanh</strong>
                        <span>Su dung email da dang ky de truy cap tai lieu, de thi va lop hoc.</span>
                    </div>
                </section>

                <section className="lms-auth-panel">
                    <div className="lms-auth-header">
                        <div className="lms-user-avatar">SV</div>
                        <h1 className="lms-auth-title">Dang nhap</h1>
                        <p className="lms-auth-subtitle">Chao mung ban quay lai</p>
                    </div>

                    <form onSubmit={handleSubmit} className="lms-auth-form">
                        {error && (
                            <div className="lms-alert">
                                {error}
                            </div>
                        )}

                        <div className="lms-section">
                            <label className="lms-label">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                                placeholder="email@example.com"
                                className="lms-input"
                                required
                            />
                        </div>

                        <div className="lms-section">
                            <label className="lms-label">Mat khau</label>
                            <div className="lms-auth-row">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); clearError(); }}
                                    placeholder="********"
                                    className="lms-input"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="lms-auth-toggle"
                                    aria-label={showPassword ? 'An mat khau' : 'Hien mat khau'}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="lms-auth-action">
                            <a href="#" className="lms-auth-link">Quen mat khau?</a>
                            <button type="submit" disabled={isLoading} className="lms-auth-submit">
                                {isLoading ? <div className="lms-spinner" /> : null}
                                <span>Dang nhap</span>
                            </button>
                        </div>
                    </form>

                    <div className="lms-auth-footer">
                        Chua co tai khoan?{' '}
                        <Link to="/register" className="lms-badge">
                            Dang ky
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
