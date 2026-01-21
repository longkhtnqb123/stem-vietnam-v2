import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    Clock,
    Trophy,
    History,
    ChevronRight,
    Play,
    Loader2,
    Sparkles,
    X,
} from 'lucide-react';
import {
    getExamTemplates,
    getExamAttempts,
    startExamAttempt,
    generateExamWithAI,
    createExamTemplate,
    getExamTypeLabel,
    getDifficultyLabel,
    type ExamTemplate,
    type ExamAttempt,
    type AIGenerateParams,
    type AIGenerateResponse,
} from '../lib/examOnlineApi';
import { useAuthStore } from '../lib/auth';

function ExamCard({
    template,
    onStart,
    isLoading,
}: {
    template: ExamTemplate;
    onStart: () => void;
    isLoading?: boolean;
}) {
    return (
        <article className="lms-card">
            <div className="lms-card-header">
                <div>
                    <div className="lms-card-title">{template.title}</div>
                    <div className="lms-card-subtitle">
                        Lop {template.grade}
                        {template.branch && ` - ${template.branch === 'cong_nghiep' ? 'Cong nghiep' : 'Nong nghiep'}`}
                    </div>
                </div>
                <span className="lms-badge">{getExamTypeLabel(template.exam_type)}</span>
            </div>

            <div className="lms-row lms-note">
                <span className="lms-row"><BookOpen size={14} /> {template.total_questions} cau</span>
                <span className="lms-row"><Clock size={14} /> {template.duration_minutes} phut</span>
                <span>{getDifficultyLabel(template.difficulty)}</span>
            </div>

            <div className="lms-row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
                <span className="lms-note">{template.times_taken} luot lam</span>
                <button onClick={onStart} disabled={isLoading} className="lms-button">
                    {isLoading ? <Loader2 size={16} /> : <Play size={16} />}
                    <span>Lam bai</span>
                </button>
            </div>
        </article>
    );
}

function AttemptCard({
    attempt,
    onClick,
}: {
    attempt: ExamAttempt;
    onClick: () => void;
}) {
    return (
        <button onClick={onClick} className="lms-card" style={{ textAlign: 'left' }}>
            <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                <div>
                    <div className="lms-card-title">{attempt.title || 'De thi'}</div>
                    <div className="lms-card-subtitle">
                        {attempt.status === 'submitted'
                            ? `${attempt.correct_count}/${attempt.total_questions} cau`
                            : 'Dang lam...'}
                    </div>
                    <div className="lms-note">{new Date(attempt.started_at).toLocaleDateString('vi-VN')}</div>
                </div>
                <ChevronRight size={18} />
            </div>
        </button>
    );
}

function QuickFilter({
    grade,
    setGrade,
    examType,
    setExamType,
}: {
    grade: string;
    setGrade: (v: string) => void;
    examType: string;
    setExamType: (v: string) => void;
}) {
    return (
        <div className="lms-row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <div className="lms-row">
                {['', '10', '11', '12'].map((g) => (
                    <button
                        key={g}
                        onClick={() => setGrade(g)}
                        className={grade === g ? 'lms-button' : 'lms-button-secondary'}
                    >
                        {g || 'Tat ca'}
                    </button>
                ))}
            </div>

            <div className="lms-row">
                {[
                    { value: '', label: 'Tat ca' },
                    { value: '15min', label: '15 phut' },
                    { value: 'midterm', label: 'Giua ki' },
                    { value: 'final', label: 'Cuoi ki' },
                    { value: 'thpt', label: 'THPT 2025' },
                ].map((t) => (
                    <button
                        key={t.value}
                        onClick={() => setExamType(t.value)}
                        className={examType === t.value ? 'lms-button' : 'lms-button-secondary'}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function ExamPage() {
    const navigate = useNavigate();
    const { token } = useAuthStore();
    const isAuthenticated = Boolean(token);

    const [templates, setTemplates] = useState<ExamTemplate[]>([]);
    const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [startingExam, setStartingExam] = useState<string | null>(null);

    const [grade, setGrade] = useState('');
    const [examType, setExamType] = useState('');

    const [showAIModal, setShowAIModal] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [aiParams, setAiParams] = useState<Partial<AIGenerateParams>>({
        grade: '10',
        exam_type: 'midterm',
        difficulty: 'medium',
    });

    const [previewData, setPreviewData] = useState<AIGenerateResponse | null>(null);
    const [savingTemplate, setSavingTemplate] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, [grade, examType]);

    useEffect(() => {
        if (isAuthenticated) loadAttempts();
    }, [isAuthenticated]);

    async function loadTemplates() {
        try {
            setLoading(true);
            const data = await getExamTemplates({
                grade: grade || undefined,
                type: examType || undefined,
                limit: 20,
            });
            setTemplates(data.templates);
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setLoading(false);
        }
    }

    async function loadAttempts() {
        try {
            const data = await getExamAttempts({ limit: 5 });
            setAttempts(data.attempts);
        } catch (error) {
            console.error('Failed to load attempts:', error);
        }
    }

    async function handleStartExam(templateId: string) {
        if (!isAuthenticated) {
            navigate('/login?redirect=/exam');
            return;
        }
        try {
            setStartingExam(templateId);
            const data = await startExamAttempt(templateId);
            navigate(`/exam/attempt/${data.attempt.id}`, {
                state: { attempt: data.attempt, questions: data.questions },
            });
        } catch (error) {
            console.error('Failed to start exam:', error);
            alert('Khong the bat dau lam bai. Vui long thu lai.');
        } finally {
            setStartingExam(null);
        }
    }

    async function handleGenerateAI() {
        if (!isAuthenticated) {
            navigate('/login?redirect=/exam');
            return;
        }
        if (!aiParams.grade || !aiParams.exam_type || !aiParams.difficulty) {
            alert('Vui long chon du thong tin');
            return;
        }
        try {
            setGenerating(true);
            const result = await generateExamWithAI({ ...aiParams, save: false } as AIGenerateParams);
            setPreviewData(result);
            setShowAIModal(false);
        } catch (error: any) {
            console.error('AI Gen Error:', error);
            alert(`Loi tao de thi: ${error.message || JSON.stringify(error)}`);
        } finally {
            setGenerating(false);
        }
    }

    async function handleSaveTemplate() {
        if (!previewData) return;
        try {
            setSavingTemplate(true);
            await createExamTemplate({
                grade: aiParams.grade!,
                branch: aiParams.branch,
                exam_type: aiParams.exam_type!,
                title: previewData.template.title,
                questions: previewData.questions,
                duration_minutes: previewData.template.duration_minutes,
                difficulty: aiParams.difficulty,
            });
            setPreviewData(null);
            loadTemplates();
            alert('Da luu de thi thanh cong!');
        } catch (error: any) {
            alert(error.message || 'Loi luu de thi');
        } finally {
            setSavingTemplate(false);
        }
    }

    const hasNoTemplates = !loading && templates.length === 0;

    return (
        <div className="lms-page">
            <section className="lms-card">
                <div className="lms-card-header">
                    <div>
                        <h1 className="lms-card-title">Thi Online</h1>
                        <p className="lms-card-subtitle">On tap va lam bai thi theo chuong trinh</p>
                    </div>
                    {isAuthenticated && (
                        <button onClick={() => setShowAIModal(true)} className="lms-button">
                            <Sparkles size={16} />
                            <span>Tao de AI</span>
                        </button>
                    )}
                </div>

                <QuickFilter
                    grade={grade}
                    setGrade={setGrade}
                    examType={examType}
                    setExamType={setExamType}
                />
            </section>

            <div className="lms-grid lms-grid-2">
                <section className="lms-section">
                    <div className="lms-card">
                        <div className="lms-card-header">
                            <div className="lms-card-title">De thi co san</div>
                        </div>

                        {loading ? (
                            <div className="lms-empty">
                                <div className="lms-spinner" />
                                <p className="lms-note">Dang tai danh sach</p>
                            </div>
                        ) : hasNoTemplates ? (
                            <div className="lms-empty">
                                <BookOpen size={28} />
                                <p className="lms-note">Chua co de thi</p>
                                {isAuthenticated && (
                                    <button onClick={() => setShowAIModal(true)} className="lms-button">
                                        <Sparkles size={16} />
                                        <span>Tao de AI</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="lms-grid">
                                {templates.map((template) => (
                                    <ExamCard
                                        key={template.id}
                                        template={template}
                                        onStart={() => handleStartExam(template.id)}
                                        isLoading={startingExam === template.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section className="lms-section">
                    <div className="lms-card">
                        <div className="lms-card-header">
                            <div className="lms-card-title">Lich su lam bai</div>
                        </div>

                        {!isAuthenticated ? (
                            <div className="lms-empty">
                                <History size={24} />
                                <p className="lms-note">Dang nhap de xem lich su</p>
                                <button onClick={() => navigate('/login')} className="lms-button-secondary">
                                    Dang nhap
                                </button>
                            </div>
                        ) : attempts.length === 0 ? (
                            <div className="lms-empty">
                                <History size={24} />
                                <p className="lms-note">Chua co bai thi</p>
                            </div>
                        ) : (
                            <div className="lms-grid">
                                {attempts.map((attempt) => (
                                    <AttemptCard
                                        key={attempt.id}
                                        attempt={attempt}
                                        onClick={() => navigate(`/exam/attempt/${attempt.id}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {showAIModal && (
                <div className="lms-modal">
                    <div className="lms-modal-panel">
                        <div className="lms-modal-header">
                            <div className="lms-card-title">Tao de thi bang AI</div>
                            <button onClick={() => setShowAIModal(false)} className="lms-button-ghost">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="lms-modal-body lms-form">
                            <div className="lms-section">
                                <label className="lms-label">Lop</label>
                                <div className="lms-row">
                                    {(['10', '11', '12'] as const).map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setAiParams(p => ({ ...p, grade: g, branch: undefined }))}
                                            className={aiParams.grade === g ? 'lms-button' : 'lms-button-secondary'}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {aiParams.grade && (
                                <div className="lms-section">
                                    <label className="lms-label">Dinh huong</label>
                                    <div className="lms-row">
                                        <button
                                            onClick={() => setAiParams(p => ({ ...p, branch: 'cong_nghiep' }))}
                                            className={aiParams.branch === 'cong_nghiep' ? 'lms-button' : 'lms-button-secondary'}
                                        >
                                            {aiParams.grade === '10' ? 'Cong nghiep' : aiParams.grade === '11' ? 'Co khi' : 'Dien - Dien tu'}
                                        </button>
                                        <button
                                            onClick={() => setAiParams(p => ({ ...p, branch: 'nong_nghiep' }))}
                                            className={aiParams.branch === 'nong_nghiep' ? 'lms-button' : 'lms-button-secondary'}
                                        >
                                            {aiParams.grade === '10' ? 'Nong nghiep' : aiParams.grade === '11' ? 'Chan nuoi' : 'Lam - Thuy san'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="lms-section">
                                <label className="lms-label">Loai de</label>
                                <select
                                    value={aiParams.exam_type}
                                    onChange={(e) => setAiParams(p => ({ ...p, exam_type: e.target.value as any }))}
                                    className="lms-select"
                                >
                                    <option value="15min">Kiem tra 15 phut (10 cau)</option>
                                    <option value="midterm">Giua ki (21 cau)</option>
                                    <option value="final">Cuoi ki (26 cau)</option>
                                    <option value="thpt">THPT 2025 (28 cau)</option>
                                </select>
                            </div>

                            <div className="lms-section">
                                <label className="lms-label">Do kho</label>
                                <div className="lms-row">
                                    {([
                                        { value: 'easy', label: 'De' },
                                        { value: 'medium', label: 'Trung binh' },
                                        { value: 'hard', label: 'Kho' },
                                    ] as const).map(d => (
                                        <button
                                            key={d.value}
                                            onClick={() => setAiParams(p => ({ ...p, difficulty: d.value }))}
                                            className={aiParams.difficulty === d.value ? 'lms-button' : 'lms-button-secondary'}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="lms-section">
                                <label className="lms-label">Chu de (tuy chon)</label>
                                <input
                                    type="text"
                                    value={aiParams.topic || ''}
                                    onChange={(e) => setAiParams(p => ({ ...p, topic: e.target.value }))}
                                    placeholder="VD: Mang may tinh, Thuat toan..."
                                    className="lms-input"
                                />
                            </div>
                        </div>

                        <div className="lms-modal-footer">
                            <button onClick={() => setShowAIModal(false)} className="lms-button-secondary">
                                Huy
                            </button>
                            <button onClick={handleGenerateAI} disabled={generating} className="lms-button">
                                {generating ? <Loader2 size={16} /> : <Sparkles size={16} />}
                                <span>Tao de</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {previewData && (
                <div className="lms-modal">
                    <div className="lms-modal-panel">
                        <div className="lms-modal-header">
                            <div>
                                <div className="lms-card-title">Xem truoc de thi</div>
                                <div className="lms-card-subtitle">
                                    {previewData.template.title} - {previewData.template.total_questions} cau
                                </div>
                            </div>
                            <button onClick={() => setPreviewData(null)} className="lms-button-ghost">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="lms-modal-body">
                            <div className="lms-grid">
                                {previewData.questions.map((q, idx) => {
                                    const isTrueFalse = q.type === 'true_false';
                                    const isEssay = q.type === 'essay';
                                    const keywordList = Array.isArray(q.keywords)
                                        ? q.keywords
                                        : typeof q.keywords === 'string'
                                            ? q.keywords.split(/[,:;\n]+/).map((item) => item.trim()).filter(Boolean)
                                            : [];

                                    return (
                                        <article key={q.id} className="lms-card">
                                            <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                                                <span className="lms-pill">Cau {idx + 1}</span>
                                                {isTrueFalse && <span className="lms-badge">D/S</span>}
                                                {isEssay && <span className="lms-badge">Tu luan</span>}
                                            </div>
                                            <p style={{ marginTop: 8 }}>{q.content}</p>

                                            {isEssay ? (
                                                <div className="lms-note">
                                                    Diem: {q.max_points ?? 1}
                                                    {keywordList.length > 0 && (
                                                        <div>Tu khoa: {keywordList.join(', ')}</div>
                                                    )}
                                                    {q.sample_answer && (
                                                        <div>Goi y: {q.sample_answer}</div>
                                                    )}
                                                </div>
                                            ) : isTrueFalse && q.statements ? (
                                                <div className="lms-section">
                                                    {q.statements.map((stmt, stmtIdx) => (
                                                        <div key={stmtIdx} className="lms-row">
                                                            <span className="lms-pill">{Array.isArray(q.answer) && q.answer[stmtIdx] ? 'Dung' : 'Sai'}</span>
                                                            <span>{stmt}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="lms-grid lms-grid-2">
                                                    {q.options?.map((opt, optIdx) => {
                                                        const letter = ['A', 'B', 'C', 'D'][optIdx];
                                                        const isCorrect = q.answer === letter || q.answer === optIdx;
                                                        return (
                                                            <div key={optIdx} className={isCorrect ? 'lms-alert' : 'lms-note'}>
                                                                {letter}. {opt}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {q.explanation && (
                                                <div className="lms-note">Giai thich: {q.explanation}</div>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="lms-modal-footer">
                            <button
                                onClick={() => { setPreviewData(null); setShowAIModal(true); }}
                                className="lms-button-secondary"
                            >
                                Tao lai
                            </button>
                            <button
                                onClick={handleSaveTemplate}
                                disabled={savingTemplate}
                                className="lms-button"
                            >
                                {savingTemplate ? <Loader2 size={16} /> : <span>Luu de thi</span>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
