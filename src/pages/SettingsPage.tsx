// Complete Settings Page with all 5 tabs
import { useState } from 'react';
import { Settings, Cpu, Key, Palette, BarChart3, Shield } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import ModelSelector from '../components/settings/ModelSelector';

type TabType = 'models' | 'api-keys' | 'preferences' | 'usage' | 'security';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('models');
    const { settings, isLoading, updateSettings } = useSettings();

    const tabs = [
        { id: 'models' as TabType, label: 'AI Models', icon: Cpu },
        { id: 'api-keys' as TabType, label: 'API Keys', icon: Key },
        { id: 'preferences' as TabType, label: 'Giao diện', icon: Palette },
        { id: 'usage' as TabType, label: 'Thống kê', icon: BarChart3 },
        { id: 'security' as TabType, label: 'Bảo mật', icon: Shield },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Settings className="text-primary-500" size={32} />
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Cài đặt
                    </h1>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                    Quản lý AI models, giao diện, và tùy chỉnh cá nhân
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
                    <ModelSelector settings={settings} onUpdate={updateSettings} />
                )}

                {activeTab === 'api-keys' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                API Keys
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                Quản lý các API keys của bên thứ ba (OpenRouter, HuggingFace, v.v.)
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-blue-700 dark:text-blue-400">
                                    💡 <strong>Lưu ý:</strong> API keys được lưu bảo mật trên server. Không ai có thể xem được keys của bạn.
                                </p>
                            </div>

                            <div className="p-6 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-center">
                                <Key size={48} className="mx-auto mb-4 text-slate-400" />
                                <p className="text-slate-600 dark:text-slate-400 mb-4">
                                    Tính năng quản lý API Keys đang được phát triển
                                </p>
                                <p className="text-sm text-slate-500">
                                    Hiện tại hệ thống sử dụng API keys được cấu hình sẵn
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'preferences' && settings && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                Tùy chỉnh giao diện
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                Cá nhân hóa trải nghiệm của bạn
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Theme */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                    Giao diện
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => updateSettings({ ...settings, theme: 'light' })}
                                        className={`p-4 rounded-lg border-2 transition-all ${settings.theme === 'light'
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-slate-200 dark:border-slate-600 hover:border-primary-300'
                                            }`}
                                    >
                                        <span className="text-2xl mb-2 block">☀️</span>
                                        <p className="font-medium text-slate-900 dark:text-white">Sáng</p>
                                    </button>
                                    <button
                                        onClick={() => updateSettings({ ...settings, theme: 'dark' })}
                                        className={`p-4 rounded-lg border-2 transition-all ${settings.theme === 'dark'
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-slate-200 dark:border-slate-600 hover:border-primary-300'
                                            }`}
                                    >
                                        <span className="text-2xl mb-2 block">🌙</span>
                                        <p className="font-medium text-slate-900 dark:text-white">Tối</p>
                                    </button>
                                    <button
                                        onClick={() => updateSettings({ ...settings, theme: 'system' })}
                                        className={`p-4 rounded-lg border-2 transition-all ${settings.theme === 'system'
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-slate-200 dark:border-slate-600 hover:border-primary-300'
                                            }`}
                                    >
                                        <span className="text-2xl mb-2 block">💻</span>
                                        <p className="font-medium text-slate-900 dark:text-white">Hệ thống</p>
                                    </button>
                                </div>
                            </div>

                            {/* Language */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                    Ngôn ngữ
                                </label>
                                <select
                                    value={settings.language}
                                    onChange={(e) => updateSettings({ ...settings, language: e.target.value as 'vi' | 'en' })}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                >
                                    <option value="vi">Tiếng Việt</option>
                                    <option value="en">English</option>
                                </select>
                            </div>

                            {/* RAG */}
                            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        Bật RAG (Tìm kiếm tài liệu)
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Tự động tìm kiếm trong thư viện sách khi chat
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.ragEnabled}
                                        onChange={(e) => updateSettings({ ...settings, ragEnabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'usage' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                Thống kê sử dụng
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                Theo dõi hoạt động và token usage của bạn
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                <p className="text-sm opacity-90 mb-2">Tổng conversations</p>
                                <p className="text-3xl font-bold">--</p>
                            </div>
                            <div className="p-6 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                                <p className="text-sm opacity-90 mb-2">Messages gửi</p>
                                <p className="text-3xl font-bold">--</p>
                            </div>
                            <div className="p-6 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                                <p className="text-sm opacity-90 mb-2">Tokens sử dụng</p>
                                <p className="text-3xl font-bold">--</p>
                            </div>
                        </div>

                        <div className="p-6 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-center">
                            <BarChart3 size={48} className="mx-auto mb-4 text-slate-400" />
                            <p className="text-slate-600 dark:text-slate-400 mb-2">
                                Tính năng thống kê đang được phát triển
                            </p>
                            <p className="text-sm text-slate-500">
                                Sẽ có biểu đồ chi tiết về usage trong tương lai
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                Bảo mật
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                Quản lý mật khẩu và phiên đăng nhập
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                <p className="text-sm text-green-700 dark:text-green-400">
                                    ✅ Tài khoản của bạn đang được bảo vệ
                                </p>
                            </div>

                            <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-600">
                                <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                                    Đổi mật khẩu
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                    Cập nhật mật khẩu định kỳ để bảo mật tài khoản
                                </p>
                                <button className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors" disabled>
                                    Đang phát triển
                                </button>
                            </div>

                            <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-600">
                                <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                                    Phiên đăng nhập
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                    Quản lý các thiết bị đã đăng nhập
                                </p>
                                <button className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors" disabled>
                                    Đang phát triển
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
