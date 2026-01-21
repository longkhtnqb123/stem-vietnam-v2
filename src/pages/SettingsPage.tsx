import { useState } from 'react';
import { Settings, Cpu, Key, Palette, BarChart3, Shield } from 'lucide-react';
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
            console.log('Developer Mode Unlocked!');
        }
    };

    const allTabs = [
        { id: 'models' as TabType, label: 'AI Models', icon: Cpu, requiresDev: true },
        { id: 'api-keys' as TabType, label: 'API Keys', icon: Key, requiresDev: true },
        { id: 'preferences' as TabType, label: 'Giao dien', icon: Palette, requiresDev: false },
        { id: 'usage' as TabType, label: 'Thong ke', icon: BarChart3, requiresDev: false },
        { id: 'security' as TabType, label: 'Bao mat', icon: Shield, requiresDev: false },
    ];

    const tabs = allTabs.filter(tab => !tab.requiresDev || isDevMode);

    if (isLoading) {
        return (
            <div className="lms-page">
                <div className="lms-empty">
                    <div className="lms-spinner" />
                    <p className="lms-note">Dang tai cai dat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="lms-page">
            <section className="lms-card" onClick={handleDevModeClick}>
                <div className="lms-card-header">
                    <div>
                        <div className="lms-card-title">Cai dat</div>
                        <div className="lms-card-subtitle">Quan ly tai khoan va tuy chinh giao dien</div>
                    </div>
                    <Settings size={20} />
                </div>
            </section>

            <section className="lms-card">
                <div className="lms-row">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={activeTab === tab.id ? 'lms-button' : 'lms-button-secondary'}
                            >
                                <Icon size={16} /> {tab.label}
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
                            <label className="lms-label">Theme</label>
                            <select
                                value={settings.theme}
                                onChange={(e) => updateSettings({ ...settings, theme: e.target.value as any })}
                                className="lms-select"
                            >
                                <option value="light">Sang</option>
                                <option value="dark">Toi</option>
                                <option value="sepia">Sepia</option>
                                <option value="auto">Tu dong</option>
                            </select>
                        </div>

                        <div className="lms-section">
                            <label className="lms-label">Ngon ngu</label>
                            <select
                                value={settings.language}
                                onChange={(e) => updateSettings({ ...settings, language: e.target.value as 'vi' | 'en' })}
                                className="lms-select"
                            >
                                <option value="vi">Tieng Viet</option>
                                <option value="en">English</option>
                            </select>
                        </div>

                        <div className="lms-section">
                            <label className="lms-label">Su dung backend proxy</label>
                            <div className="lms-row">
                                <input
                                    type="checkbox"
                                    checked={settings.useBackendProxy}
                                    onChange={(e) => updateSettings({ ...settings, useBackendProxy: e.target.checked })}
                                />
                                <span className="lms-note">Dung server de goi AI neu chua co API key</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'usage' && (
                    <div className="lms-empty">Thong ke se cap nhat sau.</div>
                )}

                {activeTab === 'security' && (
                    <div className="lms-empty">Bao mat se cap nhat sau.</div>
                )}
            </section>
        </div>
    );
}
