import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
        <div className="lms-quiz-nav">
            {questions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.id]);
                const isFlagged = flagged.has(q.id);
                const isCurrent = idx === currentIndex;
                return (
                    <button
                        key={q.id}
                        onClick={() => onSelect(idx)}
                        className={`${isCurrent ? 'is-current' : ''} ${!isCurrent && isAnswered ? 'is-answered' : ''}`}
                    >
                        {idx + 1}
                        {isFlagged && <span> *</span>}
                    </button>
                );
            })}
        </div>
    );
}

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

    const handleTrueFalseToggle = (stmtIdx: number, value: boolean) => {
        const current = Array.isArray(selectedAnswer) ? [...selectedAnswer] : [false, false, false, false];
        current[stmtIdx] = value;
        onSelectAnswer(current);
    };

    return (
        <div className="lms-card">
            <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                <div className="lms-row">
                    <span className="lms-pill">Câu {index + 1}/{total}</span>
                    {isTrueFalse && <span className="lms-badge">Đ/S</span>}
                    {isEssay && <span className="lms-badge">Tự luận</span>}
                </div>
                <button className="lms-button-ghost" onClick={onToggleFlag}>
                    {isFlagged ? 'Bỏ đánh dấu' : 'Đánh dấu'}
                </button>
            </div>

            <div style={{ marginTop: 12 }}>
                <p>{question.content}</p>
            </div>

            {isEssay ? (
                <div className="lms-section" style={{ marginTop: 16 }}>
                    <textarea
                        value={typeof selectedAnswer === 'string' ? selectedAnswer : ''}
                        onChange={(e) => !showResult && onSelectAnswer(e.target.value)}
                        disabled={showResult}
                        placeholder="Nhập câu trả lời của bạn"
                        className="lms-textarea"
                    />

                    {showResult && (
                        <div className="lms-card" style={{ marginTop: 12 }}>
                            <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                                <span className="lms-note">Điểm</span>
                                <strong>{(question.essayScore ?? 0).toFixed(2)}/{question.max_points ?? 1}</strong>
                            </div>
                            {question.matchedKeywords && question.matchedKeywords.length > 0 && (
                                <p className="lms-note">Từ khóa: {question.matchedKeywords.join(', ')}</p>
                            )}
                            {question.sample_answer && (
                                <p className="lms-note">Gợi ý: {question.sample_answer}</p>
                            )}
                        </div>
                    )}
                </div>
            ) : isTrueFalse && question.statements ? (
                <div className="lms-section" style={{ marginTop: 16 }}>
                    {question.statements.map((stmt, stmtIdx) => {
                        const userValue = Array.isArray(selectedAnswer) ? selectedAnswer[stmtIdx] : undefined;
                        const correctValue = showResult && Array.isArray(question.answer) ? question.answer[stmtIdx] : undefined;
                        const isCorrect = showResult && userValue === correctValue;
                        const isWrong = showResult && userValue !== undefined && userValue !== correctValue;

                        return (
                            <div key={stmtIdx} className="lms-card" style={{ padding: 12 }}>
                                <p>{stmt}</p>
                                <div className="lms-row" style={{ marginTop: 8 }}>
                                    <button
                                        onClick={() => !showResult && handleTrueFalseToggle(stmtIdx, true)}
                                        disabled={showResult}
                                        className={userValue === true ? 'lms-button' : 'lms-button-secondary'}
                                    >
                                        Đúng
                                    </button>
                                    <button
                                        onClick={() => !showResult && handleTrueFalseToggle(stmtIdx, false)}
                                        disabled={showResult}
                                        className={userValue === false ? 'lms-button' : 'lms-button-secondary'}
                                    >
                                        Sai
                                    </button>
                                    {showResult && (
                                        <span className="lms-note">
                                            {isCorrect ? 'Đúng' : isWrong ? `Đáp án: ${correctValue ? 'Đúng' : 'Sai'}` : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="lms-section" style={{ marginTop: 16 }}>
                    {optionLetters.map((opt, idx) => {
                        const isSelected = selectedAnswer === opt;
                        const optionText = question.options?.[idx] || '';

                        let optionClass = 'lms-option';
                        if (isSelected) optionClass += ' is-selected';
                        if (showResult) {
                            const isCorrectAnswer = question.answer === opt || question.answer === idx;
                            const userWrong = isSelected && !isCorrectAnswer;
                            if (isCorrectAnswer) optionClass += ' is-correct';
                            if (userWrong) optionClass += ' is-wrong';
                        }

                        return (
                            <button
                                key={opt}
                                onClick={() => !showResult && onSelectAnswer(opt)}
                                disabled={showResult}
                                className={optionClass}
                            >
                                <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                                    <span>{opt}. {optionText}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {showResult && question.explanation && (
                <div className="lms-alert" style={{ marginTop: 16 }}>
                    <strong>Giải thích:</strong> {question.explanation}
                </div>
            )}
        </div>
    );
}

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
        <div className="lms-modal">
            <div className="lms-modal-panel" style={{ maxWidth: 520 }}>
                <div className="lms-modal-header">
                    <div className="lms-card-title">Xác nhận nộp bài</div>
                </div>
                <div className="lms-modal-body lms-section">
                    <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                        <span className="lms-note">Đã làm</span>
                        <strong>{answeredCount}/{totalCount}</strong>
                    </div>
                    {unanswered > 0 && (
                        <div className="lms-alert">
                            Còn {unanswered} câu chưa trả lời
                        </div>
                    )}
                    {flaggedCount > 0 && (
                        <div className="lms-note">{flaggedCount} câu đang đánh dấu</div>
                    )}
                </div>
                <div className="lms-modal-footer">
                    <button onClick={onCancel} disabled={isSubmitting} className="lms-button-secondary">
                        Làm tiếp
                    </button>
                    <button onClick={onConfirm} disabled={isSubmitting} className="lms-button">
                        {isSubmitting ? <div className="lms-spinner" /> : null}
                        <span>Nộp bài</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ExamTakingPage() {
    const navigate = useNavigate();
    const { attemptId } = useParams<{ attemptId: string }>();
    const location = useLocation();

    const [attempt, setAttempt] = useState<ExamAttempt | null>(location.state?.attempt || null);
    const [questions, setQuestions] = useState<ExamQuestion[]>(location.state?.questions || []);
    const [loading, setLoading] = useState(!location.state);

    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [flagged, setFlagged] = useState<Set<string>>(new Set());
    const [currentIndex, setCurrentIndex] = useState(0);

    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<SubmitResult['result'] | null>(null);

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
                setQuestions(data.questions);
                setAnswers(data.answers || {});
            }
        } catch (error) {
            console.error('Failed to load attempt:', error);
            navigate('/exam');
        } finally {
            setLoading(false);
        }
    }

    const timer = useExamTimer({
        durationMinutes: attempt?.duration_minutes || 45,
        startedAt: attempt?.started_at || Date.now(),
        onTimeUp: () => handleSubmit(true),
        autoSubmit: true,
    });

    const handleAutoSave = useCallback(async (ans: Record<string, string>) => {
        if (attemptId && !result) {
            await saveAttemptProgress(attemptId, ans);
        }
    }, [attemptId, result]);

    useAutoSave({
        attemptId: attemptId || '',
        answers,
        saveInterval: 30000,
        onSave: handleAutoSave,
    });

    function handleSelectAnswer(answer: string | boolean[]) {
        if (result) return;

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
            const submitData = await submitExamAttempt(attemptId, answers);
            setResult(submitData.result);
            setQuestions(submitData.result.questions_with_answers);
        } catch (error) {
            console.error('Failed to submit attempt:', error);
        } finally {
            setIsSubmitting(false);
            setShowSubmitModal(false);
        }
    }

    const currentQuestion = questions[currentIndex];
    const answeredCount = Object.keys(answers).length;

    if (loading) {
        return (
            <div className="lms-page">
                <div className="lms-empty">
                    <div className="lms-spinner" />
                    <p className="lms-note">Đang tải bài thi...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="lms-page">
            <div className="lms-card">
                <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                    <div>
                        <div className="lms-card-title">{attempt?.title || 'Làm bài thi'}</div>
                        <div className="lms-note">{attempt?.total_questions} câu - {attempt?.duration_minutes} phút</div>
                    </div>
                    <div className="lms-row">
                        {!result && (
                            <div className="lms-pill">
                                {timer.formattedTime}
                            </div>
                        )}
                        {result && (
                            <div className="lms-pill">Điểm: {result.score.toFixed(1)}/10</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="lms-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
                <section className="lms-section">
                    {currentQuestion && (
                        <QuestionDisplay
                            question={currentQuestion}
                            index={currentIndex}
                            total={questions.length}
                            selectedAnswer={(() => {
                                const storedAnswer = answers[currentQuestion.id] || currentQuestion.userAnswer;
                                if (!storedAnswer) return currentQuestion.type === 'true_false' ? [] : '';
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

                    <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                        <button onClick={handlePrev} disabled={currentIndex === 0} className="lms-button-secondary">
                            Câu trước
                        </button>
                        {currentIndex === questions.length - 1 && !result ? (
                            <button onClick={() => handleSubmit()} className="lms-button">
                                Nộp bài
                            </button>
                        ) : (
                            <button onClick={handleNext} disabled={currentIndex === questions.length - 1} className="lms-button">
                                Câu sau
                            </button>
                        )}
                    </div>
                </section>

                <aside className="lms-section">
                    <div className="lms-card">
                        <div className="lms-card-title">Danh sách câu</div>
                        <QuestionNav
                            questions={questions}
                            answers={answers}
                            flagged={flagged}
                            currentIndex={currentIndex}
                            onSelect={setCurrentIndex}
                        />
                        <div className="lms-note" style={{ marginTop: 8 }}>
                            Đã làm: {answeredCount}/{questions.length}
                        </div>
                    </div>

                    {result && (
                        <div className="lms-card">
                            <div className="lms-card-title">Kết quả</div>
                            <div className="lms-section">
                                <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                                    <span className="lms-note">Điểm</span>
                                    <strong>{result.score.toFixed(1)}/10</strong>
                                </div>
                                <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                                    <span className="lms-note">Đúng</span>
                                    <strong>{result.correct_count}/{result.total_questions}</strong>
                                </div>
                                <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                                    <span className="lms-note">Thời gian</span>
                                    <strong>{formatTime(result.time_spent_seconds)}</strong>
                                </div>
                            </div>
                            <button onClick={() => navigate('/exam')} className="lms-button-secondary">
                                Về trang chủ
                            </button>
                        </div>
                    )}

                    {!result && (
                        <button onClick={() => handleSubmit()} className="lms-button">
                            Nộp bài ({answeredCount}/{questions.length})
                        </button>
                    )}
                </aside>
            </div>

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
