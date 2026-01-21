// Chú thích: Exam Online Routes - API cho hệ thống thi trắc nghiệm online
// Bao gồm: quản lý đề thi, làm bài, chấm điểm, lịch sử

import { generateId, JWTPayload } from './auth';
import { SYSTEM_PROMPTS } from './prompts';

// ==================== Types ====================
interface ExamEnv {
    DB: D1Database;
    CORS_ORIGIN: string;
    OPENROUTER_API_KEY: string;
    HF_API_TOKEN: string;
}

// Cấu trúc 1 câu hỏi (hỗ trợ cả MCQ và True/False)
export interface ExamQuestion {
    id: string;
    type?: 'multiple_choice' | 'true_false' | 'essay';  // Loai cau hoi
    content: string;           // Noi dung cau hoi
    options?: string[];        // 4 dap an A, B, C, D (cho MCQ)
    statements?: string[];     // 4 nhan dinh (cho True/False)
    answer?: string | boolean[] | number;  // MCQ/T-F (tu luan co the khong co)
    explanation?: string;      // Giai thich
    level: 'remember' | 'understand' | 'apply' | 'analyze';
    chapter?: string;
    source?: string;
    // Tu luan
    max_points?: number;
    keywords?: string[] | string;
    sample_answer?: string;
    rubric?: string;
}

// Đề thi template
export interface ExamTemplate {
    id: string;
    grade: '10' | '11' | '12';
    branch?: 'cong_nghiep' | 'nong_nghiep';
    exam_type: '15min' | 'midterm' | 'final' | 'thpt';
    title: string;
    description?: string;
    questions: ExamQuestion[];
    total_questions: number;
    duration_minutes: number;
    difficulty: 'easy' | 'medium' | 'hard';
    chapters?: string[];
    publisher?: string;
    created_at: number;
    created_by?: string;
    is_public: boolean;
    times_taken: number;
}

// Lượt làm bài
export interface ExamAttempt {
    id: string;
    user_id: string;
    template_id: string;
    answers: Record<string, unknown>; // {questionId: 'A' | 'B' | 'C' | 'D'}
    score?: number;
    correct_count?: number;
    total_questions: number;
    started_at: number;
    submitted_at?: number;
    time_spent_seconds?: number;
    status: 'in_progress' | 'submitted' | 'reviewed';
    analysis?: {
        remember: { correct: number; total: number };
        understand: { correct: number; total: number };
        apply: { correct: number; total: number };
        analyze: { correct: number; total: number };
    };
}

// Luu mapping cau hoi/option cho attempt (shuffle)
interface AttemptMeta {
    questionOrder?: string[];
    optionOrder?: Record<string, number[]>;
    shuffleMapping?: Record<string, string>;
}
// Chú thích: Câu hỏi Đúng/Sai dạng chùm (THPT 2025)
export interface TrueFalseQuestion {
    id: string;
    type: 'true_false';
    context: string;                    // Ngữ cảnh/tình huống
    statements: {                       // 4 ý nhận định
        text: string;
        isTrue: boolean;
    }[];
    explanation?: string;
    level: 'remember' | 'understand' | 'apply' | 'analyze';
    chapter?: string;
}

// ==================== KNTT EXAM MATRIX (CHUẨN 2025) ====================
// Chú thích: Ma trận đề thi theo bộ Kết nối tri thức và cuộc sống
// Tham khảo: plan12.md (Kế hoạch xây dựng ma trận đề môn Công nghệ)

export const KNTT_EXAM_MATRIX = {
    '15min': {
        mcqCount: 10,
        trueFalseCount: 0,
        essayCount: 0,
        duration: 15,
        levels: { NB: 0.60, TH: 0.40, VD: 0, VDC: 0 }, // 60% NB, 40% TH
    },
    'midterm': {
        mcqCount: 16,
        trueFalseCount: 3,
        essayCount: 2,
        duration: 45,
        levels: { NB: 0.40, TH: 0.30, VD: 0.30, VDC: 0 }, // 40% NB, 30% TH, 30% VD
    },
    'final': {
        mcqCount: 20,
        trueFalseCount: 4,
        essayCount: 2,
        duration: 60,
        levels: { NB: 0.30, TH: 0.40, VD: 0.30, VDC: 0 }, // 30% NB, 40% TH, 30% VD
    },
    'thpt': {
        mcqCount: 24,
        trueFalseCount: 4,
        essayCount: 0,
        duration: 50,
        levels: { NB: 0.40, TH: 0.30, VD: 0.20, VDC: 0.10 }, // 40/30/20/10
    },
} as const;

// ==================== Helper Functions ====================

// Chú thích: jsonResponse với CORS - luôn trả '*' để tránh lỗi CORS
// (Đã fix: trước đây chỉ trả origin[0] dẫn đến lỗi CORS trên production)
function jsonResponse(data: unknown, status: number, _corsOriginList: string): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS, DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
const ESSAY_CORRECT_THRESHOLD = 0.6;

function normalizeText(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeKeywordList(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value
            .filter((item) => typeof item === 'string')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    }
    if (typeof value === 'string') {
        return value
            .split(/[\,\n;]+/)
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    }
    return [];
}

function normalizeShuffleMapping(value: unknown): Record<string, string> {
    const mapping: Record<string, string> = {};
    if (!value || typeof value !== 'object') return mapping;

    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
        if (typeof raw !== 'string') continue;
        const letter = raw.trim().charAt(0).toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(letter)) {
            mapping[key] = letter;
        }
    }

    return mapping;
}

function normalizeOptionOrder(value: unknown): Record<string, number[]> {
    const order: Record<string, number[]> = {};
    if (!value || typeof value !== 'object') return order;

    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
        if (!Array.isArray(raw)) continue;
        const cleaned = raw
            .map((item) => Number(item))
            .filter((item) => Number.isFinite(item) && item >= 0)
            .map((item) => Math.trunc(item));
        if (cleaned.length > 0) {
            const seen = new Set<number>();
            order[key] = cleaned.filter((item) => {
                if (seen.has(item)) return false;
                seen.add(item);
                return true;
            });
        }
    }

    return order;
}

function extractAttemptMeta(raw: Record<string, unknown>): { meta: AttemptMeta; answers: Record<string, string> } {
    const rawMeta = (raw && typeof raw === 'object' ? (raw as any)._meta : undefined) || {};
    const meta: AttemptMeta = {
        questionOrder: Array.isArray(rawMeta.questionOrder)
            ? rawMeta.questionOrder.filter((id: unknown) => typeof id === 'string')
            : undefined,
        optionOrder: normalizeOptionOrder(rawMeta.optionOrder),
        shuffleMapping: normalizeShuffleMapping(rawMeta.shuffleMapping),
    };

    const answers: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
        if (key === '_meta') continue;
        if (typeof value === 'string') {
            answers[key] = value;
        } else if (Array.isArray(value)) {
            answers[key] = JSON.stringify(value);
        } else if (typeof value === 'number' || typeof value === 'boolean') {
            answers[key] = String(value);
        }
    }

    return { meta, answers };
}

function buildAnswersPayload(meta: AttemptMeta, answers: Record<string, string>): Record<string, unknown> {
    return {
        ...answers,
        _meta: {
            questionOrder: meta.questionOrder || [],
            optionOrder: meta.optionOrder || {},
            shuffleMapping: meta.shuffleMapping || {},
        },
    };
}

function applyQuestionOrder(questions: ExamQuestion[], order?: string[]): ExamQuestion[] {
    if (!order || order.length === 0) return questions;
    const byId = new Map(questions.map((q) => [q.id, q]));
    const ordered: ExamQuestion[] = [];

    for (const id of order) {
        const question = byId.get(id);
        if (question) {
            ordered.push(question);
            byId.delete(id);
        }
    }

    return ordered.concat([...byId.values()]);
}

function applyOptionOrder(question: ExamQuestion, optionOrder?: Record<string, number[]>): ExamQuestion {
    if (!question.options || !optionOrder || !optionOrder[question.id]) return question;

    const order = optionOrder[question.id];
    if (!Array.isArray(order) || order.length === 0) return question;

    const used = new Set<number>();
    const reordered: string[] = [];

    for (const idx of order) {
        if (used.has(idx)) continue;
        const option = question.options[idx];
        if (typeof option === 'string') {
            reordered.push(option);
            used.add(idx);
        }
    }

    for (let i = 0; i < question.options.length; i++) {
        if (used.has(i)) continue;
        const option = question.options[i];
        if (typeof option === 'string') reordered.push(option);
    }

    return {
        ...question,
        options: reordered.length > 0 ? reordered : question.options,
    };
}

function normalizeUserAnswer(
    question: ExamQuestion,
    rawAnswer: string | boolean[] | undefined | null
): string | boolean[] | null {
    if (rawAnswer === undefined || rawAnswer === null) return null;

    const questionType = question.type || 'multiple_choice';

    if (questionType === 'true_false') {
        if (Array.isArray(rawAnswer)) return rawAnswer;
        if (typeof rawAnswer === 'string') {
            try {
                const parsed = JSON.parse(rawAnswer);
                return Array.isArray(parsed) ? parsed.map((v) => Boolean(v)) : [];
            } catch {
                return [];
            }
        }
        return [];
    }

    if (questionType === 'essay') {
        return typeof rawAnswer === 'string' ? rawAnswer : String(rawAnswer);
    }

    if (typeof rawAnswer === 'string') {
        const letter = rawAnswer.trim().charAt(0).toUpperCase();
        return ['A', 'B', 'C', 'D'].includes(letter) ? letter : rawAnswer;
    }

    return null;
}

function scoreEssayAnswer(
    question: ExamQuestion,
    rawAnswer: string | null | undefined
): { pointsEarned: number; maxPoints: number; matchedKeywords: string[]; isCorrect: boolean } {
    const maxPoints = typeof question.max_points === 'number' && question.max_points > 0 ? question.max_points : 1;
    const answer = typeof rawAnswer === 'string' ? rawAnswer.trim() : '';
    if (!answer) {
        return { pointsEarned: 0, maxPoints, matchedKeywords: [], isCorrect: false };
    }

    const keywords = normalizeKeywordList(question.keywords);
    if (keywords.length === 0) {
        return { pointsEarned: maxPoints, maxPoints, matchedKeywords: [], isCorrect: true };
    }

    const normalizedAnswer = normalizeText(answer);
    const matchedKeywords = keywords.filter((keyword) => {
        const normalizedKeyword = normalizeText(keyword);
        return normalizedKeyword.length > 0 && normalizedAnswer.includes(normalizedKeyword);
    });

    const ratio = matchedKeywords.length / keywords.length;
    const pointsEarned = Math.round(maxPoints * ratio * 100) / 100;
    return {
        pointsEarned,
        maxPoints,
        matchedKeywords,
        isCorrect: ratio >= ESSAY_CORRECT_THRESHOLD,
    };
}

// Chấm điểm tự động - Hỗ trợ cả MCQ và True/False
function gradeExam(
    questions: ExamQuestion[],
    answers: Record<string, string | boolean[]>
): {
    score: number;
    correct_count: number;
    analysis: ExamAttempt['analysis'];
    detailed_results: Array<{
        questionId: string;
        userAnswer: string | boolean[] | null;
        correctAnswer: string | boolean[] | undefined;
        isCorrect: boolean;
        level: string;
        pointsEarned: number;
        maxPoints: number;
        matchedKeywords?: string[];
        trueFalseCorrect?: number;
        trueFalseTotal?: number;
    }>;
} {
    const analysis = {
        remember: { correct: 0, total: 0 },
        understand: { correct: 0, total: 0 },
        apply: { correct: 0, total: 0 },
        analyze: { correct: 0, total: 0 },
    };

    const detailed_results: Array<{
        questionId: string;
        userAnswer: string | boolean[] | null;
        correctAnswer: string | boolean[] | undefined;
        isCorrect: boolean;
        level: string;
        pointsEarned: number;
        maxPoints: number;
        matchedKeywords?: string[];
        trueFalseCorrect?: number;
        trueFalseTotal?: number;
    }> = [];

    let correct_count = 0;
    let totalPoints = 0;
    let pointsEarnedTotal = 0;

    for (const q of questions) {
        const questionType = q.type || 'multiple_choice';
        const normalizedAnswer = normalizeUserAnswer(q, answers[q.id] as any);
        let isCorrect = false;
        let pointsEarned = 0;
        let maxPoints = questionType === 'essay'
            ? (typeof q.max_points === 'number' && q.max_points > 0 ? q.max_points : 1)
            : 1;
        let matchedKeywords: string[] | undefined;
        let trueFalseCorrect: number | undefined;
        let trueFalseTotal: number | undefined;

        if (questionType === 'essay') {
            const essayResult = scoreEssayAnswer(q, typeof normalizedAnswer === 'string' ? normalizedAnswer : '');
            pointsEarned = essayResult.pointsEarned;
            maxPoints = essayResult.maxPoints;
            matchedKeywords = essayResult.matchedKeywords;
            isCorrect = essayResult.isCorrect;
        } else if (questionType === 'true_false') {
            const userTF = Array.isArray(normalizedAnswer) ? normalizedAnswer : [];
            const correctTF = Array.isArray(q.answer) ? q.answer : [];
            trueFalseTotal = correctTF.length || 4;
            trueFalseCorrect = correctTF.reduce(
                (sum, correct, idx) => sum + (userTF[idx] === correct ? 1 : 0),
                0
            );
            isCorrect = correctTF.length > 0 && trueFalseCorrect === correctTF.length;
            pointsEarned = isCorrect ? maxPoints : 0;
        } else {
            let correctAnswer = '';
            if (typeof q.answer === 'string') {
                const trimmed = q.answer.trim();
                const letter = trimmed.charAt(0).toUpperCase();
                correctAnswer = ['A', 'B', 'C', 'D'].includes(letter) ? letter : trimmed.toUpperCase();
            } else if (typeof q.answer === 'number') {
                correctAnswer = ['A', 'B', 'C', 'D'][q.answer] || '';
            }
            const userMCQ = typeof normalizedAnswer === 'string' ? normalizedAnswer : '';
            isCorrect = userMCQ !== '' && correctAnswer !== '' && userMCQ.toUpperCase() === correctAnswer.toUpperCase();
            pointsEarned = isCorrect ? maxPoints : 0;
        }

        totalPoints += maxPoints;
        pointsEarnedTotal += pointsEarned;

        if (isCorrect) correct_count++;

        if (q.level && analysis[q.level]) {
            analysis[q.level].total++;
            if (isCorrect) analysis[q.level].correct++;
        }

        detailed_results.push({
            questionId: q.id,
            userAnswer: normalizedAnswer ?? null,
            correctAnswer: q.answer,
            isCorrect,
            level: q.level,
            pointsEarned,
            maxPoints,
            matchedKeywords,
            trueFalseCorrect,
            trueFalseTotal,
        });
    }

    const score = totalPoints > 0 ? (pointsEarnedTotal / totalPoints) * 10 : 0;

    return {
        score: Math.round(score * 100) / 100,
        correct_count,
        analysis,
        detailed_results,
    };
}

// ==================== API Handlers ====================

// GET /api/exam-online/templates
// Lấy danh sách đề thi
export async function getTemplates(
    request: Request,
    env: ExamEnv
): Promise<Response> {
    try {
        const url = new URL(request.url);
        const grade = url.searchParams.get('grade');
        const branch = url.searchParams.get('branch');
        const exam_type = url.searchParams.get('type');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        // Build query động
        let query = 'SELECT * FROM exam_templates WHERE is_public = 1';
        const bindings: any[] = [];

        if (grade) {
            query += ' AND grade = ?';
            bindings.push(grade);
        }
        if (branch) {
            query += ' AND (branch = ? OR branch IS NULL)';
            bindings.push(branch);
        }
        if (exam_type) {
            query += ' AND exam_type = ?';
            bindings.push(exam_type);
        }

        query += ' ORDER BY times_taken DESC, created_at DESC LIMIT ? OFFSET ?';
        bindings.push(limit, offset);

        const result = await env.DB.prepare(query).bind(...bindings).all();

        // Parse JSON fields
        const templates = (result.results || []).map((row: any) => ({
            ...row,
            questions: undefined, // Không trả về questions trong list
            chapters: row.chapters ? JSON.parse(row.chapters) : null,
            is_public: row.is_public === 1,
        }));

        return jsonResponse({ templates }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[exam-online] get templates error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// GET /api/exam-online/templates/:id
// Lấy chi tiết 1 đề thi (CHỈ khi bắt đầu làm bài)
export async function getTemplate(
    templateId: string,
    env: ExamEnv
): Promise<Response> {
    try {
        const template = await env.DB.prepare(
            'SELECT * FROM exam_templates WHERE id = ?'
        ).bind(templateId).first();

        if (!template) {
            return jsonResponse({ error: 'Đề thi không tồn tại' }, 404, env.CORS_ORIGIN);
        }

        // Parse JSON fields
        const parsed = {
            ...template,
            questions: JSON.parse(template.questions as string),
            chapters: template.chapters ? JSON.parse(template.chapters as string) : null,
            is_public: template.is_public === 1,
        };

        return jsonResponse({ template: parsed }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[exam-online] get template error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// POST /api/exam-online/templates
// Tạo đề thi mới (từ AI hoặc manual)
export async function createTemplate(
    request: Request,
    user: JWTPayload,
    env: ExamEnv
): Promise<Response> {
    try {
        const body = await request.json() as Partial<ExamTemplate> & { questions: ExamQuestion[] };

        // Validate required fields
        if (!body.grade || !body.exam_type || !body.title || !body.questions || body.questions.length === 0) {
            return jsonResponse({ error: 'Thiếu thông tin bắt buộc (grade, exam_type, title, questions)' }, 400, env.CORS_ORIGIN);
        }

        const id = generateId();
        const now = Date.now();

        // Xác định duration dựa trên exam_type
        const durations: Record<string, number> = {
            '15min': 15,
            'midterm': 45,
            'final': 60,
            'thpt': 50,
        };

        const template = {
            id,
            grade: body.grade,
            branch: body.branch || null,
            exam_type: body.exam_type,
            title: body.title,
            description: body.description || null,
            questions: JSON.stringify(body.questions),
            total_questions: body.questions.length,
            duration_minutes: body.duration_minutes || durations[body.exam_type] || 45,
            difficulty: body.difficulty || 'medium',
            chapters: body.chapters ? JSON.stringify(body.chapters) : null,
            publisher: body.publisher || null,
            created_at: now,
            created_by: user.sub,
            is_public: body.is_public !== false ? 1 : 0,
            times_taken: 0,
        };

        await env.DB.prepare(`
            INSERT INTO exam_templates 
            (id, grade, branch, exam_type, title, description, questions, total_questions, 
             duration_minutes, difficulty, chapters, publisher, created_at, created_by, is_public, times_taken)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            template.id, template.grade, template.branch, template.exam_type,
            template.title, template.description, template.questions, template.total_questions,
            template.duration_minutes, template.difficulty, template.chapters, template.publisher,
            template.created_at, template.created_by, template.is_public, template.times_taken
        ).run();

        return jsonResponse({
            success: true,
            template: {
                id: template.id,
                title: template.title,
                total_questions: template.total_questions,
                duration_minutes: template.duration_minutes
            }
        }, 201, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[exam-online] create template error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// POST /api/exam-online/attempts
// Bắt đầu làm bài
export async function startAttempt(
    request: Request,
    user: JWTPayload,
    env: ExamEnv
): Promise<Response> {
    try {
        const body = await request.json() as { templateId: string };

        if (!body.templateId) {
            return jsonResponse({ error: 'Thiếu templateId' }, 400, env.CORS_ORIGIN);
        }

        // Lấy template
        const template = await env.DB.prepare(
            'SELECT * FROM exam_templates WHERE id = ?'
        ).bind(body.templateId).first();

        if (!template) {
            return jsonResponse({ error: 'Đề thi không tồn tại' }, 404, env.CORS_ORIGIN);
        }

        // Tăng times_taken
        await env.DB.prepare(
            'UPDATE exam_templates SET times_taken = times_taken + 1 WHERE id = ?'
        ).bind(body.templateId).run();

        // Tạo attempt mới
        const attemptId = generateId();
        const now = Date.now();

                const questions: ExamQuestion[] = JSON.parse(template.questions as string);

        // Shuffle cau hoi (bao gom MCQ, D/S, tu luan)
        const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
        const optionOrder: Record<string, number[]> = {};
        const shuffleMapping: Record<string, string> = {};

        const questionsForUser = shuffledQuestions.map((q) => {
            const questionType = q.type || 'multiple_choice';

            if (questionType === 'true_false') {
                return {
                    id: q.id,
                    type: 'true_false',
                    content: q.content,
                    statements: q.statements,
                    level: q.level,
                    chapter: q.chapter,
                };
            }

            if (questionType === 'essay') {
                return {
                    id: q.id,
                    type: 'essay',
                    content: q.content,
                    level: q.level,
                    chapter: q.chapter,
                    max_points: q.max_points ?? 1,
                    rubric: q.rubric,
                };
            }

            const indices = [0, 1, 2, 3];
            const shuffledIndices = [...indices].sort(() => Math.random() - 0.5);
            const shuffledOptions = shuffledIndices
                .map((i) => (q.options || [])[i])
                .filter((opt) => typeof opt === 'string') as string[];

            optionOrder[q.id] = shuffledIndices;

            let answerLetter = 'A';
            if (typeof q.answer === 'number') {
                answerLetter = ['A', 'B', 'C', 'D'][q.answer] || 'A';
            } else if (typeof q.answer === 'string') {
                const firstChar = q.answer.trim().charAt(0).toUpperCase();
                answerLetter = ['A', 'B', 'C', 'D'].includes(firstChar) ? firstChar : 'A';
            }

            const originalAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(answerLetter);
            const newAnswerIndex = shuffledIndices.indexOf(originalAnswerIndex);
            shuffleMapping[q.id] = ['A', 'B', 'C', 'D'][newAnswerIndex] || 'A';

            return {
                id: q.id,
                type: 'multiple_choice',
                content: q.content,
                options: shuffledOptions,
                level: q.level,
                chapter: q.chapter,
            };
        });

        const attemptMeta: AttemptMeta = {
            questionOrder: shuffledQuestions.map((q) => q.id),
            optionOrder,
            shuffleMapping,
        };
        const attemptAnswers = buildAnswersPayload(attemptMeta, {});

        // Luu mapping vao attempt de cham diem dung
        await env.DB.prepare(`
            INSERT INTO exam_attempts 
            (id, user_id, template_id, answers, total_questions, started_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
            attemptId,
            user.sub,
            body.templateId,
            JSON.stringify(attemptAnswers),
            template.total_questions,
            now,
            'in_progress'
        ).run();

        // Tra ve cau hoi (khong co dap an dung)
        return jsonResponse({
            success: true,
            attempt: {
                id: attemptId,
                template_id: body.templateId,
                title: template.title,
                total_questions: template.total_questions,
                duration_minutes: template.duration_minutes,
                started_at: now,
            },
            questions: questionsForUser,
        }, 201, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[exam-online] start attempt error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// PUT /api/exam-online/attempts/:id
// Lưu tiến độ làm bài (auto-save)
export async function updateAttempt(
    attemptId: string,
    request: Request,
    user: JWTPayload,
    env: ExamEnv
): Promise<Response> {
    try {
        const body = await request.json() as { answers: Record<string, string> };

        // Kiểm tra quyền
        const attempt = await env.DB.prepare(
            'SELECT * FROM exam_attempts WHERE id = ? AND user_id = ?'
        ).bind(attemptId, user.sub).first();

        if (!attempt) {
            return jsonResponse({ error: 'Bài làm không tồn tại' }, 404, env.CORS_ORIGIN);
        }

        if (attempt.status !== 'in_progress') {
            return jsonResponse({ error: 'Bài làm đã nộp, không thể chỉnh sửa' }, 400, env.CORS_ORIGIN);
        }

        const existingRaw = JSON.parse(attempt.answers || '{}');
        const { meta, answers: existingAnswers } = extractAttemptMeta(existingRaw);
        const mergedAnswers = { ...existingAnswers, ...(body.answers || {}) };
        const payload = buildAnswersPayload(meta, mergedAnswers);

        // Update answers (giu meta)
        await env.DB.prepare(
            'UPDATE exam_attempts SET answers = ? WHERE id = ?'
        ).bind(JSON.stringify(payload), attemptId).run();

        return jsonResponse({ success: true }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[exam-online] update attempt error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// POST /api/exam-online/attempts/:id/submit
// Nộp bài và chấm điểm
export async function submitAttempt(
    attemptId: string,
    request: Request,
    user: JWTPayload,
    env: ExamEnv
): Promise<Response> {
    try {
        const body = await request.json() as { answers?: Record<string, string> };

        // Lấy attempt
        const attempt = await env.DB.prepare(
            'SELECT * FROM exam_attempts WHERE id = ? AND user_id = ?'
        ).bind(attemptId, user.sub).first() as any;

        if (!attempt) {
            return jsonResponse({ error: 'Bài làm không tồn tại' }, 404, env.CORS_ORIGIN);
        }

        if (attempt.status === 'submitted') {
            return jsonResponse({ error: 'Bài làm đã được nộp trước đó' }, 400, env.CORS_ORIGIN);
        }

        // Lấy template để có đáp án đúng
        const template = await env.DB.prepare(
            'SELECT questions FROM exam_templates WHERE id = ?'
        ).bind(attempt.template_id).first() as any;

        if (!template) {
            return jsonResponse({ error: 'Đề thi không tồn tại' }, 404, env.CORS_ORIGIN);
        }

                const questions: ExamQuestion[] = JSON.parse(template.questions);

        const savedRaw = JSON.parse(attempt.answers || '{}');
        const { meta, answers: savedAnswers } = extractAttemptMeta(savedRaw);
        const finalAnswers = { ...savedAnswers, ...(body.answers || {}) };

        const shuffleMapping = meta.shuffleMapping || {};
        const questionsForGrading = questions.map((q) => {
            if ((q.type || 'multiple_choice') !== 'multiple_choice') return q;
            if (shuffleMapping[q.id]) {
                return { ...q, answer: shuffleMapping[q.id] };
            }
            return q;
        });

        const gradeResult = gradeExam(questionsForGrading, finalAnswers);
        const orderedQuestions = applyQuestionOrder(questions, meta.questionOrder)
            .map((q) => applyOptionOrder(q, meta.optionOrder))
            .map((q) => {
                if ((q.type || 'multiple_choice') === 'multiple_choice' && shuffleMapping[q.id]) {
                    return { ...q, answer: shuffleMapping[q.id] };
                }
                return q;
            });

        const now = Date.now();
        const timeSpent = Math.floor((now - attempt.started_at) / 1000);

        // Cập nhật attempt
        await env.DB.prepare(`
            UPDATE exam_attempts 
            SET answers = ?, score = ?, correct_count = ?, submitted_at = ?, 
                time_spent_seconds = ?, status = ?, analysis = ?
            WHERE id = ?
        `).bind(
            JSON.stringify(buildAnswersPayload(meta, finalAnswers)),
            gradeResult.score,
            gradeResult.correct_count,
            now,
            timeSpent,
            'submitted',
            JSON.stringify(gradeResult.analysis),
            attemptId
        ).run();

                const resultById = new Map(gradeResult.detailed_results.map((r) => [r.questionId, r]));

        // Tra ve ket qua (bao gom dap an dung)
        return jsonResponse({
            success: true,
            result: {
                score: gradeResult.score,
                correct_count: gradeResult.correct_count,
                total_questions: orderedQuestions.length,
                time_spent_seconds: timeSpent,
                analysis: gradeResult.analysis,
                detailed_results: gradeResult.detailed_results,
                questions_with_answers: orderedQuestions.map((q) => {
                    const detail = resultById.get(q.id);
                    const hasUserAnswer = Object.prototype.hasOwnProperty.call(finalAnswers, q.id);
                    const normalizedUserAnswer = hasUserAnswer ? normalizeUserAnswer(q, finalAnswers[q.id]) : null;
                    const questionType = q.type || 'multiple_choice';

                    return {
                        id: q.id,
                        type: questionType,
                        content: q.content,
                        options: q.options,
                        statements: q.statements,
                        answer: q.answer,
                        explanation: q.explanation,
                        level: q.level,
                        max_points: q.max_points ?? detail?.maxPoints,
                        keywords: q.keywords,
                        sample_answer: q.sample_answer,
                        rubric: q.rubric,
                        userAnswer: normalizedUserAnswer,
                        isCorrect: detail ? detail.isCorrect : false,
                        essayScore: questionType === 'essay' ? detail?.pointsEarned ?? 0 : undefined,
                        matchedKeywords: questionType === 'essay' ? detail?.matchedKeywords : undefined,
                        trueFalseCorrect: questionType === 'true_false' ? detail?.trueFalseCorrect : undefined,
                        trueFalseTotal: questionType === 'true_false' ? detail?.trueFalseTotal : undefined,
                    };
                }),
            },
        }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[exam-online] submit attempt error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

export async function getAttempts(
    request: Request,
    user: JWTPayload,
    env: ExamEnv
): Promise<Response> {
    try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const status = url.searchParams.get('status'); // 'in_progress', 'submitted'

        let query = `
            SELECT a.*, t.title, t.grade, t.branch, t.exam_type, t.duration_minutes
            FROM exam_attempts a
            JOIN exam_templates t ON a.template_id = t.id
            WHERE a.user_id = ?
        `;
        const bindings: any[] = [user.sub];

        if (status) {
            query += ' AND a.status = ?';
            bindings.push(status);
        }

        query += ' ORDER BY a.started_at DESC LIMIT ? OFFSET ?';
        bindings.push(limit, offset);

        const result = await env.DB.prepare(query).bind(...bindings).all();

        const attempts = (result.results || []).map((row: any) => ({
            id: row.id,
            template_id: row.template_id,
            title: row.title,
            grade: row.grade,
            branch: row.branch,
            exam_type: row.exam_type,
            score: row.score,
            correct_count: row.correct_count,
            total_questions: row.total_questions,
            duration_minutes: row.duration_minutes,
            started_at: row.started_at,
            submitted_at: row.submitted_at,
            time_spent_seconds: row.time_spent_seconds,
            status: row.status,
        }));

        return jsonResponse({ attempts }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[exam-online] get attempts error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// GET /api/exam-online/attempts
// Lịch sử làm bài của user
export async function getAttempt(
    attemptId: string,
    user: JWTPayload,
    env: ExamEnv
): Promise<Response> {
    try {
        const attempt = await env.DB.prepare(
            'SELECT * FROM exam_attempts WHERE id = ? AND user_id = ?'
        ).bind(attemptId, user.sub).first() as any;

        if (!attempt) {
            return jsonResponse({ error: 'Bai lam khong ton tai' }, 404, env.CORS_ORIGIN);
        }

        // Lay template
        const template = await env.DB.prepare(
            'SELECT * FROM exam_templates WHERE id = ?'
        ).bind(attempt.template_id).first() as any;

        const questions: ExamQuestion[] = JSON.parse(template.questions);
        const rawAnswers = JSON.parse(attempt.answers || '{}');
        const { meta, answers } = extractAttemptMeta(rawAnswers);
        const shuffleMapping = meta.shuffleMapping || {};

        const orderedQuestions = applyQuestionOrder(questions, meta.questionOrder)
            .map((q) => applyOptionOrder(q, meta.optionOrder))
            .map((q) => {
                if ((q.type || 'multiple_choice') === 'multiple_choice' && shuffleMapping[q.id]) {
                    return { ...q, answer: shuffleMapping[q.id] };
                }
                return q;
            });

        if (attempt.status === 'submitted') {
            const questionsForGrading = questions.map((q) => {
                if ((q.type || 'multiple_choice') !== 'multiple_choice') return q;
                if (shuffleMapping[q.id]) {
                    return { ...q, answer: shuffleMapping[q.id] };
                }
                return q;
            });
            const gradeResult = gradeExam(questionsForGrading, answers);
            const resultById = new Map(gradeResult.detailed_results.map((r) => [r.questionId, r]));

            return jsonResponse({
                attempt: {
                    id: attempt.id,
                    template_id: attempt.template_id,
                    title: template.title,
                    grade: template.grade,
                    branch: template.branch,
                    exam_type: template.exam_type,
                    score: attempt.score,
                    correct_count: attempt.correct_count,
                    total_questions: attempt.total_questions,
                    duration_minutes: template.duration_minutes,
                    started_at: attempt.started_at,
                    submitted_at: attempt.submitted_at,
                    time_spent_seconds: attempt.time_spent_seconds,
                    status: attempt.status,
                    analysis: attempt.analysis ? JSON.parse(attempt.analysis) : gradeResult.analysis,
                },
                questions_with_answers: orderedQuestions.map((q) => {
                    const detail = resultById.get(q.id);
                    const hasUserAnswer = Object.prototype.hasOwnProperty.call(answers, q.id);
                    const normalizedUserAnswer = hasUserAnswer ? normalizeUserAnswer(q, answers[q.id]) : null;
                    const questionType = q.type || 'multiple_choice';

                    return {
                        id: q.id,
                        type: questionType,
                        content: q.content,
                        options: q.options,
                        statements: q.statements,
                        answer: q.answer,
                        explanation: q.explanation,
                        level: q.level,
                        max_points: q.max_points ?? detail?.maxPoints,
                        keywords: q.keywords,
                        sample_answer: q.sample_answer,
                        rubric: q.rubric,
                        userAnswer: normalizedUserAnswer,
                        isCorrect: detail ? detail.isCorrect : false,
                        essayScore: questionType === 'essay' ? detail?.pointsEarned ?? 0 : undefined,
                        matchedKeywords: questionType === 'essay' ? detail?.matchedKeywords : undefined,
                        trueFalseCorrect: questionType === 'true_false' ? detail?.trueFalseCorrect : undefined,
                        trueFalseTotal: questionType === 'true_false' ? detail?.trueFalseTotal : undefined,
                    };
                }),
            }, 200, env.CORS_ORIGIN);
        }

        return jsonResponse({
            attempt: {
                id: attempt.id,
                template_id: attempt.template_id,
                title: template.title,
                total_questions: attempt.total_questions,
                duration_minutes: template.duration_minutes,
                started_at: attempt.started_at,
                status: attempt.status,
            },
            answers,
            questions: orderedQuestions.map((q) => ({
                id: q.id,
                type: q.type || 'multiple_choice',
                content: q.content,
                options: q.options,
                statements: q.statements,
                level: q.level,
                chapter: q.chapter,
                max_points: q.max_points,
                rubric: q.rubric,
            })),
        }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[exam-online] get attempt error:', error);
        return jsonResponse({ error: 'Loi server' }, 500, env.CORS_ORIGIN);
    }
}

// DELETE /api/exam-online/templates/:id// DELETE /api/exam-online/templates/:id
// Xóa đề thi (chỉ owner)
export async function deleteTemplate(
    templateId: string,
    user: JWTPayload,
    env: ExamEnv
): Promise<Response> {
    try {
        const res = await env.DB.prepare(
            'DELETE FROM exam_templates WHERE id = ? AND created_by = ?'
        ).bind(templateId, user.sub).run() as any;

        if (res.meta?.changes === 0) {
            return jsonResponse({ error: 'Không tìm thấy đề thi hoặc không có quyền xóa' }, 404, env.CORS_ORIGIN);
        }

        return jsonResponse({ success: true }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[exam-online] delete template error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// ==================== Statistics (Dashboard) ====================
// GET /api/exam-online/templates/:id/stats
// Thống kê cho giáo viên: số lượt làm, điểm TB, phân bổ điểm, leaderboard

export async function getTemplateStats(
    templateId: string,
    user: JWTPayload,
    env: ExamEnv
): Promise<Response> {
    try {
        // Kiểm tra template tồn tại và user là owner
        const template = await env.DB.prepare(
            'SELECT id, title, created_by, times_taken FROM exam_templates WHERE id = ?'
        ).bind(templateId).first() as any;

        if (!template) {
            return jsonResponse({ error: 'Đề thi không tồn tại' }, 404, env.CORS_ORIGIN);
        }

        // Lấy tất cả attempts đã submitted
        const attemptsResult = await env.DB.prepare(`
            SELECT score, correct_count, total_questions, time_spent_seconds, submitted_at
            FROM exam_attempts 
            WHERE template_id = ? AND status = 'submitted'
            ORDER BY score DESC
        `).bind(templateId).all() as any;

        const attempts = attemptsResult.results || [];

        if (attempts.length === 0) {
            return jsonResponse({
                stats: {
                    totalAttempts: 0,
                    averageScore: 0,
                    highestScore: 0,
                    lowestScore: 0,
                    averageTime: 0,
                    scoreDistribution: { '0-2': 0, '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 },
                    bloomAnalysis: null,
                },
                template: { id: template.id, title: template.title },
            }, 200, env.CORS_ORIGIN);
        }

        // Tính thống kê
        const scores = attempts.map((a: any) => a.score);
        const times = attempts.map((a: any) => a.time_spent_seconds).filter((t: any) => t > 0);

        const averageScore = scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length;
        const highestScore = Math.max(...scores);
        const lowestScore = Math.min(...scores);
        const averageTime = times.length > 0 ? times.reduce((sum: number, t: number) => sum + t, 0) / times.length : 0;

        // Phân bổ điểm
        const scoreDistribution = { '0-2': 0, '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 };
        for (const score of scores) {
            if (score < 2) scoreDistribution['0-2']++;
            else if (score < 4) scoreDistribution['2-4']++;
            else if (score < 6) scoreDistribution['4-6']++;
            else if (score < 8) scoreDistribution['6-8']++;
            else scoreDistribution['8-10']++;
        }

        // Leaderboard (top 10)
        const leaderboardResult = await env.DB.prepare(`
            SELECT a.score, a.correct_count, a.total_questions, a.time_spent_seconds, a.submitted_at, a.user_id
            FROM exam_attempts a
            WHERE a.template_id = ? AND a.status = 'submitted'
            ORDER BY a.score DESC, a.time_spent_seconds ASC
            LIMIT 10
        `).bind(templateId).all() as any;

        const leaderboard = (leaderboardResult.results || []).map((a: any, idx: number) => ({
            rank: idx + 1,
            userId: a.user_id?.substring(0, 8) + '***', // Ẩn bớt ID
            score: a.score,
            correctCount: a.correct_count,
            totalQuestions: a.total_questions,
            timeSpent: a.time_spent_seconds,
            submittedAt: a.submitted_at,
        }));

        return jsonResponse({
            stats: {
                totalAttempts: attempts.length,
                averageScore: Math.round(averageScore * 100) / 100,
                highestScore,
                lowestScore,
                averageTime: Math.round(averageTime),
                scoreDistribution,
            },
            leaderboard,
            template: { id: template.id, title: template.title },
        }, 200, env.CORS_ORIGIN);

    } catch (error) {
        console.error('[exam-online] get stats error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// ==================== Teacher Dashboard ====================
// GET /api/teacher/dashboard
// Lấy tổng quan thống kê cho giáo viên

export async function getTeacherDashboard(
    user: JWTPayload,
    env: ExamEnv
): Promise<Response> {
    try {
        // Chú thích: Chỉ teacher/admin mới truy cập được
        const userRole = (user as any).role || 'student';
        if (userRole === 'student') {
            return jsonResponse({ error: 'Chỉ giáo viên mới xem được dashboard' }, 403, env.CORS_ORIGIN);
        }

        // Lấy tất cả đề mà user đã tạo
        const templatesResult = await env.DB.prepare(`
            SELECT id, title, grade, branch, exam_type, difficulty, total_questions, 
                   duration_minutes, times_taken, created_at, is_public
            FROM exam_templates 
            WHERE created_by = ?
            ORDER BY created_at DESC
        `).bind(user.sub).all() as any;

        const templates = templatesResult.results || [];

        // Thống kê tổng quan
        const totalTemplates = templates.length;
        const totalTimesToken = templates.reduce((sum: number, t: any) => sum + (t.times_taken || 0), 0);

        // Lấy thống kê điểm từ tất cả attempts của các đề đã tạo
        let overallStats = {
            totalAttempts: 0,
            averageScore: 0,
            passRate: 0, // % học sinh >= 5 điểm
            scoreDistribution: { '0-2': 0, '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 } as Record<string, number>,
        };

        if (templates.length > 0) {
            const templateIds = templates.map((t: any) => t.id);
            const placeholders = templateIds.map(() => '?').join(',');

            const attemptsResult = await env.DB.prepare(`
                SELECT score FROM exam_attempts 
                WHERE template_id IN (${placeholders}) AND status = 'submitted'
            `).bind(...templateIds).all() as any;

            const attempts = attemptsResult.results || [];
            if (attempts.length > 0) {
                const scores = attempts.map((a: any) => a.score);
                overallStats.totalAttempts = scores.length;
                overallStats.averageScore = Math.round((scores.reduce((s: number, v: number) => s + v, 0) / scores.length) * 100) / 100;
                overallStats.passRate = Math.round((scores.filter((s: number) => s >= 5).length / scores.length) * 100);

                for (const score of scores) {
                    if (score < 2) overallStats.scoreDistribution['0-2']++;
                    else if (score < 4) overallStats.scoreDistribution['2-4']++;
                    else if (score < 6) overallStats.scoreDistribution['4-6']++;
                    else if (score < 8) overallStats.scoreDistribution['6-8']++;
                    else overallStats.scoreDistribution['8-10']++;
                }
            }
        }

        // Top 10 học sinh xuất sắc nhất (tất cả đề của teacher)
        let topStudents: any[] = [];
        if (templates.length > 0) {
            const templateIds = templates.map((t: any) => t.id);
            const placeholders = templateIds.map(() => '?').join(',');

            const topResult = await env.DB.prepare(`
                SELECT a.user_id, u.name, u.email, a.score, a.template_id, t.title as template_title, a.submitted_at
                FROM exam_attempts a
                LEFT JOIN users u ON a.user_id = u.id
                LEFT JOIN exam_templates t ON a.template_id = t.id
                WHERE a.template_id IN (${placeholders}) AND a.status = 'submitted'
                ORDER BY a.score DESC, a.submitted_at ASC
                LIMIT 10
            `).bind(...templateIds).all() as any;

            topStudents = (topResult.results || []).map((s: any, idx: number) => ({
                rank: idx + 1,
                name: s.name || 'Ẩn danh',
                email: s.email ? s.email.substring(0, 3) + '***' : null,
                score: s.score,
                templateTitle: s.template_title,
                submittedAt: s.submitted_at,
            }));
        }

        // Format templates cho response
        const formattedTemplates = templates.map((t: any) => ({
            id: t.id,
            title: t.title,
            grade: t.grade,
            branch: t.branch,
            examType: t.exam_type,
            difficulty: t.difficulty,
            totalQuestions: t.total_questions,
            durationMinutes: t.duration_minutes,
            timesTaken: t.times_taken || 0,
            createdAt: t.created_at,
            isPublic: t.is_public,
        }));

        return jsonResponse({
            overview: {
                totalTemplates,
                totalAttempts: overallStats.totalAttempts,
                averageScore: overallStats.averageScore,
                passRate: overallStats.passRate,
            },
            scoreDistribution: overallStats.scoreDistribution,
            templates: formattedTemplates,
            topStudents,
        }, 200, env.CORS_ORIGIN);

    } catch (error) {
        console.error('[exam-online] teacher dashboard error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// ==================== Student Dashboard ====================
// GET /api/student/dashboard
// Lấy thống kê cá nhân cho học sinh

export async function getStudentDashboard(
    user: JWTPayload,
    env: ExamEnv
): Promise<Response> {
    try {
        // Lấy tất cả attempts của user
        const attemptsResult = await env.DB.prepare(`
            SELECT a.id, a.template_id, a.score, a.correct_count, a.total_questions, 
                   a.time_spent_seconds, a.submitted_at, a.analysis,
                   t.title as template_title, t.grade, t.exam_type, t.difficulty
            FROM exam_attempts a
            LEFT JOIN exam_templates t ON a.template_id = t.id
            WHERE a.user_id = ? AND a.status = 'submitted'
            ORDER BY a.submitted_at DESC
        `).bind(user.sub).all() as any;

        const attempts = attemptsResult.results || [];

        // Thống kê tổng quan
        const totalAttempts = attempts.length;
        let averageScore = 0;
        let passRate = 0;
        let streak = 0;
        let highestScore = 0;

        if (attempts.length > 0) {
            const scores = attempts.map((a: any) => a.score);
            averageScore = Math.round((scores.reduce((s: number, v: number) => s + v, 0) / scores.length) * 100) / 100;
            passRate = Math.round((scores.filter((s: number) => s >= 5).length / scores.length) * 100);
            highestScore = Math.max(...scores);

            // Tính streak (số ngày liên tiếp có làm bài)
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            const submittedDates = attempts.map((a: any) => Math.floor(a.submitted_at / oneDay));
            const uniqueDates = [...new Set(submittedDates)].sort((a: number, b: number) => b - a);

            const today = Math.floor(now / oneDay);
            if (uniqueDates[0] === today || uniqueDates[0] === today - 1) {
                streak = 1;
                for (let i = 1; i < uniqueDates.length; i++) {
                    if (uniqueDates[i] === uniqueDates[i - 1] - 1) {
                        streak++;
                    } else {
                        break;
                    }
                }
            }
        }

        // Tiến độ theo thời gian (7 ngày gần nhất)
        const progressData: { date: string; score: number; count: number }[] = [];
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        for (let i = 6; i >= 0; i--) {
            const dayStart = now - (i * oneDay);
            const dayEnd = dayStart + oneDay;
            const dayAttempts = attempts.filter((a: any) => a.submitted_at >= dayStart && a.submitted_at < dayEnd);

            const date = new Date(dayStart);
            const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;

            if (dayAttempts.length > 0) {
                const avgScore = dayAttempts.reduce((s: number, a: any) => s + a.score, 0) / dayAttempts.length;
                progressData.push({ date: dateStr, score: Math.round(avgScore * 10) / 10, count: dayAttempts.length });
            } else {
                progressData.push({ date: dateStr, score: 0, count: 0 });
            }
        }

        // Phân tích điểm mạnh/yếu theo mức độ tư duy
        const bloomStats = {
            remember: { correct: 0, total: 0 },
            understand: { correct: 0, total: 0 },
            apply: { correct: 0, total: 0 },
            analyze: { correct: 0, total: 0 },
        };

        for (const attempt of attempts) {
            if (attempt.analysis) {
                try {
                    const analysis = typeof attempt.analysis === 'string' ? JSON.parse(attempt.analysis) : attempt.analysis;
                    if (analysis.byLevel) {
                        for (const [level, data] of Object.entries(analysis.byLevel) as any) {
                            if (bloomStats[level as keyof typeof bloomStats]) {
                                bloomStats[level as keyof typeof bloomStats].correct += data.correct || 0;
                                bloomStats[level as keyof typeof bloomStats].total += data.total || 0;
                            }
                        }
                    }
                } catch (e) {
                    // Ignore parse error
                }
            }
        }

        const bloomAnalysis = Object.entries(bloomStats).map(([level, data]) => ({
            level,
            label: level === 'remember' ? 'Nhận biết' : level === 'understand' ? 'Thông hiểu' : level === 'apply' ? 'Vận dụng' : 'Phân tích',
            percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
            total: data.total,
        }));

        // Gợi ý ôn tập dựa trên điểm yếu
        const recommendations: string[] = [];
        const weakAreas = bloomAnalysis.filter(b => b.total >= 3 && b.percentage < 60);
        for (const area of weakAreas.slice(0, 2)) {
            recommendations.push(`Cần ôn thêm dạng câu hỏi ${area.label} (hiện đạt ${area.percentage}%)`);
        }
        if (averageScore < 5) {
            recommendations.push('Điểm trung bình còn thấp, nên làm thêm đề dễ để củng cố kiến thức cơ bản');
        }
        if (attempts.length < 5) {
            recommendations.push('Luyện tập thêm để có kết quả đánh giá chính xác hơn');
        }

        // Recent attempts (5 bài gần nhất)
        const recentAttempts = attempts.slice(0, 5).map((a: any) => ({
            id: a.id,
            templateTitle: a.template_title,
            grade: a.grade,
            examType: a.exam_type,
            score: a.score,
            correctCount: a.correct_count,
            totalQuestions: a.total_questions,
            submittedAt: a.submitted_at,
        }));

        return jsonResponse({
            overview: {
                totalAttempts,
                averageScore,
                passRate,
                highestScore,
                streak,
            },
            progressData,
            bloomAnalysis,
            recommendations,
            recentAttempts,
        }, 200, env.CORS_ORIGIN);

    } catch (error) {
        console.error('[exam-online] student dashboard error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// ==================== AI Generation ====================
// POST /api/exam-online/generate
// Tạo đề thi bằng AI từ SGK (RAG)

interface AIGenerateRequest {
    grade: '10' | '11' | '12';
    branch?: 'cong_nghiep' | 'nong_nghiep';
    exam_type: '15min' | 'midterm' | 'final' | 'thpt';
    difficulty: 'easy' | 'medium' | 'hard';
    chapters?: string[];      // Các chương cần ra đề
    topic?: string;           // Chủ đề cụ thể (optional)
    publisher?: string;       // Bộ sách
    save?: boolean;           // Có lưu vào DB không (default: true)
}

// Prompt để AI generate đề theo format mới - Cập nhật theo chương trình Công nghệ THPT
// Prompt đã được chuyển sang SYSTEM_PROMPTS.generate trong prompts.ts

export async function generateTemplateWithAI(
    request: Request,
    user: JWTPayload,
    env: ExamEnv & { VECTORIZE?: VectorizeIndex }
): Promise<Response> {
    try {
        const body = await request.json() as AIGenerateRequest;

        // Validate
        if (!body.grade || !body.exam_type) {
            return jsonResponse({ error: 'Thiếu grade hoặc exam_type' }, 400, env.CORS_ORIGIN);
        }

        console.info('[exam-ai] Generating exam...', { grade: body.grade, type: body.exam_type });

        // 1. Tìm kiến thức từ RAG
        let ragContext = '';
        const topicSearch = body.topic ||
            `Công nghệ lớp ${body.grade} ${body.branch === 'cong_nghiep' ? 'Công nghiệp' : body.branch === 'nong_nghiep' ? 'Nông nghiệp' : ''}`;

        if (env.VECTORIZE && env.HF_API_TOKEN) {
            try {
                // Import động để tránh circular dependency
                const { getRAGContext } = await import('./rag-pipeline');
                const ragResult = await getRAGContext(
                    env.HF_API_TOKEN,
                    env.VECTORIZE,
                    topicSearch,
                    { grade: body.grade }
                );
                ragContext = ragResult.context;
                console.info('[exam-ai] RAG context found:', ragResult.sources?.length || 0, 'sources');
            } catch (err) {
                console.warn('[exam-ai] RAG failed, continuing without context:', err);
            }
        }

        // 2. Build prompt với thông tin chi tiết về nội dung môn học
        // Chú thích: Sử dụng KNTT_EXAM_MATRIX để lấy số câu chính xác
        const matrix = KNTT_EXAM_MATRIX[body.exam_type as keyof typeof KNTT_EXAM_MATRIX] || KNTT_EXAM_MATRIX.midterm;
        const mcqCount = matrix.mcqCount;
        const trueFalseCount = matrix.trueFalseCount;
        const essayCount = matrix.essayCount;
        const totalQuestions = mcqCount + trueFalseCount + essayCount;
        const levelDistribution = matrix.levels;

        // Xác định nội dung theo lớp và định hướng (KNTT specific)
        const getSubjectContent = (grade: string, branch?: string) => {
            const isCN = branch === 'cong_nghiep';
            const isNN = branch === 'nong_nghiep';

            switch (grade) {
                case '10':
                    if (isCN) return 'Thiết kế và Công nghệ (KNTT): Khái quát thiết kế kỹ thuật, Quy trình thiết kế (6 bước), Yếu tố ảnh hưởng (vật liệu, công nghệ, kinh tế, môi trường), Nguyên tắc thiết kế (công năng, độ bền, an toàn, thẩm mỹ)';
                    if (isNN) return 'Công nghệ Trồng trọt (KNTT): Đất trồng (thành phần, tính chất), Phân bón (N-P-K, hữu cơ, vi sinh), Giống cây trồng (nhân giống, nuôi cấy mô), Kỹ thuật canh tác, Phòng trừ sâu bệnh';
                    return 'Thiết kế và Công nghệ hoặc Công nghệ Trồng trọt';
                case '11':
                    if (isCN) return 'Công nghệ Cơ khí (KNTT): Vật liệu cơ khí (thép, gang, hợp kim), Công nghệ chế tạo phôi (đúc, rèn, hàn), Gia công cắt gọt (máy tiện, phay), Tự động hóa (PLC, cảm biến)';
                    if (isNN) return 'Công nghệ Chăn nuôi (KNTT): Giống vật nuôi (chọn lọc, thụ tinh nhân tạo), Dinh dưỡng & Thức ăn, Chuồng trại, Phòng trị bệnh (vaccine, an toàn sinh học)';
                    return 'Công nghệ Cơ khí hoặc Công nghệ Chăn nuôi';
                case '12':
                    if (isCN) return 'Điện - Điện tử (KNTT): Thiết bị điện tử dân dụng (Máy tăng âm, Thu thanh, Thu hình), Hệ thống viễn thông, Hệ thống điện quốc gia, Mạch điện xoay chiều 3 pha (đấu Y, đấu Δ), Máy biến áp 3 pha, Động cơ KĐB 3 pha';
                    if (isNN) return 'Lâm nghiệp & Thủy sản (KNTT): Rừng (phòng hộ, đặc dụng, sản xuất), Kỹ thuật trồng rừng, Khai thác bền vững, Môi trường ao nuôi (pH, DO, NH3), Nuôi tôm RAS, Thức ăn công nghiệp, VietGAP thủy sản';
                    return 'Điện - Điện tử hoặc Lâm nghiệp & Thủy sản';
                default:
                    return '';
            }
        };

        const subjectContent = getSubjectContent(body.grade, body.branch);
        const branchName = body.branch === 'cong_nghiep' ? 'Định hướng Công nghiệp' :
            body.branch === 'nong_nghiep' ? 'Định hướng Nông nghiệp' : '';

        // Chú thích: Tính số câu theo mức độ dựa trên ma trận
        const levelCounts = {
            remember: Math.round(mcqCount * levelDistribution.NB),
            understand: Math.round(mcqCount * levelDistribution.TH),
            apply: Math.round(mcqCount * levelDistribution.VD),
            analyze: Math.round(mcqCount * levelDistribution.VDC),
        };

        const userPrompt = `Tạo đề thi ${body.exam_type} môn Công nghệ lớp ${body.grade}${branchName ? ` - ${branchName}` : ''}.

**MA TRẬN ĐỀ THI KNTT (BẮT BUỘC TUÂN THỦ):**
- **MCQ (Trắc nghiệm 4 lựa chọn):** ${mcqCount} câu
  + Nhận biết (remember): ${levelCounts.remember} câu
  + Thông hiểu (understand): ${levelCounts.understand} câu
  + Vận dụng (apply): ${levelCounts.apply} câu
  + Vận dụng cao (analyze): ${levelCounts.analyze} câu
${trueFalseCount > 0 ? `- **True/False (Đúng/Sai dạng chùm):** ${trueFalseCount} câu (mỗi câu có 4 ý nhận định)` : ''}
${essayCount > 0 ? `- **Tự luận:** ${essayCount} câu (1 câu Vận dụng 2đ, 1 câu VDC 1đ)` : ''}

**THÔNG TIN ĐỀ THI:**
- Lớp: ${body.grade}
- Định hướng: ${branchName || 'Không xác định'}
- Nội dung chính (KNTT): ${subjectContent}
- Độ khó: ${body.difficulty === 'easy' ? 'Dễ (tăng NB/TH)' : body.difficulty === 'hard' ? 'Khó (tăng VD/VDC)' : 'Trung bình'}
${body.chapters?.length ? `- Chương cụ thể: ${body.chapters.join(', ')}` : ''}
${body.topic ? `- Chủ đề trọng tâm: ${body.topic}` : ''}

=== KIẾN THỨC SGK KNTT (RAG Context) ===
${ragContext || '(Không có context SGK - sử dụng kiến thức chuẩn chương trình KNTT)'}

**LƯU Ý QUAN TRỌNG:**
1. Câu hỏi PHẢI liên quan đến nội dung "${subjectContent}" của lớp ${body.grade}.
2. Tuân thủ ĐÚNG số câu và mức độ theo ma trận ở trên.
3. Mỗi câu phải có trường "source": "SGK Công nghệ ${body.grade} - Kết nối tri thức".

Trả về JSON array đúng format.`;

        // 3. Gọi AI (OpenRouter)
        const { callOpenRouter, buildMessages, MODEL_ROUTES } = await import('./openrouter');

        const messages = buildMessages(SYSTEM_PROMPTS.generate, userPrompt);
        const aiResult = await callOpenRouter(env.OPENROUTER_API_KEY, {
            messages,
            model: MODEL_ROUTES.examGeneration,
            temperature: 0.7,
            useOnlineSearch: false, // Chú thích: Tắt web search, dùng RAG context SGK thay vì online
        });

        // 4. Parse JSON từ AI response
        let questions: ExamQuestion[];
        try {
            const jsonMatch = aiResult.text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No JSON array found in AI response');
            }
            questions = JSON.parse(jsonMatch[0]);

            // Validate và normalize
                        questions = questions.map((q: any, idx: number) => {
                const rawOptions = Array.isArray(q.options) ? q.options : [];
                const rawStatements = Array.isArray(q.statements) ? q.statements : [];
                let statements: string[] | undefined;
                let tfAnswer: boolean[] | undefined;

                if (rawStatements.length > 0) {
                    if (typeof rawStatements[0] === 'string') {
                        statements = rawStatements as string[];
                    } else {
                        statements = rawStatements
                            .map((s: any) => s.text || s.statement || '')
                            .filter((s: string) => s.trim().length > 0);
                        tfAnswer = rawStatements.map((s: any) => Boolean(s.isTrue ?? s.correct ?? s.answer));
                    }
                }

                const hasOptions = rawOptions.length >= 2;
                const isTrueFalse = q.type === 'true_false' || (statements && statements.length > 0);
                const isEssay = q.type === 'essay' || q.question_type === 'essay' || (!hasOptions && !isTrueFalse);

                if (isEssay) {
                    const keywords = normalizeKeywordList(q.keywords || q.keyword || q.key);
                    let sampleAnswer = '';
                    if (typeof q.sample_answer === 'string') {
                        sampleAnswer = q.sample_answer;
                    } else if (typeof q.answer === 'string') {
                        const firstChar = q.answer.trim().charAt(0).toUpperCase();
                        if (!['A', 'B', 'C', 'D'].includes(firstChar)) {
                            sampleAnswer = q.answer;
                        }
                    }

                    const maxPoints = typeof q.max_points === 'number'
                        ? q.max_points
                        : (typeof q.points === 'number' ? q.points : 1);

                    return {
                        id: q.id || `q${idx + 1}`,
                        type: 'essay',
                        content: q.content || q.question || q.prompt || '',
                        explanation: q.explanation || '',
                        level: ['remember', 'understand', 'apply', 'analyze'].includes(q.level)
                            ? q.level as ExamQuestion['level']
                            : 'remember',
                        source: q.source || undefined,
                        max_points: maxPoints,
                        keywords: keywords.length > 0 ? keywords : undefined,
                        sample_answer: sampleAnswer || undefined,
                        rubric: typeof q.rubric === 'string' ? q.rubric : undefined,
                    };
                }

                if (isTrueFalse) {
                    const normalizedAnswer = Array.isArray(tfAnswer)
                        ? tfAnswer
                        : Array.isArray(q.correct)
                            ? q.correct
                            : Array.isArray(q.answer)
                                ? q.answer
                                : [false, false, false, false];

                    return {
                        id: q.id || `q${idx + 1}`,
                        type: 'true_false',
                        content: q.content || q.question || '',
                        statements: statements || (Array.isArray(q.statements) ? q.statements : []),
                        answer: normalizedAnswer,
                        explanation: q.explanation || '',
                        level: ['remember', 'understand', 'apply', 'analyze'].includes(q.level)
                            ? q.level as ExamQuestion['level']
                            : 'remember',
                        source: q.source || undefined,
                    };
                }

                const rawAnswer = q.correct !== undefined ? q.correct : q.answer;
                let normalizedAnswer: string;
                if (typeof rawAnswer === 'number') {
                    normalizedAnswer = ['A', 'B', 'C', 'D'][rawAnswer] || 'A';
                } else if (typeof rawAnswer === 'string') {
                    normalizedAnswer = rawAnswer.charAt(0).toUpperCase();
                    if (!['A', 'B', 'C', 'D'].includes(normalizedAnswer)) {
                        normalizedAnswer = 'A';
                    }
                } else {
                    normalizedAnswer = 'A';
                }

                return {
                    id: q.id || `q${idx + 1}`,
                    type: 'multiple_choice',
                    content: q.content || q.question || '',
                    options: rawOptions,
                    answer: normalizedAnswer,
                    explanation: q.explanation || '',
                    level: ['remember', 'understand', 'apply', 'analyze'].includes(q.level)
                        ? q.level as ExamQuestion['level']
                        : 'remember',
                    source: q.source || undefined,
                };
            });

        } catch (parseError) {
            console.error('[exam-ai] Parse error:', parseError, aiResult.text.substring(0, 500));
            return jsonResponse({
                error: 'AI trả về format không hợp lệ',
                raw: aiResult.text.substring(0, 1000),
            }, 500, env.CORS_ORIGIN);
        }

        // 5. Tạo title và lưu vào DB nếu save=true
        const title = `Đề ${body.exam_type === '15min' ? 'kiểm tra 15 phút' :
            body.exam_type === 'midterm' ? 'giữa kì' :
                body.exam_type === 'final' ? 'cuối kì' : 'THPT QG'} - Công nghệ ${body.grade}${body.branch ? ` (${body.branch === 'cong_nghiep' ? 'CN' : 'NN'})` : ''}`;

        const durations: Record<string, number> = {
            '15min': 15,
            'midterm': 45,
            'final': 60,
            'thpt': 50,
        };

        const templateId = generateId();
        const now = Date.now();

        const template = {
            id: templateId,
            grade: body.grade,
            branch: body.branch || null,
            exam_type: body.exam_type,
            title,
            description: `Đề được tạo tự động bởi AI từ SGK${body.chapters?.length ? ` - Chương: ${body.chapters.join(', ')}` : ''}`,
            questions: JSON.stringify(questions),
            total_questions: questions.length,
            duration_minutes: durations[body.exam_type] || 45,
            difficulty: body.difficulty || 'medium',
            chapters: body.chapters ? JSON.stringify(body.chapters) : null,
            publisher: body.publisher || null,
            created_at: now,
            created_by: user.sub,
            is_public: 1,
            times_taken: 0,
        };

        // Lưu vào DB (default: true)
        if (body.save !== false) {
            await env.DB.prepare(`
                INSERT INTO exam_templates 
                (id, grade, branch, exam_type, title, description, questions, total_questions, 
                 duration_minutes, difficulty, chapters, publisher, created_at, created_by, is_public, times_taken)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                template.id, template.grade, template.branch, template.exam_type,
                template.title, template.description, template.questions, template.total_questions,
                template.duration_minutes, template.difficulty, template.chapters, template.publisher,
                template.created_at, template.created_by, template.is_public, template.times_taken
            ).run();

            console.info('[exam-ai] Template saved:', templateId);
        }

        return jsonResponse({
            success: true,
            template: {
                id: template.id,
                title: template.title,
                total_questions: template.total_questions,
                duration_minutes: template.duration_minutes,
                difficulty: template.difficulty,
            },
            questions, // Trả về luôn để preview
        }, 201, env.CORS_ORIGIN);

    } catch (error) {
        console.error('[exam-ai] Generate error:', error);
        return jsonResponse({
            error: 'Lỗi tạo đề thi',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, 500, env.CORS_ORIGIN);
    }
}






