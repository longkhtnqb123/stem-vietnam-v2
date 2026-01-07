// Chú thích: Admin Routes cho Hono
import { Hono } from 'hono';
import type { Env } from '../types';
import {
    getUsers,
    getUser,
    deleteUser,
    updateUser,
    getStats,
    getAdminConversations,
    getAdminConversation,
    deleteAdminConversation
} from '../admin-routes';
import { searchVectors, buildContextFromResults } from '../vectorize';

const adminRoutes = new Hono<{ Bindings: Env }>();

// GET /api/admin/users
adminRoutes.get('/users', async (c) => {
    const response = await getUsers(c.env as any);
    return response;
});

// GET /api/admin/users/:id
adminRoutes.get('/users/:id', async (c) => {
    const id = c.req.param('id');
    const response = await getUser(id, c.env as any);
    return response;
});

// PUT /api/admin/users/:id
adminRoutes.put('/users/:id', async (c) => {
    const id = c.req.param('id');
    const response = await updateUser(id, c.req.raw, c.env as any);
    return response;
});

// DELETE /api/admin/users/:id
adminRoutes.delete('/users/:id', async (c) => {
    const id = c.req.param('id');
    const response = await deleteUser(id, c.env as any);
    return response;
});

// GET /api/admin/stats
adminRoutes.get('/stats', async (c) => {
    const response = await getStats(c.env as any);
    return response;
});

// GET /api/admin/conversations
adminRoutes.get('/conversations', async (c) => {
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '20', 10);
    const response = await getAdminConversations(c.env as any, page, limit);
    return response;
});

// GET /api/admin/conversations/:id
adminRoutes.get('/conversations/:id', async (c) => {
    const id = c.req.param('id');
    const response = await getAdminConversation(id, c.env as any);
    return response;
});

// DELETE /api/admin/conversations/:id
adminRoutes.delete('/conversations/:id', async (c) => {
    const id = c.req.param('id');
    const response = await deleteAdminConversation(id, c.env as any);
    return response;
});

// POST /api/admin/rag/search
adminRoutes.post('/rag/search', async (c) => {
    if (!c.env.HF_API_TOKEN) {
        return c.json({ error: 'HF_API_TOKEN not configured' }, 400);
    }

    const body = await c.req.json<{ query: string; filters?: { grade?: string; subject?: string } }>();
    if (!body.query) {
        return c.json({ error: 'query is required' }, 400);
    }

    try {
        const results = await searchVectors(
            c.env.VECTORIZE,
            c.env.HF_API_TOKEN,
            body.query,
            body.filters
        );
        const context = buildContextFromResults(results);

        return c.json({
            success: true,
            results,
            context
        }, 200);
    } catch (error) {
        console.error('[admin] RAG search error:', error);
        return c.json({
            error: 'RAG search failed',
            details: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});

export default adminRoutes;
