// ModelSelector Component - Select AI models from OpenRouter
import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, Search, Zap, DollarSign } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';
import { useAppStore } from '../../stores/appStore';
import { getAvailableModels, refreshModels, type OpenRouterModel, type UserSettings } from '../../lib/settingsApi';

interface ModelSelectorProps {
    settings: UserSettings;
    onUpdate: (updates: Partial<UserSettings>) => Promise<UserSettings>;
}

export default function ModelSelector({ settings, onUpdate }: ModelSelectorProps) {
    const { token } = useAuthStore();
    const [models, setModels] = useState<OpenRouterModel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');
    const [selectedCategory, setSelectedCategory] = useState<'chat' | 'exam'>('chat');
    const [previewModelId, setPreviewModelId] = useState<string | null>(null);
    const { showNotification } = useAppStore();

    // Load models on mount
    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        if (!token) return;

        setIsLoading(true);
        try {
            const data = await getAvailableModels(token);
            setModels(data);
        } catch (err) {
            console.error('[ModelSelector] load error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (!token) return;

        setIsLoading(true);
        try {
            const data = await refreshModels(token);
            setModels(data);
        } catch (err) {
            console.error('[ModelSelector] refresh error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Sync preview with current setting on category change
    useEffect(() => {
        setPreviewModelId(selectedCategory === 'chat' ? settings.chatModel : settings.examModel);
    }, [selectedCategory, settings]);

    const handlePreviewModel = (modelId: string) => {
        setPreviewModelId(modelId);
    };

    const handleSaveModel = async (model: OpenRouterModel) => {
        try {
            const updates = selectedCategory === 'chat'
                ? { chatModel: model.id }
                : { examModel: model.id };
            await onUpdate(updates);
            showNotification('success', `Đang sử dụng model ${model.name}...`);
        } catch (err) {
            console.error('[ModelSelector] update error:', err);
            showNotification('error', 'Lỗi khi lưu model');
        }
    };

    // Filter models
    const filteredModels = models.filter(m => {
        const isFree = m.id.includes(':free') || (
            parseFloat(m.pricing.prompt) === 0 && parseFloat(m.pricing.completion) === 0
        );

        const matchesFilter =
            filter === 'all' ||
            (filter === 'free' && isFree) ||
            (filter === 'paid' && !isFree);

        const matchesSearch = !searchTerm ||
            m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.name.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    // Group by provider
    const providers = Array.from(new Set(filteredModels.map(m => m.id.split('/')[0])));

    const currentModel = selectedCategory === 'chat' ? settings.chatModel : settings.examModel;

    return (
        <div className="space-y-6">
            {/* Category Tabs */}
            <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setSelectedCategory('chat')}
                    className={`pb-3 px-4 font-medium transition-colors relative ${selectedCategory === 'chat'
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    Chat Model
                    {selectedCategory === 'chat' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                    )}
                </button>
                <button
                    onClick={() => setSelectedCategory('exam')}
                    className={`pb-3 px-4 font-medium transition-colors relative ${selectedCategory === 'exam'
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    Exam Generation Model
                    {selectedCategory === 'exam' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                    )}
                </button>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search models..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                {/* Filter */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                            ? 'bg-primary-500 text-white'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                            }`}
                    >
                        All ({models.length})
                    </button>
                    <button
                        onClick={() => setFilter('free')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'free'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                            }`}
                    >
                        Free
                    </button>
                    <button
                        onClick={() => setFilter('paid')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'paid'
                            ? 'bg-amber-500 text-white'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                            }`}
                    >
                        Paid
                    </button>
                </div>

                {/* Refresh Button */}
                <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Models List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                        <RefreshCw className="animate-spin" size={20} />
                        <span>Loading models...</span>
                    </div>
                </div>
            ) : providers.length > 0 ? (
                <div className="space-y-6">
                    {providers.map(provider => {
                        const providerModels = filteredModels.filter(m => m.id.startsWith(provider + '/'));

                        return (
                            <div key={provider} className="space-y-3">
                                {/* Provider Header */}
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                                    <Zap size={16} className="text-primary-500" />
                                    <span className="font-semibold text-slate-900 dark:text-white capitalize">
                                        {provider}
                                    </span>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        ({providerModels.length})
                                    </span>
                                </div>

                                {/* Models Grid */}
                                <div className="grid grid-cols-1 gap-2">
                                    {providerModels.map(model => {
                                        const isFree = model.id.includes(':free') || (
                                            parseFloat(model.pricing.prompt) === 0 && parseFloat(model.pricing.completion) === 0
                                        );
                                        const isSelected = previewModelId === model.id;

                                        return (
        <div className="lms-section">
            <div className="lms-row">
                <button
                    onClick={() => setSelectedCategory('chat')}
                    className={selectedCategory === 'chat' ? 'lms-button' : 'lms-button-secondary'}
                >
                    Chat Model
                </button>
                <button
                    onClick={() => setSelectedCategory('exam')}
                    className={selectedCategory === 'exam' ? 'lms-button' : 'lms-button-secondary'}
                >
                    Exam Model
                </button>
            </div>

            <div className="lms-row" style={{ alignItems: 'center' }}>
                <div className="lms-input-group" style={{ flex: 1, minWidth: 240 }}>
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search models..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="lms-input"
                    />
                </div>

                <div className="lms-row">
                    <button
                        onClick={() => setFilter('all')}
                        className={filter === 'all' ? 'lms-chip is-active' : 'lms-chip'}
                    >
                        All ({models.length})
                    </button>
                    <button
                        onClick={() => setFilter('free')}
                        className={filter === 'free' ? 'lms-chip is-active' : 'lms-chip'}
                    >
                        Free
                    </button>
                    <button
                        onClick={() => setFilter('paid')}
                        className={filter === 'paid' ? 'lms-chip is-active' : 'lms-chip'}
                    >
                        Paid
                    </button>
                </div>

                <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="lms-button-secondary"
                >
                    <RefreshCw size={16} className={isLoading ? 'lms-spin' : ''} />
                    Refresh
                </button>
            </div>

            {isLoading ? (
                <div className="lms-empty">
                    <div className="lms-spinner" />
                    <p className="lms-note">Dang tai model...</p>
                </div>
            ) : providers.length > 0 ? (
                <div className="lms-section">
                    {providers.map(provider => {
                        const providerModels = filteredModels.filter(m => m.id.startsWith(provider + '/'));

                        return (
                            <section key={provider} className="lms-card">
                                <div className="lms-card-header">
                                    <div>
                                        <div className="lms-card-title">{provider}</div>
                                        <div className="lms-card-subtitle">{providerModels.length} models</div>
                                    </div>
                                </div>

                                <div className="lms-list">
                                    {providerModels.map(model => {
                                        const isFree = model.id.includes(':free') || (
                                            parseFloat(model.pricing.prompt) === 0 && parseFloat(model.pricing.completion) === 0
                                        );
                                        const isSelected = previewModelId === model.id;

                                        return (
                                            <button
                                                key={model.id}
                                                onClick={() => handlePreviewModel(model.id)}
                                                className={`lms-list-item ${isSelected ? 'is-active' : ''}`}
                                            >
                                                <div className="lms-row" style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontWeight: 600 }}>{model.name}</div>
                                                        {model.description && (
                                                            <div className="lms-note" style={{ marginTop: 4 }}>
                                                                {model.description}
                                                            </div>
                                                        )}
                                                        <div className="lms-note" style={{ marginTop: 6 }}>
                                                            Context: {model.context_length.toLocaleString()} tokens
                                                        </div>

                                                        {model.id === previewModelId && model.id !== currentModel && (
                                                            <div style={{ marginTop: 10 }}>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSaveModel(model);
                                                                    }}
                                                                    className="lms-button"
                                                                >
                                                                    <CheckCircle size={16} />
                                                                    Save model
                                                                </button>
                                                            </div>
                                                        )}
                                                        {model.id === currentModel && (
                                                            <div style={{ marginTop: 8 }}>
                                                                <span className="lms-badge">Dang su dung</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="lms-section" style={{ alignItems: 'flex-end' }}>
                                                        <span className="lms-badge">
                                                            {isFree ? 'Free' : 'Pro'}
                                                        </span>
                                                        {isSelected && (
                                                            <CheckCircle size={16} style={{ color: 'var(--lms-accent)' }} />
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>
            ) : (
                <div className="lms-empty">
                    <Search size={32} />
                    <p className="lms-note">No models found</p>
                </div>
            )}
        </div>
    );
}

