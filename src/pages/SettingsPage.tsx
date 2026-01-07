// Chú thích: Settings Page - Cấu hình hệ thống AI đa nền tảng
// UI mới với dropdown provider, API key input, và model selection grid
import { useState, useEffect } from 'react';
import {
    Settings,
    Key,
    CheckCircle,
    AlertCircle,
    Eye,
    EyeOff,
    ExternalLink,
    Zap,
    RefreshCw,
    Database,
    Shield
} from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { useAppStore } from '../stores/appStore';
import {
    AI_PROVIDERS,
    getProviderById,
    getDefaultModels,
} from '../lib/aiProviders';
import type { AIProviderType, ModelInfo } from '../lib/aiProviders';


// Chú thích: Component cho Provider Icon trong grid
function ProviderIcon({
    provider,
    isSelected,
    onClick
}: {
    provider: typeof AI_PROVIDERS[0];
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`
                flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                hover:shadow-md hover:scale-[1.02]
                ${isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-primary-300'
                }
            `}
        >
            {/* Icon với gradient */}
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 text-white text-xl"
                style={{
                    background: `linear-gradient(135deg, ${provider.colorFrom}, ${provider.colorTo})`
                }}
            >
                <Zap size={24} />
            </div>

            {/* Tên provider */}
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center">
                {provider.name}
            </span>

            {/* Badge khuyên dùng */}
            {provider.recommended && (
                <span className="text-[10px] text-primary-600 dark:text-primary-400 mt-1">
                    (Khuyên dùng)
                </span>
            )}
        </button>
    );
}

// Chú thích: Component cho Model Card
function ModelCard({
    model,
    isSelected,
    onClick
}: {
    model: ModelInfo;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`
                w-full text-left p-3 rounded-lg border transition-all duration-150
                ${isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-slate-200 dark:border-slate-600 hover:border-primary-300 bg-white dark:bg-slate-800'
                }
            `}
        >
            <div className="flex items-center justify-between">
                <div>
                    <div className="font-medium text-slate-800 dark:text-white text-sm">
                        {model.name}
                    </div>
                    {model.description && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            {model.description}
                        </div>
                    )}
                </div>
                {model.isFree && (
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
                        Miễn phí
                    </span>
                )}
                {isSelected && (
                    <CheckCircle size={16} className="text-primary-500 ml-2" />
                )}
            </div>
        </button>
    );
}

export default function SettingsPage() {
    const {
        provider,
        apiKey,
        selectedModel,
        availableModels,
        isLoadingModels,
        ragEnabled,
        hasConfiguredKeys,
        setProvider,
        setApiKey,
        setSelectedModel,
        setRagEnabled,
        saveSettings,
        resetSettings,
        loadModelsForProvider,
    } = useSettingsStore();

    const { setNotification } = useAppStore();

    // Local state
    const [localProvider, setLocalProvider] = useState<AIProviderType | 'default'>(provider);
    const [localApiKey, setLocalApiKey] = useState(apiKey);
    const [localModel, setLocalModel] = useState(selectedModel);
    const [localRagEnabled, setLocalRagEnabled] = useState(ragEnabled);
    const [showApiKey, setShowApiKey] = useState(false);
    const [localModels, setLocalModels] = useState<ModelInfo[]>(availableModels);

    // Chú thích: Sync local state khi store thay đổi
    useEffect(() => {
        setLocalProvider(provider);
        setLocalApiKey(apiKey);
        setLocalModel(selectedModel);
        setLocalRagEnabled(ragEnabled);
        setLocalModels(availableModels);
    }, [provider, apiKey, selectedModel, ragEnabled, availableModels]);

    // Chú thích: Load models khi đổi provider
    useEffect(() => {
        if (localProvider !== 'default') {
            const models = getDefaultModels(localProvider);
            setLocalModels(models);
            // Chọn model đầu tiên nếu model hiện tại không thuộc provider mới
            if (models.length > 0 && !models.find(m => m.id === localModel)) {
                setLocalModel(models[0].id);
            }
        } else {
            const models = getDefaultModels('openrouter');
            setLocalModels(models);
        }
    }, [localProvider]);

    // Chú thích: Lấy thông tin provider hiện tại
    const currentProviderInfo = localProvider !== 'default'
        ? getProviderById(localProvider)
        : null;

    // Chú thích: Xử lý lưu cấu hình
    const handleSave = () => {
        setProvider(localProvider);
        setApiKey(localApiKey);
        setSelectedModel(localModel);
        setRagEnabled(localRagEnabled);
        saveSettings();

        setNotification({
            type: 'success',
            message: 'Đã lưu cấu hình thành công!',
        });
    };

    // Chú thích: Xử lý reset
    const handleReset = () => {
        if (confirm('Bạn có chắc muốn reset về mặc định không?')) {
            resetSettings();
            setLocalProvider('default');
            setLocalApiKey('');
            setLocalModel('google/gemini-flash-1.5');
            setLocalRagEnabled(true);

            setNotification({
                type: 'info',
                message: 'Đã reset về cài đặt mặc định',
            });
        }
    };

    // Chú thích: Load models (placeholder cho API fetch)
    const handleLoadModels = () => {
        loadModelsForProvider();
        setNotification({
            type: 'info',
            message: 'Đã tải danh sách models mặc định',
        });
    };

    return (
        <div className="max-w-6xl mx-auto pb-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    Cấu hình hệ thống
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Quản lý kết nối AI đa nền tảng
                </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Left Column: Provider & API Key */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        {/* Section Icon */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <Settings className="text-white" size={24} />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900 dark:text-white">
                                    Nhà cung cấp AI
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Chọn và cấu hình provider
                                </p>
                            </div>
                        </div>

                        {/* Provider Dropdown */}
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                                Nhà cung cấp
                            </label>
                            <select
                                value={localProvider}
                                onChange={(e) => setLocalProvider(e.target.value as AIProviderType | 'default')}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            >
                                <option value="default">--- Chọn nhà cung cấp ---</option>
                                {AI_PROVIDERS.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} {p.recommended ? '(Khuyên dùng)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* API Key Input */}
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                                <div className="flex items-center gap-2">
                                    <Key size={14} />
                                    API Key
                                </div>
                            </label>
                            <div className="relative">
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={localApiKey}
                                    onChange={(e) => setLocalApiKey(e.target.value)}
                                    placeholder={currentProviderInfo?.apiKeyPlaceholder || 'Nhập API Key...'}
                                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Link lấy API Key */}
                            {currentProviderInfo && (
                                <a
                                    href={currentProviderInfo.apiKeyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-2"
                                >
                                    <ExternalLink size={12} />
                                    Lấy API Key tại {currentProviderInfo.name}
                                </a>
                            )}
                        </div>

                        {/* RAG Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                    <Database className="text-white" size={18} />
                                </div>
                                <div>
                                    <div className="font-medium text-slate-800 dark:text-white text-sm">
                                        Kích hoạt RAG
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        Dùng tài liệu để trả lời
                                    </div>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localRagEnabled}
                                    onChange={(e) => setLocalRagEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-primary-500"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Right Column: Model Selection */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        {/* Section Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Zap className="text-amber-500" size={20} />
                                <h2 className="font-semibold text-slate-900 dark:text-white">
                                    Chọn Model
                                </h2>
                            </div>
                            <button
                                onClick={handleLoadModels}
                                disabled={isLoadingModels}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            >
                                <RefreshCw size={14} className={isLoadingModels ? 'animate-spin' : ''} />
                                Tải Models
                            </button>
                        </div>

                        {/* Provider Icons Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {AI_PROVIDERS.slice(0, 6).map((p) => (
                                <ProviderIcon
                                    key={p.id}
                                    provider={p}
                                    isSelected={localProvider === p.id}
                                    onClick={() => setLocalProvider(p.id)}
                                />
                            ))}
                        </div>

                        {/* Models List */}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
                            {localModels.length > 0 ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {localModels.map((model) => (
                                        <ModelCard
                                            key={model.id}
                                            model={model}
                                            isSelected={localModel === model.id}
                                            onClick={() => setLocalModel(model.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                                    <Database size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="font-medium">Chưa tải danh sách Models</p>
                                    <p className="text-sm mt-1">
                                        Vui lòng nhập API Key và nhấn "Tải Models" để hệ thống kết nối tới nhà cung cấp
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Button */}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleSave}
                                className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                            >
                                <CheckCircle size={18} />
                                Xác nhận cấu hình
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Policy Configuration Card */}
            <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <Shield className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-900 dark:text-white">
                            Cấu hình Policy
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Quy định áp dụng khi tạo ma trận và đề thi
                        </p>
                    </div>
                </div>

                {/* Placeholder for policy config */}
                <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-center text-slate-500 dark:text-slate-400">
                    <p className="text-sm">Tính năng đang phát triển...</p>
                </div>
            </div>

            {/* Security Info */}
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

            {/* Status Banners */}
            {hasConfiguredKeys && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">Đã cấu hình thành công</h3>
                            <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                API keys đã được lưu an toàn trên trình duyệt.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
