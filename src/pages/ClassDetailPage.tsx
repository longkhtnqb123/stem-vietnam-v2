import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { classApi, type ClassDetailResponse } from '../lib/classApi';
import { examOnlineApi } from '../lib/examOnlineApi';
import type { ExamTemplate } from '../lib/examOnlineApi';

export default function ClassDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<ClassDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'assignments' | 'members'>('assignments');

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [templates, setTemplates] = useState<ExamTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);

    useEffect(() => {
        if (id) loadClassDetails();
    }, [id]);

    useEffect(() => {
        if (showAssignModal && templates.length === 0) {
            loadTemplates();
        }
    }, [showAssignModal]);

    const loadClassDetails = async () => {
        try {
            setLoading(true);
            const res = await classApi.getClassDetails(id!);
            setData(res);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadTemplates = async () => {
        try {
            const res = await examOnlineApi.getTemplates();
            setTemplates(res.templates);
        } catch (err) {
            console.error('Failed to load templates', err);
        }
    };

    const handleAssign = async (e: FormEvent) => {
        e.preventDefault();
        try {
            setAssignLoading(true);
            await classApi.createAssignment(id!, selectedTemplate);
            setShowAssignModal(false);
            loadClassDetails();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setAssignLoading(false);
        }
    };

    const handleDeleteClass = async () => {
        if (!window.confirm('Ban chac chan muon xoa lop nay?')) return;
        try {
            await classApi.deleteClass(id!);
            window.location.href = '/classes';
        } catch (err: any) {
            alert(err.message);
        }
    };

    const copyJoinCode = () => {
        if (data?.class.join_code) {
            navigator.clipboard.writeText(data.class.join_code);
            alert('Da sao chep ma tham gia');
        }
    };

    if (loading) {
        return (
            <div className="lms-page">
                <div className="lms-empty">Dang tai...</div>
            </div>
        );
    }
    if (error || !data) {
        return (
            <div className="lms-page">
                <div className="lms-empty">{error || 'Khong tim thay lop hoc'}</div>
            </div>
        );
    }

    const { class: cls, is_teacher, members, assignments } = data;

    return (
        <div className="lms-page">
            <section className="lms-card">
                <div className="lms-card-header">
                    <div>
                        <div className="lms-card-title">{cls.name}</div>
                        <div className="lms-card-subtitle">{cls.description || 'Chua co mo ta'}</div>
                        {!is_teacher && <div className="lms-note">GV: {cls.teacher_name}</div>}
                    </div>
                    {is_teacher && (
                        <button onClick={handleDeleteClass} className="lms-button-ghost">
                            Xoa lop
                        </button>
                    )}
                </div>
                <div className="lms-row">
                    <span className="lms-pill">{members.length} thanh vien</span>
                    <span className="lms-pill">{assignments.length} bai tap</span>
                    {is_teacher && (
                        <button onClick={copyJoinCode} className="lms-button-secondary">
                            Ma tham gia: {cls.join_code}
                        </button>
                    )}
                </div>
            </section>

            <section className="lms-card">
                <div className="lms-row">
                    <button
                        onClick={() => setActiveTab('assignments')}
                        className={activeTab === 'assignments' ? 'lms-button' : 'lms-button-secondary'}
                    >
                        Bai tap
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={activeTab === 'members' ? 'lms-button' : 'lms-button-secondary'}
                    >
                        Thanh vien
                    </button>
                    {is_teacher && activeTab === 'assignments' && (
                        <button onClick={() => setShowAssignModal(true)} className="lms-button">
                            Giao bai tap
                        </button>
                    )}
                </div>
            </section>

            {activeTab === 'assignments' ? (
                <section className="lms-card">
                    {assignments.length === 0 ? (
                        <div className="lms-empty">Chua co bai tap</div>
                    ) : (
                        <table className="lms-table">
                            <thead>
                                <tr>
                                    <th>Bai tap</th>
                                    <th>So cau</th>
                                    <th>Luot lam</th>
                                    <th>Thao tac</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.map((a) => (
                                    <tr key={a.id}>
                                        <td>{a.template_title}</td>
                                        <td>{a.total_questions}</td>
                                        <td>{a.attempts_count}</td>
                                        <td>
                                            <Link to="/exam" className="lms-button-ghost">
                                                Mo de thi
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            ) : (
                <section className="lms-card">
                    {members.length === 0 ? (
                        <div className="lms-empty">Chua co thanh vien</div>
                    ) : (
                        <table className="lms-table">
                            <thead>
                                <tr>
                                    <th>Hoc sinh</th>
                                    <th>Email</th>
                                    <th>Vai tro</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((m) => (
                                    <tr key={m.user_id}>
                                        <td>{m.name}</td>
                                        <td>{m.email}</td>
                                        <td>{m.role}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            )}

            {showAssignModal && (
                <div className="lms-modal">
                    <div className="lms-modal-panel" style={{ maxWidth: 560 }}>
                        <div className="lms-modal-header">
                            <div className="lms-card-title">Giao bai tap</div>
                            <button onClick={() => setShowAssignModal(false)} className="lms-button-ghost">
                                Dong
                            </button>
                        </div>
                        <form onSubmit={handleAssign} className="lms-modal-body lms-form">
                            <div className="lms-section">
                                <label className="lms-label">Chon de thi</label>
                                <select
                                    value={selectedTemplate}
                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                    className="lms-select"
                                >
                                    <option value="">-- Chon de thi --</option>
                                    {templates.map((t) => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="lms-modal-footer">
                                <button type="button" onClick={() => setShowAssignModal(false)} className="lms-button-secondary">
                                    Huy
                                </button>
                                <button type="submit" disabled={!selectedTemplate || assignLoading} className="lms-button">
                                    {assignLoading ? 'Dang giao...' : 'Giao bai tap'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
