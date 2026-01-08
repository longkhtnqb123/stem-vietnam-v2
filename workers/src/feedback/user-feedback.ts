// User Feedback System
// Chú thích: Collect thumbs up/down + comments

export interface UserFeedback {
    userId: string;
    queryId: string;
    rating: 'positive' | 'negative';
    comment?: string;
    timestamp: number;
}

/**
 * Save user feedback to D1
 */
export async function saveFeedback({
    db,
    userId,
    queryId,
    rating,
    comment
}: {
    db: D1Database;
    userId: string;
    queryId: string;
    rating: 'positive' | 'negative';
    comment?: string;
}): Promise<void> {
    try {
        await db.prepare(`
            INSERT INTO user_feedback (user_id, query_id, rating, comment, timestamp)
            VALUES (?, ?, ?, ?, ?)
        `).bind(userId, queryId, rating, comment || null, Date.now()).run();

        console.log('[Feedback] Saved:', { queryId, rating });
    } catch (error) {
        console.error('[Feedback] Save error:', error);
    }
}

/**
 * Get feedback statistics
 */
export async function getFeedbackStats({
    db,
    since
}: {
    db: D1Database;
    since?: number;
}): Promise<{
    totalFeedback: number;
    positiveCount: number;
    negativeCount: number;
    satisfactionRate: number;
}> {
    try {
        let query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN rating = 'positive' THEN 1 ELSE 0 END) as positive,
                SUM(CASE WHEN rating = 'negative' THEN 1 ELSE 0 END) as negative
            FROM user_feedback
        `;

        const bindings: number[] = [];
        if (since) {
            query += ' WHERE timestamp >= ?';
            bindings.push(since);
        }

        const result = await db.prepare(query).bind(...bindings).first();

        const total = (result?.total as number) || 0;
        const positive = (result?.positive as number) || 0;
        const negative = (result?.negative as number) || 0;

        return {
            totalFeedback: total,
            positiveCount: positive,
            negativeCount: negative,
            satisfactionRate: total > 0 ? positive / total : 0
        };
    } catch (error) {
        console.error('[Feedback] Stats error:', error);
        return {
            totalFeedback: 0,
            positiveCount: 0,
            negativeCount: 0,
            satisfactionRate: 0
        };
    }
}
