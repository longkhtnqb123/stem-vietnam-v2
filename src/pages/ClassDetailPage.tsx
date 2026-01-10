
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import { classApi, type ClassDetailResponse } from '../lib/classApi';
import { examOnlineApi } from '../lib/examOnlineApi';
import type { ExamTemplate } from '../lib/examOnlineApi';
import { Users, FileText, Calendar, Plus, Trash2, Clock, CheckCircle, Copy } from 'lucide-react';

export default function ClassDetailPage() {
    const { id } = useParams<{ id: string }>();
    // const { user } = useAuthStore(); // Removed unused
    const [data, setData] = useState<ClassDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'assignments' | 'members'>('assignments');

    // Assign modal
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [templates, setTemplates] = useState<ExamTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);

    useEffect(() => {
        if (id) loadClassDetails();
    }, [id]);

    useEffect(() => {
        if (showAssignModal && templates.length === 0) {
            loadTemplates();
        }
    }, [showAssignModal]);

    const loadClassDetails = async () => {
        try {
            setLoading(true);
            const res = await classApi.getClassDetails(id!);
            setData(res);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadTemplates = async () => {
        try {
            const res = await examOnlineApi.getTemplates();
            setTemplates(res.templates);
        } catch (err) {
            console.error('Failed to load templates', err);
        }
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setAssignLoading(true);
            await classApi.createAssignment(id!, selectedTemplate);
            setShowAssignModal(false);
            loadClassDetails(); // Reload
        } catch (err: any) {
            alert(err.message);
        } finally {
            setAssignLoading(false);
        }
    };

    const handleDeleteClass = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa lớp này không? Hành động này không thể hoàn tác.')) return;
        try {
            await classApi.deleteClass(id!);
            window.location.href = '/classes';
        } catch (err: any) {
            alert(err.message);
        }
    };

    const copyJoinCode = () => {
        if (data?.class.join_code) {
            navigator.clipboard.writeText(data.class.join_code);
            alert('Đã sao chép mã tham gia');
        }
    };

    if (loading) return <div className="p-8 text-center">Đang tải...</div>;
    if (error || !data) return <div className="p-8 text-center text-red-600">{error || 'Không tìm thấy lớp học'}</div>;

    const { class: cls, is_teacher, members, assignments } = data;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Users className="w-64 h-64 transform rotate-12" />
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{cls.name}</h1>
                            <p className="text-gray-600 max-w-2xl">{cls.description || 'Chưa có mô tả'}</p>
                            {!is_teacher && <p className="text-indigo-600 font-medium mt-2">GV: {cls.teacher_name}</p>}
                        </div>

                        {is_teacher && (
                            <button
                                onClick={handleDeleteClass}
                                className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                title="Xóa lớp học"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <div className="flex gap-6 mt-6">
                        <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                            <Users className="w-4 h-4" />
                            <span>{members.length} thành viên</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                            <FileText className="w-4 h-4" />
                            <span>{assignments.length} bài tập</span>
                        </div>
                        {is_teacher && (
                            <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100">
                                <span className="font-mono font-bold tracking-wider">{cls.join_code}</span>
                                <button onClick={copyJoinCode} className="hover:bg-indigo-100 p-1 rounded">
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('assignments')}
                    className={`pb-3 px-4 font-medium transition-colors border-b-2 ${activeTab === 'assignments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Bài Tập
                </button>
                <button
                    onClick={() => setActiveTab('members')}
                    className={`pb-3 px-4 font-medium transition-colors border-b-2 ${activeTab === 'members' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Thành Viên
                </button>
            </div>

            {/* Content */}
            {activeTab === 'assignments' ? (
                <div className="space-y-4">
                    {is_teacher && (
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowAssignModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
                            >
                                <Plus className="w-5 h-5" />
                                Giao Bài Tập
                            </button>
                        </div>
                    )}

                    {assignments.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Chưa có bài tập nào được giao</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {assignments.map(asm => (
                                <div key={asm.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center group hover:border-indigo-200 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-lg ${asm.max_score !== null ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{asm.template_title}</h3>
                                            <div className="flex gap-4 mt-1 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {asm.duration_minutes} phút
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle className="w-4 h-4" />
                                                    {asm.total_questions} câu hỏi
                                                </span>
                                                {asm.due_date && (
                                                    <span className="flex items-center gap-1 text-red-500">
                                                        <Calendar className="w-4 h-4" />
                                                        Deadline: {new Date(asm.due_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        {is_teacher ? (
                                            <div className="text-right">
                                                <span className="text-sm text-gray-500 block">Đã giao</span>
                                                <span className="font-mono text-xs text-gray-400">{new Date(asm.created_at).toLocaleDateString()}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                {asm.max_score !== null ? (
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-green-600">{asm.max_score}đ</div>
                                                        <div className="text-xs text-gray-500">{asm.attempts_count} lần làm</div>
                                                    </div>
                                                ) : (
                                                    <div className="text-right">
                                                        <span className="block text-sm text-gray-500 mb-1">Chưa làm</span>
                                                    </div>
                                                )}

                                                <Link
                                                    to={`/exam-online/${asm.template_id}`}
                                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${asm.max_score !== null
                                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                        }`}
                                                >
                                                    {asm.max_score !== null ? 'Làm lại' : 'Làm bài ngay'}
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Họ và tên</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Email</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Ngày tham gia</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Vai trò</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {members.map(mem => (
                                <tr key={mem.user_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{mem.name}</td>
                                    <td className="px-6 py-4 text-gray-500">{mem.email}</td>
                                    <td className="px-6 py-4 text-gray-500">{new Date(mem.joined_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${mem.role === 'assistant' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {mem.role === 'assistant' ? 'Trợ giảng' : 'Học viên'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {members.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Chưa có thành viên nào</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Assign Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">Giao Bài Tập Mới</h2>
                        <form onSubmit={handleAssign} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn đề thi</label>
                                <select
                                    required
                                    value={selectedTemplate}
                                    onChange={e => setSelectedTemplate(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">-- Chọn đề thi có sẵn --</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.title} ({t.grade} - {t.duration_minutes} phút)
                                        </option>
                                    ))}
                                </select>
                                <p className="text-sm text-gray-500 mt-1">Chỉ hiện đề thi do bạn tạo hoặc đề công khai.</p>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-blue-700 text-sm">
                                <Clock className="w-5 h-5 flex-shrink-0" />
                                <p>Học sinh sẽ nhận được thông báo và có thể làm bài ngay sau khi giao.</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Hủy</button>
                                <button
                                    type="submit"
                                    disabled={!selectedTemplate || assignLoading}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {assignLoading ? 'Đang giao...' : 'Giao bài ngay'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
