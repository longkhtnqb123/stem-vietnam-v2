// Research Analytics API Routes
// Xử lý thu thập và xuất dữ liệu nghiên cứu

import { Hono } from 'hono';
import { Env } from './index';
import { verifyJWT } from './auth';

const app = new Hono<{ Bindings: Env }>();

// POST /api/research/log-event - Ghi log sự kiện (public, rate limited)
app.post('/log-event', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = authHeader ? await verifyJWT(authHeader, c.env.JWT_SECRET) : null;

    const { eventType, eventData, pageUrl, sessionId } = await c.req.json();

    if (!eventType) {
        return c.json({ error: 'Event type required' }, 400);
    }

    const id = crypto.randomUUID();
    const userAgent = c.req.header('User-Agent') || '';

    // Hash IP for privacy
    const cfIP = c.req.header('CF-Connecting-IP') || '';
    const ipHash = cfIP ? await hashIP(cfIP) : null;

    await c.env.DB.prepare(`
        INSERT INTO event_logs (id, user_id, session_id, event_type, event_data, page_url, user_agent, ip_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
        id,
        userId,
        sessionId || null,
        eventType,
        JSON.stringify(eventData || {}),
        pageUrl || null,
        userAgent,
        ipHash
    ).run();

    return c.json({ success: true, eventId: id });
});

// GET /api/research/stats - Thống kê tổng quan (Admin only)
app.get('/stats', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await c.env.DB.prepare(`SELECT role FROM users WHERE id = ?`).bind(userId).first();
    if (user?.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
    }

    // Tổng quan events
    const eventStats = await c.env.DB.prepare(`
        SELECT 
            event_type,
            COUNT(*) as count,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(DISTINCT session_id) as unique_sessions
        FROM event_logs
        WHERE created_at > ?
        GROUP BY event_type
        ORDER BY count DESC
    `).bind(Date.now() / 1000 - 30 * 24 * 60 * 60).all(); // Last 30 days

    // Daily active users
    const dauStats = await c.env.DB.prepare(`
        SELECT 
            date(created_at, 'unixepoch') as date,
            COUNT(DISTINCT user_id) as dau
        FROM event_logs
        WHERE created_at > ?
        GROUP BY date
        ORDER BY date DESC
        LIMIT 30
    `).bind(Date.now() / 1000 - 30 * 24 * 60 * 60).all();

    // User totals
    const userStats = await c.env.DB.prepare(`
        SELECT 
            COUNT(*) as total_users,
            SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
            SUM(CASE WHEN role = 'teacher' THEN 1 ELSE 0 END) as teachers
        FROM users
    `).first();

    // Exam stats
    const examStats = await c.env.DB.prepare(`
        SELECT 
            COUNT(*) as total_attempts,
            AVG(score) as avg_score,
            SUM(CASE WHEN score >= 5 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pass_rate
        FROM exam_attempts
        WHERE submitted_at IS NOT NULL
    `).first();

    return c.json({
        events: eventStats.results || [],
        dau: dauStats.results || [],
        users: userStats,
        exams: examStats
    });
});

// GET /api/research/surveys - Danh sách surveys
app.get('/surveys', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await c.env.DB.prepare(`SELECT role FROM users WHERE id = ?`).bind(userId).first();

    // Admin sees all, users see active ones for their role
    let surveys;
    if (user?.role === 'admin') {
        surveys = await c.env.DB.prepare(`
            SELECT s.*, 
                   (SELECT COUNT(*) FROM survey_responses WHERE survey_id = s.id) as response_count
            FROM surveys s
            ORDER BY s.created_at DESC
        `).all();
    } else {
        surveys = await c.env.DB.prepare(`
            SELECT s.* FROM surveys s
            WHERE s.is_active = TRUE 
            AND (s.target_role = 'all' OR s.target_role = ?)
            AND (s.expires_at IS NULL OR s.expires_at > ?)
            AND s.id NOT IN (SELECT survey_id FROM survey_responses WHERE user_id = ?)
        `).bind(user?.role || 'student', Date.now() / 1000, userId).all();
    }

    return c.json({ surveys: surveys.results || [] });
});

// POST /api/research/surveys - Tạo survey mới (Admin only)
app.post('/surveys', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await c.env.DB.prepare(`SELECT role FROM users WHERE id = ?`).bind(userId).first();
    if (user?.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
    }

    const { title, description, questions, targetRole, expiresInDays } = await c.req.json();

    if (!title || !questions || !Array.isArray(questions)) {
        return c.json({ error: 'Title and questions required' }, 400);
    }

    const id = crypto.randomUUID();
    const expiresAt = expiresInDays ? Date.now() / 1000 + (expiresInDays * 24 * 60 * 60) : null;

    await c.env.DB.prepare(`
        INSERT INTO surveys (id, title, description, questions, target_role, created_by, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, title, description || null, JSON.stringify(questions), targetRole || 'all', userId, expiresAt).run();

    return c.json({ success: true, surveyId: id });
});

// POST /api/research/surveys/:id/respond - Trả lời survey
app.post('/surveys/:id/respond', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const surveyId = c.req.param('id');
    const { answers } = await c.req.json();

    // Check if already responded
    const existing = await c.env.DB.prepare(`
        SELECT id FROM survey_responses WHERE survey_id = ? AND user_id = ?
    `).bind(surveyId, userId).first();

    if (existing) {
        return c.json({ error: 'Already responded' }, 400);
    }

    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
        INSERT INTO survey_responses (id, survey_id, user_id, answers)
        VALUES (?, ?, ?, ?)
    `).bind(id, surveyId, userId, JSON.stringify(answers)).run();

    return c.json({ success: true });
});

// GET /api/research/export/:type - Xuất dữ liệu (Admin only)
app.get('/export/:type', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await c.env.DB.prepare(`SELECT role FROM users WHERE id = ?`).bind(userId).first();
    if (user?.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
    }

    const exportType = c.req.param('type');
    const startDate = c.req.query('start');
    const endDate = c.req.query('end');

    let data: any[] = [];
    let query = '';

    switch (exportType) {
        case 'events':
            query = `SELECT * FROM event_logs WHERE created_at BETWEEN ? AND ? ORDER BY created_at`;
            break;
        case 'attempts':
            query = `
                SELECT ea.*, u.name as user_name, et.title as template_title
                FROM exam_attempts ea
                LEFT JOIN users u ON ea.user_id = u.id
                LEFT JOIN exam_templates et ON ea.template_id = et.id
                WHERE ea.created_at BETWEEN ? AND ?
            `;
            break;
        case 'users':
            query = `
                SELECT id, name, role, xp, level, streak, school_id, created_at
                FROM users
                WHERE created_at BETWEEN ? AND ?
            `;
            break;
        default:
            return c.json({ error: 'Invalid export type' }, 400);
    }

    const start = startDate ? new Date(startDate).getTime() / 1000 : 0;
    const end = endDate ? new Date(endDate).getTime() / 1000 : Date.now() / 1000;

    const result = await c.env.DB.prepare(query).bind(start, end).all();
    data = result.results || [];

    // Log export
    const exportId = crypto.randomUUID();
    await c.env.DB.prepare(`
        INSERT INTO research_exports (id, export_type, filters, record_count, created_by)
        VALUES (?, ?, ?, ?, ?)
    `).bind(exportId, exportType, JSON.stringify({ start, end }), data.length, userId).run();

    return c.json({
        exportId,
        type: exportType,
        recordCount: data.length,
        data
    });
});

// Helper function to hash IP
async function hashIP(ip: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + 'stem-vietnam-salt');
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

export { app as researchRoutes };
