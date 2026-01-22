import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
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
                        <h1 className="lms-auth-heading">San sang vao lop hoc.</h1>
                        <p className="lms-auth-copy">
                            Tai khoan cua ban da duoc tao. He thong se chuyen ve trang chu trong giay lat.
                        </p>
                        <div className="lms-auth-chips">
                            <span className="lms-auth-chip">Ho so hoc tap</span>
                            <span className="lms-auth-chip">De thi mau</span>
                            <span className="lms-auth-chip">Chat AI</span>
                        </div>
                    </section>
                    <section className="lms-auth-panel">
                        <div className="lms-auth-header" style={{ textAlign: 'center' }}>
                            <div className="lms-user-avatar" style={{ margin: '0 auto' }}>OK</div>
                            <h2 className="lms-auth-title">Dang ky thanh cong</h2>
                            <p className="lms-auth-subtitle">Dang chuyen den trang chu...</p>
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
                    <h1 className="lms-auth-heading">Bat dau hanh trinh cong nghe.</h1>
                    <p className="lms-auth-copy">
                        Tao tai khoan de luu tien do, nhan tai lieu va theo doi ket qua bai thi.
                    </p>
                    <div className="lms-auth-chips">
                        <span className="lms-auth-chip">Lop hoc linh hoat</span>
                        <span className="lms-auth-chip">Bao cao ca nhan</span>
                        <span className="lms-auth-chip">De thi tu dong</span>
                    </div>
                    <div className="lms-auth-tile">
                        <strong>Thong tin can co</strong>
                        <span>Chuan bi email va mat khau toi thieu 6 ky tu.</span>
                    </div>
                </section>

                <section className="lms-auth-panel">
                    <div className="lms-auth-header">
                        <div className="lms-user-avatar">SV</div>
                        <h1 className="lms-auth-title">Tao tai khoan</h1>
                        <p className="lms-auth-subtitle">Tham gia he thong hoc tap</p>
                    </div>

                    <form onSubmit={handleSubmit} className="lms-auth-form">
                        {error && (
                            <div className="lms-alert">
                                {error}
                            </div>
                        )}

                        <div className="lms-section">
                            <label className="lms-label">Vai tro</label>
                            <div className="lms-auth-row">
                                <button
                                    type="button"
                                    onClick={() => setRole('student')}
                                    className={`lms-auth-choice ${role === 'student' ? 'is-active' : ''}`}
                                >
                                    Hoc sinh
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('teacher')}
                                    className={`lms-auth-choice ${role === 'teacher' ? 'is-active' : ''}`}
                                >
                                    Giao vien
                                </button>
                            </div>
                        </div>

                        <div className="lms-section">
                            <label className="lms-label">Ho va ten</label>
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
                            <label className="lms-label">Mat khau</label>
                            <div className="lms-auth-row">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); clearError(); }}
                                    placeholder="Toi thieu 6 ky tu"
                                    className="lms-input"
                                    required
                                    minLength={6}
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

                        <div className="lms-section">
                            <label className="lms-label">Xac nhan mat khau</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                                placeholder="Nhap lai mat khau"
                                className="lms-input"
                                required
                            />
                            {passwordMatch && <span className="lms-note">Mat khau khop</span>}
                            {passwordMismatch && <span className="lms-note" style={{ color: 'var(--lms-danger)' }}>Mat khau khong khop</span>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || Boolean(passwordMismatch)}
                            className="lms-auth-submit"
                        >
                            {isLoading ? <div className="lms-spinner" /> : null}
                            <span>Dang ky</span>
                        </button>
                    </form>

                    <div className="lms-auth-footer">
                        Da co tai khoan?{' '}
                        <Link to="/login" className="lms-badge">
                            Dang nhap
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
