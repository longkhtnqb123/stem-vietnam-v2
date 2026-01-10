// Teacher Invitation API Routes
// Xử lý cấp và sử dụng mã mời giáo viên

import { Hono } from 'hono';
import { Env } from './index';
import { verifyJWT } from './auth';

const app = new Hono<{ Bindings: Env }>();

// Tạo mã mời ngẫu nhiên
function generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'GV-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// GET /api/teachers/invitations - Lấy danh sách mã mời (Admin only)
app.get('/invitations', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    // Kiểm tra quyền admin
    const user = await c.env.DB.prepare(`SELECT role FROM users WHERE id = ?`).bind(userId).first();
    if (user?.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
    }

    const invitations = await c.env.DB.prepare(`
        SELECT ti.*, u.name as created_by_name, u2.name as used_by_name
        FROM teacher_invitations ti
        LEFT JOIN users u ON ti.created_by = u.id
        LEFT JOIN users u2 ON ti.used_by = u2.id
        ORDER BY ti.created_at DESC
        LIMIT 50
    `).all();

    return c.json({ invitations: invitations.results || [] });
});

// POST /api/teachers/invitations - Tạo mã mời mới (Admin only)
app.post('/invitations', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await c.env.DB.prepare(`SELECT role FROM users WHERE id = ?`).bind(userId).first();
    if (user?.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
    }

    const { email, name, schoolName, expiresInDays } = await c.req.json();

    const id = crypto.randomUUID();
    const code = generateInviteCode();
    const expiresAt = expiresInDays ? Date.now() + (expiresInDays * 24 * 60 * 60 * 1000) : null;

    await c.env.DB.prepare(`
        INSERT INTO teacher_invitations (id, code, created_by, email, name, school_name, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, code, userId, email || null, name || null, schoolName || null, expiresAt).run();

    return c.json({
        success: true,
        invitation: { id, code, email, name, schoolName, expiresAt }
    });
});

// POST /api/teachers/verify-code - Kiểm tra mã mời có hợp lệ không
app.post('/verify-code', async (c) => {
    const { code } = await c.req.json();

    const invitation = await c.env.DB.prepare(`
        SELECT * FROM teacher_invitations 
        WHERE code = ? AND used = FALSE 
        AND (expires_at IS NULL OR expires_at > ?)
    `).bind(code.toUpperCase(), Date.now()).first();

    if (!invitation) {
        return c.json({ valid: false, message: 'Mã không hợp lệ hoặc đã hết hạn' });
    }

    return c.json({
        valid: true,
        name: invitation.name,
        email: invitation.email,
        schoolName: invitation.school_name
    });
});

// POST /api/teachers/use-code - Sử dụng mã mời để upgrade thành teacher
app.post('/use-code', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const { code } = await c.req.json();

    // Kiểm tra mã
    const invitation = await c.env.DB.prepare(`
        SELECT * FROM teacher_invitations 
        WHERE code = ? AND used = FALSE 
        AND (expires_at IS NULL OR expires_at > ?)
    `).bind(code.toUpperCase(), Date.now()).first();

    if (!invitation) {
        return c.json({ error: 'Mã không hợp lệ hoặc đã hết hạn' }, 400);
    }

    // Đánh dấu mã đã sử dụng
    await c.env.DB.prepare(`
        UPDATE teacher_invitations 
        SET used = TRUE, used_by = ?, used_at = ?
        WHERE id = ?
    `).bind(userId, Date.now(), invitation.id).run();

    // Upgrade user thành teacher
    await c.env.DB.prepare(`
        UPDATE users SET role = 'teacher' WHERE id = ?
    `).bind(userId).run();

    return c.json({
        success: true,
        message: 'Chúc mừng! Tài khoản của bạn đã được nâng cấp thành Giáo viên.'
    });
});

// GET /api/teachers/list - Danh sách giáo viên (Admin only)
app.get('/list', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await c.env.DB.prepare(`SELECT role FROM users WHERE id = ?`).bind(userId).first();
    if (user?.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
    }

    const teachers = await c.env.DB.prepare(`
        SELECT u.id, u.name, u.email, u.created_at, u.school_id, u.teacher_code,
               s.name as school_name,
               (SELECT COUNT(*) FROM classes WHERE teacher_id = u.id) as class_count
        FROM users u
        LEFT JOIN schools s ON u.school_id = s.id
        WHERE u.role = 'teacher'
        ORDER BY u.created_at DESC
    `).all();

    return c.json({ teachers: teachers.results || [] });
});

export { app as teacherRoutes };
