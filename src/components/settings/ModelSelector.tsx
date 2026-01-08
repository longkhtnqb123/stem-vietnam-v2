// ModelSelector Component - Select AI models from OpenRouter
import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, Search, Zap, DollarSign } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';
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

    const handleSelectModel = async (modelId: string) => {
        try {
            const updates = selectedCategory === 'chat'
                ? { chatModel: modelId }
                : { examModel: modelId };
            await onUpdate(updates);
        } catch (err) {
            console.error('[ModelSelector] update error:', err);
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

            {/* Current Selection */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
                    <CheckCircle size={16} />
                    <span className="font-medium">Currently selected:</span>
                    <code className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                        {currentModel}
                    </code>
                </div>
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
                                        const isSelected = currentModel === model.id;

                                        return (
                                            <button
                                                key={model.id}
                                                onClick={() => handleSelectModel(model.id)}
                                                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${isSelected
                                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                        : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-primary-300'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-slate-900 dark:text-white text-sm mb-1">
                                                            {model.name}
                                                        </div>
                                                        {model.description && (
                                                            <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                                                {model.description}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                Context: {model.context_length.toLocaleString()} tokens
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                        {isFree ? (
                                                            <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
                                                                Free
                                                            </span>
                                                        ) : (
                                                            <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                                                                <DollarSign size={12} />
                                                                Pro
                                                            </div>
                                                        )}
                                                        {isSelected && (
                                                            <CheckCircle size={20} className="text-primary-500" />
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12 text-slate-500">
                    <Search size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No models found matching your criteria</p>
                </div>
            )}
        </div>
    );
}
