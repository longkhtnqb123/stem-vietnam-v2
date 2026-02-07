import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
                    <h1 className="lms-auth-heading">Học công nghệ theo cách thực tế.</h1>
                    <p className="lms-auth-copy">
                        Đăng nhập để quay lại lớp học, chat AI và bài luyện tập đã lưu.
                        Tập trung vào năng lực công nghệ cho THPT.
                    </p>
                    <div className="lms-auth-chips">
                        <span className="lms-auth-chip">Chat AI thông minh</span>
                        <span className="lms-auth-chip">Bài thi theo GDPT</span>
                        <span className="lms-auth-chip">Học theo lộ trình</span>
                    </div>
                    <div className="lms-auth-tile">
                        <strong>Gợi ý nhanh</strong>
                        <span>Sử dụng email đã đăng ký để truy cập tài liệu, đề thi và lớp học.</span>
                    </div>
                </section>

                <section className="lms-auth-panel">
                    <div className="lms-auth-header">
                        <div className="lms-user-avatar">SV</div>
                        <h1 className="lms-auth-title">Đăng nhập</h1>
                        <p className="lms-auth-subtitle">Chào mừng bạn quay lại</p>
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
                            <label className="lms-label">Mật khẩu</label>
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
                                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                >
                                    {showPassword ? 'Ẩn' : 'Hiện'}
                                </button>
                            </div>
                        </div>

                        <div className="lms-auth-action">
                            <a href="#" className="lms-auth-link">Quên mật khẩu?</a>
                            <button type="submit" disabled={isLoading} className="lms-auth-submit">
                                {isLoading ? <div className="lms-spinner" /> : null}
                                <span>Đăng nhập</span>
                            </button>
                        </div>
                    </form>

                    <div className="lms-auth-footer">
                        Chưa có tài khoản?{' '}
                        <Link to="/register" className="lms-badge">
                            Đăng ký
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
