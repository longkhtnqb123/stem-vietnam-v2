// Chú thích: Admin API routes - Quản lý users (chỉ chạy local)
import { generateId } from './auth';

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

export interface AdminEnv {
    DB: D1Database;
    CORS_ORIGIN: string;
}

// Chú thích: User type
interface User {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    created_at: number;
    updated_at: number;
}

interface UserStats {
    total_users: number;
    total_conversations: number;
    total_messages: number;
}

// JSON response helper
function jsonResponse(data: unknown, status: number, origin: string): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
        },
    });
}

// Chú thích: Get all users
export async function getUsers(env: AdminEnv): Promise<Response> {
    try {
        const result = await env.DB.prepare(
            'SELECT id, email, name, avatar_url, created_at, updated_at FROM users ORDER BY created_at DESC'
        ).all<User>();

        return jsonResponse({
            users: result.results || []
        }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[admin] get users error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// Chú thích: Get user by ID with stats
export async function getUser(id: string, env: AdminEnv): Promise<Response> {
    try {
        const user = await env.DB.prepare(
            'SELECT id, email, name, avatar_url, created_at, updated_at FROM users WHERE id = ?'
        ).bind(id).first<User>();

        if (!user) {
            return jsonResponse({ error: 'User không tồn tại' }, 404, env.CORS_ORIGIN);
        }

        // Get user's conversation count
        const convoCount = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM conversations WHERE user_id = ?'
        ).bind(id).first<{ count: number }>();

        // Get user's message count
        const msgCount = await env.DB.prepare(
            `SELECT COUNT(*) as count FROM messages m 
             JOIN conversations c ON m.conversation_id = c.id 
             WHERE c.user_id = ?`
        ).bind(id).first<{ count: number }>();

        return jsonResponse({
            user,
            stats: {
                conversations: convoCount?.count || 0,
                messages: msgCount?.count || 0
            }
        }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[admin] get user error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// Chú thích: Delete user
export async function deleteUser(id: string, env: AdminEnv): Promise<Response> {
    try {
        const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(id).first();
        if (!user) {
            return jsonResponse({ error: 'User không tồn tại' }, 404, env.CORS_ORIGIN);
        }

        // Delete user (conversations and messages will cascade)
        await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

        return jsonResponse({ success: true, message: 'Đã xóa user' }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[admin] delete user error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// Chú thích: Update user
export async function updateUser(id: string, request: Request, env: AdminEnv): Promise<Response> {
    try {
        const body = await request.json() as { name?: string; email?: string };

        const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(id).first();
        if (!user) {
            return jsonResponse({ error: 'User không tồn tại' }, 404, env.CORS_ORIGIN);
        }

        const updates: string[] = [];
        const values: unknown[] = [];

        if (body.name) {
            updates.push('name = ?');
            values.push(body.name);
        }
        if (body.email) {
            updates.push('email = ?');
            values.push(body.email.toLowerCase());
        }

        if (updates.length === 0) {
            return jsonResponse({ error: 'Không có gì để cập nhật' }, 400, env.CORS_ORIGIN);
        }

        updates.push('updated_at = ?');
        values.push(Date.now());
        values.push(id);

        await env.DB.prepare(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
        ).bind(...values).run();

        return jsonResponse({ success: true, message: 'Đã cập nhật user' }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[admin] update user error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// Chú thích: Get dashboard stats
export async function getStats(env: AdminEnv): Promise<Response> {
    try {
        const users = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
        const convos = await env.DB.prepare('SELECT COUNT(*) as count FROM conversations').first<{ count: number }>();
        const msgs = await env.DB.prepare('SELECT COUNT(*) as count FROM messages').first<{ count: number }>();

        return jsonResponse({
            stats: {
                total_users: users?.count || 0,
                total_conversations: convos?.count || 0,
                total_messages: msgs?.count || 0
            }
        }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[admin] get stats error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// ================== CONVERSATIONS ADMIN ==================

// Chú thích: Types cho Conversations
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

// Chú thích: Lấy tất cả conversations (paginated)
export async function getAdminConversations(
    env: AdminEnv,
    page: number = 1,
    limit: number = 20
): Promise<Response> {
    try {
        const offset = (page - 1) * limit;

        // Chú thích: Join với users để lấy thông tin user
        const result = await env.DB.prepare(`
            SELECT c.id, c.user_id, c.title, c.created_at, c.updated_at,
                   u.name as user_name, u.email as user_email
            FROM conversations c
            LEFT JOIN users u ON c.user_id = u.id
            ORDER BY c.updated_at DESC
            LIMIT ? OFFSET ?
        `).bind(limit, offset).all<Conversation & { user_name: string; user_email: string }>();

        // Chú thích: Đếm tổng để pagination
        const countResult = await env.DB.prepare(
            'SELECT COUNT(*) as total FROM conversations'
        ).first<{ total: number }>();

        return jsonResponse({
            conversations: result.results || [],
            pagination: {
                page,
                limit,
                total: countResult?.total || 0,
                totalPages: Math.ceil((countResult?.total || 0) / limit)
            }
        }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[admin] get conversations error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// Chú thích: Lấy chi tiết 1 conversation với messages
export async function getAdminConversation(id: string, env: AdminEnv): Promise<Response> {
    try {
        const convo = await env.DB.prepare(`
            SELECT c.id, c.user_id, c.title, c.created_at, c.updated_at,
                   u.name as user_name, u.email as user_email
            FROM conversations c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `).bind(id).first<Conversation & { user_name: string; user_email: string }>();

        if (!convo) {
            return jsonResponse({ error: 'Conversation không tồn tại' }, 404, env.CORS_ORIGIN);
        }

        // Chú thích: Lấy messages
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
        console.error('[admin] get conversation error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}

// Chú thích: Xóa conversation (admin không cần check ownership)
export async function deleteAdminConversation(id: string, env: AdminEnv): Promise<Response> {
    try {
        const convo = await env.DB.prepare('SELECT id FROM conversations WHERE id = ?').bind(id).first();
        if (!convo) {
            return jsonResponse({ error: 'Conversation không tồn tại' }, 404, env.CORS_ORIGIN);
        }

        // Chú thích: Delete (messages will cascade do foreign key)
        await env.DB.prepare('DELETE FROM conversations WHERE id = ?').bind(id).run();

        return jsonResponse({ success: true, message: 'Đã xóa conversation' }, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[admin] delete conversation error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}
