// Chú thích: CORS Middleware cho Hono
import { cors } from 'hono/cors';
import type { MiddlewareHandler } from 'hono';

// Chú thích: Factory function để tạo CORS middleware với origin từ env
export function createCorsMiddleware(corsOrigin: string): MiddlewareHandler {
    return cors({
        origin: corsOrigin || '*',
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-User-OpenRouter-Key', 'X-User-HF-Token', 'X-User-Model', 'X-User-Provider'],
        exposeHeaders: ['Content-Length'],
        maxAge: 86400,
        credentials: true,
    });
}
