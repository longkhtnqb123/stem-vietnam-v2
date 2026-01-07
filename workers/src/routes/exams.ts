// Chú thích: Exams Routes cho Hono
import { Hono } from 'hono';
import type { Env } from '../types';
import {
    getExams as getExamsHandler,
    getExam as getExamHandler,
    createExam as createExamHandler,
    deleteExam as deleteExamHandler
} from '../exam-routes';

const examsRoutes = new Hono<{ Bindings: Env }>();

// GET /api/exams
examsRoutes.get('/', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const response = await getExamsHandler(user, c.env as any);
    return response;
});

// GET /api/exams/:id
examsRoutes.get('/:id', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const response = await getExamHandler(id, user, c.env as any);
    return response;
});

// POST /api/exams
examsRoutes.post('/', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const response = await createExamHandler(c.req.raw, user, c.env as any);
    return response;
});

// DELETE /api/exams/:id
examsRoutes.delete('/:id', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const response = await deleteExamHandler(id, user, c.env as any);
    return response;
});

export default examsRoutes;
