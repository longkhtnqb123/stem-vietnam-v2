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
        if (!window.confirm('Bạn chắc chắn muốn xóa lớp này?')) return;
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
            alert('Đã sao chép mã tham gia');
        }
    };

    if (loading) {
        return (
            <div className="lms-page">
                <div className="lms-empty">Đang tải...</div>
            </div>
        );
    }
    if (error || !data) {
        return (
            <div className="lms-page">
                <div className="lms-empty">{error || 'Không tìm thấy lớp học'}</div>
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
                        <div className="lms-card-subtitle">{cls.description || 'Chưa có mô tả'}</div>
                        {!is_teacher && <div className="lms-note">GV: {cls.teacher_name}</div>}
                    </div>
                    {is_teacher && (
                        <button onClick={handleDeleteClass} className="lms-button-ghost">
                            Xóa lớp
                        </button>
                    )}
                </div>
                <div className="lms-row">
                    <span className="lms-pill">{members.length} thành viên</span>
                    <span className="lms-pill">{assignments.length} bài tập</span>
                    {is_teacher && (
                        <button onClick={copyJoinCode} className="lms-button-secondary">
                            Mã tham gia: {cls.join_code}
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
                        Bài tập
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={activeTab === 'members' ? 'lms-button' : 'lms-button-secondary'}
                    >
                        Thành viên
                    </button>
                    {is_teacher && activeTab === 'assignments' && (
                        <button onClick={() => setShowAssignModal(true)} className="lms-button">
                            Giao bài tập
                        </button>
                    )}
                </div>
            </section>

            {activeTab === 'assignments' ? (
                <section className="lms-card">
                    {assignments.length === 0 ? (
                        <div className="lms-empty">Chưa có bài tập</div>
                    ) : (
                        <table className="lms-table">
                            <thead>
                                <tr>
                                    <th>Bài tập</th>
                                    <th>Số câu</th>
                                    <th>Lượt làm</th>
                                    <th>Thao tác</th>
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
                                                Mở đề thi
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
                        <div className="lms-empty">Chưa có thành viên</div>
                    ) : (
                        <table className="lms-table">
                            <thead>
                                <tr>
                                    <th>Học sinh</th>
                                    <th>Email</th>
                                    <th>Vai trò</th>
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
                            <div className="lms-card-title">Giao bài tập</div>
                            <button onClick={() => setShowAssignModal(false)} className="lms-button-ghost">
                                Đóng
                            </button>
                        </div>
                        <form onSubmit={handleAssign} className="lms-modal-body lms-form">
                            <div className="lms-section">
                                <label className="lms-label">Chọn đề thi</label>
                                <select
                                    value={selectedTemplate}
                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                    className="lms-select"
                                >
                                    <option value="">-- Chọn đề thi --</option>
                                    {templates.map((t) => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="lms-modal-footer">
                                <button type="button" onClick={() => setShowAssignModal(false)} className="lms-button-secondary">
                                    Hủy
                                </button>
                                <button type="submit" disabled={!selectedTemplate || assignLoading} className="lms-button">
                                    {assignLoading ? 'Đang giao...' : 'Giao bài tập'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
