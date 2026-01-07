// Chú thích: Auth Middleware cho Hono - JWT verification
import type { MiddlewareHandler, Context, Next } from 'hono';
import { verifyJWT, type JWTPayload } from '../auth';

// Chú thích: Extended Context với user info
declare module 'hono' {
    interface ContextVariableMap {
        user: JWTPayload | null;
    }
}

// Chú thích: Get token from Authorization header
function getToken(c: Context): string | null {
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7);
}

// Chú thích: Auth middleware - sets c.get('user') or null
export function authMiddleware(jwtSecret: string): MiddlewareHandler {
    return async (c: Context, next: Next) => {
        const token = getToken(c);
        if (token) {
            try {
                const payload = await verifyJWT(token, jwtSecret);
                c.set('user', payload);
            } catch {
                c.set('user', null);
            }
        } else {
            c.set('user', null);
        }
        await next();
    };
}

// Chú thích: Require auth middleware - trả 401 nếu không có user
export function requireAuth(): MiddlewareHandler {
    return async (c: Context, next: Next) => {
        const user = c.get('user');
        if (!user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        await next();
    };
}
