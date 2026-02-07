import { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import ModelSelector from '../components/settings/ModelSelector';
import ApiManagement from '../components/settings/ApiManagement';

type TabType = 'models' | 'api-keys' | 'preferences' | 'usage' | 'security';

export default function SettingsPage() {
    const [devModeCount, setDevModeCount] = useState(0);
    const isDevMode = devModeCount >= 7;

    const [activeTab, setActiveTab] = useState<TabType>('preferences');
    const { settings, isLoading, updateSettings } = useSettings();

    const handleDevModeClick = () => {
        if (isDevMode) return;
        const newCount = devModeCount + 1;
        setDevModeCount(newCount);
        if (newCount === 7) {
            console.log('Chế độ nhà phát triển đã được mở khóa!');
        }
    };

    const allTabs = [
        { id: 'models' as TabType, label: 'Mô hình AI', requiresDev: true },
        { id: 'api-keys' as TabType, label: 'Khóa API', requiresDev: true },
        { id: 'preferences' as TabType, label: 'Giao diện', requiresDev: false },
        { id: 'usage' as TabType, label: 'Thống kê', requiresDev: false },
        { id: 'security' as TabType, label: 'Bảo mật', requiresDev: false },
    ];

    const tabs = allTabs.filter(tab => !tab.requiresDev || isDevMode);

    if (isLoading) {
        return (
            <div className="lms-page">
                <div className="lms-empty">
                    <div className="lms-spinner" />
                    <p className="lms-note">Đang tải cài đặt...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="lms-page">
            <section className="lms-card" onClick={handleDevModeClick}>
                <div className="lms-card-header">
                    <div>
                        <div className="lms-card-title">Cài đặt</div>
                        <div className="lms-card-subtitle">Quản lý tài khoản và tùy chỉnh giao diện</div>
                    </div>
                </div>
            </section>

            <section className="lms-card">
                <div className="lms-row">
                    {tabs.map((tab) => {
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={activeTab === tab.id ? 'lms-button' : 'lms-button-secondary'}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="lms-card">
                {activeTab === 'models' && settings && (
                    <ModelSelector settings={settings} onUpdate={updateSettings} />
                )}

                {activeTab === 'api-keys' && settings && (
                    <ApiManagement settings={settings} onUpdate={updateSettings} />
                )}

                {activeTab === 'preferences' && settings && (
                    <div className="lms-form">
                        <div className="lms-section">
                            <label className="lms-label">Giao diện (Theme)</label>
                            <select
                                value={settings.theme}
                                onChange={(e) => updateSettings({ ...settings, theme: e.target.value as any })}
                                className="lms-select"
                            >
                                <option value="light">Sáng</option>
                                <option value="dark">Tối</option>
                                <option value="sepia">Sepia (Dịu mắt)</option>
                                <option value="auto">Tự động theo hệ thống</option>
                            </select>
                        </div>

                        <div className="lms-section">
                            <label className="lms-label">Ngôn ngữ</label>
                            <select
                                value={settings.language}
                                onChange={(e) => updateSettings({ ...settings, language: e.target.value as 'vi' | 'en' })}
                                className="lms-select"
                            >
                                <option value="vi">Tiếng Việt</option>
                                <option value="en">English</option>
                            </select>
                        </div>

                        <div className="lms-section">
                            <label className="lms-label">Sử dụng backend proxy</label>
                            <div className="lms-row">
                                <input
                                    type="checkbox"
                                    checked={settings.useBackendProxy}
                                    onChange={(e) => updateSettings({ ...settings, useBackendProxy: e.target.checked })}
                                />
                                <span className="lms-note">Dùng server để gọi AI nếu chưa có API key</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'usage' && (
                    <div className="lms-empty">Thống kê sẽ cập nhật sau.</div>
                )}

                {activeTab === 'security' && (
                    <div className="lms-empty">Bảo mật sẽ cập nhật sau.</div>
                )}
            </section>
        </div>
    );
}
