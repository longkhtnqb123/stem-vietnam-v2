import { useSettingsStore } from '../stores/settingsStore';

// Chú thích: Lấy API URL từ environment hoặc dùng URL đã deploy
const API_URL = (import.meta.env.VITE_API_URL || 'https://stem-vietnam-api.stu725114073.workers.dev').replace(/\/$/, '');

// Chú thích: Helper to get auth headers from store
function getAuthHeaders() {
    const state = useSettingsStore.getState();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (state.provider !== 'default') {
        headers['X-User-Provider'] = state.provider;
        if (state.selectedModel) {
            headers['X-User-Model'] = state.selectedModel;
        }
    }

    if (state.openRouterKey) {
        headers['X-User-OpenRouter-Key'] = state.openRouterKey;
    }

    if (state.hfToken) {
        headers['X-User-HF-Token'] = state.hfToken;
    }

    return headers;
}

// Chú thích: Interface cho response
export interface ChatResponse {
    success: boolean;
    response?: string;
    error?: string;
    suggestions?: string[]; // Chú thích: Gợi ý câu hỏi tiếp theo từ AI
}

export interface GenerateResponse {
    success: boolean;
    questions?: Array<{
        question: string;
        options: string[];
        correct: number;
        explanation: string;
        source_type?: 'SGK' | 'Search'; // Nguồn: SGK hoặc Google Search
    }>;
    sourceChunks?: Array<{
        content: string;
        source: string;
    }>;
    error?: string;
}

// Chú thích: Gửi tin nhắn chat đến backend
export async function sendChatMessage(
    message: string,
    context?: string,
    systemPrompt?: string // Chú thích: Cho phép gửi systemPrompt tùy chỉnh từ frontend
): Promise<ChatResponse> {
    try {
        const response = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ message, context, systemPrompt }),
        });

        const data = await response.json();
        return data as ChatResponse;
    } catch (error) {
        console.error('[api] chat error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

// Chú thích: Stream chat response (Server-Sent Events)
export async function* streamChatMessage(
    message: string,
    context?: string,
    systemPrompt?: string // Chú thích: Cho phép gửi systemPrompt tùy chỉnh
): AsyncGenerator<string> {
    try {
        const response = await fetch(`${API_URL}/api/chat/stream`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ message, context, systemPrompt }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body');
        }

        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        return;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.text) {
                            yield parsed.text;
                        }
                    } catch {
                        // Chú thích: Skip invalid JSON
                    }
                }
            }
        }
    } catch (error) {
        console.error('[api] stream error:', error);
        throw error;
    }
}

// Chú thích: Tạo câu hỏi trắc nghiệm
export async function generateQuestions(
    topic: string,
    count: number = 1,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<GenerateResponse> {
    try {
        const response = await fetch(`${API_URL}/api/generate`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ topic, count, difficulty }),
        });

        const data = await response.json();
        return data as GenerateResponse;
    } catch (error) {
        console.error('[api] generate error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

// Chú thích: Health check
export async function checkApiHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        return data.status === 'ok';
    } catch {
        return false;
    }
}
