// Chú thích: Trang Thi Online - Làm bài thi chính thức
// Có tính điểm, giới hạn thời gian, lưu lịch sử

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

// Card đề thi - gọn hơn
function ExamCard({
    template,
    onStart,
    isLoading,
}: {
    template: ExamTemplate;
    onStart: () => void;
    isLoading?: boolean;
}) {
    const emoji = template.exam_type === 'thpt' ? '🎓' :
        template.exam_type === 'final' ? '📋' :
            template.exam_type === 'midterm' ? '📝' : '⏱️';

    return (
        <div className="glass-panel p-4 hover:shadow-lg transition-all cursor-pointer group hover:scale-[1.02]">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{emoji}</span>
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
                    disabled={isLoading}
                    className="btn-primary text-sm py-2 px-4 flex items-center gap-2 group-hover:scale-105 transition-transform disabled:opacity-50"
                >
                    {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Play size={16} />
                    )}
                    Làm bài
                </button>
            </div>
        </div>
    );
}

// Card lịch sử làm bài
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
                            ? `${attempt.correct_count}/${attempt.total_questions} câu đúng`
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

// Quick Filter Pills
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
        <div className="flex flex-wrap gap-2 mb-6">
            {/* Lớp */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                {['', '10', '11', '12'].map((g) => (
                    <button
                        key={g}
                        onClick={() => setGrade(g)}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${grade === g
                            ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                    >
                        {g || 'Tất cả'}
                    </button>
                ))}
            </div>

            {/* Loại đề */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                {[
                    { value: '', label: 'Tất cả' },
                    { value: '15min', label: '15 phút' },
                    { value: 'midterm', label: 'Giữa kì' },
                    { value: 'final', label: 'Cuối kì' },
                ].map((t) => (
                    <button
                        key={t.value}
                        onClick={() => setExamType(t.value)}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${examType === t.value
                            ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ==================== Main Page ====================

export default function ExamPage() {
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
    const [examType, setExamType] = useState('');

    // AI Generate Modal
    const [showAIModal, setShowAIModal] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [aiParams, setAiParams] = useState<Partial<AIGenerateParams>>({
        grade: '10',
        exam_type: 'midterm',
        difficulty: 'medium',
    });

    // AI Preview
    const [previewData, setPreviewData] = useState<AIGenerateResponse | null>(null);
    const [savingTemplate, setSavingTemplate] = useState(false);

    // Load data
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
            alert('Không thể bắt đầu làm bài. Vui lòng thử lại.');
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
            alert('Vui lòng chọn đủ thông tin');
            return;
        }
        try {
            setGenerating(true);
            const result = await generateExamWithAI({ ...aiParams, save: false } as AIGenerateParams);
            setPreviewData(result);
            setShowAIModal(false);
        } catch (error: any) {
            console.error('AI Gen Error:', error);
            alert(`Lỗi tạo đề thi: ${error.message || JSON.stringify(error)}`);
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
            alert('Đã lưu đề thi thành công!');
        } catch (error: any) {
            alert(error.message || 'Lỗi lưu đề thi');
        } finally {
            setSavingTemplate(false);
        }
    }

    const hasNoTemplates = !loading && templates.length === 0;

    return (
        <div className="max-w-6xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Trophy className="text-primary-500" />
                        Thi Online
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Làm bài thi trắc nghiệm • Tự động chấm điểm • Lưu kết quả
                    </p>
                </div>
                {isAuthenticated && (
                    <button
                        onClick={() => setShowAIModal(true)}
                        className="btn-primary flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                        <Sparkles size={18} />
                        Tạo đề AI
                    </button>
                )}
            </div>

            {/* Quick Filters */}
            <QuickFilter
                grade={grade}
                setGrade={setGrade}
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
                                Chưa có đề thi
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                Tạo đề mới bằng AI để bắt đầu!
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
                                    isLoading={startingExam === template.id}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar: Lịch sử */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <History size={20} className="text-primary-500" />
                        Lịch sử làm bài
                    </h2>

                    {!isAuthenticated ? (
                        <div className="glass-panel p-6 text-center">
                            <History size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-sm text-slate-500 mb-3">
                                Đăng nhập để xem lịch sử
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
                            <p className="text-sm text-slate-500">
                                Bạn chưa làm bài thi nào
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
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
            </div>

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
                                            onClick={() => setAiParams(p => ({ ...p, grade: g, branch: undefined }))}
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

                            {/* Định hướng (GDPT 2018) */}
                            {aiParams.grade && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Định hướng (GDPT 2018)
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setAiParams(p => ({ ...p, branch: 'cong_nghiep' }))}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${aiParams.branch === 'cong_nghiep'
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                }`}
                                        >
                                            {aiParams.grade === '10' ? '🏭 Công nghiệp' :
                                                aiParams.grade === '11' ? '⚙️ Cơ khí' :
                                                    '⚡ Điện - Điện tử'}
                                        </button>
                                        <button
                                            onClick={() => setAiParams(p => ({ ...p, branch: 'nong_nghiep' }))}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${aiParams.branch === 'nong_nghiep'
                                                ? 'bg-green-600 text-white shadow-md'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                }`}
                                        >
                                            {aiParams.grade === '10' ? '🌱 Nông nghiệp' :
                                                aiParams.grade === '11' ? '🐷 Chăn nuôi' :
                                                    '🌲 Lâm - Thủy sản'}
                                        </button>
                                    </div>
                                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                        {aiParams.grade === '10' && 'Chọn định hướng để AI tạo đề phù hợp với sách CN hoặc NN.'}
                                        {aiParams.grade === '11' && 'Lớp 11 chuyên sâu về Cơ khí động lực hoặc Công nghệ chăn nuôi.'}
                                        {aiParams.grade === '12' && 'Lớp 12 với định hướng Điện-Điện tử hoặc Lâm nghiệp-Thủy sản.'}
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
                                        { value: 'medium', label: '🟡 Trung bình' },
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

                            {/* Chủ đề */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Chủ đề (tùy chọn)
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
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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

                        <div className="p-6 space-y-4">
                            {previewData.questions.map((q, idx) => {
                                // Chú thích: Phân biệt loại câu hỏi MCQ và True/False
                                const isTrueFalse = q.type === 'true_false';

                                return (
                                    <div key={q.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                                        <div className="flex items-start gap-3">
                                            {/* Số thứ tự + Badge loại câu */}
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isTrueFalse
                                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                                                    : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                                                    }`}>
                                                    {idx + 1}
                                                </span>
                                                {isTrueFalse && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 font-medium">
                                                        Đ/S
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                {/* Nội dung câu hỏi */}
                                                <p className="text-slate-900 dark:text-white font-medium mb-3">{q.content}</p>

                                                {/* Chú thích: Render khác nhau cho MCQ và True/False */}
                                                {isTrueFalse && q.statements ? (
                                                    // === TRUE/FALSE QUESTION ===
                                                    <div className="space-y-2">
                                                        {q.statements.map((stmt, stmtIdx) => {
                                                            const isCorrect = Array.isArray(q.answer)
                                                                ? q.answer[stmtIdx]
                                                                : false;
                                                            return (
                                                                <div
                                                                    key={stmtIdx}
                                                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isCorrect
                                                                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                                                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                                                        }`}
                                                                >
                                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isCorrect
                                                                        ? 'bg-green-500 text-white'
                                                                        : 'bg-red-500 text-white'
                                                                        }`}>
                                                                        {isCorrect ? 'Đ' : 'S'}
                                                                    </span>
                                                                    <span className="text-slate-700 dark:text-slate-300">{stmt}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    // === MULTIPLE CHOICE QUESTION ===
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {q.options?.map((opt, optIdx) => {
                                                            const letter = ['A', 'B', 'C', 'D'][optIdx];
                                                            const isCorrect = q.answer === letter || q.answer === optIdx;
                                                            return (
                                                                <div
                                                                    key={optIdx}
                                                                    className={`px-3 py-2 rounded-lg text-sm ${isCorrect
                                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300'
                                                                        : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300'
                                                                        }`}
                                                                >
                                                                    <span className="font-medium">{letter}.</span> {opt}
                                                                    {isCorrect && <span className="ml-2">✓</span>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Hiển thị explanation nếu có */}
                                                {q.explanation && (
                                                    <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                                                        💡 {q.explanation}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="sticky bottom-0 bg-white dark:bg-slate-800 p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                            <button
                                onClick={() => { setPreviewData(null); setShowAIModal(true); }}
                                className="flex-1 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50"
                            >
                                🔄 Tạo lại
                            </button>
                            <button
                                onClick={handleSaveTemplate}
                                disabled={savingTemplate}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium flex items-center justify-center gap-2"
                            >
                                {savingTemplate ? <Loader2 className="animate-spin" size={18} /> : '✅'} Lưu đề thi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
