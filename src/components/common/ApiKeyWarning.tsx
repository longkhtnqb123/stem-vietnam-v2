// Chú thích: API Key Warning - Modal cảnh báo cho người dùng mới
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Settings, X } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../lib/auth';

export default function ApiKeyWarning() {
    const navigate = useNavigate();
    const { hasConfiguredKeys, hasSeenWarning, setHasSeenWarning } = useSettingsStore();
    const { user } = useAuthStore();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Chú thích: Hiện warning nếu DĐÃ ĐĂNG NHẬP, chưa config key VÀ chưa từng thấy warning
        if (user && !hasConfiguredKeys && !hasSeenWarning) {
            // Delay 1 giây để user nhìn thấy UI trước
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [hasConfiguredKeys, hasSeenWarning, user]);

    const handleGoToSettings = () => {
        setHasSeenWarning(true);
        setIsVisible(false);
        navigate('/settings');
    };

    const handleDismiss = () => {
        setHasSeenWarning(true);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-in relative">
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    aria-label="Đóng"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="text-center mb-5">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                        <AlertTriangle className="text-amber-600 dark:text-amber-400" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cấu hình API Key</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                        Để sử dụng đầy đủ tính năng AI mà không bị giới hạn
                    </p>
                </div>

                {/* Content */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 mb-5">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm">Tại sao cần API Key?</h3>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
                        <li className="flex items-start gap-2">
                            <span className="text-primary-500 mt-0.5">•</span>
                            <span>Sử dụng không giới hạn các tính năng AI</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary-500 mt-0.5">•</span>
                            <span>Chọn model AI phù hợp với nhu cầu</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary-500 mt-0.5">•</span>
                            <span>Dữ liệu được lưu an toàn trên thiết bị của bạn</span>
                        </li>
                    </ul>
                </div>

                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 mb-5">
                    <p className="text-sm text-primary-700 dark:text-primary-300">
                        💡 <strong>Miễn phí 100%</strong> - Bạn có thể lấy API key miễn phí từ OpenRouter hoặc HuggingFace
                    </p>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleGoToSettings}
                        className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-primary-600 transition-all shadow-sm hover:shadow-md"
                    >
                        <Settings size={20} />
                        Đi tới Cài đặt
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all text-sm"
                    >
                        Để sau (Dùng key mặc định)
                    </button>
                </div>
            </div>
        </div>
    );
}
