import { Env } from './index';
import { hashPassword, verifyPassword, createJWT, verifyJWT, generateId, JWTPayload } from './auth';
import { jsonResponse, getAllowedOrigin } from './utils';

export type AuthEnv = Env;

// Helper to get allowed origin inside routes
function getOrigin(request: Request, env: Env): string {
    return getAllowedOrigin(request.headers.get('Origin'), env.CORS_ORIGIN);
}

export async function handleRegister(request: Request, env: AuthEnv): Promise<Response> {
    const origin = getOrigin(request, env);
    try {
        const body = await request.json() as { email?: string; password?: string; name?: string };
        const { email, password, name } = body;

        if (!email || !password || !name) {
            return jsonResponse({ error: 'Email, password và name là bắt buộc' }, 400, origin);
        }

        if (password.length < 6) {
            return jsonResponse({ error: 'Password phải có ít nhất 6 ký tự' }, 400, origin);
        }

        // Check existing
        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
        if (existing) {
            return jsonResponse({ error: 'Email đã được sử dụng' }, 409, origin);
        }

        const userId = generateId();
        const passwordHash = await hashPassword(password);
        const now = Date.now();

        await env.DB.prepare(
            'INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(userId, email.toLowerCase(), passwordHash, name, now, now).run();

        return jsonResponse({ success: true, message: 'Đăng ký thành công!' }, 201, origin);

    } catch (error: any) {
        console.error('[auth] register error:', error);
        return jsonResponse({ error: 'Lỗi server', details: error.message }, 500, origin);
    }
}

export async function handleLogin(request: Request, env: AuthEnv): Promise<Response> {
    const origin = getOrigin(request, env);
    try {
        const body = await request.json() as { email?: string; password?: string };
        const { email, password } = body;

        if (!email || !password) {
            return jsonResponse({ error: 'Email và password là bắt buộc' }, 400, origin);
        }

        const user = await env.DB.prepare(
            'SELECT id, email, password_hash, name, avatar_url FROM users WHERE email = ?'
        ).bind(email.toLowerCase()).first<{ id: string; email: string; password_hash: string; name: string; avatar_url: string | null }>();

        if (!user || !(await verifyPassword(password, user.password_hash))) {
            return jsonResponse({ error: 'Email hoặc password không đúng' }, 401, origin);
        }

        const token = await createJWT({
            sub: user.id,
            email: user.email,
            name: user.name
        }, env.JWT_SECRET);

        return jsonResponse({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar_url: user.avatar_url
            }
        }, 200, origin);

    } catch (error: any) {
        console.error('[auth] login error:', error);
        return jsonResponse({ error: 'Lỗi server', details: error.message }, 500, origin);
    }
}

export async function handleMe(request: Request, env: AuthEnv): Promise<Response> {
    const origin = getOrigin(request, env);
    try {
        const payload = await getUserFromToken(request, env);
        if (!payload) {
            return jsonResponse({ error: 'Unauthorized' }, 401, origin);
        }

        const user = await env.DB.prepare(
            'SELECT id, email, name, avatar_url FROM users WHERE id = ?'
        ).bind(payload.sub).first<{ id: string; email: string; name: string; avatar_url: string | null }>();

        if (!user) {
            return jsonResponse({ error: 'User không tồn tại' }, 404, origin);
        }

        return jsonResponse({ user }, 200, origin);

    } catch (error: any) {
        console.error('[auth] me error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, origin);
    }
}

export async function getUserFromToken(request: Request, env: AuthEnv): Promise<JWTPayload | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    return verifyJWT(token, env.JWT_SECRET);
}
