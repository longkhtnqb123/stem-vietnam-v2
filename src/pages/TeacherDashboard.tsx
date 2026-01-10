// Chú thích: Teacher Dashboard - Thống kê tổng quan cho giáo viên
import { useState, useEffect } from 'react';
import {
    FileText,
    Users,
    Trophy,
    TrendingUp,
    BarChart3,
    Plus,
    Eye,
    Award,
    ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../lib/auth';

// API URL
const API_URL = (import.meta.env.VITE_API_URL || 'https://stem-vietnam-api.stu725114073.workers.dev').replace(/\/$/, '');

interface DashboardData {
    overview: {
        totalTemplates: number;
        totalAttempts: number;
        averageScore: number;
        passRate: number;
    };
    scoreDistribution: Record<string, number>;
    templates: Array<{
        id: string;
        title: string;
        grade: string;
        examType: string;
        difficulty: string;
        totalQuestions: number;
        timesTaken: number;
        createdAt: number;
    }>;
    topStudents: Array<{
        rank: number;
        name: string;
        email: string | null;
        score: number;
        templateTitle: string;
        submittedAt: number;
    }>;
}

export default function TeacherDashboard() {
    const { token, user } = useAuthStore();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDashboard() {
            if (!token) return;

            try {
                const res = await fetch(`${API_URL}/api/teacher/dashboard`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || 'Lỗi tải dữ liệu');
                }

                const json = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboard();
    }, [token]);

    // Chú thích: Check role
    if (user?.role === 'student') {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        ⚠️ Không có quyền truy cập
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                        Dashboard này chỉ dành cho giáo viên
                    </p>
                    <Link to="/chat" className="text-blue-600 hover:underline">
                        ← Quay về Chat AI
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center text-red-500">
                    <p className="text-xl mb-2">❌ {error}</p>
                    <button onClick={() => window.location.reload()} className="text-blue-600 hover:underline">
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { overview, scoreDistribution, templates, topStudents } = data;

    // Chú thích: Tính max value cho chart
    const maxDistribution = Math.max(...Object.values(scoreDistribution), 1);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                        📊 Dashboard Giáo Viên
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Xin chào, {user?.name}! Đây là tổng quan về các đề thi của bạn.
                    </p>
                </div>
                <Link
                    to="/exam-online"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-colors"
                >
                    <Plus size={18} />
                    Tạo đề mới
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <FileText size={24} className="opacity-80" />
                        <span className="text-sm opacity-80">Đề đã tạo</span>
                    </div>
                    <p className="text-3xl font-bold">{overview.totalTemplates}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <Users size={24} className="opacity-80" />
                        <span className="text-sm opacity-80">Lượt làm bài</span>
                    </div>
                    <p className="text-3xl font-bold">{overview.totalAttempts}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <TrendingUp size={24} className="opacity-80" />
                        <span className="text-sm opacity-80">Điểm TB</span>
                    </div>
                    <p className="text-3xl font-bold">{overview.averageScore.toFixed(1)}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <Trophy size={24} className="opacity-80" />
                        <span className="text-sm opacity-80">Tỷ lệ đạt</span>
                    </div>
                    <p className="text-3xl font-bold">{overview.passRate}%</p>
                </div>
            </div>

            {/* Score Distribution */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <BarChart3 size={20} className="text-blue-500" />
                    Phân bổ điểm (tất cả đề)
                </h2>
                <div className="flex items-end gap-3 h-40">
                    {Object.entries(scoreDistribution).map(([range, count]) => (
                        <div key={range} className="flex-1 flex flex-col items-center">
                            <div
                                className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg transition-all duration-500"
                                style={{ height: `${(count / maxDistribution) * 100}%`, minHeight: count > 0 ? '20px' : '4px' }}
                            />
                            <span className="text-xs text-slate-500 mt-2">{range}</span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* My Templates */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileText size={20} className="text-purple-500" />
                            Đề thi của tôi
                        </h2>
                        <Link to="/exam-online" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            Xem tất cả <ChevronRight size={14} />
                        </Link>
                    </div>

                    {templates.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <FileText size={48} className="mx-auto mb-3 opacity-50" />
                            <p>Chưa có đề thi nào</p>
                            <Link to="/exam-online" className="text-blue-600 hover:underline mt-2 inline-block">
                                Tạo đề đầu tiên →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {templates.slice(0, 5).map((t) => (
                                <div
                                    key={t.id}
                                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-slate-900 dark:text-white truncate">
                                            {t.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Lớp {t.grade} • {t.totalQuestions} câu • {t.timesTaken} lượt làm
                                        </p>
                                    </div>
                                    <Link
                                        to={`/exam-online`}
                                        className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400"
                                    >
                                        <Eye size={18} />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Students */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Award size={20} className="text-yellow-500" />
                        Top Học Sinh Xuất Sắc
                    </h2>

                    {topStudents.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Trophy size={48} className="mx-auto mb-3 opacity-50" />
                            <p>Chưa có học sinh nào làm bài</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {topStudents.map((s) => (
                                <div
                                    key={s.rank}
                                    className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${s.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                                        s.rank === 2 ? 'bg-slate-200 text-slate-700' :
                                            s.rank === 3 ? 'bg-orange-100 text-orange-700' :
                                                'bg-slate-100 text-slate-600'
                                        }`}>
                                        {s.rank <= 3 ? ['🥇', '🥈', '🥉'][s.rank - 1] : s.rank}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-slate-900 dark:text-white truncate">
                                            {s.name}
                                        </h4>
                                        <p className="text-xs text-slate-500 truncate">
                                            {s.templateTitle}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-green-600">{s.score.toFixed(1)}</span>
                                        <span className="text-xs text-slate-500 block">điểm</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
