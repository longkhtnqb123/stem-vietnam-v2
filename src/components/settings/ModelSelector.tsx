// ModelSelector Component - Select AI models from OpenRouter
import { useState, useEffect } from 'react';
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
            showNotification('success', `Dang su dung model ${model.name}.`);
        } catch (err) {
            console.error('[ModelSelector] update error:', err);
            showNotification('error', 'Loi khi luu model.');
        }
    };

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

    const providers = Array.from(new Set(filteredModels.map(m => m.id.split('/')[0])));
    const currentModel = selectedCategory === 'chat' ? settings.chatModel : settings.examModel;

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

            <div className="lms-row" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="Tim kiem model..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="lms-input"
                    style={{ minWidth: 220, flex: 1 }}
                />

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
                    {isLoading ? 'Dang tai...' : 'Refresh'}
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
                                        const isCurrent = model.id === currentModel;

                                        return (
                                            <button
                                                key={model.id}
                                                onClick={() => handlePreviewModel(model.id)}
                                                className={`lms-list-item ${isSelected ? 'is-active' : ''}`}
                                            >
                                                <div className="lms-row" style={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
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

                                                        {isSelected && !isCurrent && (
                                                            <div style={{ marginTop: 10 }}>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSaveModel(model);
                                                                    }}
                                                                    className="lms-button"
                                                                >
                                                                    Luu model
                                                                </button>
                                                            </div>
                                                        )}
                                                        {isCurrent && (
                                                            <div style={{ marginTop: 8 }}>
                                                                <span className="lms-badge">Dang su dung</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="lms-section" style={{ alignItems: 'flex-end' }}>
                                                        <span className="lms-pill">
                                                            {isFree ? 'Free' : 'Pro'}
                                                        </span>
                                                        {isSelected && (
                                                            <span className="lms-note">Dang xem</span>
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
                    <p className="lms-note">Khong tim thay model.</p>
                </div>
            )}
        </div>
    );
}
