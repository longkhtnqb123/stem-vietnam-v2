import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
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
            <div className="lms-page">
                <div className="lms-empty">Bạn không có quyền truy cập.</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="lms-page">
                <div className="lms-empty">
                    <div className="lms-spinner" />
                    <p className="lms-note">Đang tải thống kê...</p>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="lms-page">
                <div className="lms-empty">Không có dữ liệu</div>
            </div>
        );
    }

    return (
        <div className="lms-page">
            <section className="lms-card">
                <div className="lms-card-header">
                    <div>
                        <div className="lms-card-title">Research Dashboard</div>
                        <div className="lms-card-subtitle">Thống kê hệ thống</div>
                    </div>
                </div>
                <div className="lms-row">
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="lms-input"
                    />
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="lms-input"
                    />
                </div>
            </section>

            <section className="lms-grid lms-grid-3">
                <div className="lms-card">
                    <div className="lms-card-title">Người dùng</div>
                    <div className="lms-note">{stats.users.total_users}</div>
                </div>
                <div className="lms-card">
                    <div className="lms-card-title">Lượt làm bài</div>
                    <div className="lms-note">{stats.exams.total_attempts}</div>
                </div>
                <div className="lms-card">
                    <div className="lms-card-title">Điểm trung bình</div>
                    <div className="lms-note">{stats.exams.avg_score.toFixed(1)}</div>
                </div>
            </section>

            <section className="lms-card">
                <div className="lms-card-header">
                    <div className="lms-card-title">Sự kiện</div>
                    <div className="lms-row">
                        <button onClick={() => handleExport('events')} className="lms-button" disabled={exporting}>
                            <Download size={16} /> Export
                        </button>
                    </div>
                </div>
                {stats.events.length === 0 ? (
                    <div className="lms-empty">Không có sự kiện</div>
                ) : (
                    <table className="lms-table">
                        <thead>
                            <tr>
                                <th>Loại</th>
                                <th>Số lượt</th>
                                <th>Người dùng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.events.map((e) => (
                                <tr key={e.event_type}>
                                    <td>{e.event_type}</td>
                                    <td>{e.count}</td>
                                    <td>{e.unique_users}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}
