// Chú thích: Types cho Chat Conversations
import type { ChatMessage } from './index';

export interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: number;
    updatedAt: number;
    context?: string; // Context (của đề thi, bài học...) để AI nhớ lâu dài
}

export interface ChatStore {
    conversations: Conversation[];
    activeConversationId: string | null;
}

// Chú thích: File attachment type
export interface FileAttachment {
    id: string;
    file: File;
    preview?: string; // base64 hoặc URL cho preview
    type: 'image' | 'document' | 'video' | 'audio' | 'other';
}
