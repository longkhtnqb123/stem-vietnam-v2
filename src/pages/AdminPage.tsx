// Chú thích: Admin Dashboard - Quản lý users và conversations với tabs
import { useState, useEffect } from 'react';
import { Users, MessageSquare, Trash2, Edit2, Search, RefreshCw, BarChart3, X, Save, ChevronLeft, ChevronRight, Eye, MessagesSquare, Plus, Upload } from 'lucide-react';
import CreateUserModal from '../components/admin/CreateUserModal';
import UserImportModal from '../components/admin/UserImportModal';

const API_URL = (import.meta.env.VITE_API_URL || 'https://stem-vietnam-api.stu725114073.workers.dev').replace(/\/$/, '');

// Chú thích: Types
interface User {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    role: 'student' | 'teacher' | 'admin';
    created_at: number;
    updated_at: number;
}

interface Stats {
    total_users: number;
    total_conversations: number;
    total_messages: number;
}

interface UserDetail {
    user: User;
    stats: { conversations: number; messages: number };
}

interface AdminConversation {
    id: string;
    user_id: string;
    title: string;
    created_at: number;
    updated_at: number;
    user_name: string;
    user_email: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: number;
}

interface ConversationDetail {
    conversation: AdminConversation;
    messages: Message[];
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

type TabType = 'users' | 'conversations' | 'analytics';

export default function AdminPage() {
    // Chú thích: State chung
    const [activeTab, setActiveTab] = useState<TabType>('users');
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Chú thích: Users state
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
    const [editingUser, setEditingUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    // Chú thích: Conversations state
    const [conversations, setConversations] = useState<AdminConversation[]>([]);
    const [convoPagination, setConvoPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [selectedConvo, setSelectedConvo] = useState<ConversationDetail | null>(null);
    const [convoSearchQuery, setConvoSearchQuery] = useState('');

    // Chú thích: Load stats
    const loadStats = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/stats`);
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
            }
        } catch (err) {
            console.error('[admin] load stats error:', err);
        }
    };

    // Chú thích: Load users
    const loadUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/users`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (err) {
            console.error('[admin] load users error:', err);
            setError('Không thể tải danh sách users');
        }
    };

    // Chú thích: Load conversations với pagination
    const loadConversations = async (page = 1) => {
        try {
            const res = await fetch(`${API_URL}/api/admin/conversations?page=${page}&limit=10`);
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations || []);
                setConvoPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
            }
        } catch (err) {
            console.error('[admin] load conversations error:', err);
        }
    };

    // Chú thích: Initial load
    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            await Promise.all([loadStats(), loadUsers(), loadConversations()]);
        } catch (err) {
            setError('Không thể kết nối đến server');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Chú thích: View user details
    const viewUser = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/api/admin/users/${id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedUser(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Chú thích: Delete user
    const handleDeleteUser = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa user này? Tất cả dữ liệu của user sẽ bị xóa.')) return;
        try {
            const res = await fetch(`${API_URL}/api/admin/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== id));
                setSelectedUser(null);
                loadStats();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Chú thích: Update user
    const handleUpdateUser = async () => {
        if (!editingUser) return;
        try {
            const res = await fetch(`${API_URL}/api/admin/users/${editingUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editingUser.name, email: editingUser.email, role: editingUser.role })
            });
            if (res.ok) {
                setEditingUser(null);
                loadUsers();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Chú thích: View conversation details
    const viewConversation = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/api/admin/conversations/${id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedConvo(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Chú thích: Delete conversation
    const handleDeleteConvo = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) return;
        try {
            const res = await fetch(`${API_URL}/api/admin/conversations/${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadConversations(convoPagination.page);
                loadStats();
                setSelectedConvo(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Chú thích: Filter users
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Chú thích: Filter conversations
    const filteredConvos = conversations.filter(c =>
        c.title.toLowerCase().includes(convoSearchQuery.toLowerCase()) ||
        c.user_name?.toLowerCase().includes(convoSearchQuery.toLowerCase()) ||
        c.user_email?.toLowerCase().includes(convoSearchQuery.toLowerCase())
    );

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // Chú thích: Tab navigation
    const tabs = [
        { id: 'users' as TabType, label: 'Users', icon: Users },
        { id: 'conversations' as TabType, label: 'Conversations', icon: MessagesSquare },
        { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-violet-600 bg-clip-text text-transparent">
                            Admin Dashboard
                        </h1>
                        <p className="text-slate-500 text-sm">Quản lý hệ thống - STEM Vietnam</p>
                    </div>
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-primary-300 transition-all text-sm shadow-sm"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
                                    <Users className="text-white" size={22} />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-slate-900">{stats.total_users}</p>
                                    <p className="text-slate-500 text-sm">Users</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                                    <MessageSquare className="text-white" size={22} />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-slate-900">{stats.total_conversations}</p>
                                    <p className="text-slate-500 text-sm">Conversations</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                                    <BarChart3 className="text-white" size={22} />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-slate-900">{stats.total_messages}</p>
                                    <p className="text-slate-500 text-sm">Messages</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-slate-200 pb-3">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">{error}</div>
                )}

                {/* Tab Content */}
                {activeTab === 'users' && (
                    <div>
                        {/* Search & Actions */}
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="relative max-w-md w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm kiếm user..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm shadow-sm"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowImportModal(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-emerald-300 transition-all text-sm font-medium shadow-sm"
                                >
                                    <Upload size={18} className="text-emerald-600" />
                                    <span>Import</span>
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all text-sm font-medium shadow-sm"
                                >
                                    <Plus size={18} />
                                    <span>Create User</span>
                                </button>
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">User</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Role</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Email</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Ngày tạo</th>
                                        <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={4} className="text-center py-8 text-slate-400">Đang tải...</td></tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr><td colSpan={4} className="text-center py-8 text-slate-400">Không có user nào</td></tr>
                                    ) : (
                                        filteredUsers.map(user => (
                                            <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium text-sm shadow-md">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-medium text-slate-900 text-sm">{user.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        user.role === 'teacher' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            'bg-slate-50 text-slate-600 border-slate-200'
                                                        }`}>
                                                        {user.role || 'student'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 text-sm">{user.email}</td>
                                                <td className="px-4 py-3 text-slate-500 text-sm">{formatDate(user.created_at)}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => viewUser(user.id)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-all" title="Xem chi tiết"><Eye size={16} /></button>
                                                    <button onClick={() => setEditingUser({ id: user.id, name: user.name, email: user.email, role: user.role || 'student' })} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-all ml-1" title="Sửa"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-all ml-1" title="Xóa"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'conversations' && (
                    // ... (keep existing)
                    <div>
                        {/* Search */}
                        <div className="mb-4">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={convoSearchQuery}
                                    onChange={(e) => setConvoSearchQuery(e.target.value)}
                                    placeholder="Tìm kiếm conversation..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Conversations Table */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Tiêu đề</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">User</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Cập nhật</th>
                                        <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={4} className="text-center py-8 text-slate-400">Đang tải...</td></tr>
                                    ) : filteredConvos.length === 0 ? (
                                        <tr><td colSpan={4} className="text-center py-8 text-slate-400">Không có conversation nào</td></tr>
                                    ) : (
                                        filteredConvos.map(convo => (
                                            <tr key={convo.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className="font-medium text-slate-900 text-sm">{convo.title || 'Untitled'}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-medium text-xs">
                                                            {convo.user_name?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-800">{convo.user_name || 'Unknown'}</p>
                                                            <p className="text-xs text-slate-400">{convo.user_email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 text-sm">{formatDate(convo.updated_at)}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => viewConversation(convo.id)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-all" title="Xem chi tiết"><Eye size={16} /></button>
                                                    <button onClick={() => handleDeleteConvo(convo.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-all ml-1" title="Xóa"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {convoPagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 px-2">
                                <p className="text-sm text-slate-500">
                                    Trang {convoPagination.page} / {convoPagination.totalPages} ({convoPagination.total} items)
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => loadConversations(convoPagination.page - 1)}
                                        disabled={convoPagination.page <= 1}
                                        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => loadConversations(convoPagination.page + 1)}
                                        disabled={convoPagination.page >= convoPagination.totalPages}
                                        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">📊 Analytics Overview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6">
                                <h4 className="text-blue-800 font-medium mb-2">User Growth</h4>
                                <p className="text-4xl font-bold text-blue-600">{stats?.total_users || 0}</p>
                                <p className="text-blue-600/70 text-sm mt-1">Total registered users</p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6">
                                <h4 className="text-emerald-800 font-medium mb-2">Engagement</h4>
                                <p className="text-4xl font-bold text-emerald-600">{stats?.total_messages || 0}</p>
                                <p className="text-emerald-600/70 text-sm mt-1">Total messages sent</p>
                            </div>
                            <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-6">
                                <h4 className="text-violet-800 font-medium mb-2">Avg Messages/Conversation</h4>
                                <p className="text-4xl font-bold text-violet-600">
                                    {stats && stats.total_conversations > 0
                                        ? (stats.total_messages / stats.total_conversations).toFixed(1)
                                        : '0'}
                                </p>
                                <p className="text-violet-600/70 text-sm mt-1">Average engagement</p>
                            </div>
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6">
                                <h4 className="text-amber-800 font-medium mb-2">Active Conversations</h4>
                                <p className="text-4xl font-bold text-amber-600">{stats?.total_conversations || 0}</p>
                                <p className="text-amber-600/70 text-sm mt-1">Total conversations created</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* User Detail Modal */}
                {selectedUser && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-900">Chi tiết User</h3>
                                <button onClick={() => setSelectedUser(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                        {selectedUser.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{selectedUser.user.name}</p>
                                        <p className="text-slate-500 text-sm">{selectedUser.user.email}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-2xl font-bold text-slate-900">{selectedUser.stats.conversations}</p>
                                        <p className="text-slate-500 text-sm">Conversations</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-2xl font-bold text-slate-900">{selectedUser.stats.messages}</p>
                                        <p className="text-slate-500 text-sm">Messages</p>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-500 space-y-1">
                                    <p>ID: <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{selectedUser.user.id}</span></p>
                                    <p>Tạo lúc: {formatDate(selectedUser.user.created_at)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit User Modal */}
                {editingUser && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-900">Sửa User</h3>
                                <button onClick={() => setEditingUser(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên</label>
                                    <input type="text" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input type="email" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                    <select
                                        value={editingUser.role || 'student'}
                                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                                    >
                                        <option value="student">Student</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <button onClick={handleUpdateUser} className="w-full py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary-500/25 transition-all text-sm">
                                    <Save size={16} /> Lưu thay đổi
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Conversation Detail Modal */}
                {selectedConvo && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
                            <div className="flex items-center justify-between p-4 border-b border-slate-200">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{selectedConvo.conversation.title}</h3>
                                    <p className="text-sm text-slate-500">{selectedConvo.conversation.user_name} • {selectedConvo.messages.length} messages</p>
                                </div>
                                <button onClick={() => setSelectedConvo(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {selectedConvo.messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-br-md'
                                            : 'bg-slate-100 text-slate-800 rounded-bl-md'
                                            }`}>
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                            <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-primary-100' : 'text-slate-400'}`}>
                                                {formatDate(msg.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <CreateUserModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        loadUsers();
                        loadStats();
                    }}
                />

                <UserImportModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={() => {
                        loadUsers();
                        loadStats();
                    }}
                />
            </div>
        </div>
    );
}
