// Chú thích: Trang Thi Online - Entry point chính
// Bao gồm: chọn đề, làm bài, kết quả, lịch sử

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

// ==================== Components ====================

// Card đề thi
function ExamCard({
    template,
    onStart,
}: {
    template: ExamTemplate;
    onStart: () => void;
}) {
    return (
        <div className="glass-panel p-4 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">
                        {template.exam_type === 'thpt' ? '🎓' :
                            template.exam_type === 'final' ? '📋' :
                                template.exam_type === 'midterm' ? '📝' : '⏱️'}
                    </span>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                            {template.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Lớp {template.grade}
                            {template.branch && ` • ${template.branch === 'cong_nghiep' ? 'Công nghiệp' : 'Nông nghiệp'}`}
                        </p>
                    </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                    {getExamTypeLabel(template.exam_type)}
                </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-4">
                <span className="flex items-center gap-1">
                    <BookOpen size={14} />
                    {template.total_questions} câu
                </span>
                <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {template.duration_minutes} phút
                </span>
                <span>{getDifficultyLabel(template.difficulty)}</span>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    {template.times_taken} lượt làm
                </span>
                <button
                    onClick={onStart}
                    className="btn-primary text-sm py-2 px-4 flex items-center gap-2 group-hover:scale-105 transition-transform"
                >
                    <Play size={16} />
                    Làm bài
                </button>
            </div>
        </div>
    );
}

// Card lịch sử
function AttemptCard({
    attempt,
    onClick,
}: {
    attempt: ExamAttempt;
    onClick: () => void;
}) {
    const scoreColor = attempt.score && attempt.score >= 8 ? 'text-green-600' :
        attempt.score && attempt.score >= 5 ? 'text-yellow-600' : 'text-red-600';

    return (
        <div
            onClick={onClick}
            className="glass-panel p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
        >
            <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${attempt.status === 'submitted'
                    ? `bg-slate-100 dark:bg-slate-700 ${scoreColor}`
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                    }`}>
                    {attempt.status === 'submitted'
                        ? attempt.score?.toFixed(1)
                        : '...'
                    }
                </div>
                <div>
                    <h4 className="font-medium text-slate-900 dark:text-white line-clamp-1">
                        {attempt.title || 'Đề thi'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {attempt.status === 'submitted'
                            ? `${attempt.correct_count}/${attempt.total_questions} câu đúng • ${Math.floor((attempt.time_spent_seconds || 0) / 60)} phút`
                            : 'Đang làm...'
                        }
                    </p>
                    <p className="text-xs text-slate-400">
                        {new Date(attempt.started_at).toLocaleDateString('vi-VN')}
                    </p>
                </div>
            </div>
            <ChevronRight className="text-slate-400" />
        </div>
    );
}

// Filter bar
function FilterBar({
    grade,
    setGrade,
    branch,
    setBranch,
    examType,
    setExamType,
}: {
    grade: string;
    setGrade: (v: string) => void;
    branch: string;
    setBranch: (v: string) => void;
    examType: string;
    setExamType: (v: string) => void;
}) {
    return (
        <div className="flex flex-wrap gap-3 mb-6">
            {/* Lớp */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Lớp:</span>
                <div className="flex gap-1">
                    {['', '10', '11', '12'].map((g) => (
                        <button
                            key={g}
                            onClick={() => setGrade(g)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${grade === g
                                ? 'bg-primary-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            {g || 'Tất cả'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Nhánh */}
            {(grade === '11' || grade === '12') && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Nhánh:</span>
                    <div className="flex gap-1">
                        {[
                            { value: '', label: 'Tất cả' },
                            { value: 'cong_nghiep', label: '🏭 CN' },
                            { value: 'nong_nghiep', label: '🌾 NN' },
                        ].map((b) => (
                            <button
                                key={b.value}
                                onClick={() => setBranch(b.value)}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${branch === b.value
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {b.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Loại đề */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Loại:</span>
                <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="input-field py-1.5 text-sm w-36"
                >
                    <option value="">Tất cả</option>
                    <option value="15min">15 phút</option>
                    <option value="midterm">Giữa kì</option>
                    <option value="final">Cuối kì</option>
                    <option value="thpt">THPT QG</option>
                </select>
            </div>
        </div>
    );
}

// ==================== Main Page ====================

export default function ExamOnlinePage() {
    const navigate = useNavigate();
    const { token } = useAuthStore();
    const isAuthenticated = Boolean(token);

    // State
    const [templates, setTemplates] = useState<ExamTemplate[]>([]);
    const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [startingExam, setStartingExam] = useState<string | null>(null);

    // Filters
    const [grade, setGrade] = useState('');
    const [branch, setBranch] = useState('');
    const [examType, setExamType] = useState('');

    // AI Generate Modal
    const [showAIModal, setShowAIModal] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [aiParams, setAiParams] = useState<Partial<AIGenerateParams>>({
        grade: '10',
        exam_type: 'midterm',
        difficulty: 'medium',
    });

    // AI Preview Mode
    const [previewData, setPreviewData] = useState<AIGenerateResponse | null>(null);
    const [savingTemplate, setSavingTemplate] = useState(false);

    // Load templates
    useEffect(() => {
        loadTemplates();
    }, [grade, branch, examType]);

    // Load attempts (nếu đã đăng nhập)
    useEffect(() => {
        if (isAuthenticated) {
            loadAttempts();
        }
    }, [isAuthenticated]);

    async function loadTemplates() {
        try {
            setLoading(true);
            const data = await getExamTemplates({
                grade: grade || undefined,
                branch: branch || undefined,
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
            navigate('/login?redirect=/exam-online');
            return;
        }

        try {
            setStartingExam(templateId);
            const data = await startExamAttempt(templateId);
            // Navigate to exam taking page
            navigate(`/exam-online/attempt/${data.attempt.id}`, {
                state: {
                    attempt: data.attempt,
                    questions: data.questions,
                },
            });
        } catch (error) {
            console.error('Failed to start exam:', error);
            alert('Không thể bắt đầu làm bài. Vui lòng thử lại.');
        } finally {
            setStartingExam(null);
        }
    }

    function handleViewAttempt(attemptId: string) {
        navigate(`/exam-online/attempt/${attemptId}`);
    }

    // Tạo đề bằng AI - Preview mode (không save trước)
    async function handleGenerateAI() {
        if (!isAuthenticated) {
            navigate('/login?redirect=/exam-online');
            return;
        }
        if (!aiParams.grade || !aiParams.exam_type || !aiParams.difficulty) {
            alert('Vui lòng chọn đủ thông tin');
            return;
        }
        try {
            setGenerating(true);
            // Generate nhưng KHÔNG save (save: false)
            const result = await generateExamWithAI({ ...aiParams, save: false } as AIGenerateParams);
            // Hiển thị preview
            setPreviewData(result);
            setShowAIModal(false);
        } catch (error: any) {
            alert(error.message || 'Lỗi tạo đề thi');
        } finally {
            setGenerating(false);
        }
    }

    // Lưu đề sau khi preview
    async function handleSavePreviewTemplate() {
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
            alert('Đã lưu đề thi thành công!');
        } catch (error: any) {
            alert(error.message || 'Lỗi lưu đề thi');
        } finally {
            setSavingTemplate(false);
        }
    }

    // Tạm thời: Nếu chưa có đề, hiển thị thông báo
    const hasNoTemplates = !loading && templates.length === 0;

    return (
        <div className="max-w-6xl mx-auto p-4">
            {/* Header */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Trophy className="text-primary-500" />
                        Thi Trắc Nghiệm Online
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Làm bài thi trắc nghiệm môn Công nghệ THPT • Tự động chấm điểm
                    </p>
                </div>
                {isAuthenticated && (
                    <button
                        onClick={() => setShowAIModal(true)}
                        className="btn-primary flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                        <Sparkles size={18} />
                        Tạo đề bằng AI
                    </button>
                )}
            </div>

            {/* Filters */}
            <FilterBar
                grade={grade}
                setGrade={setGrade}
                branch={branch}
                setBranch={setBranch}
                examType={examType}
                setExamType={setExamType}
            />

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Danh sách đề thi */}
                <div className="lg:col-span-2">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <BookOpen size={20} className="text-primary-500" />
                        Đề thi có sẵn
                    </h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-primary-500" size={32} />
                        </div>
                    ) : hasNoTemplates ? (
                        <div className="glass-panel p-8 text-center">
                            <BookOpen size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                            <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Chưa có đề thi nào
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                Chưa có đề thi nào. Hãy tạo đề mới bằng AI!
                            </p>
                            <button
                                onClick={() => setShowAIModal(true)}
                                className="btn-primary flex items-center gap-2 mx-auto bg-gradient-to-r from-purple-600 to-pink-600"
                            >
                                <Sparkles size={18} />
                                Tạo đề bằng AI
                            </button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {templates.map((template) => (
                                <ExamCard
                                    key={template.id}
                                    template={template}
                                    onStart={() => handleStartExam(template.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Lịch sử làm bài */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <History size={20} className="text-primary-500" />
                        Lịch sử làm bài
                    </h2>

                    {!isAuthenticated ? (
                        <div className="glass-panel p-6 text-center">
                            <History size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                                Đăng nhập để xem lịch sử làm bài
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-primary text-sm"
                            >
                                Đăng nhập
                            </button>
                        </div>
                    ) : attempts.length === 0 ? (
                        <div className="glass-panel p-6 text-center">
                            <History size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Bạn chưa làm bài thi nào
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {attempts.map((attempt) => (
                                <AttemptCard
                                    key={attempt.id}
                                    attempt={attempt}
                                    onClick={() => handleViewAttempt(attempt.id)}
                                />
                            ))}
                            {attempts.length >= 5 && (
                                <button
                                    onClick={() => navigate('/exam-online/history')}
                                    className="w-full text-sm text-primary-600 dark:text-primary-400 py-2 hover:underline"
                                >
                                    Xem tất cả lịch sử →
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Loading overlay khi bắt đầu làm bài */}
            {startingExam && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center shadow-2xl">
                        <Loader2 className="animate-spin text-primary-500 mx-auto mb-4" size={48} />
                        <p className="text-lg font-medium text-slate-900 dark:text-white">
                            Đang tải đề thi...
                        </p>
                    </div>
                </div>
            )}

            {/* AI Generate Modal */}
            {showAIModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="text-purple-500" />
                                Tạo đề bằng AI
                            </h3>
                            <button onClick={() => setShowAIModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Lớp */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Lớp
                                </label>
                                <div className="flex gap-2">
                                    {(['10', '11', '12'] as const).map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setAiParams(p => ({ ...p, grade: g }))}
                                            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${aiParams.grade === g
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Nhánh (lớp 11, 12) */}
                            {(aiParams.grade === '11' || aiParams.grade === '12') && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Nhánh
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setAiParams(p => ({ ...p, branch: 'cong_nghiep' }))}
                                            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${aiParams.branch === 'cong_nghiep'
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                }`}
                                        >
                                            🏭 Công nghiệp
                                        </button>
                                        <button
                                            onClick={() => setAiParams(p => ({ ...p, branch: 'nong_nghiep' }))}
                                            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${aiParams.branch === 'nong_nghiep'
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                }`}
                                        >
                                            🌾 Nông nghiệp
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Loại đề */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Loại đề
                                </label>
                                <select
                                    value={aiParams.exam_type}
                                    onChange={(e) => setAiParams(p => ({ ...p, exam_type: e.target.value as any }))}
                                    className="input-field w-full"
                                >
                                    <option value="15min">Kiểm tra 15 phút (15 câu)</option>
                                    <option value="midterm">Giữa kì (30 câu)</option>
                                    <option value="final">Cuối kì (40 câu)</option>
                                    <option value="thpt">THPT Quốc gia (40 câu)</option>
                                </select>
                            </div>

                            {/* Độ khó */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Độ khó
                                </label>
                                <div className="flex gap-2">
                                    {([
                                        { value: 'easy', label: '🟢 Dễ' },
                                        { value: 'medium', label: '🟡 TB' },
                                        { value: 'hard', label: '🔴 Khó' },
                                    ] as const).map(d => (
                                        <button
                                            key={d.value}
                                            onClick={() => setAiParams(p => ({ ...p, difficulty: d.value }))}
                                            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${aiParams.difficulty === d.value
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                }`}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Chủ đề tùy chọn */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Chủ đề cụ thể (tùy chọn)
                                </label>
                                <input
                                    type="text"
                                    value={aiParams.topic || ''}
                                    onChange={(e) => setAiParams(p => ({ ...p, topic: e.target.value }))}
                                    placeholder="VD: Mạng máy tính, Thuật toán..."
                                    className="input-field w-full"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAIModal(false)}
                                className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleGenerateAI}
                                disabled={generating}
                                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Tạo đề
                                    </>
                                )}
                            </button>
                        </div>

                        <p className="text-xs text-slate-400 text-center mt-4">
                            AI sử dụng RAG từ SGK để tạo đề chuẩn chương trình
                        </p>
                    </div>
                </div>
            )}

            {/* Preview AI Generated Exam Modal */}
            {previewData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        {/* Header */}
                        <div className="sticky top-0 bg-white dark:bg-slate-800 p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="text-purple-500" />
                                    Xem trước đề thi
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    {previewData.template.title} • {previewData.template.total_questions} câu
                                </p>
                            </div>
                            <button onClick={() => setPreviewData(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Questions Preview */}
                        <div className="p-6 space-y-6">
                            {previewData.questions.map((q, idx) => (
                                <div key={q.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-sm font-bold shrink-0">
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-slate-900 dark:text-white font-medium mb-3">
                                                {q.content}
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {q.options.map((opt, optIdx) => {
                                                    const letter = ['A', 'B', 'C', 'D'][optIdx];
                                                    const isCorrect = q.answer === letter;
                                                    return (
                                                        <div
                                                            key={optIdx}
                                                            className={`px-3 py-2 rounded-lg text-sm ${isCorrect
                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
                                                                : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300'
                                                                }`}
                                                        >
                                                            <span className="font-medium">{letter}.</span> {opt}
                                                            {isCorrect && <span className="ml-2">✓</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {q.explanation && (
                                                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 italic">
                                                    💡 {q.explanation}
                                                </p>
                                            )}
                                            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                                                {q.level === 'remember' ? 'Nhận biết' : q.level === 'understand' ? 'Thông hiểu' : q.level === 'apply' ? 'Vận dụng' : 'Phân tích'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer Actions */}
                        <div className="sticky bottom-0 bg-white dark:bg-slate-800 p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                            <button
                                onClick={() => {
                                    setPreviewData(null);
                                    setShowAIModal(true);
                                }}
                                className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                🔄 Tạo lại
                            </button>
                            <button
                                onClick={handleSavePreviewTemplate}
                                disabled={savingTemplate}
                                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {savingTemplate ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        ✅ Lưu đề thi
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
