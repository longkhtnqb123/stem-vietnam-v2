import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../lib/auth';

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

    if (user?.role === 'student') {
        return (
            <div className="lms-page">
                <div className="lms-empty">
                    <p className="lms-note">Bạn không có quyền truy cập.</p>
                    <Link to="/chat" className="lms-button-secondary">Về Chat</Link>
                </div>
            </div>
        );
    }

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

    const { overview, templates, topStudents } = data;

    return (
        <div className="lms-page lms-dashboard">
            <section className="lms-hero-card">
                <div>
                    <div className="lms-hero-kicker">Giáo viên</div>
                    <h2 className="lms-hero-title">Quản lý lớp học của bạn</h2>
                    <p className="lms-hero-subtitle">Theo dõi kết quả và tạo đề thi mới</p>
                </div>
                <div className="lms-hero-actions">
                    <Link to="/exam" className="lms-hero-button">Tạo đề thi</Link>
                    <Link to="/classes" className="lms-hero-ghost">Quản lý lớp</Link>
                </div>
            </section>

            <section className="lms-stat-grid">
                <div className="lms-stat-card">
                    <div className="lms-stat-label">Đề thi</div>
                    <div className="lms-stat-value">{overview.totalTemplates}</div>
                </div>
                <div className="lms-stat-card">
                    <div className="lms-stat-label">Lượt làm</div>
                    <div className="lms-stat-value">{overview.totalAttempts}</div>
                </div>
                <div className="lms-stat-card">
                    <div className="lms-stat-label">Trung bình</div>
                    <div className="lms-stat-value">{overview.averageScore.toFixed(1)}</div>
                </div>
                <div className="lms-stat-card">
                    <div className="lms-stat-label">Tỉ lệ đạt</div>
                    <div className="lms-stat-value">{Math.round(overview.passRate)}%</div>
                </div>
            </section>

            <section className="lms-table-card">
                <div className="lms-card-header">
                    <div>
                        <div className="lms-card-title">Đề thi gần đây</div>
                        <div className="lms-card-subtitle">Các bộ đề đã tạo</div>
                    </div>
                </div>
                {templates.length === 0 ? (
                    <div className="lms-empty">Chưa có đề thi</div>
                ) : (
                    <table className="lms-table">
                        <thead>
                            <tr>
                                <th>Tiêu đề</th>
                                <th>Lớp</th>
                                <th>Số câu</th>
                                <th>Lượt làm</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates.slice(0, 6).map((item) => (
                                <tr key={item.id}>
                                    <td>{item.title}</td>
                                    <td>{item.grade}</td>
                                    <td>{item.totalQuestions}</td>
                                    <td>{item.timesTaken}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            <section className="lms-table-card">
                <div className="lms-card-header">
                    <div>
                        <div className="lms-card-title">Top học sinh</div>
                        <div className="lms-card-subtitle">Thành tích nổi bật</div>
                    </div>
                </div>
                {topStudents.length === 0 ? (
                    <div className="lms-empty">Chưa có dữ liệu</div>
                ) : (
                    <table className="lms-table">
                        <thead>
                            <tr>
                                <th>Hạng</th>
                                <th>Học sinh</th>
                                <th>Điểm</th>
                                <th>Đề thi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topStudents.slice(0, 6).map((student) => (
                                <tr key={student.rank}>
                                    <td>{student.rank}</td>
                                    <td>{student.name || student.email || 'Học sinh'}</td>
                                    <td>{student.score.toFixed(1)}</td>
                                    <td>{student.templateTitle}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}
