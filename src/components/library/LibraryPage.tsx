import { useState, useEffect, useRef } from 'react';
import { Library, Upload, Trash2, BookOpen, Plus, CheckCircle2, AlertCircle, Download, Link as LinkIcon } from 'lucide-react';
import type { Document } from '../../types';
import { DEFAULT_LIBRARY, BOOK_PUBLISHERS, checkDocumentExists } from '../../data/library/defaultBooks';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../lib/auth';

const API_URL = (import.meta.env.VITE_API_URL || 'https://stem-vietnam-api.stu725114073.workers.dev').replace(/\/$/, '');

const TABS = [
    { id: 'policy', label: 'Van ban', prefix: 'policy-' },
    { id: 'sgk', label: 'SGK', prefix: 'sgk-' },
    { id: 'chuyen_de', label: 'Chuyen de', prefix: 'cd-' },
    { id: 'user', label: 'Tai lieu cua ban', prefix: 'user-' },
] as const;

export default function LibraryPage() {
    const documents = DEFAULT_LIBRARY;
    const [userDocuments, setUserDocuments] = useState<Document[]>([]);
    const [documentStatus, setDocumentStatus] = useState<Record<string, boolean>>({});
    const [activeTab, setActiveTab] = useState<string>('sgk');
    const [showUpload, setShowUpload] = useState(false);
    const [filterGrade, setFilterGrade] = useState<'all' | '10' | '11' | '12'>('all');
    const [filterPublisher, setFilterPublisher] = useState<'all' | string>('all');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const { useDefaultLibrary, toggleDefaultLibrary, showNotification } = useAppStore();
    const { token } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [uploadForm, setUploadForm] = useState({
        title: '',
        grade: '12' as '10' | '11' | '12',
        topic: '',
        source: '',
        inputType: 'file' as 'file' | 'url',
        fileUrl: '',
        file: null as File | null,
    });

    useEffect(() => {
        const checkAllDocuments = async () => {
            const statuses: Record<string, boolean> = {};
            for (const doc of DEFAULT_LIBRARY) {
                statuses[doc.id] = await checkDocumentExists(doc.fileUrl);
            }
            setDocumentStatus(statuses);
        };
        checkAllDocuments();
    }, []);

    const getTabDocuments = () => {
        let docs: Document[] = [];

        switch (activeTab) {
            case 'policy':
                docs = documents.filter(d => d.id.startsWith('policy-'));
                break;
            case 'sgk':
                docs = documents.filter(d => d.id.startsWith('sgk-'));
                break;
            case 'chuyen_de':
                docs = documents.filter(d => d.id.startsWith('cd-'));
                break;
            case 'user':
                docs = userDocuments;
                break;
            default:
                docs = documents;
        }

        return docs.filter(doc => {
            if (filterGrade !== 'all' && doc.grade !== filterGrade) return false;
            if (filterPublisher !== 'all' && doc.source !== filterPublisher) return false;
            return true;
        });
    };

    const filteredDocuments = getTabDocuments();

    const handleUpload = async () => {
        setUploadError(null);

        if (uploadForm.inputType === 'url') {
            const newDoc: Document = {
                id: `user-doc-${Date.now()}`,
                title: uploadForm.title,
                grade: uploadForm.grade,
                topic: uploadForm.topic,
                source: uploadForm.source,
                fileUrl: uploadForm.fileUrl,
                createdAt: Date.now(),
            };
            setUserDocuments(prev => [newDoc, ...prev]);
            setShowUpload(false);
            setActiveTab('user');
            resetForm();
            showNotification('success', 'Da them tai lieu!');
            return;
        }

        if (!uploadForm.file) {
            setUploadError('Vui long chon file de upload');
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', uploadForm.file);
            formData.append('metadata', JSON.stringify({
                bookId: `user-${Date.now()}`,
                title: uploadForm.title,
                grade: uploadForm.grade,
                subject: 'cong_nghiep',
                type: 'user',
            }));

            const res = await fetch(`${API_URL}/api/admin/rag/upload`, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.details || 'Upload that bai');
            }

            const newDoc: Document = {
                id: `user-doc-${Date.now()}`,
                title: uploadForm.title,
                grade: uploadForm.grade,
                topic: uploadForm.topic,
                source: uploadForm.source || 'Upload',
                fileUrl: '',
                createdAt: Date.now(),
            };
            setUserDocuments(prev => [newDoc, ...prev]);
            setShowUpload(false);
            setActiveTab('user');
            resetForm();
            showNotification('success', `Da upload ${data.result?.chunksCreated || 0} chunks!`);

        } catch (error) {
            console.error('[library] upload error:', error);
            setUploadError(error instanceof Error ? error.message : 'Upload that bai');
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setUploadForm({
            title: '',
            grade: '12',
            topic: '',
            source: '',
            inputType: 'file',
            fileUrl: '',
            file: null,
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadForm(prev => ({
                ...prev,
                file,
                title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
            }));
        }
    };

    const handleDelete = (id: string) => {
        if (id.startsWith('user-doc-')) {
            if (confirm('Ban chac chan muon xoa tai lieu nay?')) {
                setUserDocuments(prev => prev.filter(d => d.id !== id));
            }
        }
    };

    return (
        <div className="lms-page">
            <section className="lms-card">
                <div className="lms-card-header">
                    <div>
                        <div className="lms-card-title">Thu vien tai lieu</div>
                        <div className="lms-card-subtitle">Tai lieu SGK va chuyen de cho AI</div>
                    </div>
                    <button onClick={() => setShowUpload(true)} className="lms-button">
                        <Plus size={16} /> Them tai lieu
                    </button>
                </div>
            </section>

            <section className="lms-card">
                <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                    <div className="lms-row">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={activeTab === tab.id ? 'lms-button' : 'lms-button-secondary'}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="lms-row">
                        <label className="lms-note">Dung thu vien mac dinh</label>
                        <input type="checkbox" checked={useDefaultLibrary} onChange={toggleDefaultLibrary} />
                    </div>
                </div>
            </section>

            <section className="lms-card">
                <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                    <div className="lms-row">
                        {(['all', '10', '11', '12'] as const).map(grade => (
                            <button
                                key={grade}
                                onClick={() => setFilterGrade(grade)}
                                className={filterGrade === grade ? 'lms-button' : 'lms-button-secondary'}
                            >
                                {grade === 'all' ? 'Tat ca' : grade}
                            </button>
                        ))}
                    </div>
                    <select
                        value={filterPublisher}
                        onChange={(e) => setFilterPublisher(e.target.value)}
                        className="lms-select"
                    >
                        <option value="all">Tat ca nguon</option>
                        {Object.values(BOOK_PUBLISHERS).map(pub => (
                            <option key={pub} value={pub}>{pub}</option>
                        ))}
                    </select>
                </div>
            </section>

            <section className="lms-card">
                {filteredDocuments.length > 0 ? (
                    <table className="lms-table">
                        <thead>
                            <tr>
                                <th>Tai lieu</th>
                                <th>Lop</th>
                                <th>Nguon</th>
                                <th>Trang thai</th>
                                <th>Thao tac</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDocuments.map((doc) => {
                                const isDefault = !doc.id.startsWith('user-doc-');
                                const hasFile = documentStatus[doc.id];
                                return (
                                    <tr key={doc.id}>
                                        <td>{doc.title}</td>
                                        <td>{doc.grade}</td>
                                        <td>{doc.source}</td>
                                        <td>
                                            {isDefault ? (
                                                hasFile ? (
                                                    <span className="lms-note"><CheckCircle2 size={14} /> San sang</span>
                                                ) : (
                                                    <span className="lms-note"><AlertCircle size={14} /> Thieu file</span>
                                                )
                                            ) : (
                                                <span className="lms-note">Ca nhan</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="lms-row">
                                                {doc.fileUrl && (
                                                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="lms-button-ghost">
                                                        <LinkIcon size={14} /> Mo
                                                    </a>
                                                )}
                                                {doc.fileUrl && (
                                                    <a href={doc.fileUrl} className="lms-button-ghost" download>
                                                        <Download size={14} /> Tai
                                                    </a>
                                                )}
                                                {!isDefault && (
                                                    <button onClick={() => handleDelete(doc.id)} className="lms-button-ghost">
                                                        <Trash2 size={14} /> Xoa
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="lms-empty">Chua co tai lieu</div>
                )}
            </section>

            {showUpload && (
                <div className="lms-modal">
                    <div className="lms-modal-panel" style={{ maxWidth: 640 }}>
                        <div className="lms-modal-header">
                            <div className="lms-card-title">Them tai lieu</div>
                            <button onClick={() => setShowUpload(false)} className="lms-button-ghost">
                                Dong
                            </button>
                        </div>
                        <div className="lms-modal-body lms-form">
                            {uploadError && <div className="lms-alert">{uploadError}</div>}

                            <div className="lms-section">
                                <label className="lms-label">Tieu de</label>
                                <input
                                    type="text"
                                    value={uploadForm.title}
                                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="lms-input"
                                />
                            </div>

                            <div className="lms-section">
                                <label className="lms-label">Lop</label>
                                <select
                                    value={uploadForm.grade}
                                    onChange={(e) => setUploadForm(prev => ({ ...prev, grade: e.target.value as any }))}
                                    className="lms-select"
                                >
                                    <option value="10">10</option>
                                    <option value="11">11</option>
                                    <option value="12">12</option>
                                </select>
                            </div>

                            <div className="lms-section">
                                <label className="lms-label">Nguon</label>
                                <input
                                    type="text"
                                    value={uploadForm.source}
                                    onChange={(e) => setUploadForm(prev => ({ ...prev, source: e.target.value }))}
                                    className="lms-input"
                                />
                            </div>

                            <div className="lms-section">
                                <label className="lms-label">Cach them</label>
                                <div className="lms-row">
                                    <button
                                        type="button"
                                        onClick={() => setUploadForm(prev => ({ ...prev, inputType: 'file' }))}
                                        className={uploadForm.inputType === 'file' ? 'lms-button' : 'lms-button-secondary'}
                                    >
                                        <Upload size={14} /> File
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUploadForm(prev => ({ ...prev, inputType: 'url' }))}
                                        className={uploadForm.inputType === 'url' ? 'lms-button' : 'lms-button-secondary'}
                                    >
                                        <LinkIcon size={14} /> URL
                                    </button>
                                </div>
                            </div>

                            {uploadForm.inputType === 'file' ? (
                                <div className="lms-section">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            ) : (
                                <div className="lms-section">
                                    <input
                                        type="text"
                                        value={uploadForm.fileUrl}
                                        onChange={(e) => setUploadForm(prev => ({ ...prev, fileUrl: e.target.value }))}
                                        className="lms-input"
                                        placeholder="Nhap duong dan file"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="lms-modal-footer">
                            <button onClick={() => setShowUpload(false)} className="lms-button-secondary">
                                Huy
                            </button>
                            <button onClick={handleUpload} disabled={isUploading} className="lms-button">
                                {isUploading ? <Loader2 size={16} /> : <Plus size={16} />}
                                <span>Upload</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
