// Chú thích: Chat Routes cho Hono - AI Chat, Stream, Generate, Feedback
import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import type { Env } from '../types';
import { callOpenRouter, streamOpenRouter, buildMessages, classifyQueryForModel, MODEL_ROUTES } from '../openrouter';
import { webSearch, formatSearchResultsAsContext } from '../duckduckgo';
import { getRAGContext } from '../rag-pipeline';
import { SYSTEM_PROMPTS, classifyQuery, generateSuggestions } from '../prompts';

const chatRoutes = new Hono<{ Bindings: Env }>();

// Chú thích: Helper để lấy API keys từ headers hoặc env
function getApiKeys(c: { req: { header: (name: string) => string | undefined }, env: Env }) {
    const userOpenRouterKey = c.req.header('X-User-OpenRouter-Key');
    const userHfToken = c.req.header('X-User-HF-Token');
    const userModel = c.req.header('X-User-Model');

    return {
        openRouterKey: userOpenRouterKey || c.env.OPENROUTER_API_KEY,
        hfToken: userHfToken || c.env.HF_API_TOKEN,
        userModel
    };
}

// POST /api/chat
chatRoutes.post('/chat', async (c) => {
    try {
        const { openRouterKey, hfToken, userModel } = getApiKeys(c);

        if (!openRouterKey) {
            return c.json({
                error: 'AI service not configured',
                details: 'Missing API Key. Please configure it in Settings.'
            }, 500);
        }

        const body = await c.req.json<{
            message: string;
            context?: string;
            systemPrompt?: string;
            images?: string[]; // Array of base64 data URIs
        }>();

        if (!body.message && (!body.images || body.images.length === 0)) {
            return c.json({ error: 'Message or Image is required' }, 400);
        }

        // Phân loại câu hỏi
        const queryType = classifyQuery(body.message);
        let ragContext = '';
        let sources: unknown[] = [];

        // RAG search nếu là câu hỏi học tập (chỉ search nếu có text)
        if (body.message && queryType === 'academic' && c.env.VECTORIZE && hfToken) {
            try {
                const ragResult = await getRAGContext(hfToken, c.env.VECTORIZE, body.message, undefined);
                ragContext = ragResult.context;
                sources = ragResult.sources;
            } catch (error) {
                console.warn('[chat] RAG search failed:', error);
            }
        }

        // Build context
        let fullContext = '';
        if (ragContext) {
            fullContext += `=== TÀI LIỆU THAM KHẢO TỪ SGK ===\n${ragContext}\n\n`;
        }
        if (body.context) {
            fullContext += body.context;
        }

        // Model routing
        const modelRouting = classifyQueryForModel(body.message);

        // Web search nếu cần
        if (body.message && modelRouting.useOnlineSearch) {
            try {
                const searchResult = await webSearch(body.message);
                const webSearchContext = formatSearchResultsAsContext(searchResult);
                if (webSearchContext) {
                    fullContext = webSearchContext + '\n' + fullContext;
                }
            } catch (error) {
                console.warn('[chat] Web search failed:', error);
            }
        }

        // Call OpenRouter
        const messages = buildMessages(
            body.systemPrompt || SYSTEM_PROMPTS.chat,
            body.message || "Hãy mô tả hình ảnh này.", // Default prompt if only image provided
            fullContext || undefined,
            body.images // Helper images
        );

        const result = await callOpenRouter(openRouterKey, {
            messages,
            model: userModel || modelRouting.model,
            useOnlineSearch: modelRouting.useOnlineSearch,
        });

        const suggestions = generateSuggestions(body.message, result.text, queryType);

        return c.json({
            success: true,
            response: result.text,
            sources: sources.length > 0 ? sources : undefined,
            queryType,
            suggestions,
            model: result.model,
        }, 200);

    } catch (error) {
        console.error('[chat] error:', error);
        return c.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// POST /api/chat/stream
chatRoutes.post('/chat/stream', async (c) => {
    const { openRouterKey, userModel } = getApiKeys(c);

    const body = await c.req.json<{
        message: string;
        context?: string;
        systemPrompt?: string;
        images?: string[]; // Array of base64 data URIs
    }>();

    if (!body.message && (!body.images || body.images.length === 0)) {
        return c.json({ error: 'Message or Image is required' }, 400);
    }

    const modelRouting = classifyQueryForModel(body.message || "Describe this image");
    const messages = buildMessages(
        body.systemPrompt || SYSTEM_PROMPTS.chat,
        body.message || "Describe this image",
        body.context,
        body.images
    );

    return stream(c, async (streamWriter) => {
        try {
            const generator = streamOpenRouter(openRouterKey || c.env.OPENROUTER_API_KEY, {
                messages,
                model: userModel || modelRouting.model,
                useOnlineSearch: modelRouting.useOnlineSearch,
            });

            for await (const chunk of generator) {
                await streamWriter.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            }
            await streamWriter.write('data: [DONE]\n\n');
        } catch (error) {
            await streamWriter.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
        }
    });
});

// POST /api/generate
chatRoutes.post('/generate', async (c) => {
    try {
        const body = await c.req.json<{
            topic: string;
            count?: number;
            difficulty?: 'easy' | 'medium' | 'hard';
        }>();

        if (!body.topic) {
            return c.json({ error: 'Topic is required' }, 400);
        }

        const count = body.count || 1;
        const difficulty = body.difficulty || 'medium';
        const { openRouterKey, hfToken } = getApiKeys(c);

        const userMessage = `Tạo ${count} câu hỏi trắc nghiệm về chủ đề: ${body.topic}\nĐộ khó: ${difficulty}\nTrả về dưới dạng JSON array.`;

        // RAG search
        let ragContext = '';
        let examStyleContext = '';
        let sourceChunks: unknown[] = [];

        if (c.env.VECTORIZE && hfToken) {
            try {
                const [knowledgeResult, styleResult] = await Promise.all([
                    getRAGContext(hfToken, c.env.VECTORIZE, body.topic, undefined),
                    getRAGContext(hfToken, c.env.VECTORIZE, `Đề thi kiểm tra trắc nghiệm ${body.topic}`, undefined)
                ]);
                ragContext = knowledgeResult.context;
                examStyleContext = styleResult.context;
                sourceChunks = [...knowledgeResult.sources, ...styleResult.sources];
            } catch (error) {
                console.warn('[generate] RAG search failed:', error);
            }
        }

        const systemInstructionWithContext = `
${SYSTEM_PROMPTS.generate}

=== TÀI LIỆU KIẾN THỨC (SGK) ===
${ragContext || '(Dựa vào Google Search)'}

=== ĐỀ THI MẪU THAM KHẢO (STYLE) ===
${examStyleContext || '(Không tìm thấy đề mẫu, hãy dùng format chuẩn Bộ GD&ĐT)'}
`;

        const messages = buildMessages(systemInstructionWithContext, userMessage);
        const result = await callOpenRouter(openRouterKey || c.env.OPENROUTER_API_KEY, {
            messages,
            model: MODEL_ROUTES.examGeneration,
            useOnlineSearch: true,
        });

        // Parse JSON
        let questions;
        try {
            const jsonMatch = result.text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                questions = JSON.parse(jsonMatch[0]);
            } else {
                questions = JSON.parse(result.text);
            }
        } catch {
            questions = [{ raw: result.text }];
        }

        return c.json({
            success: true,
            questions,
            sourceChunks: sourceChunks.length > 0 ? sourceChunks : undefined,
        }, 200);

    } catch (error) {
        console.error('[generate] error:', error);
        return c.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// POST /api/feedback
chatRoutes.post('/feedback', async (c) => {
    try {
        const body = await c.req.json<{
            messageId: string;
            helpful: boolean;
            reason?: string;
            userMessage?: string;
            aiResponse?: string;
        }>();

        if (!body.messageId) {
            return c.json({ error: 'messageId is required' }, 400);
        }

        // Lưu vào D1
        try {
            await c.env.DB.prepare(`
                INSERT INTO chat_feedback (id, message_id, helpful, reason, user_message, ai_response, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(
                crypto.randomUUID(),
                body.messageId,
                body.helpful ? 1 : 0,
                body.reason || null,
                body.userMessage || null,
                body.aiResponse || null,
                Date.now()
            ).run();
        } catch {
            // Tạo bảng nếu chưa có
            await c.env.DB.prepare(`
                CREATE TABLE IF NOT EXISTS chat_feedback (
                    id TEXT PRIMARY KEY,
                    message_id TEXT NOT NULL,
                    helpful INTEGER NOT NULL,
                    reason TEXT,
                    user_message TEXT,
                    ai_response TEXT,
                    created_at INTEGER NOT NULL
                )
            `).run();

            await c.env.DB.prepare(`
                INSERT INTO chat_feedback (id, message_id, helpful, reason, user_message, ai_response, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(
                crypto.randomUUID(),
                body.messageId,
                body.helpful ? 1 : 0,
                body.reason || null,
                body.userMessage || null,
                body.aiResponse || null,
                Date.now()
            ).run();
        }

        return c.json({
            success: true,
            message: 'Cảm ơn phản hồi của bạn!'
        }, 200);

    } catch (error) {
        console.error('[feedback] error:', error);
        return c.json({ error: 'Lỗi lưu phản hồi' }, 500);
    }
});

export default chatRoutes;
