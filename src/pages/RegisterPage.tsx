// Chú thích: Register Page - Giao diện nhẹ nhàng, nền trắng
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Check } from 'lucide-react';
import { useAuthStore } from '../lib/auth';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const { register, isLoading, error, clearError } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return;
        }

        const result = await register(name, email, password);
        if (result) {
            setSuccess(true);
            // Chú thích: Redirect về home vì đã tự động login sau khi đăng ký
            setTimeout(() => navigate('/'), 1500);
        }
    };

    const passwordMatch = password && confirmPassword && password === confirmPassword;
    const passwordMismatch = password && confirmPassword && password !== confirmPassword;

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                        <Check className="text-green-600" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Đăng ký thành công!</h2>
                    <p className="text-slate-500 text-sm">Đang chuyển đến trang chủ...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500 mb-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Tạo tài khoản</h1>
                    <p className="text-slate-500 mt-1 text-sm">Tham gia Học Công Nghệ ngay hôm nay</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Họ và tên</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); clearError(); }}
                                    placeholder="Nguyễn Văn A"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); clearError(); }}
                                    placeholder="email@example.com"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); clearError(); }}
                                    placeholder="Ít nhất 6 ký tự"
                                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Xác nhận mật khẩu</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                                    placeholder="Nhập lại mật khẩu"
                                    className={`w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-50 border text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm ${passwordMatch ? 'border-green-400' : passwordMismatch ? 'border-red-400' : 'border-slate-200'
                                        }`}
                                    required
                                />
                                {passwordMatch && (
                                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                                )}
                            </div>
                            {passwordMismatch && (
                                <p className="text-red-500 text-xs mt-1">Mật khẩu không khớp</p>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading || Boolean(passwordMismatch)}
                        className="w-full mt-6 py-2.5 rounded-lg bg-primary-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Đăng ký
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>

                {/* Login link */}
                <p className="text-center mt-6 text-slate-500 text-sm">
                    Đã có tài khoản?{' '}
                    <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
}
