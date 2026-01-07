// Chú thích: Settings Page - Cấu hình API Keys và Provider
import { useState } from 'react';
import { Settings, Key, Save, RotateCcw, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { useAppStore } from '../stores/appStore';

export default function SettingsPage() {
    const {
        openRouterKey,
        hfToken,
        provider,
        selectedModel,
        setOpenRouterKey,
        setHfToken,
        setProvider,
        setSelectedModel,
        saveSettings,
        resetSettings,
        hasConfiguredKeys,
    } = useSettingsStore();

    const { setNotification } = useAppStore();

    const [localOpenRouterKey, setLocalOpenRouterKey] = useState(openRouterKey);
    const [localHfToken, setLocalHfToken] = useState(hfToken);
    const [localProvider, setLocalProvider] = useState(provider);
    const [localModel, setLocalModel] = useState(selectedModel);
    const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
    const [showHfToken, setShowHfToken] = useState(false);

    const handleSave = () => {
        setOpenRouterKey(localOpenRouterKey);
        setHfToken(localHfToken);
        setProvider(localProvider);
        setSelectedModel(localModel);
        saveSettings();

        setNotification({
            type: 'success',
            message: 'Đã lưu cài đặt thành công!',
        });
    };

    const handleReset = () => {
        if (confirm('Bạn có chắc muốn reset về mặc định không?')) {
            resetSettings();
            setLocalOpenRouterKey('');
            setLocalHfToken('');
            setLocalProvider('default');
            setLocalModel('google/gemini-flash-1.5');

            setNotification({
                type: 'info',
                message: 'Đã reset về cài đặt mặc định',
            });
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
                    <Settings className="text-white" size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cài đặt</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý API keys và tùy chọn provider</p>
                </div>
            </div>

            {/* Status Banner */}
            {!hasConfiguredKeys && (
                <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Chưa cấu hình API Key</h3>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                Bạn đang sử dụng key mặc định của hệ thống. Để đảm bảo trải nghiệm tốt nhất và không giới hạn,
                                hãy cấu hình API key riêng của bạn bên dưới.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {hasConfiguredKeys && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">Đã cấu hình thành công</h3>
                            <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                API keys của bạn đã được lưu an toàn trên trình duyệt.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                {/* Provider Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Provider
                    </label>
                    <select
                        value={localProvider}
                        onChange={(e) => setLocalProvider(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="default">Mặc định (Hệ thống)</option>
                        <option value="openrouter">OpenRouter (Khuyến nghị)</option>
                        <option value="huggingface">HuggingFace</option>
                    </select>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        {localProvider === 'default' && 'Sử dụng API key mặc định của hệ thống (có thể có giới hạn)'}
                        {localProvider === 'openrouter' && 'Hỗ trợ nhiều model AI mạnh mẽ (Gemini, DeepSeek, Claude...)'}
                        {localProvider === 'huggingface' && 'Dùng cho Embeddings và một số model miễn phí'}
                    </p>
                </div>

                {/* OpenRouter API Key */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <div className="flex items-center gap-2">
                            <Key size={16} />
                            OpenRouter API Key
                        </div>
                    </label>
                    <div className="relative">
                        <input
                            type={showOpenRouterKey ? 'text' : 'password'}
                            value={localOpenRouterKey}
                            onChange={(e) => setLocalOpenRouterKey(e.target.value)}
                            placeholder="sk-or-v1-..."
                            className="w-full px-4 py-2.5 pr-12 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            {showOpenRouterKey ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        Lấy miễn phí tại <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">openrouter.ai/keys</a>
                    </p>
                </div>

                {/* HuggingFace Token */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <div className="flex items-center gap-2">
                            <Key size={16} />
                            HuggingFace API Token
                        </div>
                    </label>
                    <div className="relative">
                        <input
                            type={showHfToken ? 'text' : 'password'}
                            value={localHfToken}
                            onChange={(e) => setLocalHfToken(e.target.value)}
                            placeholder="hf_..."
                            className="w-full px-4 py-2.5 pr-12 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={() => setShowHfToken(!showHfToken)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            {showHfToken ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        Lấy miễn phí tại <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">huggingface.co/settings/tokens</a>
                    </p>
                </div>

                {/* Model Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Model
                    </label>
                    <select
                        value={localModel}
                        onChange={(e) => setLocalModel(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        disabled={localProvider === 'default'}
                    >
                        <option value="google/gemini-flash-1.5">Gemini Flash 1.5 (Mạnh & Nhanh - Khuyến nghị)</option>
                        <option value="google/gemini-pro-1.5">Gemini Pro 1.5 (Mạnh nhất)</option>
                        <option value="deepseek/deepseek-chat">DeepSeek Chat (Miễn phí)</option>
                        <option value="meta-llama/llama-3.2-3b-instruct">Llama 3.2 3B (Nhẹ)</option>
                    </select>
                    {localProvider === 'default' && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                            Chọn provider khác để tùy chỉnh model
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-primary-600 transition-all shadow-sm"
                    >
                        <Save size={18} />
                        Lưu cài đặt
                    </button>
                    <button
                        onClick={handleReset}
                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                    >
                        <RotateCcw size={18} />
                        Reset
                    </button>
                </div>
            </div>

            {/* Info Card */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <AlertCircle size={18} className="text-primary-500" />
                    Lưu ý bảo mật
                </h3>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 ml-6 list-disc">
                    <li>API keys được lưu trực tiếp trên trình duyệt của bạn (localStorage)</li>
                    <li>Chúng tôi không lưu trữ hoặc gửi API keys của bạn lên server</li>
                    <li>Không chia sẻ API keys với người khác</li>
                    <li>Nên sử dụng API keys có giới hạn chi tiêu để an toàn</li>
                </ul>
            </div>
        </div>
    );
}
