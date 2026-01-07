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
import { fetchModelsForProvider, validateApiKeyFormat, testApiKey } from '../lib/modelService';


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
    // Chú thích: Kiểm tra model miễn phí bằng id có ":free" hoặc field isFree
    const isFreeModel = model.isFree || model.id.includes(':free');

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
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 dark:text-white text-sm truncate">
                        {model.name}
                    </div>
                    {model.description && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {model.description}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    {isFreeModel ? (
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
                            ✓ Miễn phí
                        </span>
                    ) : (
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                            💎 Pro
                        </span>
                    )}
                    {isSelected && (
                        <CheckCircle size={16} className="text-primary-500" />
                    )}
                </div>
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
        webSearchEnabled,
        costSaverMode,
        thinkingLevel,
        hasConfiguredKeys,
        setProvider,
        setApiKey,
        setSelectedModel,
        setRagEnabled,
        setWebSearchEnabled,
        setCostSaverMode,
        setThinkingLevel,
        setAvailableModels,
        setIsLoadingModels,
        saveSettings,
        resetSettings,
    } = useSettingsStore();


    const { setNotification } = useAppStore();

    // Local state
    const [localProvider, setLocalProvider] = useState<AIProviderType | 'default'>(provider);
    const [localApiKey, setLocalApiKey] = useState(apiKey);
    const [localModel, setLocalModel] = useState(selectedModel);
    const [localRagEnabled, setLocalRagEnabled] = useState(ragEnabled);
    const [showApiKey, setShowApiKey] = useState(false);
    const [localModels, setLocalModels] = useState<ModelInfo[]>(availableModels);

    // Chú thích: State cho auto-validation
    const [keyStatus, setKeyStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
    const [keyError, setKeyError] = useState<string | null>(null);

    // Chú thích: State cho filter models
    const [modelFilter, setModelFilter] = useState<'all' | 'free' | 'paid'>('all');
    const [modelSearch, setModelSearch] = useState('');


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

    // Chú thích: Filter models theo loại (free/paid) và search
    const filteredModels = localModels.filter(model => {
        const isFree = model.isFree || model.id.includes(':free');
        const matchesFilter = modelFilter === 'all' ||
            (modelFilter === 'free' && isFree) ||
            (modelFilter === 'paid' && !isFree);

        // Chú thích: Search theo tên hoặc id
        const matchesSearch = !modelSearch ||
            model.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
            model.id.toLowerCase().includes(modelSearch.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    // Chú thích: Đếm số models theo loại
    const freeCount = localModels.filter(m => m.isFree || m.id.includes(':free')).length;
    const paidCount = localModels.length - freeCount;

    // Chú thích: Xử lý lưu cấu hình
    const handleSave = () => {
        setProvider(localProvider);
        setApiKey(localApiKey);
        setSelectedModel(localModel);
        setRagEnabled(localRagEnabled);
        setAvailableModels(localModels); // Save models to store
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
            setLocalModel('google/gemini-2.0-flash-exp:free');
            setLocalRagEnabled(true);
            setKeyStatus('idle');
            setKeyError(null);

            setNotification({
                type: 'info',
                message: 'Đã reset về cài đặt mặc định',
            });
        }
    };

    // Chú thích: Load models từ API với validation
    const handleLoadModels = async () => {
        if (localProvider === 'default') {
            // Mặc định load từ OpenRouter
            const models = getDefaultModels('openrouter');
            setLocalModels(models);
            // Không save vào store ngay, chỉ khi user bấm Save
            setNotification({
                type: 'info',
                message: `Đã tải ${models.length} models mặc định từ OpenRouter`,
            });
            return;
        }

        // Kiểm tra format API key trước
        if (!localApiKey) {
            setNotification({
                type: 'error',
                message: 'Vui lòng nhập API Key trước khi tải models',
            });
            return;
        }

        const isValidFormat = validateApiKeyFormat(localProvider, localApiKey);
        if (!isValidFormat) {
            setKeyStatus('invalid');
            setKeyError('Định dạng API Key không đúng cho ' + (getProviderById(localProvider)?.name || localProvider));
            setNotification({
                type: 'error',
                message: 'Định dạng API Key không đúng',
            });
            return;
        }

        // Bắt đầu loading
        setIsLoadingModels(true);
        setKeyStatus('checking');
        setKeyError(null);

        try {
            // Test API key trước
            const testResult = await testApiKey(localProvider, localApiKey);

            if (!testResult.valid) {
                setKeyStatus('invalid');
                setKeyError(testResult.error || 'API Key không hợp lệ');
                setIsLoadingModels(false);
                setNotification({
                    type: 'error',
                    message: testResult.error || 'API Key không hợp lệ',
                });
                return;
            }

            // Fetch models từ provider
            const result = await fetchModelsForProvider(localProvider, localApiKey);

            if (result.success && result.models.length > 0) {
                setLocalModels(result.models);
                // Không save vào store ngay
                setKeyStatus('valid');

                // Chọn model đầu tiên nếu cần
                if (!result.models.find(m => m.id === localModel)) {
                    setLocalModel(result.models[0].id);
                }

                setNotification({
                    type: 'success',
                    message: `Đã tải ${result.models.length} models từ ${getProviderById(localProvider)?.name || localProvider}`,
                });
            } else {
                // Fallback về default models
                const defaultModels = getDefaultModels(localProvider);
                setLocalModels(defaultModels);
                // Không save vào store ngay
                setKeyStatus('valid');

                setNotification({
                    type: 'info',
                    message: `Đang dùng ${defaultModels.length} models mặc định (API không trả danh sách)`,
                });
            }
        } catch (error) {
            setKeyStatus('invalid');
            setKeyError(error instanceof Error ? error.message : 'Lỗi kết nối');

            // Fallback về default models
            const defaultModels = getDefaultModels(localProvider);
            setLocalModels(defaultModels);

            setNotification({
                type: 'error',
                message: 'Lỗi khi tải models: ' + (error instanceof Error ? error.message : 'Unknown'),
            });
        } finally {
            setIsLoadingModels(false);
        }
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
                                    className={`w-full px-4 py-3 pr-12 rounded-xl border bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${keyStatus === 'valid' ? 'border-emerald-400' :
                                        keyStatus === 'invalid' ? 'border-red-400' :
                                            'border-slate-200 dark:border-slate-600'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Key Status Indicator */}
                            {keyStatus !== 'idle' && (
                                <div className={`mt-2 text-xs flex items-center gap-1.5 ${keyStatus === 'valid' ? 'text-emerald-600' :
                                    keyStatus === 'invalid' ? 'text-red-600' :
                                        'text-amber-600'
                                    }`}>
                                    {keyStatus === 'checking' && (
                                        <><RefreshCw size={12} className="animate-spin" /> Đang kiểm tra...</>
                                    )}
                                    {keyStatus === 'valid' && (
                                        <><CheckCircle size={12} /> API Key hợp lệ</>
                                    )}
                                    {keyStatus === 'invalid' && (
                                        <><AlertCircle size={12} /> {keyError || 'API Key không hợp lệ'}</>
                                    )}
                                </div>
                            )}

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

                        {/* Load Models Button - Nổi bật */}
                        <button
                            onClick={handleLoadModels}
                            disabled={isLoadingModels || !localApiKey}
                            className={`w-full mt-4 py-3 px-4 rounded-xl font-medium text-white transition-all flex items-center justify-center gap-2 ${isLoadingModels
                                ? 'bg-slate-400 cursor-not-allowed'
                                : localApiKey
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg'
                                    : 'bg-slate-300 cursor-not-allowed'
                                }`}
                        >
                            {isLoadingModels ? (
                                <>
                                    <RefreshCw size={18} className="animate-spin" />
                                    Đang tải danh sách models...
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={18} />
                                    Tải Models
                                </>
                            )}
                        </button>

                        {/* Key Status Panel - Hiển thị khi key valid */}
                        {keyStatus === 'valid' && localApiKey && (
                            <div className="mt-4 space-y-2">
                                {/* Key Active Indicator */}
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle size={16} className="text-emerald-600" />
                                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                        Key đang hoạt động:
                                    </span>
                                    <code className="text-xs text-emerald-600 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded">
                                        {localApiKey.slice(0, 8)}{'•'.repeat(8)}{localApiKey.slice(-4)}
                                    </code>
                                </div>

                                {/* Models Found Indicator */}
                                {localModels.length > 0 && (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                        <CheckCircle size={16} className="text-blue-600" />
                                        <span className="text-sm text-blue-700 dark:text-blue-400">
                                            Tìm thấy <strong>{localModels.length}</strong> models sẵn sàng
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Security Note */}
                        <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                            <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <Shield size={14} className="mt-0.5 flex-shrink-0" />
                                <span>
                                    Key được mã hóa trước khi lưu vào trình duyệt.
                                    Kết nối trực tiếp từ máy bạn tới API nhà cung cấp, không qua trung gian.
                                </span>
                            </div>
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

                        {/* Reset Button */}
                        <button
                            onClick={handleReset}
                            className="mt-4 w-full py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={14} />
                            Reset về mặc định
                        </button>

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
                            <div className="flex items-center gap-3">
                                {/* Models Active Badge */}
                                {localModels.length > 0 && (
                                    <span className="px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
                                        {localModels.length} Models Active
                                    </span>
                                )}
                                <button
                                    onClick={handleLoadModels}
                                    disabled={isLoadingModels}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                >
                                    <RefreshCw size={14} className={isLoadingModels ? 'animate-spin' : ''} />
                                    Tải Models
                                </button>
                            </div>
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
                            {/* Filter Tabs */}
                            <div className="flex items-center gap-2 mb-4">
                                <button
                                    onClick={() => setModelFilter('all')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${modelFilter === 'all'
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    Tất cả ({localModels.length})
                                </button>
                                <button
                                    onClick={() => setModelFilter('free')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${modelFilter === 'free'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    ✓ Miễn phí ({freeCount})
                                </button>
                                <button
                                    onClick={() => setModelFilter('paid')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${modelFilter === 'paid'
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    💎 Pro ({paidCount})
                                </button>
                            </div>

                            {/* Search Input */}
                            <div className="relative mb-4">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm model..."
                                    value={modelSearch}
                                    onChange={(e) => setModelSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                                <svg
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            {/* Models List - Tăng chiều cao */}
                            {filteredModels.length > 0 ? (
                                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                    {filteredModels.map((model) => (

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

            {/* AI Options Card - NEW SECTION */}
            <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <Zap className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-900 dark:text-white">
                            Tùy chọn AI
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Cấu hình nâng cao cho AI thông minh hơn
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Web Search Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                                <RefreshCw className="text-white" size={18} />
                            </div>
                            <div>
                                <div className="font-medium text-slate-800 dark:text-white text-sm">
                                    🌐 Tìm kiếm Web
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Thông tin mới nhất từ internet
                                </div>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={webSearchEnabled}
                                onChange={(e) => setWebSearchEnabled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-blue-500"></div>
                        </label>
                    </div>

                    {/* Cost Saver Toggle */}
                    <div className={`flex items-center justify-between p-4 rounded-xl transition-all ${costSaverMode ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${costSaverMode ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
                                <span className="text-white text-lg">💰</span>
                            </div>
                            <div>
                                <div className="font-medium text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                    Tiết kiệm Chi phí
                                    {costSaverMode && (
                                        <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
                                            ĐANG BẬT
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Tự động dùng model miễn phí + cache thông minh
                                </div>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={costSaverMode}
                                onChange={(e) => setCostSaverMode(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>

                    {/* Thinking Level Selector */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                <span className="text-white text-lg">🧠</span>
                            </div>
                            <div>
                                <div className="font-medium text-slate-800 dark:text-white text-sm">
                                    Mức độ Suy luận
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Cho các model hỗ trợ thinking mode (Gemini 3, o1, etc.)
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setThinkingLevel('low')}
                                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${thinkingLevel === 'low'
                                    ? 'bg-purple-500 text-white shadow-md'
                                    : 'bg-white dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-500'
                                    }`}
                            >
                                ⚡ Low
                                <span className="block text-[10px] opacity-75 mt-0.5">Nhanh, hiệu quả</span>
                            </button>
                            <button
                                onClick={() => setThinkingLevel('high')}
                                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${thinkingLevel === 'high'
                                    ? 'bg-purple-500 text-white shadow-md'
                                    : 'bg-white dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-500'
                                    }`}
                            >
                                🔬 High
                                <span className="block text-[10px] opacity-75 mt-0.5">Suy luận sâu</span>
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
