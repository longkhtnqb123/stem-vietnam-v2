import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../lib/auth';

export default function ApiKeyWarning() {
    const navigate = useNavigate();
    const { hasConfiguredKeys, hasSeenWarning, setHasSeenWarning } = useSettingsStore();
    const { user } = useAuthStore();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (user && !hasConfiguredKeys && !hasSeenWarning) {
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
        <div className="lms-modal">
            <div className="lms-modal-panel" style={{ maxWidth: 520 }}>
                <div className="lms-modal-header">
                    <div className="lms-card-title">Cấu hình AI</div>
                    <button onClick={handleDismiss} className="lms-button-ghost" aria-label="Đóng">
                        Đóng
                    </button>
                </div>
                <div className="lms-modal-body lms-section">
                    <div className="lms-alert">
                        <span>Bạn chưa cấu hình API key cho AI.</span>
                    </div>
                    <p className="lms-note">
                        API key giúp AI hoạt động ổn định và không bị giới hạn.
                    </p>
                </div>
                <div className="lms-modal-footer">
                    <button onClick={handleDismiss} className="lms-button-secondary">
                        Để sau
                    </button>
                    <button onClick={handleGoToSettings} className="lms-button">
                        <span>Đi tới Cài đặt</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
