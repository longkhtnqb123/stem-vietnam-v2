import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
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
            <div className="lms-auth-card">
                <div className="lms-auth-header">
                    <div className="lms-user-avatar">SV</div>
                    <h1 className="lms-auth-title">Dang nhap</h1>
                    <p className="lms-auth-subtitle">Chao mung ban quay lai</p>
                </div>

                <form onSubmit={handleSubmit} className="lms-card lms-form">
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
                        <div className="lms-row">
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
                                className="lms-button-ghost"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                        <a href="#" className="lms-note">Quen mat khau?</a>
                        <button type="submit" disabled={isLoading} className="lms-button">
                            {isLoading ? <div className="lms-spinner" /> : <ArrowRight size={16} />}
                            <span>Dang nhap</span>
                        </button>
                    </div>
                </form>

                <p className="lms-note" style={{ textAlign: 'center' }}>
                    Chua co tai khoan?{' '}
                    <Link to="/register" className="lms-badge">
                        Dang ky
                    </Link>
                </p>
            </div>
        </div>
    );
}
