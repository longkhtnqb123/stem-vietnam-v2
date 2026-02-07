import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../lib/auth';

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
            <div className="lms-page">
                <div className="lms-empty">
                    <div className="lms-spinner" />
                    <p className="lms-note">Đang tải bảng điều khiển...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="lms-page">
                <div className="lms-empty">
                    <p className="lms-note">Lỗi: {error}</p>
                    <button onClick={() => window.location.reload()} className="lms-button-secondary">
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { overview, bloomAnalysis, recommendations, recentAttempts } = data;

    return (
        <div className="lms-page lms-dashboard">
            <section className="lms-hero-card">
                <div>
                    <div className="lms-hero-kicker">Học sinh</div>
                    <h2 className="lms-hero-title">Xin chào, {user?.name}</h2>
                    <p className="lms-hero-subtitle">Tổng quan tiến độ học tập hôm nay</p>
                </div>
                <div className="lms-hero-actions">
                    <Link to="/exam" className="lms-hero-button">
                        Làm bài thi
                    </Link>
                    <Link to="/practice" className="lms-hero-ghost">
                        Ôn tập nhanh
                    </Link>
                </div>
            </section>

            <section className="lms-stat-grid">
                <div className="lms-stat-card">
                    <div className="lms-stat-label">Bài thi</div>
                    <div className="lms-stat-value">{overview.totalAttempts} bài</div>
                </div>
                <div className="lms-stat-card">
                    <div className="lms-stat-label">Trung bình</div>
                    <div className="lms-stat-value">{overview.averageScore.toFixed(1)}/10</div>
                </div>
                <div className="lms-stat-card">
                    <div className="lms-stat-label">Tỉ lệ đạt</div>
                    <div className="lms-stat-value">{Math.round(overview.passRate)}%</div>
                </div>
                <div className="lms-stat-card">
                    <div className="lms-stat-label">Streak</div>
                    <div className="lms-stat-value">{overview.streak} ngày</div>
                </div>
            </section>

            <section className="lms-table-card">
                <div className="lms-card-header">
                    <div>
                        <div className="lms-card-title">Gần đây</div>
                        <div className="lms-card-subtitle">Bài thi vừa hoàn thành</div>
                    </div>
                </div>
                {recentAttempts.length === 0 ? (
                    <div className="lms-empty">Chưa có bài thi</div>
                ) : (
                    <table className="lms-table">
                        <thead>
                            <tr>
                                <th>Đề thi</th>
                                <th>Lớp</th>
                                <th>Điểm</th>
                                <th>Ngày</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentAttempts.map((attempt) => (
                                <tr key={attempt.id}>
                                    <td>{attempt.templateTitle}</td>
                                    <td>{attempt.grade}</td>
                                    <td>{attempt.score.toFixed(1)}</td>
                                    <td>{new Date(attempt.submittedAt).toLocaleDateString('vi-VN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            <section className="lms-grid lms-grid-2">
                <div className="lms-table-card">
                    <div className="lms-card-title">Phân tích mức độ</div>
                    <div className="lms-section">
                        {bloomAnalysis.map((item) => (
                            <div key={item.level} className="lms-row" style={{ justifyContent: 'space-between' }}>
                                <span>{item.label}</span>
                                <span className="lms-note">{item.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="lms-table-card">
                    <div className="lms-card-title">Gợi ý ôn tập</div>
                    {recommendations.length === 0 ? (
                        <div className="lms-note">Chưa có gợi ý.</div>
                    ) : (
                        <ul className="lms-section">
                            {recommendations.map((rec, idx) => (
                                <li key={idx} className="lms-note">- {rec}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </div>
    );
}
