// Chú thích: Auth Routes cho Hono
import { Hono } from 'hono';
import { hashPassword, verifyPassword, createJWT, generateId } from '../auth';
import type { Env } from '../types';

// Chú thích: User type from DB
interface User {
    id: string;
    email: string;
    password_hash: string;
    name: string;
    avatar_url: string | null;
    created_at: number;
}

const authRoutes = new Hono<{ Bindings: Env }>();

// POST /api/auth/register
authRoutes.post('/register', async (c) => {
    try {
        const body = await c.req.json<{ email: string; password: string; name: string }>();
        const { email, password, name } = body;

        // Validation
        if (!email || !password || !name) {
            return c.json({ error: 'Email, password và name là bắt buộc' }, 400);
        }

        if (password.length < 6) {
            return c.json({ error: 'Password phải có ít nhất 6 ký tự' }, 400);
        }

        // Check if email exists
        const existing = await c.env.DB.prepare(
            'SELECT id FROM users WHERE email = ?'
        ).bind(email.toLowerCase()).first();

        if (existing) {
            return c.json({ error: 'Email đã được sử dụng' }, 409);
        }

        // Create user
        const userId = generateId();
        const passwordHash = await hashPassword(password);

        await c.env.DB.prepare(
            'INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(userId, email.toLowerCase(), passwordHash, name, Date.now(), Date.now()).run();

        return c.json({
            success: true,
            message: 'Đăng ký thành công! Vui lòng đăng nhập.'
        }, 201);

    } catch (error) {
        console.error('[auth] register error:', error);
        return c.json({
            error: 'Lỗi server',
            details: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});

// POST /api/auth/login
authRoutes.post('/login', async (c) => {
    try {
        if (!c.env.JWT_SECRET) {
            console.error('[auth] Critical error: JWT_SECRET is missing');
            return c.json({ error: 'Server configuration error' }, 500);
        }

        const body = await c.req.json<{ email: string; password: string }>();
        const { email, password } = body;

        if (!email || !password) {
            return c.json({ error: 'Email và password là bắt buộc' }, 400);
        }

        // Find user
        const user = await c.env.DB.prepare(
            'SELECT id, email, password_hash, name, avatar_url FROM users WHERE email = ?'
        ).bind(email.toLowerCase()).first<User>();

        if (!user) {
            return c.json({ error: 'Email hoặc password không đúng' }, 401);
        }

        // Verify password
        const valid = await verifyPassword(password, user.password_hash);
        if (!valid) {
            return c.json({ error: 'Email hoặc password không đúng' }, 401);
        }

        // Create JWT
        const token = await createJWT({
            sub: user.id,
            email: user.email,
            name: user.name,
        }, c.env.JWT_SECRET);

        return c.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar_url: user.avatar_url,
            }
        }, 200);

    } catch (error) {
        console.error('[auth] login error:', error);
        return c.json({
            error: 'Lỗi server',
            details: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});

// GET /api/auth/me
authRoutes.get('/me', async (c) => {
    try {
        const user = c.get('user');
        if (!user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        // Get fresh user data
        const dbUser = await c.env.DB.prepare(
            'SELECT id, email, name, avatar_url FROM users WHERE id = ?'
        ).bind(user.sub).first<User>();

        if (!dbUser) {
            return c.json({ error: 'User không tồn tại' }, 404);
        }

        return c.json({
            user: {
                id: dbUser.id,
                email: dbUser.email,
                name: dbUser.name,
                avatar_url: dbUser.avatar_url,
            }
        }, 200);

    } catch (error) {
        console.error('[auth] me error:', error);
        return c.json({
            error: 'Lỗi server',
            details: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});

export default authRoutes;
