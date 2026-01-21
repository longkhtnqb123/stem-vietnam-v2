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
        <div className="lms-section">
            <button onClick={onToggle} className="lms-button-ghost">
                <Lightbulb size={16} />
                <span>{isVisible ? 'An goi y' : 'Xem goi y'}</span>
            </button>
            {isVisible && (
                <div className="lms-alert">Goi y: {hint}</div>
            )}
        </div>
    );
}

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
        <div className="lms-card">
            <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                <span className="lms-pill">Cau {index + 1}/{total}</span>
                <span className="lms-note">{question.level}</span>
            </div>

            <div style={{ marginTop: 12 }}>
                <strong>{question.content}</strong>
            </div>

            <div className="lms-section" style={{ marginTop: 12 }}>
                {(question.options || []).map((opt, idx) => {
                    const letter = letters[idx];
                    const isSelected = selectedAnswer === letter;
                    const isCorrectAnswer = letter === question.answer;

                    let optionClass = 'lms-option';
                    if (showAnswer || hasAnswered) {
                        if (isCorrectAnswer) optionClass += ' is-correct';
                        if (isSelected && !isCorrect) optionClass += ' is-wrong';
                    } else if (isSelected) {
                        optionClass += ' is-selected';
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => !showAnswer && onSelectAnswer(letter)}
                            disabled={showAnswer}
                            className={optionClass}
                        >
                            <span>{letter}. {opt}</span>
                            {showAnswer && isCorrectAnswer && (
                                <CheckCircle2 size={16} />
                            )}
                            {showAnswer && isSelected && !isCorrect && (
                                <XCircle size={16} />
                            )}
                        </button>
                    );
                })}
            </div>

            {!hasAnswered && !showAnswer && (
                <HintButton
                    hint={question.explanation}
                    isVisible={showHint}
                    onToggle={onToggleHint}
                />
            )}

            {!showAnswer && !hasAnswered && (
                <button onClick={onShowAnswer} className="lms-button-ghost">
                    <Eye size={16} /> Xem dap an
                </button>
            )}

            {(showAnswer || hasAnswered) && question.explanation && (
                <div className="lms-alert">Giai thich: {question.explanation}</div>
            )}

            {hasAnswered && (
                <div className="lms-note">
                    {isCorrect ? 'Chinh xac' : `Sai, dap an dung la ${question.answer}`}
                </div>
            )}
        </div>
    );
}

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
        { value: '', label: 'Ngau nhien' },
        { value: 'thiet_ke_ky_thuat', label: 'Thiet ke ky thuat' },
        { value: 'co_khi', label: 'Co khi' },
        { value: 'dien_tu', label: 'Dien - Dien tu' },
        { value: 'tin_hoc', label: 'Tin hoc ung dung' },
        { value: 'cong_nghe_thuc_pham', label: 'Cong nghe thuc pham' },
        { value: 'lam_vuon', label: 'Lam vuon' },
    ];

    return (
        <div className="lms-card">
            <div className="lms-card-header">
                <div className="lms-card-title">Chon noi dung on tap</div>
                <Target size={16} />
            </div>

            <div className="lms-grid lms-grid-2">
                <div className="lms-section">
                    <label className="lms-label">Lop</label>
                    <div className="lms-row">
                        {['10', '11', '12'].map(g => (
                            <button
                                key={g}
                                onClick={() => setGrade(g)}
                                className={grade === g ? 'lms-button' : 'lms-button-secondary'}
                            >
                                Lop {g}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="lms-section">
                    <label className="lms-label">Dinh huong</label>
                    <div className="lms-row">
                        <button
                            onClick={() => setBranch('cong_nghiep')}
                            className={branch === 'cong_nghiep' ? 'lms-button' : 'lms-button-secondary'}
                        >
                            Cong nghiep
                        </button>
                        <button
                            onClick={() => setBranch('nong_nghiep')}
                            className={branch === 'nong_nghiep' ? 'lms-button' : 'lms-button-secondary'}
                        >
                            Nong nghiep
                        </button>
                    </div>
                </div>

                <div className="lms-section">
                    <label className="lms-label">Chu de</label>
                    <select
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="lms-select"
                    >
                        {topics.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <button onClick={onStart} disabled={isGenerating} className="lms-button">
                {isGenerating ? <Loader2 size={16} /> : <Sparkles size={16} />}
                <span>Bat dau on tap (10 cau)</span>
            </button>
        </div>
    );
}

export default function PracticePage() {
    const navigate = useNavigate();
    const { token } = useAuthStore();
    const isAuthenticated = Boolean(token);

    const [grade, setGrade] = useState('10');
    const [branch, setBranch] = useState('cong_nghiep');
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const [session, setSession] = useState<PracticeSession | null>(null);
    const [history, setHistory] = useState<PracticeSession[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('practice_history');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch {
                console.error('Failed to parse practice history');
            }
        }
    }, []);

    function saveHistory(sessions: PracticeSession[]) {
        const toSave = sessions.slice(0, 20);
        localStorage.setItem('practice_history', JSON.stringify(toSave));
        setHistory(toSave);
    }

    async function startPractice() {
        if (!isAuthenticated) {
            navigate('/login?redirect=/practice');
            return;
        }

        try {
            setIsGenerating(true);
            const params: AIGenerateParams = {
                grade: grade as '10' | '11' | '12',
                exam_type: '15min',
                difficulty: 'medium',
                branch: branch as 'cong_nghiep' | 'nong_nghiep',
                topic: topic || undefined,
                save: false,
            };

            const result = await generateExamWithAI(params);

            const newSession: PracticeSession = {
                id: `practice_${Date.now()}`,
                questions: result.questions.slice(0, 10),
                answers: {},
                showAnswer: {},
                showHint: {},
                currentIndex: 0,
                completed: false,
                grade,
                topic: topic || 'Ngau nhien',
                created_at: Date.now(),
            };

            setSession(newSession);
        } catch (error: any) {
            alert(error.message || 'Loi tao cau hoi. Vui long thu lai.');
        } finally {
            setIsGenerating(false);
        }
    }

    function selectAnswer(answer: string) {
        if (!session) return;
        const qId = session.questions[session.currentIndex].id;
        setSession(prev => prev ? {
            ...prev,
            answers: { ...prev.answers, [qId]: answer },
            showAnswer: { ...prev.showAnswer, [qId]: true },
        } : null);
    }

    function forceShowAnswer() {
        if (!session) return;
        const qId = session.questions[session.currentIndex].id;
        setSession(prev => prev ? {
            ...prev,
            showAnswer: { ...prev.showAnswer, [qId]: true },
        } : null);
    }

    function toggleHint() {
        if (!session) return;
        const qId = session.questions[session.currentIndex].id;
        setSession(prev => prev ? {
            ...prev,
            showHint: { ...prev.showHint, [qId]: !prev.showHint[qId] },
        } : null);
    }

    function goNext() {
        if (!session || session.currentIndex >= session.questions.length - 1) return;
        setSession(prev => prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : null);
    }

    function goPrev() {
        if (!session || session.currentIndex <= 0) return;
        setSession(prev => prev ? { ...prev, currentIndex: prev.currentIndex - 1 } : null);
    }

    function finishSession() {
        if (!session) return;
        const correctCount = session.questions.reduce((acc, q) => {
            return acc + (session.answers[q.id] === q.answer ? 1 : 0);
        }, 0);
        const score = (correctCount / session.questions.length) * 10;

        const completedSession: PracticeSession = {
            ...session,
            completed: true,
            score,
        };

        saveHistory([completedSession, ...history]);
        setSession(null);
    }

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

    const currentQ = session?.questions[session.currentIndex];
    const currentQId = currentQ?.id || '';
    const answeredCount = session ? Object.keys(session.answers).length : 0;

    return (
        <div className="lms-page">
            <section className="lms-card">
                <div className="lms-card-header">
                    <div>
                        <div className="lms-card-title">On tap</div>
                        <div className="lms-card-subtitle">Luyen tap nhanh voi AI</div>
                    </div>
                    <BookOpen size={18} />
                </div>
            </section>

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

                    {history.length > 0 && (
                        <div className="lms-card">
                            <div className="lms-card-header">
                                <div className="lms-card-title">Lich su on tap</div>
                                <History size={16} />
                            </div>
                            <div className="lms-grid">
                                {history.slice(0, 5).map((h) => (
                                    <div key={h.id} className="lms-card">
                                        <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                                            <div>
                                                <strong>Lop {h.grade} - {h.topic}</strong>
                                                <div className="lms-note">
                                                    {new Date(h.created_at).toLocaleDateString('vi-VN')}
                                                </div>
                                            </div>
                                            <span className="lms-pill">{h.score?.toFixed(1) || '--'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {session && currentQ && (
                <>
                    <div className="lms-card">
                        <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                            <span className="lms-note">Da lam: {answeredCount}/{session.questions.length} cau</span>
                            <span className="lms-note">Lop {session.grade} - {session.topic}</span>
                        </div>
                    </div>

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

                    <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                        <button
                            onClick={goPrev}
                            disabled={session.currentIndex === 0}
                            className="lms-button-secondary"
                        >
                            <ChevronLeft size={16} /> Cau truoc
                        </button>

                        {session.currentIndex < session.questions.length - 1 ? (
                            <button onClick={goNext} className="lms-button">
                                Cau sau <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button onClick={finishSession} className="lms-button">
                                <CheckCircle2 size={16} /> Hoan thanh
                            </button>
                        )}
                    </div>

                    <div className="lms-row" style={{ justifyContent: 'center' }}>
                        <button onClick={restartSession} className="lms-button-ghost">
                            <RefreshCw size={16} /> Lam lai
                        </button>
                        <button onClick={() => setSession(null)} className="lms-button-ghost">
                            Thoat
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
