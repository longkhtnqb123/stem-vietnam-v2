// Chú thích: Trang làm bài thi - Timer, Navigation, Submit
// Đây là màn hình chính khi học sinh làm bài

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    Flag,
    Send,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Loader2,
} from 'lucide-react';
import {
    getExamAttempt,
    saveAttemptProgress,
    submitExamAttempt,
    formatTime,
    type ExamQuestion,
    type ExamAttempt,
    type SubmitResult,
} from '../lib/examOnlineApi';
import { useExamTimer, useAutoSave } from '../hooks/useExamTimer';

// ==================== Components ====================

// Navigation grid
function QuestionNav({
    questions,
    answers,
    flagged,
    currentIndex,
    onSelect,
}: {
    questions: ExamQuestion[];
    answers: Record<string, string>;
    flagged: Set<string>;
    currentIndex: number;
    onSelect: (index: number) => void;
}) {
    return (
        <div className="grid grid-cols-10 gap-1">
            {questions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.id]);
                const isFlagged = flagged.has(q.id);
                const isCurrent = idx === currentIndex;

                return (
                    <button
                        key={q.id}
                        onClick={() => onSelect(idx)}
                        className={`
                            h-8 w-8 text-xs font-medium rounded-lg relative transition-all
                            ${isCurrent
                                ? 'bg-primary-600 text-white ring-2 ring-primary-400'
                                : isAnswered
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }
                            hover:scale-105
                        `}
                    >
                        {idx + 1}
                        {isFlagged && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// Question display - Hỗ trợ cả MCQ và True/False
function QuestionDisplay({
    question,
    index,
    total,
    selectedAnswer,
    onSelectAnswer,
    isFlagged,
    onToggleFlag,
    showResult,
}: {
    question: ExamQuestion;
    index: number;
    total: number;
    selectedAnswer: string | boolean[] | undefined;
    onSelectAnswer: (answer: string | boolean[]) => void;
    isFlagged: boolean;
    onToggleFlag: () => void;
    showResult?: boolean;
}) {
    const optionLetters = ['A', 'B', 'C', 'D'];
    const isTrueFalse = question.type === 'true_false';
    const isEssay = question.type === 'essay';

    // Chú thích: Handler cho True/False toggle
    const handleTrueFalseToggle = (stmtIdx: number, value: boolean) => {
        const current = Array.isArray(selectedAnswer) ? [...selectedAnswer] : [false, false, false, false];
        current[stmtIdx] = value;
        onSelectAnswer(current);
    };

    return (
        <div className="glass-panel p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Câu {index + 1}/{total}
                    </span>
                    {isTrueFalse && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 font-medium">
                            Đ/S
                        </span>
                    )}
                    {isEssay && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 font-medium">
                            TL
                        </span>
                    )}
                </div>
                <button
                    onClick={onToggleFlag}
                    className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors ${isFlagged
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                >
                    <Flag size={14} />
                    {isFlagged ? 'Bỏ đánh dấu' : 'Đánh dấu'}
                </button>
            </div>

            {/* Question content */}
            <div className="mb-6">
                <p className="text-lg text-slate-900 dark:text-white leading-relaxed">
                    {question.content}
                </p>
            </div>

            {/* Options - MCQ, True/False, hoac tu luan */}
            {isEssay ? (
                // === ESSAY QUESTION ===
                <div className="space-y-4">
                    <textarea
                        value={typeof selectedAnswer === 'string' ? selectedAnswer : ''}
                        onChange={(e) => !showResult && onSelectAnswer(e.target.value)}
                        disabled={showResult}
                        placeholder="Nhap cau tra loi cua ban..."
                        className="w-full min-h-[140px] p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-400"
                    />

                    {showResult && (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Diem:</span>
                                <span className="font-semibold text-primary-600">
                                    {(question.essayScore ?? 0).toFixed(2)}/{question.max_points ?? 1}
                                </span>
                            </div>
                            {question.matchedKeywords && question.matchedKeywords.length > 0 && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    Tu khoa: {question.matchedKeywords.join(', ')}
                                </p>
                            )}
                            {question.sample_answer && (
                                <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                                    Goi y dap an: {question.sample_answer}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : isTrueFalse && question.statements ? (
                // === TRUE/FALSE QUESTION ===
                <div className="space-y-3">
                    {question.statements.map((stmt, stmtIdx) => {
                        const userValue = Array.isArray(selectedAnswer) ? selectedAnswer[stmtIdx] : undefined;
                        const correctValue = showResult && Array.isArray(question.answer) ? question.answer[stmtIdx] : undefined;
                        const isCorrect = showResult && userValue === correctValue;
                        const isWrong = showResult && userValue !== undefined && userValue !== correctValue;

                        return (
                            <div
                                key={stmtIdx}
                                className={`p-4 rounded-xl border-2 transition-all ${showResult
                                    ? isCorrect
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                        : isWrong
                                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                            : 'border-slate-200 dark:border-slate-700'
                                    : 'border-slate-200 dark:border-slate-700'
                                    }`}
                            >
                                <p className="text-slate-700 dark:text-slate-200 mb-3">{stmt}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => !showResult && handleTrueFalseToggle(stmtIdx, true)}
                                        disabled={showResult}
                                        className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${userValue === true
                                            ? 'bg-green-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                            } ${showResult ? 'cursor-default' : 'hover:bg-green-100'}`}
                                    >
                                        Dung
                                    </button>
                                    <button
                                        onClick={() => !showResult && handleTrueFalseToggle(stmtIdx, false)}
                                        disabled={showResult}
                                        className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${userValue === false
                                            ? 'bg-red-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                            } ${showResult ? 'cursor-default' : 'hover:bg-red-100'}`}
                                    >
                                        Sai
                                    </button>
                                </div>
                                {showResult && (
                                    <div className={`mt-2 text-xs ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                        {isCorrect ? 'Dung' : `Dap an dung: ${correctValue ? 'Dung' : 'Sai'}`}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                // === MULTIPLE CHOICE QUESTION ===
                <div className="space-y-3">
                    {optionLetters.map((opt, idx) => {
                        const isSelected = selectedAnswer === opt;
                        const optionText = question.options?.[idx] || '';

                        // Khi hien thi ket qua
                        let resultStyle = '';
                        if (showResult) {
                            const isCorrectAnswer = question.answer === opt || question.answer === idx;
                            const userWrong = isSelected && !isCorrectAnswer;
                            if (isCorrectAnswer) {
                                resultStyle = 'border-green-500 bg-green-50 dark:bg-green-900/20';
                            } else if (userWrong) {
                                resultStyle = 'border-red-500 bg-red-50 dark:bg-red-900/20';
                            }
                        }

                        return (
                            <button
                                key={opt}
                                onClick={() => !showResult && onSelectAnswer(opt)}
                                disabled={showResult}
                                className={`
                                    w-full p-4 rounded-xl border-2 text-left transition-all
                                    ${resultStyle || (isSelected
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'
                                    )}
                                    ${showResult ? 'cursor-default' : 'cursor-pointer'}
                                `}
                            >
                                <div className="flex items-start gap-3">
                                    <span className={`
                                        w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm
                                        ${isSelected
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                                        }
                                    `}>
                                        {opt}
                                    </span>
                                    <span className="flex-1 text-slate-700 dark:text-slate-200 pt-1">
                                        {optionText}
                                    </span>
                                    {showResult && (question.answer === opt || question.answer === idx) && (
                                        <CheckCircle2 className="text-green-500" size={20} />
                                    )}
                                    {showResult && isSelected && question.answer !== opt && question.answer !== idx && (
                                        <XCircle className="text-red-500" size={20} />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
{/* Giải thích (sau khi nộp) */}
            {showResult && question.explanation && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                        💡 Giải thích
                    </h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                        {question.explanation}
                    </p>
                </div>
            )}
        </div>
    );
}

// Submit confirmation modal
function SubmitModal({
    answeredCount,
    totalCount,
    flaggedCount,
    onConfirm,
    onCancel,
    isSubmitting,
}: {
    answeredCount: number;
    totalCount: number;
    flaggedCount: number;
    onConfirm: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
}) {
    const unanswered = totalCount - answeredCount;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    Xác nhận nộp bài
                </h3>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Đã trả lời:</span>
                        <span className="font-medium text-green-600">{answeredCount}/{totalCount}</span>
                    </div>
                    {unanswered > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <AlertTriangle className="text-yellow-600" size={20} />
                            <span className="text-sm text-yellow-700 dark:text-yellow-300">
                                Còn <strong>{unanswered}</strong> câu chưa trả lời
                            </span>
                        </div>
                    )}
                    {flaggedCount > 0 && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Flag size={16} className="text-yellow-500" />
                            <span>{flaggedCount} câu đã đánh dấu</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Làm tiếp
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="flex-1 py-3 px-4 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Đang nộp...
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                Nộp bài
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==================== Main Page ====================

export default function ExamTakingPage() {
    const navigate = useNavigate();
    const { attemptId } = useParams<{ attemptId: string }>();
    const location = useLocation();

    // State từ navigation hoặc load từ API
    const [attempt, setAttempt] = useState<ExamAttempt | null>(location.state?.attempt || null);
    const [questions, setQuestions] = useState<ExamQuestion[]>(location.state?.questions || []);
    const [loading, setLoading] = useState(!location.state);

    // Câu trả lời
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [flagged, setFlagged] = useState<Set<string>>(new Set());
    const [currentIndex, setCurrentIndex] = useState(0);

    // Submit
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<SubmitResult['result'] | null>(null);

    // Load attempt nếu không có state
    useEffect(() => {
        if (!location.state && attemptId) {
            loadAttempt();
        }
    }, [attemptId, location.state]);

    async function loadAttempt() {
        try {
            setLoading(true);
            const data = await getExamAttempt(attemptId!);
            setAttempt(data.attempt);

            if (data.attempt.status === 'submitted' && data.questions_with_answers) {
                // Đã nộp - hiển thị kết quả
                setQuestions(data.questions_with_answers);
                setResult({
                    score: data.attempt.score || 0,
                    correct_count: data.attempt.correct_count || 0,
                    total_questions: data.attempt.total_questions,
                    time_spent_seconds: data.attempt.time_spent_seconds || 0,
                    analysis: data.attempt.analysis,
                    questions_with_answers: data.questions_with_answers,
                });
            } else if (data.questions) {
                // Đang làm
                setQuestions(data.questions);
                setAnswers(data.answers || {});
            }
        } catch (error) {
            console.error('Failed to load attempt:', error);
            navigate('/exam-online');
        } finally {
            setLoading(false);
        }
    }

    // Timer
    const timer = useExamTimer({
        durationMinutes: attempt?.duration_minutes || 45,
        startedAt: attempt?.started_at || Date.now(),
        onTimeUp: () => handleSubmit(true),
        autoSubmit: true,
    });

    // Auto-save callback
    const handleAutoSave = useCallback(async (ans: Record<string, string>) => {
        if (attemptId && !result) {
            await saveAttemptProgress(attemptId, ans);
        }
    }, [attemptId, result]);

    // Auto-save hook
    useAutoSave({
        attemptId: attemptId || '',
        answers,
        saveInterval: 30000,
        onSave: handleAutoSave,
    });

    // Handlers - Ho tro MCQ, True/False, va tu luan
    function handleSelectAnswer(answer: string | boolean[]) {
        if (result) return; // Da nop roi

        const q = questions[currentIndex];
        if (q.type === 'essay' && typeof answer === 'string') {
            setAnswers(prev => {
                const next = { ...prev };
                if (!answer.trim()) {
                    delete next[q.id];
                } else {
                    next[q.id] = answer;
                }
                return next;
            });
            return;
        }

        // Serialize boolean[] thanh JSON string de luu vao answers
        const answerValue = Array.isArray(answer) ? JSON.stringify(answer) : answer;
        setAnswers(prev => ({
            ...prev,
            [q.id]: answerValue,
        }));
    }

    function handleToggleFlag() {
        const q = questions[currentIndex];
        setFlagged(prev => {
            const next = new Set(prev);
            if (next.has(q.id)) {
                next.delete(q.id);
            } else {
                next.add(q.id);
            }
            return next;
        });
    }

    function handlePrev() {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    }

    function handleNext() {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    }

    async function handleSubmit(autoSubmit = false) {
        if (!attemptId) return;

        if (!autoSubmit && Object.keys(answers).length < questions.length) {
            setShowSubmitModal(true);
            return;
        }

        try {
            setIsSubmitting(true);
            setShowSubmitModal(false);

            const submitResult = await submitExamAttempt(attemptId, answers);
            setResult(submitResult.result);
            setQuestions(submitResult.result.questions_with_answers);
            setCurrentIndex(0);
        } catch (error) {
            console.error('Failed to submit:', error);
            alert('Có lỗi khi nộp bài. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    }

    // Computed
    const currentQuestion = questions[currentIndex];
    const answeredCount = Object.keys(answers).length;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-primary-500" size={48} />
            </div>
        );
    }

    if (!attempt || questions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-slate-500">Không tìm thấy bài thi</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/exam-online')}
                            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                                {attempt.title || 'Đề thi'}
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {attempt.total_questions} câu • {attempt.duration_minutes} phút
                            </p>
                        </div>
                    </div>

                    {/* Timer (chỉ hiển thị khi chưa nộp) */}
                    {!result && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${timer.isWarning
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                            <Clock size={18} />
                            <span className="font-mono font-semibold text-lg">
                                {timer.formattedTime}
                            </span>
                        </div>
                    )}

                    {/* Score (hiển thị khi đã nộp) */}
                    {result && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30">
                            <span className="text-primary-700 dark:text-primary-300 font-bold text-xl">
                                {result.score.toFixed(1)}
                            </span>
                            <span className="text-primary-600 dark:text-primary-400 text-sm">/10</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto p-4">
                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Question */}
                    <div className="lg:col-span-3">
                        {currentQuestion && (
                            <QuestionDisplay
                                question={currentQuestion}
                                index={currentIndex}
                                total={questions.length}
                                selectedAnswer={(() => {
                                    const storedAnswer = answers[currentQuestion.id] || currentQuestion.userAnswer;
                                    if (!storedAnswer) return currentQuestion.type === 'true_false' ? [] : '';
                                    // Chú thích: Parse JSON nếu là True/False answer
                                    if (currentQuestion.type === 'true_false' && typeof storedAnswer === 'string') {
                                        try { return JSON.parse(storedAnswer); } catch { return []; }
                                    }
                                    return storedAnswer;
                                })()}
                                onSelectAnswer={handleSelectAnswer}
                                isFlagged={flagged.has(currentQuestion.id)}
                                onToggleFlag={handleToggleFlag}
                                showResult={Boolean(result)}
                            />
                        )}

                        {/* Navigation buttons */}
                        <div className="flex items-center justify-between mt-4">
                            <button
                                onClick={handlePrev}
                                disabled={currentIndex === 0}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                <ChevronLeft size={18} />
                                Câu trước
                            </button>

                            {currentIndex === questions.length - 1 && !result ? (
                                <button
                                    onClick={() => handleSubmit()}
                                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
                                >
                                    <Send size={18} />
                                    Nộp bài
                                </button>
                            ) : (
                                <button
                                    onClick={handleNext}
                                    disabled={currentIndex === questions.length - 1}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors"
                                >
                                    Câu sau
                                    <ChevronRight size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Navigation grid */}
                        <div className="glass-panel p-4">
                            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                Danh sách câu hỏi
                            </h3>
                            <QuestionNav
                                questions={questions}
                                answers={answers}
                                flagged={flagged}
                                currentIndex={currentIndex}
                                onSelect={setCurrentIndex}
                            />
                            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded bg-green-200" /> Đã trả lời
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded bg-yellow-500" /> Đánh dấu
                                </span>
                            </div>
                        </div>

                        {/* Stats */}
                        {!result && (
                            <div className="glass-panel p-4 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Đã làm:</span>
                                    <span className="font-medium text-green-600">{answeredCount}/{questions.length}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Đánh dấu:</span>
                                    <span className="font-medium text-yellow-600">{flagged.size}</span>
                                </div>
                            </div>
                        )}

                        {/* Result stats */}
                        {result && (
                            <div className="glass-panel p-4 space-y-3">
                                <h3 className="font-medium text-slate-900 dark:text-white">📊 Kết quả</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">Điểm:</span>
                                        <span className="font-bold text-primary-600">{result.score.toFixed(1)}/10</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">Đúng:</span>
                                        <span className="font-medium text-green-600">{result.correct_count}/{result.total_questions}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">Thời gian:</span>
                                        <span>{formatTime(result.time_spent_seconds)}</span>
                                    </div>
                                </div>

                                {result.analysis && (
                                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                                        <h4 className="text-xs font-medium text-slate-500 uppercase">Theo mức độ</h4>
                                        {Object.entries(result.analysis).map(([level, data]) => (
                                            <div key={level} className="flex justify-between text-xs">
                                                <span className="text-slate-600 dark:text-slate-400">
                                                    {level === 'remember' ? 'Nhận biết' :
                                                        level === 'understand' ? 'Thông hiểu' :
                                                            level === 'apply' ? 'Vận dụng' : 'VD cao'}
                                                </span>
                                                <span className={data.correct === data.total ? 'text-green-600' : 'text-slate-700 dark:text-slate-300'}>
                                                    {data.correct}/{data.total}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={() => navigate('/exam-online')}
                                    className="w-full mt-4 btn-primary text-sm"
                                >
                                    Về trang chủ
                                </button>
                            </div>
                        )}

                        {/* Submit button (mobile) */}
                        {!result && (
                            <button
                                onClick={() => handleSubmit()}
                                className="w-full btn-primary flex items-center justify-center gap-2 lg:hidden"
                            >
                                <Send size={18} />
                                Nộp bài ({answeredCount}/{questions.length})
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Submit modal */}
            {showSubmitModal && (
                <SubmitModal
                    answeredCount={answeredCount}
                    totalCount={questions.length}
                    flaggedCount={flagged.size}
                    onConfirm={() => handleSubmit(true)}
                    onCancel={() => setShowSubmitModal(false)}
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    );
}





