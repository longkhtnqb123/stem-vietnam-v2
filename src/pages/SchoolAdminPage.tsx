// School Admin Portal Page
// Trang quản lý trường học cho Admin hệ thống

import { useState, useEffect } from 'react';
import {
    School,
    Plus,
    Users,
    BookOpen,
    TrendingUp,
    Search,
    Edit,
    ChevronRight,
    Building2,
    Phone,
    Mail
} from 'lucide-react';
import { useAuthStore } from '../lib/auth';

const API_URL = (import.meta.env.VITE_API_URL || 'https://stem-vietnam-api.stu725114073.workers.dev').replace(/\/$/, '');

interface SchoolData {
    id: string;
    name: string;
    code: string;
    address?: string;
    contact_email?: string;
    contact_phone?: string;
    admin_name?: string;
    teacher_count: number;
    class_count: number;
    created_at: number;
}

export default function SchoolAdminPage() {
    const { token, user } = useAuthStore();
    const [schools, setSchools] = useState<SchoolData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<SchoolData | null>(null);

    // Form state for create/edit
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        contactEmail: '',
        contactPhone: ''
    });

    useEffect(() => {
        fetchSchools();
    }, [token]);

    async function fetchSchools() {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/schools`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSchools(data.schools || []);
        } catch (error) {
            console.error('Failed to fetch schools:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateSchool(e: React.FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/schools`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowCreateModal(false);
                setFormData({ name: '', code: '', address: '', contactEmail: '', contactPhone: '' });
                fetchSchools();
            }
        } catch (error) {
            console.error('Failed to create school:', error);
        }
    }

    const filteredSchools = schools.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (user?.role !== 'admin') {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <School className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Không có quyền truy cập
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Trang này chỉ dành cho Admin hệ thống.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-primary-500" />
                        Quản Lý Trường Học
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Quản lý các trường trong hệ thống STEM Vietnam
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={18} />
                    Thêm Trường
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bento-card">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Tổng trường</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{schools.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bento-card">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
                            <Users className="w-5 h-5 text-secondary-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Tổng giáo viên</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {schools.reduce((acc, s) => acc + s.teacher_count, 0)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bento-card">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-accent-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Tổng lớp học</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {schools.reduce((acc, s) => acc + s.class_count, 0)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bento-card">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Hoạt động</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {schools.filter(s => s.class_count > 0).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Tìm kiếm trường học..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="input-field pl-12"
                />
            </div>

            {/* Schools List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-slate-500 mt-4">Đang tải...</p>
                </div>
            ) : filteredSchools.length === 0 ? (
                <div className="text-center py-12 bento-card">
                    <School className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                        {searchQuery ? 'Không tìm thấy trường phù hợp' : 'Chưa có trường nào trong hệ thống'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredSchools.map(school => (
                        <div
                            key={school.id}
                            className="bento-card hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => setSelectedSchool(school)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
                                        {school.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{school.name}</h3>
                                        <p className="text-sm text-slate-500">Mã: {school.code}</p>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Users size={12} /> {school.teacher_count} GV
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <BookOpen size={12} /> {school.class_count} lớp
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-400" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            Thêm Trường Mới
                        </h2>
                        <form onSubmit={handleCreateSchool} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Tên trường *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="input-field"
                                    placeholder="VD: THPT Nguyễn Trãi"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Mã trường
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="input-field"
                                    placeholder="Để trống để tự động tạo"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Địa chỉ
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Email liên hệ
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.contactEmail}
                                        onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.contactPhone}
                                        onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Hủy
                                </button>
                                <button type="submit" className="btn-primary flex-1">
                                    Tạo Trường
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
