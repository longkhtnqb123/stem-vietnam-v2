// Chú thích: Student Dashboard - Thống kê tiến độ học tập cho học sinh
import { useState, useEffect } from 'react';
import {
    Trophy,
    TrendingUp,
    Target,
    Flame,
    Star,
    BookOpen,
    ChevronRight,
    Lightbulb
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../lib/auth';
import { XPBar, StreakCounter, DailyGoalCard } from '../components/gamification/GamificationComponents';
import UsageStatsCard from '../components/UsageStatsCard';

const API_URL = (import.meta.env.VITE_API_URL || 'https://stem-vietnam-api.stu725114073.workers.dev').replace(/\/$/, '');

interface DashboardData {
    overview: {
        totalAttempts: number;
        averageScore: number;
        passRate: number;
        highestScore: number;
        streak: number;
    };
    progressData: Array<{ date: string; score: number; count: number }>;
    bloomAnalysis: Array<{ level: string; label: string; percentage: number; total: number }>;
    recommendations: string[];
    recentAttempts: Array<{
        id: string;
        templateTitle: string;
        grade: string;
        examType: string;
        score: number;
        correctCount: number;
        totalQuestions: number;
        submittedAt: number;
    }>;
}

export default function StudentDashboard() {
    const { token, user } = useAuthStore();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDashboard() {
            if (!token) return;

            try {
                const res = await fetch(`${API_URL}/api/student/dashboard`, {
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

    const { overview, progressData, bloomAnalysis, recommendations, recentAttempts } = data;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                        🎓 Xin chào, {user?.name}!
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Tiếp tục luyện tập để đạt kết quả tốt hơn nhé!
                    </p>
                </div>
                <Link
                    to="/exam-online"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-medium hover:from-primary-600 hover:to-secondary-600 transition-colors shadow-lg shadow-primary-500/30"
                >
                    <BookOpen size={18} />
                    Làm bài thi
                </Link>
            </div>

            {/* Gamification Section - XP, Streak, Daily Goal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <XPBar
                    currentXP={overview.totalAttempts * 25}
                    level={Math.floor(overview.totalAttempts / 5) + 1}
                    progressToNextLevel={(overview.totalAttempts % 5) * 20}
                    xpToNextLevel={125 - (overview.totalAttempts % 5) * 25}
                />
                <StreakCounter streak={overview.streak} />
                <DailyGoalCard
                    targetExams={3}
                    completedExams={Math.min(overview.totalAttempts % 3, 3)}
                    achieved={overview.totalAttempts % 3 === 0 && overview.totalAttempts > 0}
                />
            </div>

            {/* Thống kê sử dụng AI */}
            {token && <UsageStatsCard token={token} />}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-4 text-white shadow-lg shadow-primary-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Target size={20} className="opacity-80" />
                        <span className="text-xs opacity-80">Bài đã làm</span>
                    </div>
                    <p className="text-2xl font-bold">{overview.totalAttempts}</p>
                </div>
                <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl p-4 text-white shadow-lg shadow-secondary-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={20} className="opacity-80" />
                        <span className="text-xs opacity-80">Điểm TB</span>
                    </div>
                    <p className="text-2xl font-bold">{overview.averageScore.toFixed(1)}</p>
                </div>
                <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-4 text-white shadow-lg shadow-primary-600/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Trophy size={20} className="opacity-80" />
                        <span className="text-xs opacity-80">Cao nhất</span>
                    </div>
                    <p className="text-2xl font-bold">{overview.highestScore.toFixed(1)}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
                    <div className="flex items-center gap-2 mb-2">
                        <Star size={20} className="opacity-80" />
                        <span className="text-xs opacity-80">Tỷ lệ đạt</span>
                    </div>
                    <p className="text-2xl font-bold">{overview.passRate}%</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl p-4 text-white">
                    <div className="flex items-center gap-2 mb-2">
                        <Flame size={20} className="opacity-80" />
                        <span className="text-xs opacity-80">Streak</span>
                    </div>
                    <p className="text-2xl font-bold">{overview.streak} 🔥</p>
                </div>
            </div>

            {/* Progress Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-500" />
                    Tiến độ 7 ngày gần nhất
                </h2>
                <div className="flex items-end justify-between gap-2 h-32">
                    {progressData.map((p, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                            <div className="w-full relative">
                                {p.count > 0 && (
                                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold text-green-600">
                                        {p.score}
                                    </span>
                                )}
                                <div
                                    className={`w-full rounded-t-lg transition-all duration-500 ${p.count > 0
                                        ? 'bg-gradient-to-t from-primary-500 to-secondary-400'
                                        : 'bg-slate-200 dark:bg-slate-700'
                                        }`}
                                    style={{
                                        height: p.count > 0 ? `${(p.score / 10) * 100}px` : '8px',
                                    }}
                                />
                            </div>
                            <span className="text-xs text-slate-500 mt-2">{p.date}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Bloom Analysis */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Target size={20} className="text-purple-500" />
                        Điểm mạnh / Điểm yếu
                    </h2>
                    <div className="space-y-4">
                        {bloomAnalysis.map((b) => (
                            <div key={b.level}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {b.label}
                                    </span>
                                    <span className={`text-sm font-bold ${b.percentage >= 70 ? 'text-green-600' :
                                        b.percentage >= 50 ? 'text-yellow-600' : 'text-red-500'
                                        }`}>
                                        {b.total > 0 ? `${b.percentage}%` : '--'}
                                    </span>
                                </div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${b.percentage >= 70 ? 'bg-green-500' :
                                            b.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${b.percentage}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    {b.total > 0 ? `${b.total} câu đã làm` : 'Chưa có dữ liệu'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Lightbulb size={20} className="text-yellow-500" />
                        Gợi ý ôn tập
                    </h2>
                    {recommendations.length === 0 ? (
                        <div className="text-center py-6 text-slate-500">
                            <Star size={40} className="mx-auto mb-3 text-yellow-400" />
                            <p>Tuyệt vời! Bạn đang làm rất tốt 🎉</p>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {recommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                                    <span className="text-yellow-500 mt-0.5">💡</span>
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Link
                        to="/exam-online"
                        className="mt-4 inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                    >
                        Làm bài để cải thiện <ChevronRight size={14} />
                    </Link>
                </div>
            </div>

            {/* Recent Attempts */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BookOpen size={20} className="text-green-500" />
                        Bài làm gần đây
                    </h2>
                    <Link to="/exam-online" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                        Xem tất cả <ChevronRight size={14} />
                    </Link>
                </div>

                {recentAttempts.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
                        <p>Chưa có bài làm nào</p>
                        <Link to="/exam-online" className="text-blue-600 hover:underline mt-2 inline-block">
                            Làm bài đầu tiên →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentAttempts.map((a) => (
                            <div
                                key={a.id}
                                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50"
                            >
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-slate-900 dark:text-white truncate">
                                        {a.templateTitle || 'Đề thi'}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Lớp {a.grade} • {a.correctCount}/{a.totalQuestions} câu đúng
                                    </p>
                                </div>
                                <div className="text-right ml-4">
                                    <span className={`text-xl font-bold ${a.score >= 8 ? 'text-green-600' :
                                        a.score >= 5 ? 'text-yellow-600' : 'text-red-500'
                                        }`}>
                                        {a.score.toFixed(1)}
                                    </span>
                                    <p className="text-xs text-slate-500">điểm</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
