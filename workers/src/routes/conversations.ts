// Chú thích: Conversations Routes cho Hono
import { Hono } from 'hono';
import type { Env } from '../types';
import {
    getConversations as getConvosHandler,
    getConversation as getConvoHandler,
    createConversation as createConvoHandler,
    deleteConversation as deleteConvoHandler,
    addMessageFromRequest
} from '../conversation-routes';

const conversationsRoutes = new Hono<{ Bindings: Env }>();

// GET /api/conversations
conversationsRoutes.get('/', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    // Chú thích: Gọi handler cũ, nhưng cần convert response
    const response = await getConvosHandler(user, c.env as any);
    return response;
});

// GET /api/conversations/:id
conversationsRoutes.get('/:id', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const response = await getConvoHandler(id, user, c.env as any);
    return response;
});

// POST /api/conversations
conversationsRoutes.post('/', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const response = await createConvoHandler(c.req.raw, user, c.env as any);
    return response;
});

// DELETE /api/conversations/:id
conversationsRoutes.delete('/:id', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const response = await deleteConvoHandler(id, user, c.env as any);
    return response;
});

// POST /api/conversations/:id/messages
conversationsRoutes.post('/:id/messages', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const response = await addMessageFromRequest(id, c.req.raw, user, c.env as any);
    return response;
});

export default conversationsRoutes;
