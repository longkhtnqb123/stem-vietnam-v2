// Chú thích: Usage tracking routes - Theo dõi sử dụng AI
// Lưu và thống kê token usage cho mỗi user

import { jsonResponse } from './utils';

// Chú thích: Interface cho Env
interface UsageEnv {
    DB: D1Database;
    CORS_ORIGIN: string;
}

// Chú thích: Interface cho JWT payload
interface JWTPayload {
    sub: string;
    email: string;
    name: string;
}

// ==================== LOGGING ====================

// Chú thích: Log một lần gọi AI vào database
export async function logUsage(
    env: UsageEnv,
    userId: string,
    actionType: 'chat' | 'exam_generate' | 'rag_search',
    model: string,
    tokensIn: number,
    tokensOut: number,
    latencyMs: number
): Promise<void> {
    try {
        const id = crypto.randomUUID();
        await env.DB.prepare(`
            INSERT INTO usage_logs (id, user_id, action_type, model, tokens_in, tokens_out, latency_ms)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(id, userId, actionType, model, tokensIn, tokensOut, latencyMs).run();

        console.info('[usage] Logged:', { userId, actionType, model, tokensIn, tokensOut, latencyMs });
    } catch (error) {
        // Không throw error để không ảnh hưởng flow chính
        console.warn('[usage] Failed to log usage:', error);
    }
}

// ==================== STATS API ====================

// Chú thích: Interface cho thống kê
export interface UsageStats {
    summary: {
        totalCalls: number;
        totalTokensIn: number;
        totalTokensOut: number;
        totalTokens: number;
        avgLatency: number;
    };
    byAction: Array<{
        actionType: string;
        calls: number;
        tokensIn: number;
        tokensOut: number;
    }>;
    byModel: Array<{
        model: string;
        calls: number;
        tokensIn: number;
        tokensOut: number;
    }>;
    daily: Array<{
        date: string;
        calls: number;
        tokens: number;
    }>;
}

// GET /api/usage/stats - Lấy thống kê sử dụng AI của user
export async function getUsageStats(
    request: Request,
    user: JWTPayload,
    env: UsageEnv
): Promise<Response> {
    try {
        // 1. Tổng hợp tổng quan
        const summaryRes = await env.DB.prepare(`
            SELECT 
                COUNT(*) as total_calls,
                COALESCE(SUM(tokens_in), 0) as total_tokens_in,
                COALESCE(SUM(tokens_out), 0) as total_tokens_out,
                COALESCE(AVG(latency_ms), 0) as avg_latency
            FROM usage_logs
            WHERE user_id = ?
        `).bind(user.sub).first<{
            total_calls: number;
            total_tokens_in: number;
            total_tokens_out: number;
            avg_latency: number;
        }>();

        // 2. Phân tích theo action type
        const { results: byAction } = await env.DB.prepare(`
            SELECT 
                action_type,
                COUNT(*) as calls,
                COALESCE(SUM(tokens_in), 0) as tokens_in,
                COALESCE(SUM(tokens_out), 0) as tokens_out
            FROM usage_logs
            WHERE user_id = ?
            GROUP BY action_type
            ORDER BY calls DESC
        `).bind(user.sub).all();

        // 3. Phân tích theo model
        const { results: byModel } = await env.DB.prepare(`
            SELECT 
                model,
                COUNT(*) as calls,
                COALESCE(SUM(tokens_in), 0) as tokens_in,
                COALESCE(SUM(tokens_out), 0) as tokens_out
            FROM usage_logs
            WHERE user_id = ?
            GROUP BY model
            ORDER BY calls DESC
        `).bind(user.sub).all();

        // 4. Thống kê 7 ngày gần nhất
        const { results: daily } = await env.DB.prepare(`
            SELECT 
                date(created_at, 'unixepoch') as date,
                COUNT(*) as calls,
                COALESCE(SUM(tokens_in + tokens_out), 0) as tokens
            FROM usage_logs
            WHERE user_id = ? AND created_at > strftime('%s', 'now', '-7 days')
            GROUP BY date(created_at, 'unixepoch')
            ORDER BY date DESC
        `).bind(user.sub).all();

        const stats: UsageStats = {
            summary: {
                totalCalls: summaryRes?.total_calls || 0,
                totalTokensIn: summaryRes?.total_tokens_in || 0,
                totalTokensOut: summaryRes?.total_tokens_out || 0,
                totalTokens: (summaryRes?.total_tokens_in || 0) + (summaryRes?.total_tokens_out || 0),
                avgLatency: Math.round(summaryRes?.avg_latency || 0),
            },
            byAction: (byAction || []).map((a: any) => ({
                actionType: a.action_type,
                calls: a.calls,
                tokensIn: a.tokens_in,
                tokensOut: a.tokens_out,
            })),
            byModel: (byModel || []).map((m: any) => ({
                model: m.model,
                calls: m.calls,
                tokensIn: m.tokens_in,
                tokensOut: m.tokens_out,
            })),
            daily: (daily || []).map((d: any) => ({
                date: d.date,
                calls: d.calls,
                tokens: d.tokens,
            })),
        };

        return jsonResponse(stats, 200, env.CORS_ORIGIN);
    } catch (error) {
        console.error('[usage] getUsageStats error:', error);
        return jsonResponse({ error: 'Lỗi server' }, 500, env.CORS_ORIGIN);
    }
}
