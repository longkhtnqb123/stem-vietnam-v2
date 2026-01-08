// Settings Page - Main dashboard for user settings
import { useState } from 'react';
import { Settings, Cpu, Key, Palette, BarChart3, Shield, RefreshCw } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import ModelSelector from '../components/settings/ModelSelector';

type TabType = 'models' | 'api-keys' | 'preferences' | 'usage' | 'security';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('models');
    const { settings, isLoading, updateSettings } = useSettings();

    const tabs = [
        { id: 'models' as TabType, label: 'AI Models', icon: Cpu },
        { id: 'api-keys' as TabType, label: 'API Keys', icon: Key },
        { id: 'preferences' as TabType, label: 'Preferences', icon: Palette },
        { id: 'usage' as TabType, label: 'Usage Stats', icon: BarChart3 },
        { id: 'security' as TabType, label: 'Security', icon: Shield },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <RefreshCw className="animate-spin" size={24} />
                    <span>Loading settings...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Settings className="text-primary-500" size={32} />
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Cài đặt
                    </h1>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                    Quản lý AI models, API keys, và preferences
                </p>
            </div>

            {/* Tabs */}
            <div className="glass-panel mb-6">
                <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <Icon size={20} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="glass-panel p-6">
                {activeTab === 'models' && settings && (
                    <ModelSelector
                        settings={settings}
                        onUpdate={updateSettings}
                    />
                )}

                {activeTab === 'api-keys' && (
                    <div className="text-center py-12 text-slate-500">
                        <Key size={48} className="mx-auto mb-4 opacity-50" />
                        <p>API Keys management - Coming soon</p>
                    </div>
                )}

                {activeTab === 'preferences' && (
                    <div className="text-center py-12 text-slate-500">
                        <Palette size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Preferences - Coming soon</p>
                    </div>
                )}

                {activeTab === 'usage' && (
                    <div className="text-center py-12 text-slate-500">
                        <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Usage Statistics - Coming soon</p>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="text-center py-12 text-slate-500">
                        <Shield size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Security Settings - Coming soon</p>
                    </div>
                )}
            </div>
        </div>
    );
}
