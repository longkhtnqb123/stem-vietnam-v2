// Research Dashboard Page
// Trang phân tích dữ liệu nghiên cứu cho Admin

import { useState, useEffect } from 'react';
import {
    BarChart3,
    Users,
    Activity,
    Download,
    FileSpreadsheet,
    Calendar,
    TrendingUp,
    Eye
} from 'lucide-react';
import { useAuthStore } from '../lib/auth';

const API_URL = (import.meta.env.VITE_API_URL || 'https://stem-vietnam-api.stu725114073.workers.dev').replace(/\/$/, '');

interface ResearchStats {
    events: Array<{ event_type: string; count: number; unique_users: number }>;
    dau: Array<{ date: string; dau: number }>;
    users: { total_users: number; students: number; teachers: number };
    exams: { total_attempts: number; avg_score: number; pass_rate: number };
}

export default function ResearchDashboard() {
    const { token, user } = useAuthStore();
    const [stats, setStats] = useState<ResearchStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchStats();
    }, [token]);

    async function fetchStats() {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/research/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleExport(type: 'events' | 'attempts' | 'users') {
        setExporting(true);
        try {
            const res = await fetch(
                `${API_URL}/api/research/export/${type}?start=${dateRange.start}&end=${dateRange.end}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const data = await res.json();

            // Download as JSON
            const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_export_${dateRange.start}_${dateRange.end}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setExporting(false);
        }
    }

    if (user?.role !== 'admin') {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
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
                        <BarChart3 className="w-8 h-8 text-primary-500" />
                        Research Analytics
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Phân tích dữ liệu và xuất báo cáo nghiên cứu
                    </p>
                </div>
            </div>

            {/* Overview Stats */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
            ) : stats && (
                <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bento-card-highlight">
                            <div className="flex items-center gap-3">
                                <Users className="w-8 h-8 text-white/80" />
                                <div>
                                    <p className="text-sm text-white/70">Tổng Users</p>
                                    <p className="text-3xl font-bold">{stats.users?.total_users || 0}</p>
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-white/60">
                                {stats.users?.students || 0} HS • {stats.users?.teachers || 0} GV
                            </div>
                        </div>
                        <div className="bento-card">
                            <div className="flex items-center gap-3">
                                <Activity className="w-8 h-8 text-secondary-500" />
                                <div>
                                    <p className="text-sm text-slate-500">Tổng Attempts</p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                        {stats.exams?.total_attempts || 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bento-card">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-8 h-8 text-primary-500" />
                                <div>
                                    <p className="text-sm text-slate-500">Điểm TB</p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                        {(stats.exams?.avg_score || 0).toFixed(1)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bento-card">
                            <div className="flex items-center gap-3">
                                <Eye className="w-8 h-8 text-accent-500" />
                                <div>
                                    <p className="text-sm text-slate-500">Tỷ lệ đạt</p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                        {(stats.exams?.pass_rate || 0).toFixed(0)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Event Analytics */}
                    <div className="bento-card">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                            📊 Event Types (30 ngày gần nhất)
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {stats.events?.slice(0, 8).map(event => (
                                <div key={event.event_type} className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                                    <p className="text-xs text-slate-500 truncate">{event.event_type}</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{event.count}</p>
                                    <p className="text-xs text-slate-400">{event.unique_users} users</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DAU Chart */}
                    <div className="bento-card">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                            📈 Daily Active Users
                        </h3>
                        <div className="h-40 flex items-end gap-1">
                            {stats.dau?.slice(-14).map((day, i) => {
                                const maxDAU = Math.max(...stats.dau.map(d => d.dau));
                                const height = maxDAU > 0 ? (day.dau / maxDAU) * 100 : 0;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center">
                                        <div
                                            className="w-full bg-gradient-to-t from-primary-500 to-secondary-400 rounded-t-lg transition-all"
                                            style={{ height: `${Math.max(height, 5)}%` }}
                                        />
                                        <span className="text-xs text-slate-400 mt-1">
                                            {new Date(day.date).getDate()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Data Export */}
            <div className="bento-card">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5 text-primary-500" />
                    Xuất Dữ Liệu Nghiên Cứu
                </h3>

                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400" />
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                            className="input-field py-2"
                        />
                        <span className="text-slate-400">→</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                            className="input-field py-2"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => handleExport('events')}
                        disabled={exporting}
                        className="btn-secondary flex items-center justify-center gap-2"
                    >
                        <FileSpreadsheet size={18} />
                        Export Events
                    </button>
                    <button
                        onClick={() => handleExport('attempts')}
                        disabled={exporting}
                        className="btn-secondary flex items-center justify-center gap-2"
                    >
                        <FileSpreadsheet size={18} />
                        Export Exam Attempts
                    </button>
                    <button
                        onClick={() => handleExport('users')}
                        disabled={exporting}
                        className="btn-secondary flex items-center justify-center gap-2"
                    >
                        <FileSpreadsheet size={18} />
                        Export User Data
                    </button>
                </div>

                <p className="text-xs text-slate-500 mt-4">
                    ⚠️ Dữ liệu được xuất ở định dạng JSON. Đảm bảo tuân thủ quy định về bảo mật thông tin.
                </p>
            </div>
        </div>
    );
}
