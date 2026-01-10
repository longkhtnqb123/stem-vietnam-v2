import { useState, useEffect } from 'react';
import { Key, Save, Eye, EyeOff, ExternalLink, ShieldCheck } from 'lucide-react';
import { UserSettings } from '../../lib/settingsApi';
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

    // Sync state when settings change (e.g. initial load)
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
                    huggingFace: keys.huggingFace
                }
            });
            showNotification('success', 'Đã lưu API Keys thành công! Bạn không cần nhập lại ở lần sau.');
        } catch (error) {
            showNotification('error', 'Lỗi khi lưu API Keys');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleShow = (key: string) => {
        setShowKey(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Quản lý API Keys
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                    Nhập API Key một lần và sử dụng mãi mãi. Keys được lưu an toàn và được tự động điền khi đăng nhập.
                </p>
            </div>

            {/* OpenRouter Key */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                        <Key size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                            OpenRouter API Key
                            <span className="px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-bold">
                                Khuyên dùng
                            </span>
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Dùng để truy cập hàng trăm model AI (GPT-4, Claude 3, Gemini Pro) với giá rẻ hoặc miễn phí.
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <input
                        type={showKey['openRouter'] ? 'text' : 'password'}
                        value={keys.openRouter}
                        onChange={(e) => setKeys(prev => ({ ...prev, openRouter: e.target.value }))}
                        placeholder="sk-or-v1-..."
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12 font-mono"
                    />
                    <button
                        onClick={() => toggleShow('openRouter')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        {showKey['openRouter'] ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                    <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                        Lấy API Key tại đây <ExternalLink size={12} />
                    </a>
                    {settings.apiKeys?.openRouter && (
                        <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                            <ShieldCheck size={14} /> Đã được cấu hình
                        </span>
                    )}
                </div>
            </div>

            {/* HuggingFace Token */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
                        <Key size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                            HuggingFace Token
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            (Tin chọn) Dùng cho các model mã nguồn mở hoặc custom embedding.
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <input
                        type={showKey['huggingFace'] ? 'text' : 'password'}
                        value={keys.huggingFace}
                        onChange={(e) => setKeys(prev => ({ ...prev, huggingFace: e.target.value }))}
                        placeholder="hf_..."
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent pr-12 font-mono"
                    />
                    <button
                        onClick={() => toggleShow('huggingFace')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        {showKey['huggingFace'] ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-primary-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Lưu Cấu Hình
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
