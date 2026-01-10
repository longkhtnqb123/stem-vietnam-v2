import { useState, useEffect } from 'react';
import {
    TrendingUp,
    Target,
    BookOpen,
    Play,
    Zap,
    Crown,
    Swords,
    Map
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../lib/auth';
import { BadgeDisplay } from '../components/gamification/GamificationComponents';

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
    // Gamification data from separate API calls merged here in real implementation, 
    // but for now we'll assume the component handles it or we mock it for the immersive view
    gamification?: any;
}

export default function StudentDashboardImmersive() {
    const { token } = useAuthStore();
    const [data, setData] = useState<DashboardData | null>(null);
    const [_loading, setLoading] = useState(true);

    // Mock Quest Data for Immersive UI
    const quests = [
        { id: 1, title: 'Chinh phục Lượng giác', progress: 60, total: 100, xp: 150, type: 'daily' },
        { id: 2, title: 'Thám hiểm Vũ trụ', progress: 30, total: 100, xp: 300, type: 'weekly' },
        { id: 3, title: 'Bảo vệ Môi trường', progress: 0, total: 100, xp: 100, type: 'side' },
    ];

    useEffect(() => {
        async function fetchDashboard() {
            if (!token) return;
            try {
                const res = await fetch(`${API_URL}/api/student/dashboard`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchDashboard();
    }, [token]);

    const stats = [
        { label: 'Điểm trung bình', value: data?.overview.averageScore ? `${Math.round(data.overview.averageScore)}` : '-', icon: Target, color: 'text-emerald-400' },
        { label: 'Bài thi đã làm', value: data?.overview.totalAttempts || 0, icon: BookOpen, color: 'text-blue-400' },
        { label: 'Tỉ lệ đậu', value: data?.overview.passRate ? `${Math.round(data.overview.passRate)}%` : '-', icon: TrendingUp, color: 'text-amber-400' },
    ];

    return (
        <div className="space-y-8 animate-fade-in pb-20">

            {/* HERO: Active Mission */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all opacity-50"></div>
                    <div className="glass-panel p-8 rounded-3xl relative overflow-hidden border border-primary-500/30">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Swords size={120} />
                        </div>

                        <div className="relative z-10">
                            <span className="px-3 py-1 bg-primary-500/20 text-primary-300 text-xs font-bold uppercase tracking-wider rounded-full border border-primary-500/30">
                                Nhiệm vụ hiện tại
                            </span>
                            <h1 className="text-3xl font-extrabold mt-4 mb-2 text-white neon-text-emerald">
                                Tiếp tục hành trình: Toán Học
                            </h1>
                            <p className="text-slate-300 mb-6 max-w-lg">
                                Bạn đang làm dở bài "Đạo hàm và ứng dụng". Hoàn thành ngay để nhận +50 XP!
                            </p>

                            <div className="flex items-center gap-4">
                                <Link to="/active-learning" className="group/btn flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl font-bold text-white shadow-lg shadow-primary-500/30 hover:scale-105 transition-all">
                                    <Play className="fill-current" size={20} />
                                    Tiếp tục ngay
                                </Link>
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <Zap size={16} className="fill-current" /> +50 XP
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* STATS: Quick View */}
                <div className="grid grid-cols-1 gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className="glass-panel p-4 rounded-2xl flex items-center justify-between glass-panel-hover group">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl bg-slate-800/50 ${stat.color} group-hover:scale-110 transition-transform`}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm">{stat.label}</p>
                                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* QUEST LOG */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <Map className="text-amber-500" />
                        Bản Đồ Nhiệm Vụ
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {quests.map((quest) => (
                        <div key={quest.id} className="glass-panel p-5 rounded-2xl border-t-4 border-t-amber-500/50 hover:-translate-y-1 transition-transform">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                                    {quest.type === 'daily' ? 'Hàng ngày' : quest.type === 'weekly' ? 'Hàng tuần' : 'Phụ bản'}
                                </span>
                                <span className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                                    <Zap size={14} className="fill-current" /> {quest.xp} XP
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{quest.title}</h3>
                            <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden mb-2">
                                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${quest.progress}%` }}></div>
                            </div>
                            <div className="text-right text-xs text-slate-400">
                                {quest.progress}% Hoàn thành
                            </div>
                        </div>
                    ))}

                    {/* Add more interactive cards or integrate DailyGoalCard here */}
                    <div className="md:col-span-3">
                        {/* We reuse the generic DailyGoalCard but wrapper for layout */}
                    </div>
                </div>
            </section>

            {/* HALL OF FAME */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold flex items-center gap-3 mb-6">
                        <Crown className="text-yellow-500" />
                        Kho Tàng Danh Hiệu
                    </h2>
                    {/* Reuse BadgeDisplay but ensure it fits the glass theme. 
                        Since BadgeDisplay has its own bento-card class which has white bg, 
                        we might need to override it or accept className prop. 
                        Assuming global CSS handles bento-card in dark mode correctly or we just use it.
                    */}
                    <div className="glass-panel p-6 rounded-3xl">
                        <BadgeDisplay badges={[]} showAll={true} />
                        {/* Note: In real app we pass actual badges from data */}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <TrendingUp className="text-emerald-400" />
                        Top Học Viên
                    </h2>
                    <div className="glass-panel p-6 rounded-3xl h-full">
                        {/* Placeholder for Leaderboard */}
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                                    <span className={`font-bold w-6 text-center ${i === 1 ? 'text-yellow-400' : i === 2 ? 'text-slate-300' : i === 3 ? 'text-amber-600' : 'text-slate-500'}`}>#{i}</span>
                                    <div className="w-8 h-8 rounded-full bg-slate-700"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white">Student {i}</p>
                                        <p className="text-xs text-slate-400">Level {10 - i}</p>
                                    </div>
                                    <span className="text-emerald-400 font-bold text-sm">{(10 - i) * 100} XP</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
