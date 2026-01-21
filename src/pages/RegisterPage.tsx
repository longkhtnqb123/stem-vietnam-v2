import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Check } from 'lucide-react';
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
                <div className="lms-card lms-auth-card" style={{ textAlign: 'center' }}>
                    <div className="lms-user-avatar" style={{ margin: '0 auto' }}>
                        <Check size={16} />
                    </div>
                    <h2 className="lms-auth-title">Dang ky thanh cong</h2>
                    <p className="lms-auth-subtitle">Dang chuyen den trang chu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="lms-auth">
            <div className="lms-auth-card">
                <div className="lms-auth-header">
                    <div className="lms-user-avatar">SV</div>
                    <h1 className="lms-auth-title">Tao tai khoan</h1>
                    <p className="lms-auth-subtitle">Tham gia he thong hoc tap</p>
                </div>

                <form onSubmit={handleSubmit} className="lms-card lms-form">
                    {error && (
                        <div className="lms-alert">
                            {error}
                        </div>
                    )}

                    <div className="lms-section">
                        <label className="lms-label">Vai tro</label>
                        <div className="lms-row">
                            <button
                                type="button"
                                onClick={() => setRole('student')}
                                className={role === 'student' ? 'lms-button' : 'lms-button-secondary'}
                            >
                                Hoc sinh
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('teacher')}
                                className={role === 'teacher' ? 'lms-button' : 'lms-button-secondary'}
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
                        <div className="lms-row">
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
                                className="lms-button-ghost"
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
                        className="lms-button"
                    >
                        {isLoading ? <div className="lms-spinner" /> : <ArrowRight size={16} />}
                        <span>Dang ky</span>
                    </button>
                </form>

                <p className="lms-note" style={{ textAlign: 'center' }}>
                    Da co tai khoan?{' '}
                    <Link to="/login" className="lms-badge">
                        Dang nhap
                    </Link>
                </p>
            </div>
        </div>
    );
}
