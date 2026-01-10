
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../lib/auth';
import { classApi, type Class } from '../lib/classApi';
import { Plus, Users, Loader2, School, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ClassesPage() {
    const { user } = useAuthStore();
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    // Form state
    const [newClassName, setNewClassName] = useState('');
    const [newClassDesc, setNewClassDesc] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        try {
            setLoading(true);
            const data = await classApi.getClasses();
            setClasses(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            await classApi.createClass(newClassName, newClassDesc);
            setShowCreateModal(false);
            setNewClassName('');
            setNewClassDesc('');
            loadClasses(); // Reload list
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoinClass = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            await classApi.joinClass(joinCode);
            setShowJoinModal(false);
            setJoinCode('');
            loadClasses(); // Reload list
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <School className="w-8 h-8 text-indigo-600" />
                        Lớp Học Của Tôi
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {user?.role === 'teacher'
                            ? 'Quản lý các lớp học và giao bài tập cho học sinh.'
                            : 'Tham gia lớp học để nhận bài tập từ giáo viên.'}
                    </p>
                </div>

                {user?.role === 'teacher' ? (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                    >
                        <Plus className="w-5 h-5" />
                        Tạo Lớp Mới
                    </button>
                ) : (
                    <button
                        onClick={() => setShowJoinModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                    >
                        <LogIn className="w-5 h-5" />
                        Tham Gia Lớp
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                    {error}
                </div>
            )}

            {classes.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <School className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900">Chưa có lớp học nào</h3>
                    <p className="text-gray-500 mt-2 mb-6">
                        {user?.role === 'teacher' ? 'Hãy tạo lớp đầu tiên để bắt đầu giảng dạy.' : 'Hãy nhập mã tham gia lớp từ giáo viên.'}
                    </p>
                    {user?.role === 'teacher' ? (
                        <button onClick={() => setShowCreateModal(true)} className="text-indigo-600 hover:text-indigo-700 font-medium">
                            + Tạo lớp ngay
                        </button>
                    ) : (
                        <button onClick={() => setShowJoinModal(true)} className="text-green-600 hover:text-green-700 font-medium">
                            + Tham gia ngay
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <Link
                            key={cls.id}
                            to={`/classes/${cls.id}`}
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <School className="w-24 h-24 text-indigo-600 transform rotate-12 translate-x-4 -translate-y-4" />
                            </div>

                            <div className="relative">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{cls.name}</h3>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[2.5rem]">
                                    {cls.description || 'Không có mô tả'}
                                </p>

                                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <span>{cls.member_count ?? 0} thành viên</span>
                                    </div>
                                    {user?.role === 'student' && cls.teacher_name && (
                                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md">
                                            GV: {cls.teacher_name}
                                        </span>
                                    )}
                                </div>

                                {user?.role === 'teacher' && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Mã tham gia</p>
                                        <div className="bg-gray-100 text-gray-800 font-mono text-center py-2 rounded-lg tracking-widest text-lg select-all">
                                            {cls.join_code}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Create Class Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-2xl font-bold mb-4">Tạo Lớp Mới</h2>
                        <form onSubmit={handleCreateClass} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên lớp</label>
                                <input
                                    type="text"
                                    required
                                    value={newClassName}
                                    onChange={e => setNewClassName(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="VD: Lớp 10A1 - Công Nghệ"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả (tùy chọn)</label>
                                <textarea
                                    value={newClassDesc}
                                    onChange={e => setNewClassDesc(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Mô tả về lớp học..."
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Hủy</button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Đang tạo...' : 'Tạo lớp'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Class Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-2xl font-bold mb-4">Tham Gia Lớp Học</h2>
                        <form onSubmit={handleJoinClass} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mã lớp (6 ký tự)</label>
                                <input
                                    type="text"
                                    required
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-center text-xl tracking-widest uppercase"
                                    placeholder="XXXXXX"
                                    maxLength={6}
                                />
                                <p className="text-sm text-gray-500 mt-2">Nhập mã code giáo viên cung cấp để tham gia lớp.</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowJoinModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Hủy</button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Đang xử lý...' : 'Tham gia'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
