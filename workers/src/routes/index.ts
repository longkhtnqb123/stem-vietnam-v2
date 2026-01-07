// Chú thích: Main Hono App Entry Point
import { Hono } from 'hono';
import type { Env } from '../types';
import { createCorsMiddleware } from '../middleware/cors';
import { authMiddleware } from '../middleware/auth';

// Import routes
import authRoutes from './auth';
import chatRoutes from './chat';
import conversationsRoutes from './conversations';
import examsRoutes from './exams';
import adminRoutes from './admin';

const app = new Hono<{ Bindings: Env }>();

// Chú thích: Global middleware
app.use('*', async (c, next) => {
    // CORS
    const corsMiddleware = createCorsMiddleware(c.env.CORS_ORIGIN);
    await corsMiddleware(c, async () => { });

    // Auth (set user context)
    const authMw = authMiddleware(c.env.JWT_SECRET);
    await authMw(c, next);
});

// Chú thích: Health check
app.get('/', (c) => {
    return c.json({
        status: 'ok',
        service: 'stem-vietnam-api',
        provider: 'openrouter + huggingface',
        framework: 'hono',
        timestamp: new Date().toISOString(),
    });
});

app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        service: 'stem-vietnam-api',
        provider: 'openrouter + huggingface',
        framework: 'hono',
        timestamp: new Date().toISOString(),
    });
});

// Chú thích: Mount routes
app.route('/api/auth', authRoutes);
app.route('/api', chatRoutes);
app.route('/api/conversations', conversationsRoutes);
app.route('/api/exams', examsRoutes);
app.route('/api/admin', adminRoutes);

// Chú thích: 404 handler
app.notFound((c) => {
    return c.json({ error: 'Not Found' }, 404);
});

// Chú thích: Error handler
app.onError((err, c) => {
    console.error('[app] Unhandled error:', err);
    return c.json({
        error: 'Internal Server Error',
        details: err.message
    }, 500);
});

export default app;
