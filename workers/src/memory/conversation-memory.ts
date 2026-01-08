// Conversation Memory - Remember past conversations
// Chú thích: Long-term memory giúp AI nhớ user preferences và context

export interface ConversationMemory {
    userId: string;
    sessionId: string;
    summary: string; // Tóm tắt cuộc trò chuyện
    keyPoints: string[]; // Điểm chính user đã nói
    preferences: Record<string, any>; // User preferences
    topics: string[]; // Topics discussed
    createdAt: number;
    updatedAt: number;
}

export interface MessageSummary {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

/**
 * Save conversation memory to D1
 */
export async function saveConversationMemory({
    db,
    userId,
    sessionId,
    messages,
    apiKey
}: {
    db: D1Database;
    userId: string;
    sessionId: string;
    messages: MessageSummary[];
    apiKey: string;
}): Promise<void> {
    try {
        // Summarize conversation
        const summary = await summarizeConversation(messages, apiKey);

        // Extract key points
        const keyPoints = await extractKeyPoints(messages, apiKey);

        // Detect topics
        const topics = await detectTopics(messages, apiKey);

        const memory: ConversationMemory = {
            userId,
            sessionId,
            summary,
            keyPoints,
            preferences: {},
            topics,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        await db.prepare(`
            INSERT INTO conversation_memory (user_id, session_id, summary, key_points, preferences, topics, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, session_id) DO UPDATE SET
                summary = excluded.summary,
                key_points = excluded.key_points,
                topics = excluded.topics,
                updated_at = excluded.updated_at
        `).bind(
            userId,
            sessionId,
            summary,
            JSON.stringify(keyPoints),
            JSON.stringify(memory.preferences),
            JSON.stringify(topics),
            memory.createdAt,
            memory.updatedAt
        ).run();

        console.log('[Memory] Saved:', { userId, sessionId, keyPoints: keyPoints.length });
    } catch (error) {
        console.error('[Memory] Save error:', error);
    }
}

/**
 * Load conversation memory for user
 */
export async function loadConversationMemory({
    db,
    userId,
    limit = 5
}: {
    db: D1Database;
    userId: string;
    limit?: number;
}): Promise<ConversationMemory[]> {
    try {
        const results = await db.prepare(`
            SELECT * FROM conversation_memory
            WHERE user_id = ?
            ORDER BY updated_at DESC
            LIMIT ?
        `).bind(userId, limit).all();

        return results.results.map(row => ({
            userId: row.user_id as string,
            sessionId: row.session_id as string,
            summary: row.summary as string,
            keyPoints: JSON.parse(row.key_points as string),
            preferences: JSON.parse(row.preferences as string),
            topics: JSON.parse(row.topics as string),
            createdAt: row.created_at as number,
            updatedAt: row.updated_at as number
        }));
    } catch (error) {
        console.error('[Memory] Load error:', error);
        return [];
    }
}

/**
 * Summarize conversation
 */
async function summarizeConversation(messages: MessageSummary[], apiKey: string): Promise<string> {
    if (messages.length === 0) return '';

    const { callOpenRouter } = await import('../openrouter');

    const conversationText = messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

    const prompt = `Tóm tắt cuộc trò chuyện sau trong 2-3 câu:

${conversationText}

Tóm tắt:`;

    try {
        const response = await callOpenRouter(apiKey, {
            messages: [{ role: 'user', content: prompt }],
            model: 'google/gemini-2.0-flash-exp:free'
        });

        return response.text.trim();
    } catch (error) {
        console.error('[Memory] Summarize error:', error);
        return 'Cuộc trò chuyện về nhiều chủ đề.';
    }
}

/**
 * Extract key points from conversation
 */
async function extractKeyPoints(messages: MessageSummary[], apiKey: string): Promise<string[]> {
    if (messages.length === 0) return [];

    const { callOpenRouter } = await import('../openrouter');

    const conversationText = messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

    const prompt = `Liệt kê các điểm chính user đã nói/hỏi trong cuộc trò chuyện:

${conversationText}

Format: JSON array ["điểm 1", "điểm 2", ...]
Chỉ trả về JSON, không thêm text khác:`;

    try {
        const response = await callOpenRouter(apiKey, {
            messages: [{ role: 'user', content: prompt }],
            model: 'google/gemini-2.0-flash-exp:free'
        });

        const jsonMatch = response.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return [];
    } catch (error) {
        console.error('[Memory] Extract key points error:', error);
        return [];
    }
}

/**
 * Detect topics discussed
 */
async function detectTopics(messages: MessageSummary[], apiKey: string): Promise<string[]> {
    if (messages.length === 0) return [];

    const { callOpenRouter } = await import('../openrouter');

    const conversationText = messages
        .map(m => m.content)
        .join(' ');

    const prompt = `Xác định các chủ đề chính được thảo luận:

${conversationText}

Format: JSON array ["chủ đề 1", "chủ đề 2", ...]
Tối đa 5 chủ đề. Chỉ trả về JSON:`;

    try {
        const response = await callOpenRouter(apiKey, {
            messages: [{ role: 'user', content: prompt }],
            model: 'google/gemini-2.0-flash-exp:free'
        });

        const jsonMatch = response.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return [];
    } catch (error) {
        console.error('[Memory] Detect topics error:', error);
        return [];
    }
}

/**
 * Build context from memory for new conversation
 */
export function buildMemoryContext(memories: ConversationMemory[]): string {
    if (memories.length === 0) return '';

    const context = memories.map(m => `
**Session ${new Date(m.createdAt).toLocaleDateString()}**:
- Tóm tắt: ${m.summary}
- Đã hỏi về: ${m.keyPoints.slice(0, 3).join(', ')}
- Topics: ${m.topics.join(', ')}
`).join('\n');

    return `=== LỊCH SỬ TRÒ CHUYỆN TRƯỚC ===\n${context}\n`;
}
