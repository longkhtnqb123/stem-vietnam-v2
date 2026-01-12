// Chú thích: Trang Ôn Tập - Luyện tập với AI
// Xem đáp án ngay, có nút gợi ý, vẫn lưu lịch sử

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    Lightbulb,
    CheckCircle2,
    XCircle,
    ChevronRight,
    ChevronLeft,
    Loader2,
    Sparkles,
    History,
    RefreshCw,
    Eye,
    Target,
} from 'lucide-react';
import {
    generateExamWithAI,
    type AIGenerateParams,
    type ExamQuestion,
} from '../lib/examOnlineApi';
import { useAuthStore } from '../lib/auth';

// ==================== Types ====================

interface PracticeSession {
    id: string;
    questions: ExamQuestion[];
    answers: Record<string, string>;
    showAnswer: Record<string, boolean>;
    showHint: Record<string, boolean>;
    currentIndex: number;
    completed: boolean;
    score?: number;
    grade: string;
    topic?: string;
    created_at: number;
}

// ==================== Components ====================

// Nút gợi ý (Hint)
function HintButton({
    hint,
    isVisible,
    onToggle,
}: {
    hint?: string;
    isVisible: boolean;
    onToggle: () => void;
}) {
    if (!hint) return null;

    return (
        <div className="mt-3">
            <button
                onClick={onToggle}
                className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors"
            >
                <Lightbulb size={16} />
                {isVisible ? 'Ẩn gợi ý' : 'Xem gợi ý'}
            </button>
            {isVisible && (
                <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                    💡 {hint}
                </div>
            )}
        </div>
    );
}

// Card câu hỏi với đáp án
function QuestionCard({
    question,
    index,
    total,
    selectedAnswer,
    onSelectAnswer,
    showAnswer,
    onShowAnswer,
    showHint,
    onToggleHint,
}: {
    question: ExamQuestion;
    index: number;
    total: number;
    selectedAnswer: string;
    onSelectAnswer: (answer: string) => void;
    showAnswer: boolean;
    onShowAnswer: () => void;
    showHint: boolean;
    onToggleHint: () => void;
}) {
    const letters = ['A', 'B', 'C', 'D'];
    const hasAnswered = Boolean(selectedAnswer);
    const isCorrect = selectedAnswer === question.answer;

    return (
        <div className="glass-panel p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Câu {index + 1}/{total}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${question.level === 'remember' ? 'bg-green-100 text-green-700' :
                    question.level === 'understand' ? 'bg-blue-100 text-blue-700' :
                        question.level === 'apply' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                    }`}>
                    {question.level === 'remember' ? 'Nhận biết' :
                        question.level === 'understand' ? 'Thông hiểu' :
                            question.level === 'apply' ? 'Vận dụng' : 'Phân tích'}
                </span>
            </div>

            {/* Câu hỏi */}
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                {question.content}
            </h3>

            {/* Options */}
            <div className="space-y-2">
                {(question.options || []).map((opt, idx) => {
                    const letter = letters[idx];
                    const isSelected = selectedAnswer === letter;
                    const isCorrectAnswer = letter === question.answer;

                    let optionClass = 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:border-primary-400';

                    if (showAnswer || hasAnswered) {
                        if (isCorrectAnswer) {
                            optionClass = 'bg-green-50 dark:bg-green-900/30 border-green-400 text-green-700 dark:text-green-400';
                        } else if (isSelected && !isCorrect) {
                            optionClass = 'bg-red-50 dark:bg-red-900/30 border-red-400 text-red-700 dark:text-red-400';
                        }
                    } else if (isSelected) {
                        optionClass = 'bg-primary-50 dark:bg-primary-900/30 border-primary-400';
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => !showAnswer && onSelectAnswer(letter)}
                            disabled={showAnswer}
                            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${optionClass}`}
                        >
                            <span className="font-semibold mr-2">{letter}.</span>
                            {opt}
                            {showAnswer && isCorrectAnswer && (
                                <CheckCircle2 size={18} className="inline ml-2 text-green-600" />
                            )}
                            {showAnswer && isSelected && !isCorrect && (
                                <XCircle size={18} className="inline ml-2 text-red-600" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Gợi ý (nếu chưa trả lời) */}
            {!hasAnswered && !showAnswer && (
                <HintButton
                    hint={question.explanation}
                    isVisible={showHint}
                    onToggle={onToggleHint}
                />
            )}

            {/* Nút xem đáp án */}
            {!showAnswer && !hasAnswered && (
                <button
                    onClick={onShowAnswer}
                    className="mt-4 flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                    <Eye size={16} />
                    Xem đáp án
                </button>
            )}

            {/* Giải thích (sau khi xem đáp án) */}
            {(showAnswer || hasAnswered) && question.explanation && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-2">
                        <Lightbulb size={16} />
                        Giải thích
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                        {question.explanation}
                    </p>
                </div>
            )}

            {/* Kết quả sau khi trả lời */}
            {hasAnswered && (
                <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 ${isCorrect
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                    {isCorrect ? (
                        <>
                            <CheckCircle2 size={20} />
                            <span className="font-medium">Chính xác!</span>
                        </>
                    ) : (
                        <>
                            <XCircle size={20} />
                            <span className="font-medium">Sai rồi! Đáp án đúng là {question.answer}</span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// Quick topic selector
function TopicSelector({
    grade,
    setGrade,
    branch,
    setBranch,
    topic,
    setTopic,
    onStart,
    isGenerating,
}: {
    grade: string;
    setGrade: (v: string) => void;
    branch?: string;
    setBranch: (v: string) => void;
    topic: string;
    setTopic: (v: string) => void;
    onStart: () => void;
    isGenerating: boolean;
}) {
    const topics = [
        { value: '', label: 'Ngẫu nhiên (tất cả chủ đề)' },
        { value: 'thiet_ke_ky_thuat', label: '📐 Thiết kế kỹ thuật' },
        { value: 'co_khi', label: '⚙️ Cơ khí' },
        { value: 'dien_tu', label: '💡 Điện - Điện tử' },
        { value: 'tin_hoc', label: '💻 Tin học ứng dụng' },
        { value: 'cong_nghe_thuc_pham', label: '🍎 Công nghệ thực phẩm' },
        { value: 'lam_vuon', label: '🌱 Lâm nghiệp - Làm vườn' },
    ];

    return (
        <div className="glass-panel p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="text-primary-500" />
                Chọn nội dung ôn tập
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
                {/* Lớp */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Lớp
                    </label>
                    <div className="flex gap-2">
                        {['10', '11', '12'].map(g => (
                            <button
                                key={g}
                                onClick={() => setGrade(g)}
                                className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${grade === g
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                    }`}
                            >
                                Lớp {g}
                            </button>
                        ))}
                    </div>

                    {/* Định hướng (GDPT 2018) */}
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Định hướng (GDPT 2018)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setBranch('cong_nghiep')}
                                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${branch === 'cong_nghiep'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {grade === '10' ? '🏭 Công nghiệp' : grade === '11' ? '⚙️ Cơ khí' : '⚡ Điện - Điện tử'}
                            </button>
                            <button
                                onClick={() => setBranch('nong_nghiep')}
                                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${branch === 'nong_nghiep'
                                    ? 'bg-green-600 text-white shadow-md'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {grade === '10' ? '🌱 Nông nghiệp' : grade === '11' ? '🐷 Chăn nuôi' : '🌲 Lâm - Thủy sản'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Chủ đề */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Chủ đề
                    </label>
                    <select
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="input-field w-full h-[42px]" // Match height with buttons
                    >
                        {topics.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-2">
                        *AI sẽ ưu tiên câu hỏi theo định hướng đã chọn.
                    </p>
                </div>
            </div>

            <button
                onClick={onStart}
                disabled={isGenerating}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
                {isGenerating ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        Đang tạo câu hỏi...
                    </>
                ) : (
                    <>
                        <Sparkles size={20} />
                        Bắt đầu ôn tập (10 câu)
                    </>
                )}
            </button>

            <p className="text-xs text-slate-500 text-center mt-3">
                AI sẽ tạo 10 câu hỏi ngẫu nhiên theo chủ đề bạn chọn
            </p>
        </div>
    );
}

// ==================== Main Page ====================

export default function PracticePage() {
    const navigate = useNavigate();
    const { token } = useAuthStore();
    const isAuthenticated = Boolean(token);

    // Config
    const [grade, setGrade] = useState('10');
    const [branch, setBranch] = useState('cong_nghiep'); // Default branch
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Session
    const [session, setSession] = useState<PracticeSession | null>(null);

    // History
    const [history, setHistory] = useState<PracticeSession[]>([]);

    // Load history từ localStorage
    useEffect(() => {
        const saved = localStorage.getItem('practice_history');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse practice history');
            }
        }
    }, []);

    // Lưu history
    function saveHistory(sessions: PracticeSession[]) {
        const toSave = sessions.slice(0, 20); // Giữ 20 session gần nhất
        localStorage.setItem('practice_history', JSON.stringify(toSave));
        setHistory(toSave);
    }

    // Tạo session mới với AI
    async function startPractice() {
        if (!isAuthenticated) {
            navigate('/login?redirect=/practice');
            return;
        }

        try {
            setIsGenerating(true);

            // Tạo 10 câu hỏi với AI
            const params: AIGenerateParams = {
                grade: grade as '10' | '11' | '12',
                exam_type: '15min', // 15 câu nhưng ta chỉ lấy 10
                difficulty: 'medium',
                branch: branch as 'cong_nghiep' | 'nong_nghiep',
                topic: topic || undefined,
                save: false,
            };

            const result = await generateExamWithAI(params);

            // Tạo session mới
            const newSession: PracticeSession = {
                id: `practice_${Date.now()}`,
                questions: result.questions.slice(0, 10), // Lấy 10 câu
                answers: {},
                showAnswer: {},
                showHint: {},
                currentIndex: 0,
                completed: false,
                grade,
                topic: topic || 'Tất cả chủ đề',
                created_at: Date.now(),
            };

            setSession(newSession);
        } catch (error: any) {
            alert(error.message || 'Lỗi tạo câu hỏi. Vui lòng thử lại.');
        } finally {
            setIsGenerating(false);
        }
    }

    // Chọn đáp án
    function selectAnswer(answer: string) {
        if (!session) return;

        const qId = session.questions[session.currentIndex].id;
        setSession(prev => prev ? {
            ...prev,
            answers: { ...prev.answers, [qId]: answer },
            showAnswer: { ...prev.showAnswer, [qId]: true },
        } : null);
    }

    // Xem đáp án (không cần chọn)
    function forceShowAnswer() {
        if (!session) return;

        const qId = session.questions[session.currentIndex].id;
        setSession(prev => prev ? {
            ...prev,
            showAnswer: { ...prev.showAnswer, [qId]: true },
        } : null);
    }

    // Toggle hint
    function toggleHint() {
        if (!session) return;

        const qId = session.questions[session.currentIndex].id;
        setSession(prev => prev ? {
            ...prev,
            showHint: { ...prev.showHint, [qId]: !prev.showHint[qId] },
        } : null);
    }

    // Navigation
    function goNext() {
        if (!session || session.currentIndex >= session.questions.length - 1) return;
        setSession(prev => prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : null);
    }

    function goPrev() {
        if (!session || session.currentIndex <= 0) return;
        setSession(prev => prev ? { ...prev, currentIndex: prev.currentIndex - 1 } : null);
    }

    // Hoàn thành session
    function finishSession() {
        if (!session) return;

        // Tính điểm
        const correctCount = session.questions.reduce((acc, q) => {
            return acc + (session.answers[q.id] === q.answer ? 1 : 0);
        }, 0);
        const score = (correctCount / session.questions.length) * 10;

        const completedSession: PracticeSession = {
            ...session,
            completed: true,
            score,
        };

        // Lưu vào history
        saveHistory([completedSession, ...history]);

        // Reset
        setSession(null);
    }

    // Làm lại session
    function restartSession() {
        if (!session) return;
        setSession({
            ...session,
            answers: {},
            showAnswer: {},
            showHint: {},
            currentIndex: 0,
            completed: false,
            score: undefined,
        });
    }

    // Current question
    const currentQ = session?.questions[session.currentIndex];
    const currentQId = currentQ?.id || '';
    const answeredCount = session ? Object.keys(session.answers).length : 0;

    return (
        <div className="max-w-4xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <BookOpen className="text-primary-500" />
                    Ôn Tập
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Luyện tập với AI • Xem đáp án ngay • Có gợi ý khi cần
                </p>
            </div>

            {/* Chưa có session: Chọn config */}
            {!session && (
                <>
                    <TopicSelector
                        grade={grade}
                        setGrade={setGrade}
                        branch={branch}
                        setBranch={setBranch}
                        topic={topic}
                        setTopic={setTopic}
                        onStart={startPractice}
                        isGenerating={isGenerating}
                    />

                    {/* Lịch sử ôn tập */}
                    {history.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <History className="text-primary-500" />
                                Lịch sử ôn tập
                            </h2>
                            <div className="space-y-3">
                                {history.slice(0, 5).map((h) => (
                                    <div
                                        key={h.id}
                                        className="glass-panel p-4 flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                Lớp {h.grade} • {h.topic}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {new Date(h.created_at).toLocaleDateString('vi-VN')} •
                                                {h.completed ? ` Điểm: ${h.score?.toFixed(1)}/10` : ' Chưa hoàn thành'}
                                            </p>
                                        </div>
                                        <span className={`text-lg font-bold ${(h.score || 0) >= 8 ? 'text-green-600' :
                                            (h.score || 0) >= 5 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                            {h.score?.toFixed(1) || '--'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Đang làm bài */}
            {session && currentQ && (
                <>
                    {/* Progress */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                            <span>Tiến độ: {answeredCount}/{session.questions.length} câu</span>
                            <span>Lớp {session.grade} • {session.topic}</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary-500 to-pink-500 transition-all"
                                style={{ width: `${(answeredCount / session.questions.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Question */}
                    <QuestionCard
                        question={currentQ}
                        index={session.currentIndex}
                        total={session.questions.length}
                        selectedAnswer={session.answers[currentQId] || ''}
                        onSelectAnswer={selectAnswer}
                        showAnswer={session.showAnswer[currentQId] || false}
                        onShowAnswer={forceShowAnswer}
                        showHint={session.showHint[currentQId] || false}
                        onToggleHint={toggleHint}
                    />

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-6">
                        <button
                            onClick={goPrev}
                            disabled={session.currentIndex === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={20} />
                            Câu trước
                        </button>

                        {/* Quick nav dots */}
                        <div className="flex gap-1 flex-wrap justify-center max-w-[200px]">
                            {session.questions.map((q, idx) => (
                                <button
                                    key={q.id}
                                    onClick={() => setSession(prev => prev ? { ...prev, currentIndex: idx } : null)}
                                    className={`w-6 h-6 rounded-full text-xs font-medium transition-colors ${idx === session.currentIndex
                                        ? 'bg-primary-600 text-white'
                                        : session.answers[q.id]
                                            ? session.answers[q.id] === q.answer
                                                ? 'bg-green-500 text-white'
                                                : 'bg-red-500 text-white'
                                            : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>

                        {session.currentIndex < session.questions.length - 1 ? (
                            <button
                                onClick={goNext}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700"
                            >
                                Câu sau
                                <ChevronRight size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={finishSession}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700"
                            >
                                <CheckCircle2 size={20} />
                                Hoàn thành
                            </button>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center gap-4 mt-6">
                        <button
                            onClick={restartSession}
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
                        >
                            <RefreshCw size={16} />
                            Làm lại
                        </button>
                        <button
                            onClick={() => setSession(null)}
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
                        >
                            Thoát
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
