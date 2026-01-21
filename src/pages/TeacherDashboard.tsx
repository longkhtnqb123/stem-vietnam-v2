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
                    throw new Error(errData.error || 'Loi tai du lieu');
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
                    <p className="lms-note">Ban khong co quyen truy cap.</p>
                    <Link to="/chat" className="lms-button-secondary">Ve Chat</Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="lms-page">
                <div className="lms-empty">
                    <div className="lms-spinner" />
                    <p className="lms-note">Dang tai dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="lms-page">
                <div className="lms-empty">
                    <p className="lms-note">Loi: {error}</p>
                    <button onClick={() => window.location.reload()} className="lms-button-secondary">
                        Thu lai
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { overview, templates, topStudents } = data;

    return (
        <div className="lms-page">
            <section className="lms-card">
                <div className="lms-card-header">
                    <div>
                        <div className="lms-card-title">Teacher Dashboard</div>
                        <div className="lms-card-subtitle">Tong quan lop hoc va de thi</div>
                    </div>
                    <Link to="/exam" className="lms-button">Tao de thi</Link>
                </div>
            </section>

            <section className="lms-grid lms-grid-3">
                <div className="lms-card">
                    <div className="lms-card-title">De thi</div>
                    <div className="lms-note">{overview.totalTemplates}</div>
                </div>
                <div className="lms-card">
                    <div className="lms-card-title">Luot lam bai</div>
                    <div className="lms-note">{overview.totalAttempts}</div>
                </div>
                <div className="lms-card">
                    <div className="lms-card-title">Diem trung binh</div>
                    <div className="lms-note">{overview.averageScore.toFixed(1)}</div>
                </div>
            </section>

            <section className="lms-card">
                <div className="lms-card-header">
                    <div className="lms-card-title">De thi gan day</div>
                </div>
                {templates.length === 0 ? (
                    <div className="lms-empty">Chua co de thi</div>
                ) : (
                    <table className="lms-table">
                        <thead>
                            <tr>
                                <th>Tieu de</th>
                                <th>Lop</th>
                                <th>So cau</th>
                                <th>Luot lam</th>
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

            <section className="lms-card">
                <div className="lms-card-header">
                    <div className="lms-card-title">Top hoc sinh</div>
                </div>
                {topStudents.length === 0 ? (
                    <div className="lms-empty">Chua co du lieu</div>
                ) : (
                    <table className="lms-table">
                        <thead>
                            <tr>
                                <th>Hang</th>
                                <th>Hoc sinh</th>
                                <th>Diem</th>
                                <th>De thi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topStudents.slice(0, 6).map((student) => (
                                <tr key={student.rank}>
                                    <td>{student.rank}</td>
                                    <td>{student.name || student.email || 'Hoc sinh'}</td>
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
