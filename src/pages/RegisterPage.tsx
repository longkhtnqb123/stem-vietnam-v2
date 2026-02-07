import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../lib/auth';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const [role, setRole] = useState<UserRole>('student');
    const { register, isLoading, error, clearError } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return;
        }

        const result = await register(name, email, password, role);
        if (result) {
            setSuccess(true);
            setTimeout(() => navigate('/'), 1500);
        }
    };

    const passwordMatch = password && confirmPassword && password === confirmPassword;
    const passwordMismatch = password && confirmPassword && password !== confirmPassword;

    if (success) {
        return (
            <div className="lms-auth">
                <div className="lms-auth-shell">
                    <section className="lms-auth-hero">
                        <span className="lms-auth-kicker">STEM Vietnam</span>
                        <h1 className="lms-auth-heading">Sẵn sàng vào lớp học.</h1>
                        <p className="lms-auth-copy">
                            Tài khoản của bạn đã được tạo. Hệ thống sẽ chuyển về trang chủ trong giây lát.
                        </p>
                        <div className="lms-auth-chips">
                            <span className="lms-auth-chip">Hồ sơ học tập</span>
                            <span className="lms-auth-chip">Đề thi mẫu</span>
                            <span className="lms-auth-chip">Chat AI</span>
                        </div>
                    </section>
                    <section className="lms-auth-panel">
                        <div className="lms-auth-header" style={{ textAlign: 'center' }}>
                            <div className="lms-user-avatar" style={{ margin: '0 auto' }}>OK</div>
                            <h2 className="lms-auth-title">Đăng ký thành công</h2>
                            <p className="lms-auth-subtitle">Đang chuyển đến trang chủ...</p>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="lms-auth">
            <div className="lms-auth-shell">
                <section className="lms-auth-hero">
                    <span className="lms-auth-kicker">STEM Vietnam</span>
                    <h1 className="lms-auth-heading">Bắt đầu hành trình công nghệ.</h1>
                    <p className="lms-auth-copy">
                        Tạo tài khoản để lưu tiến độ, nhận tài liệu và theo dõi kết quả bài thi.
                    </p>
                    <div className="lms-auth-chips">
                        <span className="lms-auth-chip">Lớp học linh hoạt</span>
                        <span className="lms-auth-chip">Báo cáo cá nhân</span>
                        <span className="lms-auth-chip">Đề thi tự động</span>
                    </div>
                    <div className="lms-auth-tile">
                        <strong>Thông tin cần có</strong>
                        <span>Chuẩn bị email và mật khẩu tối thiểu 6 ký tự.</span>
                    </div>
                </section>

                <section className="lms-auth-panel">
                    <div className="lms-auth-header">
                        <div className="lms-user-avatar">SV</div>
                        <h1 className="lms-auth-title">Tạo tài khoản</h1>
                        <p className="lms-auth-subtitle">Tham gia hệ thống học tập</p>
                    </div>

                    <form onSubmit={handleSubmit} className="lms-auth-form">
                        {error && (
                            <div className="lms-alert">
                                {error}
                            </div>
                        )}

                        <div className="lms-section">
                            <label className="lms-label">Vai trò</label>
                            <div className="lms-auth-row">
                                <button
                                    type="button"
                                    onClick={() => setRole('student')}
                                    className={`lms-auth-choice ${role === 'student' ? 'is-active' : ''}`}
                                >
                                    Học sinh
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('teacher')}
                                    className={`lms-auth-choice ${role === 'teacher' ? 'is-active' : ''}`}
                                >
                                    Giáo viên
                                </button>
                            </div>
                        </div>

                        <div className="lms-section">
                            <label className="lms-label">Họ và tên</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => { setName(e.target.value); clearError(); }}
                                placeholder="Nguyen Van A"
                                className="lms-input"
                                required
                            />
                        </div>

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
                                    placeholder="Tối thiểu 6 ký tự"
                                    className="lms-input"
                                    required
                                    minLength={6}
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

                        <div className="lms-section">
                            <label className="lms-label">Xác nhận mật khẩu</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                                placeholder="Nhập lại mật khẩu"
                                className="lms-input"
                                required
                            />
                            {passwordMatch && <span className="lms-note">Mật khẩu khớp</span>}
                            {passwordMismatch && <span className="lms-note" style={{ color: 'var(--lms-danger)' }}>Mật khẩu không khớp</span>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || Boolean(passwordMismatch)}
                            className="lms-auth-submit"
                        >
                            {isLoading ? <div className="lms-spinner" /> : null}
                            <span>Đăng ký</span>
                        </button>
                    </form>

                    <div className="lms-auth-footer">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="lms-badge">
                            Đăng nhập
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
