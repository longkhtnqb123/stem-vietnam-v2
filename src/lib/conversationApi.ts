// Chú thích: API client cho Conversation CRUD - Sync localStorage ↔ D1 backend
const API_URL = (import.meta.env.VITE_API_URL || 'https://stem-vietnam-api.stu725114073.workers.dev').replace(/\/$/, '');

// Chú thích: Types matching backend schema
export interface ConversationAPI {
    id: string;
    title: string;
    created_at: number;
    updated_at: number;
}

export interface MessageAPI {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    attachments?: unknown[];
    created_at: number;
}

// Chú thích: Helper để lấy auth headers
function getAuthHeaders(token: string): HeadersInit {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

// Chú thích: Lấy danh sách conversations của user
export async function getConversations(token: string): Promise<ConversationAPI[]> {
    try {
        const res = await fetch(`${API_URL}/api/conversations`, {
            headers: getAuthHeaders(token),
        });

        if (!res.ok) {
            console.warn('[conversationApi] getConversations failed:', res.status);
            return [];
        }

        const data = await res.json();
        return data.conversations || [];
    } catch (error) {
        console.error('[conversationApi] getConversations error:', error);
        return [];
    }
}

// Chú thích: Lấy chi tiết 1 conversation với messages
export async function getConversation(
    id: string,
    token: string
): Promise<{ conversation: ConversationAPI; messages: MessageAPI[] } | null> {
    try {
        const res = await fetch(`${API_URL}/api/conversations/${id}`, {
            headers: getAuthHeaders(token),
        });

        if (!res.ok) {
            console.warn('[conversationApi] getConversation failed:', res.status);
            return null;
        }

        return await res.json();
    } catch (error) {
        console.error('[conversationApi] getConversation error:', error);
        return null;
    }
}

// Chú thích: Tạo conversation mới
export async function createConversation(
    title: string,
    token: string
): Promise<ConversationAPI | null> {
    try {
        const res = await fetch(`${API_URL}/api/conversations`, {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify({ title }),
        });

        if (!res.ok) {
            console.warn('[conversationApi] createConversation failed:', res.status);
            return null;
        }

        return await res.json();
    } catch (error) {
        console.error('[conversationApi] createConversation error:', error);
        return null;
    }
}

// Chú thích: Xóa conversation
export async function deleteConversation(
    id: string,
    token: string
): Promise<boolean> {
    try {
        const res = await fetch(`${API_URL}/api/conversations/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(token),
        });

        return res.ok;
    } catch (error) {
        console.error('[conversationApi] deleteConversation error:', error);
        return false;
    }
}

// Chú thích: Thêm message vào conversation
export async function addMessage(
    conversationId: string,
    message: { role: 'user' | 'assistant'; content: string; attachments?: unknown[] },
    token: string
): Promise<MessageAPI | null> {
    try {
        const res = await fetch(`${API_URL}/api/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify(message),
        });

        if (!res.ok) {
            console.warn('[conversationApi] addMessage failed:', res.status);
            return null;
        }

        return await res.json();
    } catch (error) {
        console.error('[conversationApi] addMessage error:', error);
        return null;
    }
}

// Chú thích: Batch sync - upload nhiều messages cùng lúc
export async function syncConversation(
    conversationId: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
    token: string
): Promise<boolean> {
    try {
        // Chú thích: Gửi từng message tuần tự (đơn giản hơn batch)
        for (const msg of messages) {
            const result = await addMessage(conversationId, msg, token);
            if (!result) {
                console.warn('[conversationApi] syncConversation: failed to add message');
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error('[conversationApi] syncConversation error:', error);
        return false;
    }
}
