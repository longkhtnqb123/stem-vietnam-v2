
import { generateId, JWTPayload } from './auth';

// ==================== Types ====================
export interface ClassesEnv {
    DB: D1Database;
    CORS_ORIGIN: string;
}

export interface Class {
    id: string;
    name: string;
    teacher_id: string;
    join_code: string;
    description?: string;
    created_at: number;
    member_count?: number;
    teacher_name?: string;
    is_member?: boolean;
}

export interface ClassMember {
    user_id: string;
    name: string;
    email: string;
    role: 'student' | 'assistant';
    joined_at: number;
}

// ==================== Helper Functions ====================
function jsonResponse(data: unknown, status: number, origin: string): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

// ==================== Routes ====================

// GET /api/classes
// Lấy danh sách lớp học
export async function getClasses(
    user: JWTPayload,
    env: ClassesEnv
): Promise<Response> {
    try {
        let sql = '';
        let params: any[] = [];

        if (user.role === 'teacher' || user.role === 'admin') {
            // Giáo viên: lấy danh sách lớp mình tạo
            sql = `
                SELECT c.*, 
                       (SELECT COUNT(*) FROM class_members cm WHERE cm.class_id = c.id) as member_count
                FROM classes c
                WHERE c.teacher_id = ?
                ORDER BY c.created_at DESC
            `;
            params = [user.sub];
        } else {
            // Học sinh: lấy danh sách lớp mình đã tham gia
            sql = `
                SELECT c.*, u.name as teacher_name
                FROM classes c
                JOIN class_members cm ON c.id = cm.class_id
                LEFT JOIN users u ON c.teacher_id = u.id
                WHERE cm.user_id = ?
                ORDER BY cm.joined_at DESC
            `;
            params = [user.sub];
        }

        const result = await env.DB.prepare(sql).bind(...params).all<Class>();
        return jsonResponse(result.results || [], 200, env.CORS_ORIGIN);

    } catch (error) {
        console.error('[classes] getClasses error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// POST /api/classes
// Tạo lớp mới (Chỉ giáo viên)
export async function createClass(
    request: Request,
    user: JWTPayload,
    env: ClassesEnv
): Promise<Response> {
    if (user.role !== 'teacher' && user.role !== 'admin') {
        return jsonResponse({ error: 'Bạn không có quyền tạo lớp' }, 403, env.CORS_ORIGIN);
    }

    try {
        const body = await request.json() as { name: string; description?: string };
        if (!body.name || body.name.length < 3) {
            return jsonResponse({ error: 'Tên lớp phải từ 3 ký tự trở lên' }, 400, env.CORS_ORIGIN);
        }

        const id = generateId();
        // Tạo join_code ngẫu nhiên 6 ký tự
        const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        await env.DB.prepare(`
            INSERT INTO classes (id, name, teacher_id, join_code, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(id, body.name, user.sub, joinCode, body.description || null, Date.now()).run();

        return jsonResponse({ id, join_code: joinCode, message: 'Tạo lớp thành công' }, 201, env.CORS_ORIGIN);

    } catch (error) {
        console.error('[classes] createClass error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// POST /api/classes/join
// Tham gia lớp bằng mã (Học sinh)
export async function joinClass(
    request: Request,
    user: JWTPayload,
    env: ClassesEnv
): Promise<Response> {
    try {
        const body = await request.json() as { join_code: string };
        if (!body.join_code) {
            return jsonResponse({ error: 'Thiếu mã tham gia' }, 400, env.CORS_ORIGIN);
        }

        // Tìm lớp theo ma code
        const cls = await env.DB.prepare('SELECT id, name, teacher_id FROM classes WHERE join_code = ?').bind(body.join_code.toUpperCase()).first<Class>();

        if (!cls) {
            return jsonResponse({ error: 'Mã lớp không tồn tại' }, 404, env.CORS_ORIGIN);
        }

        if (cls.teacher_id === user.sub) {
            return jsonResponse({ error: 'Bạn là giáo viên của lớp này' }, 400, env.CORS_ORIGIN);
        }

        // Kiểm tra đã tham gia chưa
        const existing = await env.DB.prepare('SELECT 1 FROM class_members WHERE class_id = ? AND user_id = ?')
            .bind(cls.id, user.sub).first();

        if (existing) {
            return jsonResponse({ error: 'Bạn đã tham gia lớp này rồi' }, 400, env.CORS_ORIGIN);
        }

        // Thêm vào lớp
        await env.DB.prepare(`
            INSERT INTO class_members (class_id, user_id, joined_at)
            VALUES (?, ?, ?)
        `).bind(cls.id, user.sub, Date.now()).run();

        return jsonResponse({ message: `Đã tham gia lớp ${cls.name}`, class_id: cls.id }, 200, env.CORS_ORIGIN);

    } catch (error) {
        console.error('[classes] joinClass error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// GET /api/classes/:id
// Lấy chi tiết lớp + thành viên
export async function getClassDetails(
    classId: string,
    user: JWTPayload,
    env: ClassesEnv
): Promise<Response> {
    try {
        // Kiểm tra quyền truy cập: là giáo viên của lớp OR là thành viên
        const cls = await env.DB.prepare(`
            SELECT c.*, u.name as teacher_name
            FROM classes c
            LEFT JOIN users u ON c.teacher_id = u.id
            WHERE c.id = ?
        `).bind(classId).first<Class>();

        if (!cls) {
            return jsonResponse({ error: 'Lớp không tồn tại' }, 404, env.CORS_ORIGIN);
        }

        let isTeacher = cls.teacher_id === user.sub;
        let isMember = false;

        if (!isTeacher) {
            const memberCheck = await env.DB.prepare('SELECT 1 FROM class_members WHERE class_id = ? AND user_id = ?')
                .bind(classId, user.sub).first();
            isMember = !!memberCheck;
        }

        if (!isTeacher && !isMember && user.role !== 'admin') {
            return jsonResponse({ error: 'Bạn không có quyền truy cập lớp này' }, 403, env.CORS_ORIGIN);
        }

        // Lấy danh sách thành viên (chỉ giáo viên mới thấy ds đầy đủ, học sinh thấy số lượng?)
        // Hiện tại cho thấy hết để mọi người biết bạn học
        const members = await env.DB.prepare(`
            SELECT cm.*, u.name, u.email
            FROM class_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.class_id = ?
            ORDER BY cm.joined_at DESC
        `).bind(classId).all<ClassMember>();

        // Lấy danh sách bài tập assignment
        const assignments = await env.DB.prepare(`
            SELECT ca.*, t.title as template_title, t.duration_minutes, t.total_questions,
                   (SELECT COUNT(*) FROM exam_attempts a WHERE a.template_id = ca.template_id AND a.user_id = ?) as attempts_count,
                   (SELECT MAX(a.score) FROM exam_attempts a WHERE a.template_id = ca.template_id AND a.user_id = ?) as max_score
            FROM class_assignments ca
            JOIN exam_templates t ON ca.template_id = t.id
            WHERE ca.class_id = ?
            ORDER BY ca.created_at DESC
        `).bind(user.sub, user.sub, classId).all();

        return jsonResponse({
            class: cls,
            is_teacher: isTeacher,
            members: members.results || [],
            assignments: assignments.results || []
        }, 200, env.CORS_ORIGIN);

    } catch (error) {
        console.error('[classes] getClassDetails error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// POST /api/classes/:id/assignments
// Giao bài tập (Chỉ giáo viên)
export async function createAssignment(
    request: Request,
    classId: string,
    user: JWTPayload,
    env: ClassesEnv
): Promise<Response> {
    try {
        // Check quyền teacher
        const cls = await env.DB.prepare('SELECT teacher_id FROM classes WHERE id = ?').bind(classId).first<Class>();
        if (!cls) return jsonResponse({ error: 'Lớp không tồn tại' }, 404, env.CORS_ORIGIN);
        if (cls.teacher_id !== user.sub && user.role !== 'admin') {
            return jsonResponse({ error: 'Chỉ giáo viên của lớp được giao bài' }, 403, env.CORS_ORIGIN);
        }

        const body = await request.json() as { template_id: string; due_date?: number };
        if (!body.template_id) {
            return jsonResponse({ error: 'Thiếu template_id' }, 400, env.CORS_ORIGIN);
        }

        // Verify template exists
        const tpl = await env.DB.prepare('SELECT id FROM exam_templates WHERE id = ?').bind(body.template_id).first();
        if (!tpl) {
            return jsonResponse({ error: 'Đề thi không tồn tại' }, 404, env.CORS_ORIGIN);
        }

        const id = generateId();
        await env.DB.prepare(`
            INSERT INTO class_assignments (id, class_id, template_id, due_date, created_at)
            VALUES (?, ?, ?, ?, ?)
        `).bind(id, classId, body.template_id, body.due_date || null, Date.now()).run();

        return jsonResponse({ message: 'Giao bài thành công', id }, 201, env.CORS_ORIGIN);

    } catch (error) {
        console.error('[classes] createAssignment error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// DELETE /api/classes/:id
export async function deleteClass(
    classId: string,
    user: JWTPayload,
    env: ClassesEnv
): Promise<Response> {
    try {
        const cls = await env.DB.prepare('SELECT teacher_id FROM classes WHERE id = ?').bind(classId).first<Class>();
        if (!cls) return jsonResponse({ error: 'Lớp không tồn tại' }, 404, env.CORS_ORIGIN);
        if (cls.teacher_id !== user.sub && user.role !== 'admin') {
            return jsonResponse({ error: 'Không có quyền xóa lớp này' }, 403, env.CORS_ORIGIN);
        }

        await env.DB.prepare('DELETE FROM classes WHERE id = ?').bind(classId).run();
        return jsonResponse({ message: 'Xóa lớp thành công' }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[classes] deleteClass error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}
