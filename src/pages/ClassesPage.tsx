import { useEffect, useState, type FormEvent } from 'react';
import { useAuthStore } from '../lib/auth';
import { classApi, type Class } from '../lib/classApi';
import { Plus, LogIn } from 'lucide-react';
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
                    <p className="lms-note">Dang tai lop hoc...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="lms-page">
            <section className="lms-card">
                <div className="lms-card-header">
                    <div>
                        <div className="lms-card-title">Lop hoc</div>
                        <div className="lms-card-subtitle">
                            {user?.role === 'teacher'
                                ? 'Quan ly lop hoc va giao bai tap.'
                                : 'Tham gia lop hoc de nhan bai tap.'}
                        </div>
                    </div>
                    {user?.role === 'teacher' ? (
                        <button onClick={() => setShowCreateModal(true)} className="lms-button">
                            <Plus size={16} /> Tao lop moi
                        </button>
                    ) : (
                        <button onClick={() => setShowJoinModal(true)} className="lms-button">
                            <LogIn size={16} /> Tham gia lop
                        </button>
                    )}
                </div>
            </section>

            {error && <div className="lms-alert">{error}</div>}

            {classes.length === 0 ? (
                <div className="lms-empty">Chua co lop hoc</div>
            ) : (
                <div className="lms-grid lms-grid-2">
                    {classes.map((cls) => (
                        <Link key={cls.id} to={`/classes/${cls.id}`} className="lms-card">
                            <div className="lms-card-title">{cls.name}</div>
                            <div className="lms-card-subtitle">{cls.description || 'Chua co mo ta'}</div>
                            <div className="lms-note">Ma tham gia: {cls.join_code}</div>
                        </Link>
                    ))}
                </div>
            )}

            {showCreateModal && (
                <div className="lms-modal">
                    <div className="lms-modal-panel" style={{ maxWidth: 560 }}>
                        <div className="lms-modal-header">
                            <div className="lms-card-title">Tao lop moi</div>
                            <button onClick={() => setShowCreateModal(false)} className="lms-button-ghost">
                                Dong
                            </button>
                        </div>
                        <form onSubmit={handleCreateClass} className="lms-modal-body lms-form">
                            <div className="lms-section">
                                <label className="lms-label">Ten lop</label>
                                <input
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    className="lms-input"
                                    required
                                />
                            </div>
                            <div className="lms-section">
                                <label className="lms-label">Mo ta</label>
                                <textarea
                                    value={newClassDesc}
                                    onChange={(e) => setNewClassDesc(e.target.value)}
                                    className="lms-textarea"
                                />
                            </div>
                            <div className="lms-modal-footer">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="lms-button-secondary">
                                    Huy
                                </button>
                                <button type="submit" disabled={actionLoading} className="lms-button">
                                    {actionLoading ? 'Dang tao...' : 'Tao lop'}
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
                            <div className="lms-card-title">Tham gia lop</div>
                            <button onClick={() => setShowJoinModal(false)} className="lms-button-ghost">
                                Dong
                            </button>
                        </div>
                        <form onSubmit={handleJoinClass} className="lms-modal-body lms-form">
                            <div className="lms-section">
                                <label className="lms-label">Ma tham gia</label>
                                <input
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                    className="lms-input"
                                    required
                                />
                            </div>
                            <div className="lms-modal-footer">
                                <button type="button" onClick={() => setShowJoinModal(false)} className="lms-button-secondary">
                                    Huy
                                </button>
                                <button type="submit" disabled={actionLoading} className="lms-button">
                                    {actionLoading ? 'Dang tham gia...' : 'Tham gia'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
