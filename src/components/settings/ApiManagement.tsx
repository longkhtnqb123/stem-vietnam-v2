import { useState, useEffect } from 'react';
import type { UserSettings } from '../../lib/settingsApi';
import { useAppStore } from '../../stores/appStore';

interface Props {
    settings: UserSettings;
    onUpdate: (updates: Partial<UserSettings>) => Promise<UserSettings>;
}

export default function ApiManagement({ settings, onUpdate }: Props) {
    const { showNotification } = useAppStore();
    const [keys, setKeys] = useState({
        openRouter: settings.apiKeys?.openRouter || '',
        huggingFace: settings.apiKeys?.huggingFace || '',
    });
    const [showKey, setShowKey] = useState<Record<string, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setKeys({
            openRouter: settings.apiKeys?.openRouter || '',
            huggingFace: settings.apiKeys?.huggingFace || '',
        });
    }, [settings]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdate({
                apiKeys: {
                    openRouter: keys.openRouter,
                    huggingFace: keys.huggingFace,
                }
            });
            showNotification('success', 'Da luu API key.');
        } catch (error) {
            showNotification('error', 'Loi khi luu API key.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleShow = (key: string) => {
        setShowKey(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="lms-section">
            <div>
                <div className="lms-card-title">Quan ly API Keys</div>
                <p className="lms-note">
                    Nhap API key mot lan. He thong se luu an toan va tu dong tai lai khi dang nhap.
                </p>
            </div>

            <section className="lms-card">
                <div className="lms-card-header">
                    <div>
                        <div className="lms-card-title">OpenRouter API Key</div>
                        <div className="lms-card-subtitle">Khuyen dung cho chat va de thi AI.</div>
                    </div>
                    <span className="lms-badge">Khuyen dung</span>
                </div>
                <div className="lms-section">
                    <div className="lms-row">
                        <input
                            type={showKey['openRouter'] ? 'text' : 'password'}
                            value={keys.openRouter}
                            onChange={(e) => setKeys(prev => ({ ...prev, openRouter: e.target.value }))}
                            placeholder="sk-or-v1-..."
                            className="lms-input"
                        />
                        <button
                            onClick={() => toggleShow('openRouter')}
                            className="lms-text-button"
                        >
                            {showKey['openRouter'] ? 'An' : 'Hien'}
                        </button>
                    </div>
                    <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                        <a
                            href="https://openrouter.ai/keys"
                            target="_blank"
                            rel="noreferrer"
                            className="lms-link"
                        >
                            Lay API key
                        </a>
                        {settings.apiKeys?.openRouter && (
                            <span className="lms-pill">Da cau hinh</span>
                        )}
                    </div>
                </div>
            </section>

            <section className="lms-card">
                <div className="lms-card-header">
                    <div>
                        <div className="lms-card-title">HuggingFace Token</div>
                        <div className="lms-card-subtitle">Tuy chon cho embeddings hoac tai lieu nang cao.</div>
                    </div>
                    <span className="lms-pill">Optional</span>
                </div>
                <div className="lms-section">
                    <div className="lms-row">
                        <input
                            type={showKey['huggingFace'] ? 'text' : 'password'}
                            value={keys.huggingFace}
                            onChange={(e) => setKeys(prev => ({ ...prev, huggingFace: e.target.value }))}
                            placeholder="hf_..."
                            className="lms-input"
                        />
                        <button
                            onClick={() => toggleShow('huggingFace')}
                            className="lms-text-button"
                        >
                            {showKey['huggingFace'] ? 'An' : 'Hien'}
                        </button>
                    </div>
                </div>
            </section>

            <div className="lms-row" style={{ justifyContent: 'flex-end' }}>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="lms-button"
                >
                    {isSaving ? 'Dang luu...' : 'Luu cau hinh'}
                </button>
            </div>
        </div>
    );
}
