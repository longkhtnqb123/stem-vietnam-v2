// School Management API Routes
// Xử lý quản lý trường học cho Phase 4 Multi-School

import { Hono } from 'hono';
import { Bindings } from './types';
import { verifyJWT } from './auth-routes';

const app = new Hono<{ Bindings: Bindings }>();

// GET /api/schools - Danh sách trường (Admin only)
app.get('/', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await c.env.DB.prepare(`SELECT role FROM users WHERE id = ?`).bind(userId).first();
    if (user?.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
    }

    const schools = await c.env.DB.prepare(`
        SELECT s.*, 
               u.name as admin_name,
               (SELECT COUNT(*) FROM users WHERE school_id = s.id AND role = 'teacher') as teacher_count,
               (SELECT COUNT(*) FROM classes c 
                JOIN users t ON c.teacher_id = t.id 
                WHERE t.school_id = s.id) as class_count
        FROM schools s
        LEFT JOIN users u ON s.admin_id = u.id
        ORDER BY s.created_at DESC
    `).all();

    return c.json({ schools: schools.results || [] });
});

// POST /api/schools - Tạo trường mới (Admin only)
app.post('/', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await c.env.DB.prepare(`SELECT role FROM users WHERE id = ?`).bind(userId).first();
    if (user?.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
    }

    const { name, code, address, contactEmail, contactPhone, adminId } = await c.req.json();

    if (!name) {
        return c.json({ error: 'School name is required' }, 400);
    }

    const id = crypto.randomUUID();
    const schoolCode = code || `SCH-${id.substring(0, 6).toUpperCase()}`;

    await c.env.DB.prepare(`
        INSERT INTO schools (id, name, code, address, contact_email, contact_phone, admin_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, name, schoolCode, address || null, contactEmail || null, contactPhone || null, adminId || null).run();

    return c.json({
        success: true,
        school: { id, name, code: schoolCode, address, contactEmail, contactPhone, adminId }
    });
});

// GET /api/schools/:id - Chi tiết trường
app.get('/:id', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const schoolId = c.req.param('id');

    const school = await c.env.DB.prepare(`
        SELECT s.*, u.name as admin_name
        FROM schools s
        LEFT JOIN users u ON s.admin_id = u.id
        WHERE s.id = ?
    `).bind(schoolId).first();

    if (!school) {
        return c.json({ error: 'School not found' }, 404);
    }

    // Lấy danh sách giáo viên của trường
    const teachers = await c.env.DB.prepare(`
        SELECT id, name, email, teacher_code, created_at,
               (SELECT COUNT(*) FROM classes WHERE teacher_id = users.id) as class_count
        FROM users
        WHERE school_id = ? AND role = 'teacher'
        ORDER BY name
    `).bind(schoolId).all();

    // Thống kê tổng quan
    const stats = await c.env.DB.prepare(`
        SELECT 
            (SELECT COUNT(*) FROM users WHERE school_id = ? AND role = 'teacher') as teacher_count,
            (SELECT COUNT(*) FROM classes WHERE teacher_id IN (SELECT id FROM users WHERE school_id = ?)) as class_count,
            (SELECT COUNT(*) FROM class_members WHERE class_id IN 
                (SELECT id FROM classes WHERE teacher_id IN (SELECT id FROM users WHERE school_id = ?))) as student_count
    `).bind(schoolId, schoolId, schoolId).first();

    return c.json({
        school,
        teachers: teachers.results || [],
        stats
    });
});

// GET /api/schools/:id/analytics - Thống kê chi tiết cho trường
app.get('/:id/analytics', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const schoolId = c.req.param('id');

    // Kiểm tra quyền (admin hoặc school admin)
    const user = await c.env.DB.prepare(`SELECT role, school_id FROM users WHERE id = ?`).bind(userId).first();
    const school = await c.env.DB.prepare(`SELECT admin_id FROM schools WHERE id = ?`).bind(schoolId).first();

    if (user?.role !== 'admin' && school?.admin_id !== userId) {
        return c.json({ error: 'Access denied' }, 403);
    }

    // Lấy tất cả class IDs của trường
    const classesResult = await c.env.DB.prepare(`
        SELECT c.id FROM classes c
        JOIN users t ON c.teacher_id = t.id
        WHERE t.school_id = ?
    `).bind(schoolId).all();

    const classIds = (classesResult.results || []).map((c: any) => c.id);

    if (classIds.length === 0) {
        return c.json({
            avgScore: 0,
            totalExams: 0,
            passRate: 0,
            topClasses: [],
            weeklyProgress: []
        });
    }

    // Thống kê điểm trung bình, tổng bài thi
    const overallStats = await c.env.DB.prepare(`
        SELECT 
            AVG(score) as avg_score,
            COUNT(*) as total_exams,
            SUM(CASE WHEN score >= 5 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pass_rate
        FROM exam_attempts
        WHERE class_id IN (${classIds.map(() => '?').join(',')})
        AND submitted_at IS NOT NULL
    `).bind(...classIds).first();

    // Top classes by average score
    const topClasses = await c.env.DB.prepare(`
        SELECT 
            c.id, c.name,
            u.name as teacher_name,
            AVG(ea.score) as avg_score,
            COUNT(ea.id) as attempt_count
        FROM classes c
        JOIN users u ON c.teacher_id = u.id
        LEFT JOIN exam_attempts ea ON ea.class_id = c.id AND ea.submitted_at IS NOT NULL
        WHERE u.school_id = ?
        GROUP BY c.id
        HAVING attempt_count > 0
        ORDER BY avg_score DESC
        LIMIT 5
    `).bind(schoolId).all();

    return c.json({
        avgScore: overallStats?.avg_score || 0,
        totalExams: overallStats?.total_exams || 0,
        passRate: overallStats?.pass_rate || 0,
        topClasses: topClasses.results || []
    });
});

// PUT /api/schools/:id - Cập nhật thông tin trường
app.put('/:id', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const schoolId = c.req.param('id');
    const user = await c.env.DB.prepare(`SELECT role FROM users WHERE id = ?`).bind(userId).first();
    const school = await c.env.DB.prepare(`SELECT admin_id FROM schools WHERE id = ?`).bind(schoolId).first();

    if (user?.role !== 'admin' && school?.admin_id !== userId) {
        return c.json({ error: 'Access denied' }, 403);
    }

    const { name, address, contactEmail, contactPhone, adminId } = await c.req.json();

    await c.env.DB.prepare(`
        UPDATE schools 
        SET name = COALESCE(?, name),
            address = COALESCE(?, address),
            contact_email = COALESCE(?, contact_email),
            contact_phone = COALESCE(?, contact_phone),
            admin_id = COALESCE(?, admin_id)
        WHERE id = ?
    `).bind(name, address, contactEmail, contactPhone, adminId, schoolId).run();

    return c.json({ success: true });
});

// POST /api/schools/:id/assign-teacher - Gán giáo viên vào trường
app.post('/:id/assign-teacher', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const schoolId = c.req.param('id');
    const user = await c.env.DB.prepare(`SELECT role FROM users WHERE id = ?`).bind(userId).first();

    if (user?.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
    }

    const { teacherId, teacherCode } = await c.req.json();

    // Kiểm tra teacher tồn tại và có role teacher
    const teacher = await c.env.DB.prepare(`
        SELECT id, role FROM users WHERE id = ? AND role = 'teacher'
    `).bind(teacherId).first();

    if (!teacher) {
        return c.json({ error: 'Teacher not found' }, 404);
    }

    await c.env.DB.prepare(`
        UPDATE users SET school_id = ?, teacher_code = ? WHERE id = ?
    `).bind(schoolId, teacherCode || null, teacherId).run();

    return c.json({ success: true });
});

export { app as schoolRoutes };
