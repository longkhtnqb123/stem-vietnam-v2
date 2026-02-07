import { useEffect, useState, type FormEvent } from 'react';
import { useAuthStore } from '../lib/auth';
import { classApi, type Class } from '../lib/classApi';
import { Link } from 'react-router-dom';

export default function ClassesPage() {
    const { user } = useAuthStore();
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

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

    const handleCreateClass = async (e: FormEvent) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            await classApi.createClass(newClassName, newClassDesc);
            setShowCreateModal(false);
            setNewClassName('');
            setNewClassDesc('');
            loadClasses();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoinClass = async (e: FormEvent) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            await classApi.joinClass(joinCode);
            setShowJoinModal(false);
            setJoinCode('');
            loadClasses();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="lms-page">
                <div className="lms-empty">
                    <div className="lms-spinner" />
                    <p className="lms-note">Đang tải lớp học...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="lms-page">
            <section className="lms-card">
                <div className="lms-card-header">
                    <div>
                        <div className="lms-card-title">Lớp học</div>
                        <div className="lms-card-subtitle">
                            {user?.role === 'teacher'
                                ? 'Quản lý lớp học và giao bài tập.'
                                : 'Tham gia lớp học để nhận bài tập.'}
                        </div>
                    </div>
                    {user?.role === 'teacher' ? (
                        <button onClick={() => setShowCreateModal(true)} className="lms-button">
                            Tạo lớp mới
                        </button>
                    ) : (
                        <button onClick={() => setShowJoinModal(true)} className="lms-button">
                            Tham gia lớp
                        </button>
                    )}
                </div>
            </section>

            {error && <div className="lms-alert">{error}</div>}

            {classes.length === 0 ? (
                <div className="lms-empty">Chưa có lớp học</div>
            ) : (
                <div className="lms-grid lms-grid-2">
                    {classes.map((cls) => (
                        <Link key={cls.id} to={`/classes/${cls.id}`} className="lms-card">
                            <div className="lms-card-title">{cls.name}</div>
                            <div className="lms-card-subtitle">{cls.description || 'Chưa có mô tả'}</div>
                            <div className="lms-note">Mã tham gia: {cls.join_code}</div>
                        </Link>
                    ))}
                </div>
            )}

            {showCreateModal && (
                <div className="lms-modal">
                    <div className="lms-modal-panel" style={{ maxWidth: 560 }}>
                        <div className="lms-modal-header">
                            <div className="lms-card-title">Tạo lớp mới</div>
                            <button onClick={() => setShowCreateModal(false)} className="lms-button-ghost">
                                Đóng
                            </button>
                        </div>
                        <form onSubmit={handleCreateClass} className="lms-modal-body lms-form">
                            <div className="lms-section">
                                <label className="lms-label">Tên lớp</label>
                                <input
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    className="lms-input"
                                    required
                                />
                            </div>
                            <div className="lms-section">
                                <label className="lms-label">Mô tả</label>
                                <textarea
                                    value={newClassDesc}
                                    onChange={(e) => setNewClassDesc(e.target.value)}
                                    className="lms-textarea"
                                />
                            </div>
                            <div className="lms-modal-footer">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="lms-button-secondary">
                                    Hủy
                                </button>
                                <button type="submit" disabled={actionLoading} className="lms-button">
                                    {actionLoading ? 'Đang tạo...' : 'Tạo lớp'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showJoinModal && (
                <div className="lms-modal">
                    <div className="lms-modal-panel" style={{ maxWidth: 560 }}>
                        <div className="lms-modal-header">
                            <div className="lms-card-title">Tham gia lớp</div>
                            <button onClick={() => setShowJoinModal(false)} className="lms-button-ghost">
                                Đóng
                            </button>
                        </div>
                        <form onSubmit={handleJoinClass} className="lms-modal-body lms-form">
                            <div className="lms-section">
                                <label className="lms-label">Mã tham gia</label>
                                <input
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                    className="lms-input"
                                    required
                                />
                            </div>
                            <div className="lms-modal-footer">
                                <button type="button" onClick={() => setShowJoinModal(false)} className="lms-button-secondary">
                                    Hủy
                                </button>
                                <button type="submit" disabled={actionLoading} className="lms-button">
                                    {actionLoading ? 'Đang tham gia...' : 'Tham gia'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
