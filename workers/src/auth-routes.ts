// Chú thích: Auth routes - Register, Login, Logout, Me
import { hashPassword, verifyPassword, createJWT, verifyJWT, generateId, JWTPayload } from './auth';

// Chú thích: D1 Database type
interface D1Database {
    prepare(query: string): D1PreparedStatement;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(column?: string): Promise<T | null>;
    run(): Promise<D1Result>;
    all<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Result<T = unknown> {
    results?: T[];
    success: boolean;
    error?: string;
    meta: object;
}

// Chú thích: User type from DB
interface User {
    id: string;
    email: string;
    password_hash: string;
    name: string;
    avatar_url: string | null;
    created_at: number;
}

// Chú thích: Auth Env
export interface AuthEnv {
    DB: D1Database;
    JWT_SECRET: string;
    CORS_ORIGIN: string;
}

// Chú thích: JSON response helper
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

// Chú thích: Get token from Authorization header
function getToken(request: Request): string | null {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7);
}

// Chú thích: Register endpoint
export async function handleRegister(request: Request, env: AuthEnv): Promise<Response> {
    try {
        const body = await request.json() as { email: string; password: string; name: string };
        const { email, password, name } = body;

        // Validation
        if (!email || !password || !name) {
            return jsonResponse({ error: 'Email, password và name là bắt buộc' }, 400, env.CORS_ORIGIN);
        }

        if (password.length < 6) {
            return jsonResponse({ error: 'Password phải có ít nhất 6 ký tự' }, 400, env.CORS_ORIGIN);
        }

        // Check if email exists
        const existing = await env.DB.prepare(
            'SELECT id FROM users WHERE email = ?'
        ).bind(email.toLowerCase()).first();

        if (existing) {
            return jsonResponse({ error: 'Email đã được sử dụng' }, 409, env.CORS_ORIGIN);
        }

        // Create user
        const userId = generateId();
        const passwordHash = await hashPassword(password);

        await env.DB.prepare(
            'INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(userId, email.toLowerCase(), passwordHash, name, Date.now(), Date.now()).run();

        return jsonResponse({
            success: true,
            message: 'Đăng ký thành công! Vui lòng đăng nhập.'
        }, 201, env.CORS_ORIGIN);

    } catch (error) {
        console.error('[auth] register error:', error);
        return jsonResponse({
            error: 'Lỗi server',
            details: error instanceof Error ? error.message : String(error)
        }, 500, env.CORS_ORIGIN);
    }
}

// Chú thích: Login endpoint
export async function handleLogin(request: Request, env: AuthEnv): Promise<Response> {
    try {
        if (!env.JWT_SECRET) {
            console.error('[auth] Critical error: JWT_SECRET is missing in environment variables');
            return jsonResponse({ error: 'Server configuration error' }, 500, env.CORS_ORIGIN);
        }

        const body = await request.json() as { email: string; password: string };
        const { email, password } = body;

        if (!email || !password) {
            return jsonResponse({ error: 'Email và password là bắt buộc' }, 400, env.CORS_ORIGIN);
        }

        // Find user
        const user = await env.DB.prepare(
            'SELECT id, email, password_hash, name, avatar_url FROM users WHERE email = ?'
        ).bind(email.toLowerCase()).first<User>();

        if (!user) {
            console.log('[auth] Login failed: User not found for email', email);
            return jsonResponse({ error: 'Email hoặc password không đúng' }, 401, env.CORS_ORIGIN);
        }

        // Verify password
        const valid = await verifyPassword(password, user.password_hash);
        if (!valid) {
            console.log('[auth] Login failed: Invalid password for user', email);
            return jsonResponse({ error: 'Email hoặc password không đúng' }, 401, env.CORS_ORIGIN);
        }

        // Create JWT
        const token = await createJWT({
            sub: user.id,
            email: user.email,
            name: user.name,
        }, env.JWT_SECRET);

        return jsonResponse({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar_url: user.avatar_url,
            }
        }, 200, env.CORS_ORIGIN);

    } catch (error) {
        console.error('[auth] login error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            error
        });
        return jsonResponse({
            error: 'Lỗi server',
            details: error instanceof Error ? error.message : String(error)
        }, 500, env.CORS_ORIGIN);
    }
}

// Chú thích: Get current user (verify token)
export async function handleMe(request: Request, env: AuthEnv): Promise<Response> {
    try {
        const token = getToken(request);
        if (!token) {
            return jsonResponse({ error: 'Unauthorized' }, 401, env.CORS_ORIGIN);
        }

        const payload = await verifyJWT(token, env.JWT_SECRET);
        if (!payload) {
            return jsonResponse({ error: 'Token không hợp lệ hoặc đã hết hạn' }, 401, env.CORS_ORIGIN);
        }

        // Get fresh user data
        const user = await env.DB.prepare(
            'SELECT id, email, name, avatar_url FROM users WHERE id = ?'
        ).bind(payload.sub).first<User>();

        if (!user) {
            return jsonResponse({ error: 'User không tồn tại' }, 404, env.CORS_ORIGIN);
        }

        return jsonResponse({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar_url: user.avatar_url,
            }
        }, 200, env.CORS_ORIGIN);

    } catch (error) {
        console.error('[auth] me error:', error);
        return jsonResponse({
            error: 'Lỗi server',
            details: error instanceof Error ? error.message : String(error)
        }, 500, env.CORS_ORIGIN);
    }
}

// Chú thích: Middleware to get user from token (returns null if not authenticated)
export async function getUserFromToken(request: Request, env: AuthEnv): Promise<JWTPayload | null> {
    const token = getToken(request);
    if (!token) return null;
    return verifyJWT(token, env.JWT_SECRET);
}
