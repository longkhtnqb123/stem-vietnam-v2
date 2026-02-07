import { useState, useEffect, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../lib/auth';

const API_URL = (import.meta.env.VITE_API_URL || 'https://stem-vietnam-api.stu725114073.workers.dev').replace(/\/$/, '');

interface SchoolData {
    id: string;
    name: string;
    code: string;
    address?: string;
    contact_email?: string;
    contact_phone?: string;
    admin_name?: string;
    teacher_count: number;
    class_count: number;
    created_at: number;
}

export default function SchoolAdminPage() {
    const { token, user } = useAuthStore();
    const [schools, setSchools] = useState<SchoolData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        contactEmail: '',
        contactPhone: ''
    });

    useEffect(() => {
        fetchSchools();
    }, [token]);

    async function fetchSchools() {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/schools`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSchools(data.schools || []);
        } catch (error) {
            console.error('Failed to fetch schools:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateSchool(e: FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/schools`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowCreateModal(false);
                setFormData({ name: '', code: '', address: '', contactEmail: '', contactPhone: '' });
                fetchSchools();
            }
        } catch (error) {
            console.error('Failed to create school:', error);
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
                    <p className="lms-note">Đang tải trường học...</p>
                </div>
            </div>
        );
    }

    const filtered = schools.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="lms-page">
            <section className="lms-card">
                <div className="lms-card-header">
                    <div>
                        <div className="lms-card-title">Quản lý trường học</div>
                        <div className="lms-card-subtitle">Danh sách trường và thông tin liên hệ</div>
                    </div>
                    <button onClick={() => setShowCreateModal(true)} className="lms-button">
                        <Plus size={16} /> Thêm trường
                    </button>
                </div>
                <input
                    className="lms-input"
                    placeholder="Tìm kiếm trường..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </section>

            <section className="lms-card">
                {filtered.length === 0 ? (
                    <div className="lms-empty">Không có dữ liệu</div>
                ) : (
                    <table className="lms-table">
                        <thead>
                            <tr>
                                <th>Tên trường</th>
                                <th>Mã</th>
                                <th>Số lớp</th>
                                <th>Số giáo viên</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((school) => (
                                <tr key={school.id}>
                                    <td>{school.name}</td>
                                    <td>{school.code}</td>
                                    <td>{school.class_count}</td>
                                    <td>{school.teacher_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {showCreateModal && (
                <div className="lms-modal">
                    <div className="lms-modal-panel" style={{ maxWidth: 560 }}>
                        <div className="lms-modal-header">
                            <div className="lms-card-title">Thêm trường</div>
                            <button onClick={() => setShowCreateModal(false)} className="lms-button-ghost">
                                Đóng
                            </button>
                        </div>
                        <form onSubmit={handleCreateSchool} className="lms-modal-body lms-form">
                            <div className="lms-section">
                                <label className="lms-label">Tên trường</label>
                                <input
                                    className="lms-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="lms-section">
                                <label className="lms-label">Mã trường</label>
                                <input
                                    className="lms-input"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="lms-section">
                                <label className="lms-label">Địa chỉ</label>
                                <input
                                    className="lms-input"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="lms-section">
                                <label className="lms-label">Email</label>
                                <input
                                    className="lms-input"
                                    value={formData.contactEmail}
                                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                />
                            </div>
                            <div className="lms-section">
                                <label className="lms-label">Điện thoại</label>
                                <input
                                    className="lms-input"
                                    value={formData.contactPhone}
                                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                />
                            </div>
                            <div className="lms-modal-footer">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="lms-button-secondary">
                                    Hủy
                                </button>
                                <button type="submit" className="lms-button">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
