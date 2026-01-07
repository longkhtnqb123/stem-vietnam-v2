// Chú thích: Exam Routes - CRUD for exam history
import { generateId } from './auth';
import { JWTPayload } from './auth';
import { ConvoEnv } from './conversation-routes';

// Reuse ConvoEnv for DB access
type ExamEnv = ConvoEnv;

interface D1Result<T = unknown> {
    results?: T[];
    success: boolean;
    meta?: {
        changes?: number;
        last_row_id?: number;
        duration?: number;
        size_after?: number;
        rows_read?: number;
        rows_written?: number;
    };
}

interface ExamRow {
    id: string;
    topic: string;
    config: string; // JSON string
    content: string;
    created_at: number;
}

// Helper JSON response
function jsonResponse(data: unknown, status: number, origin: string): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

// === API Handlers ===

// GET /api/exams
export async function getExams(user: JWTPayload, env: ExamEnv): Promise<Response> {
    try {
        const result = await env.DB.prepare(
            'SELECT id, topic, config, created_at FROM exams WHERE user_id = ? ORDER BY created_at DESC'
        ).bind(user.sub).all();

        const exams = (result.results || []).map((row: any) => ({
            ...row,
            config: row.config ? JSON.parse(row.config) : null
        }));

        return jsonResponse({ exams }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[exam] get list error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// GET /api/exams/:id
export async function getExam(id: string, user: JWTPayload, env: ExamEnv): Promise<Response> {
    try {
        const exam = await env.DB.prepare(
            'SELECT * FROM exams WHERE id = ? AND user_id = ?'
        ).bind(id, user.sub).first<ExamRow>();

        if (!exam) {
            return jsonResponse({ error: 'Đề thi không tồn tại' }, 404, env.CORS_ORIGIN);
        }

        return jsonResponse({
            exam: {
                ...exam,
                config: exam.config ? JSON.parse(exam.config) : null,
                content: exam.content
            }
        }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[exam] get detail error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// POST /api/exams
export async function createExam(request: Request, user: JWTPayload, env: ExamEnv): Promise<Response> {
    try {
        const body = await request.json() as {
            topic: string;
            config: any;
            content: string;
        };

        if (!body.topic || !body.content) {
            return jsonResponse({ error: 'Thiếu thông tin bắt buộc' }, 400, env.CORS_ORIGIN);
        }

        const id = generateId();
        const now = Date.now();

        await env.DB.prepare(
            'INSERT INTO exams (id, user_id, topic, config, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
            id,
            user.sub,
            body.topic,
            JSON.stringify(body.config || {}),
            body.content,
            now,
            now
        ).run();

        return jsonResponse({
            success: true,
            exam: {
                id,
                topic: body.topic,
                created_at: now
            }
        }, 201, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[exam] create error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// DELETE /api/exams/:id
export async function deleteExam(id: string, user: JWTPayload, env: ExamEnv): Promise<Response> {
    try {
        const res = await env.DB.prepare(
            'DELETE FROM exams WHERE id = ? AND user_id = ?'
        ).bind(id, user.sub).run() as any;

        if (res.meta?.changes === 0) {
            return jsonResponse({ error: 'Không tìm thấy đề thi hoặc không có quyền xóa' }, 404, env.CORS_ORIGIN);
        }

        return jsonResponse({ success: true }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[exam] delete error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}
