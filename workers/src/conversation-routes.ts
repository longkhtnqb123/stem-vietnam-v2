// Chú thích: Conversation routes - CRUD for chat history with D1
import { generateId } from './auth';
import { JWTPayload } from './auth';

// Chú thích: D1 types
interface D1Database {
    prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(): Promise<T | null>;
    run(): Promise<D1Result>;
    all<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Result<T = unknown> {
    results?: T[];
    success: boolean;
}

// Chú thích: Types
interface Conversation {
    id: string;
    user_id: string;
    title: string;
    created_at: number;
    updated_at: number;
}

interface Message {
    id: string;
    conversation_id: string;
    role: string;
    content: string;
    attachments: string | null;
    created_at: number;
}

export interface ConvoEnv {
    DB: D1Database;
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

// Chú thích: Get all conversations for user
export async function getConversations(user: JWTPayload, env: ConvoEnv): Promise<Response> {
    try {
        const result = await env.DB.prepare(
            'SELECT id, title, created_at, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC'
        ).bind(user.sub).all<Conversation>();

        return jsonResponse({
            conversations: result.results || []
        }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[convo] get error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// Chú thích: Get single conversation with messages
export async function getConversation(id: string, user: JWTPayload, env: ConvoEnv): Promise<Response> {
    try {
        // Check ownership
        const convo = await env.DB.prepare(
            'SELECT id, title, created_at, updated_at FROM conversations WHERE id = ? AND user_id = ?'
        ).bind(id, user.sub).first<Conversation>();

        if (!convo) {
            return jsonResponse({ error: 'Conversation không tồn tại' }, 404, env.CORS_ORIGIN);
        }

        // Get messages
        const messagesResult = await env.DB.prepare(
            'SELECT id, role, content, attachments, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
        ).bind(id).all<Message>();

        return jsonResponse({
            conversation: convo,
            messages: (messagesResult.results || []).map(m => ({
                ...m,
                attachments: m.attachments ? JSON.parse(m.attachments) : null
            }))
        }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[convo] get one error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// Chú thích: Create conversation
export async function createConversation(request: Request, user: JWTPayload, env: ConvoEnv): Promise<Response> {
    try {
        const body = await request.json() as { title?: string };
        const id = generateId();
        const now = Date.now();

        await env.DB.prepare(
            'INSERT INTO conversations (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(id, user.sub, body.title || 'Cuộc trò chuyện mới', now, now).run();

        return jsonResponse({
            id,
            title: body.title || 'Cuộc trò chuyện mới',
            created_at: now,
            updated_at: now
        }, 201, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[convo] create error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// Chú thích: Delete conversation
export async function deleteConversation(id: string, user: JWTPayload, env: ConvoEnv): Promise<Response> {
    try {
        // Check ownership
        const convo = await env.DB.prepare(
            'SELECT id FROM conversations WHERE id = ? AND user_id = ?'
        ).bind(id, user.sub).first();

        if (!convo) {
            return jsonResponse({ error: 'Conversation không tồn tại' }, 404, env.CORS_ORIGIN);
        }

        // Delete (messages will cascade)
        await env.DB.prepare('DELETE FROM conversations WHERE id = ?').bind(id).run();

        return jsonResponse({ success: true }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[convo] delete error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// Chú thích: Add message to conversation
export async function addMessage(
    conversationId: string,
    user: JWTPayload,
    message: { role: 'user' | 'assistant'; content: string; attachments?: unknown[] },
    env: ConvoEnv
): Promise<Response> {
    try {
        // Check ownership
        const convo = await env.DB.prepare(
            'SELECT id, title FROM conversations WHERE id = ? AND user_id = ?'
        ).bind(conversationId, user.sub).first<Conversation>();

        if (!convo) {
            return jsonResponse({ error: 'Conversation không tồn tại' }, 404, env.CORS_ORIGIN);
        }

        const id = generateId();
        const now = Date.now();

        await env.DB.prepare(
            'INSERT INTO messages (id, conversation_id, role, content, attachments, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(
            id,
            conversationId,
            message.role,
            message.content,
            message.attachments ? JSON.stringify(message.attachments) : null,
            now
        ).run();

        // Update conversation updated_at and title if first message
        let newTitle = convo.title;
        if (message.role === 'user' && convo.title === 'Cuộc trò chuyện mới') {
            newTitle = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
        }

        await env.DB.prepare(
            'UPDATE conversations SET updated_at = ?, title = ? WHERE id = ?'
        ).bind(now, newTitle, conversationId).run();

        return jsonResponse({
            id,
            role: message.role,
            content: message.content,
            created_at: now
        }, 201, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[convo] add message error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// Chú thích: HTTP handler để thêm message (POST /api/conversations/:id/messages)
export async function addMessageFromRequest(
    conversationId: string,
    request: Request,
    user: JWTPayload,
    env: ConvoEnv
): Promise<Response> {
    try {
        const body = await request.json() as {
            role: 'user' | 'assistant';
            content: string;
            attachments?: unknown[]
        };

        if (!body.role || !body.content) {
            return jsonResponse({ error: 'role và content là bắt buộc' }, 400, env.CORS_ORIGIN);
        }

        return addMessage(conversationId, user, body, env);
    } catch (error) {
        console.error('[convo] addMessageFromRequest error:', error);
        return jsonResponse({ error: 'Invalid JSON' }, 400, env.CORS_ORIGIN);
    }
}
