// Chú thích: Entry point cho Cloudflare Workers API (OpenRouter + Auth + Conversations + Admin + RAG)
// Đã chuyển hoàn toàn từ Vertex AI sang OpenRouter + HuggingFace (miễn phí)
import { callOpenRouter, streamOpenRouter, buildMessages, classifyQueryForModel, MODEL_ROUTES, MODELS } from './openrouter';
import { webSearch, formatSearchResultsAsContext } from './duckduckgo';
import { handleRegister, handleLogin, handleMe, getUserFromToken, AuthEnv } from './auth-routes';
import { handleGetSettings, handleUpdateSettings, handleGetModels, handleRefreshModels } from './settings-routes';
import { getConversations, getConversation, createConversation, deleteConversation, addMessage, addMessageFromRequest, ConvoEnv } from './conversation-routes';
import {
    getExams,
    getExam,
    createExam,
    deleteExam
} from './exam-routes';
import { getUsers, getUser, deleteUser, updateUser, getStats, getAdminConversations, getAdminConversation, deleteAdminConversation, AdminEnv } from './admin-routes';
import { handleStorageRequest } from './storage-routes';
import { searchVectors, buildContextFromResults } from './vectorize';
import { getRAGContext } from './rag-pipeline';
import { getAdvancedRAGContext } from './rag/advanced-rag-pipeline';
import { isFileTypeSupported, isFileSizeValid, MAX_FILE_SIZE, getSupportedExtensions } from './file-parser';

// Chú thích: Environment interface (đã xoá Vertex AI, chuyển sang HuggingFace)
export interface Env {
    // OpenRouter API Key (BẮT BUỘC - set qua wrangler secret put)
    OPENROUTER_API_KEY: string;

    // HuggingFace API Token (cho embeddings RAG - miễn phí)
    // Chú thích: Lấy từ https://huggingface.co/settings/tokens
    HF_API_TOKEN: string;

    // JWT Secret for auth
    JWT_SECRET: string;

    // D1 Database
    DB: D1Database;

    // Vectorize (RAG Pipeline)
    VECTORIZE: VectorizeIndex;

    // CORS
    CORS_ORIGIN: string;

    // R2 Bucket
    BOOKS_BUCKET: R2Bucket;
}

// SYSTEM_PROMPTS moved to prompts.ts
import { SYSTEM_PROMPTS } from './prompts';
import { getAllowedOrigin, corsHeaders, jsonResponse } from './utils';

// Chú thích: Phân loại câu hỏi - học tập (academic) vs tổng quát (general)
// Nếu là câu hỏi học tập → sẽ dùng RAG context từ thư viện sách
function classifyQuery(query: string): 'academic' | 'general' {
    const queryLower = query.toLowerCase();

    // Chú thích: Keywords chỉ câu hỏi học tập / Công nghệ
    const academicKeywords = [
        // Môn Công nghệ
        'công nghệ', 'sgk', 'sách giáo khoa', 'bài học', 'chương',
        'mạng máy tính', 'lan', 'wan', 'tcp', 'ip', 'router', 'switch',
        'cpu', 'ram', 'rom', 'phần cứng', 'phần mềm',
        'thuật toán', 'lập trình', 'biến', 'hàm', 'mảng',
        'điện tử', 'điện trở', 'tụ điện', 'transistor', 'mạch',
        'cơ khí', 'gia công', 'máy tiện', 'máy phay',
        'trồng trọt', 'chăn nuôi', 'nông nghiệp', 'lâm nghiệp', 'thuỷ sản',
        // Keywords học tập
        'giải thích', 'định nghĩa', 'là gì', 'thế nào', 'so sánh',
        'công thức', 'tính toán', 'giải bài', 'bài tập',
        'lớp 10', 'lớp 11', 'lớp 12', 'thpt',
        'thi thử', 'đề thi', 'ôn tập',
    ];

    // Chú thích: Keywords chỉ câu hỏi tổng quát / tin tức
    const generalKeywords = [
        'hôm nay', 'thời tiết', 'tin tức', 'bóng đá', 'thể thao',
        'giá', 'tỷ giá', 'chứng khoán',
        'chào', 'xin chào', 'hello', 'hi',
        'cảm ơn', 'tạm biệt',
    ];

    // Check general keywords trước
    for (const kw of generalKeywords) {
        if (queryLower.includes(kw)) {
            return 'general';
        }
    }

    // Check academic keywords
    for (const kw of academicKeywords) {
        if (queryLower.includes(kw)) {
            return 'academic';
        }
    }

    // Mặc định: câu hỏi ngắn thường là general, dài hơn có thể là academic
    return query.length > 30 ? 'academic' : 'general';
}

// Chú thích: Tạo suggestions dựa trên câu hỏi và câu trả lời
function generateSuggestions(
    userMessage: string,
    aiResponse: string,
    queryType: 'academic' | 'general'
): string[] {
    const suggestions: string[] = [];
    const msgLower = userMessage.toLowerCase();
    const respLower = aiResponse.toLowerCase();

    // Chú thích: Gợi ý dựa trên loại câu hỏi
    if (queryType === 'academic') {
        // Gợi ý học thuật
        if (respLower.includes('mạng') || respLower.includes('lan') || respLower.includes('wan')) {
            suggestions.push('So sánh LAN và WAN?');
            suggestions.push('Router hoạt động thế nào?');
            suggestions.push('Giao thức TCP/IP là gì?');
        } else if (respLower.includes('cpu') || respLower.includes('ram') || respLower.includes('phần cứng')) {
            suggestions.push('So sánh RAM và ROM?');
            suggestions.push('Cách CPU xử lý dữ liệu?');
            suggestions.push('Thế nào là bộ nhớ cache?');
        } else if (respLower.includes('thuật toán') || respLower.includes('lập trình')) {
            suggestions.push('Thuật toán sắp xếp nào nhanh nhất?');
            suggestions.push('Phân biệt vòng lặp for và while?');
            suggestions.push('Big O notation là gì?');
        } else if (respLower.includes('điện') || respLower.includes('mạch')) {
            suggestions.push('Định luật Ohm là gì?');
            suggestions.push('Công thức tính điện trở?');
            suggestions.push('Transistor hoạt động thế nào?');
        } else if (respLower.includes('trồng trọt') || respLower.includes('nông nghiệp')) {
            suggestions.push('Các loại phân bón phổ biến?');
            suggestions.push('Kỹ thuật tưới tiêu hiện đại?');
            suggestions.push('Làm thế nào để chống sâu bệnh?');
        } else if (respLower.includes('chăn nuôi')) {
            suggestions.push('Dinh dưỡng cho gia súc?');
            suggestions.push('Phòng bệnh trong chăn nuôi?');
            suggestions.push('Chuồng trại tiêu chuẩn?');
        } else {
            // Gợi ý chung cho academic
            suggestions.push('Cho ví dụ cụ thể hơn?');
            suggestions.push('Giải thích chi tiết hơn?');
            suggestions.push('Có bài tập liên quan không?');
        }
    } else {
        // Gợi ý cho câu hỏi tổng quát
        if (msgLower.includes('tin tức') || msgLower.includes('hôm nay')) {
            suggestions.push('Tin tức công nghệ mới nhất?');
            suggestions.push('Sự kiện thể thao hôm nay?');
            suggestions.push('Thời tiết ngày mai?');
        } else if (msgLower.includes('chào') || msgLower.includes('hello')) {
            suggestions.push('Bạn có thể giúp gì cho tôi?');
            suggestions.push('Giới thiệu về STEM AI?');
            suggestions.push('Hướng dẫn sử dụng?');
        } else {
            suggestions.push('Học gì tiếp theo?');
            suggestions.push('Tin tức công nghệ?');
            suggestions.push('Tạo đề thi thử?');
        }
    }

    // Chú thích: Giới hạn 3 suggestions
    return suggestions.slice(0, 3);
}

// Chú thích: Handle chat endpoint
async function handleChat(request: Request, env: Env): Promise<Response> {
    const origin = getAllowedOrigin(request.headers.get('Origin'), env.CORS_ORIGIN);
    try {
        // Chú thích: Validate API key trước
        if (!env.OPENROUTER_API_KEY) {
            console.error('[chat] OPENROUTER_API_KEY not configured!');
            return jsonResponse({
                error: 'AI service not configured',
                details: 'OPENROUTER_API_KEY is missing. Run: wrangler secret put OPENROUTER_API_KEY'
            }, 500, origin);
        }

        const body = await request.json() as {
            message: string;
            context?: string;
            systemPrompt?: string;
            useCoT?: boolean; // Enable Chain-of-Thought
            useReflection?: boolean; // Enable Self-Reflection
            userId?: string; // For rate limiting & personalization
        };

        if (!body.message) {
            return jsonResponse({ error: 'Message is required' }, 400, origin);
        }

        // ===== PRODUCTION FEATURES =====

        // 1. Rate Limiting (if KV available)
        const userId = body.userId || 'anonymous';
        if (env.CACHE) {
            const { RateLimiter } = await import('./optimization/rate-limiter');
            const limiter = new RateLimiter(env.CACHE);
            const limit = await limiter.isAllowed(userId);

            if (!limit.allowed) {
                return jsonResponse({
                    error: 'Rate limit exceeded',
                    resetAt: limit.resetAt,
                    message: 'You have reached the maximum number of requests. Please try again later.'
                }, 429, origin);
            }
        }

        // 2. Enhanced Semantic Cache Check (if KV available)
        let cachedResponse = null;
        if (env.CACHE) {
            const { EnhancedSemanticCache } = await import('./cache/enhanced-cache');
            const cache = new EnhancedSemanticCache(env.CACHE);

            cachedResponse = await cache.getWithFuzzyMatch({
                query: body.message,
                apiKey: env.HF_API_TOKEN
            });

            if (cachedResponse) {
                console.log('[chat] ✅ Cache HIT - returning cached response');
                return jsonResponse({
                    success: true,
                    response: cachedResponse.response,
                    thinking: cachedResponse.thinking,
                    reflection: cachedResponse.reflection,
                    sources: cachedResponse.sources,
                    cached: true,
                    cacheHits: cachedResponse.hitCount
                }, 200, origin);
            }
        }

        console.log('[chat] Cache MISS - generating new response');

        // Chú thích: Phân loại câu hỏi để quyết định có dùng RAG không
        const queryType = classifyQuery(body.message);
        let ragContext = '';
        let sources: unknown[] = [];

        // Chú thích: Nếu là câu hỏi học tập → tìm RAG context từ thư viện sách
        if (queryType === 'academic' && env.VECTORIZE && env.OPENROUTER_API_KEY && env.DB) {
            try {
                console.info('[chat] Academic query detected, using Advanced RAG...');
                const ragResult = await getAdvancedRAGContext(
                    env.OPENROUTER_API_KEY,
                    env.VECTORIZE,
                    body.message,
                    env.DB
                );
                ragContext = ragResult.context;
                sources = ragResult.sources;
                console.info('[chat] Advanced RAG found', { sourcesCount: sources.length });
            } catch (error) {
                console.warn('[chat] Advanced RAG failed, falling back to basic RAG:', error);
                // Fallback to old RAG
                try {
                    const ragResult = await getRAGContext(
                        env.HF_API_TOKEN || env.OPENROUTER_API_KEY,
                        env.VECTORIZE,
                        body.message,
                        undefined
                    );
                    ragContext = ragResult.context;
                    sources = ragResult.sources;
                } catch (fallbackError) {
                    console.warn('[chat] Fallback RAG also failed, continuing without context:', fallbackError);
                }
            }
        }

        // Chú thích: Build context string nếu có RAG hoặc context từ frontend
        let fullContext = '';
        if (ragContext) {
            fullContext += `=== TÀI LIỆU THAM KHẢO TỪ SGK ===\n${ragContext}\n\n`;
        }
        if (body.context) {
            fullContext += body.context;
        }

        // Chú thích: Phân loại câu hỏi để chọn model phù hợp (OpenRouter multi-model routing)
        const modelRouting = classifyQueryForModel(body.message);
        console.info('[chat] Model routing:', modelRouting);

        // Chú thích: Nếu cần web search → dùng DuckDuckGo API (miễn phí, không cần key)
        let webSearchContext = '';
        if (modelRouting.useOnlineSearch) {
            try {
                console.info('[chat] Web search triggered, querying DuckDuckGo...');
                const searchResult = await webSearch(body.message);
                webSearchContext = formatSearchResultsAsContext(searchResult);

                if (webSearchContext) {
                    console.info('[chat] DuckDuckGo search found results', {
                        sourcesCount: searchResult.sources.length
                    });
                    fullContext = webSearchContext + '\n' + fullContext;
                }
            } catch (error) {
                console.warn('[chat] DuckDuckGo search failed:', error);
                // Tiếp tục mà không có web search context
            }
        }

        // Chú thích: Gọi OpenRouter để generate response
        let aiResponse = '';
        let thinkingProcess = ''; // For CoT mode
        let reflectionData: any = null; // For reflection mode
        let usedModel = ''; // To store the model used

        // Chú thích: Check if user wants advanced reasoning
        if (body.useReflection) {
            // Self-Reflection mode: Generate → Critique → Revise
            console.info('[chat] Self-Reflection mode enabled');
            const { generateWithReflection } = await import('./reasoning/self-reflection');

            const reflectionResult = await generateWithReflection({
                query: body.message,
                context: fullContext,
                systemPrompt: body.systemPrompt || SYSTEM_PROMPTS.chat,
                apiKey: env.OPENROUTER_API_KEY,
                maxIterations: 2
            });

            aiResponse = reflectionResult.final;
            reflectionData = {
                iterations: reflectionResult.iterations.length,
                issues: reflectionResult.iterations.flatMap(it => it.critique.issues)
            };
            usedModel = modelRouting.model; // Reflection uses the base model
        } else if (body.useCoT) {
            // Chain-of-Thought mode: Show thinking process
            console.info('[chat] Chain-of-Thought mode enabled');
            const { generateWithCoT } = await import('./reasoning/chain-of-thought');

            const cotResult = await generateWithCoT({
                query: body.message,
                context: fullContext,
                systemPrompt: body.systemPrompt || SYSTEM_PROMPTS.chat,
                apiKey: env.OPENROUTER_API_KEY
            });

            thinkingProcess = cotResult.thinking;
            aiResponse = cotResult.answer;
            usedModel = modelRouting.model; // CoT uses the base model
        } else {
            // Standard mode: Direct response
            const messages = buildMessages(
                body.systemPrompt || SYSTEM_PROMPTS.chat,
                body.message,
                fullContext || undefined
            );

            const result = await callOpenRouter(env.OPENROUTER_API_KEY, {
                messages,
                model: modelRouting.model,
                useOnlineSearch: modelRouting.useOnlineSearch,
            });

            aiResponse = result.text;
            usedModel = result.model;
        }

        // Chú thích: Tạo suggestions dựa trên nội dung trả lời
        const suggestions = generateSuggestions(body.message, aiResponse, queryType);

        return jsonResponse({
            success: true,
            response: aiResponse,
            thinking: thinkingProcess || undefined, // Include thinking if CoT mode
            reflection: reflectionData || undefined, // Include reflection if enabled
            sources: sources.length > 0 ? sources : undefined,
            queryType,
            suggestions, // Gợi ý câu hỏi tiếp theo
            model: usedModel, // Trả về model đã sử dụng để debug
        }, 200, origin);


    } catch (error) {
        console.error('[chat] error:', error);
        return jsonResponse({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500, origin);
    }
}

// Chú thích: Handle generate endpoint (tạo câu hỏi)
// Chú thích: Handle generate endpoint (tạo câu hỏi) - Updated 2-Pass Logic
async function handleGenerate(request: Request, env: Env): Promise<Response> {
    const origin = getAllowedOrigin(request.headers.get('Origin'), env.CORS_ORIGIN);
    try {
        const body = await request.json() as {
            topic: string;
            matrix?: any; // New: Structure matrix
            count?: number; // Legacy support
            difficulty?: string; // Legacy support
        };

        if (!body.topic) {
            return jsonResponse({ error: 'Topic is required' }, 400, origin);
        }

        // Chú thích: Construct request message from Matrix or legacy params
        let userMessage = '';
        if (body.matrix) {
            userMessage = `Yêu cầu tạo đề thi theo ma trận sau:\n${JSON.stringify(body.matrix, null, 2)}`;
        } else {
            // Fallback legacy
            userMessage = `Tạo ${body.count || 5} câu hỏi trắc nghiệm chủ đề: ${body.topic}. Độ khó: ${body.difficulty || 'medium'}`;
        }

        // Chú thích: Hybrid RAG - Tìm context từ SGK trước
        let ragContext = '';
        let sourceChunks: unknown[] = [];

        if (env.VECTORIZE && env.HF_API_TOKEN) {
            try {
                console.info('[generate] Searching RAG for topic:', body.topic);
                // 1. Tìm kiến thức SGK
                const knowledgeResult = await getRAGContext(
                    env.HF_API_TOKEN,
                    env.VECTORIZE,
                    body.topic,
                    undefined
                );

                ragContext = knowledgeResult.context;
                sourceChunks = knowledgeResult.sources;

            } catch (error) {
                console.warn('[generate] RAG search failed:', error);
            }
        }

        // ==========================================
        // PASS 1: DRAFT GENERATION
        // ==========================================
        console.info('[generate] Pass 1: Generating Draft...');

        const systemInstructionPass1 = `
${SYSTEM_PROMPTS.generate}

=== TÀI LIỆU KIẾN THỨC (SGK) ===
${ragContext || '(Không tìm thấy tài liệu SGK, hãy dùng kiến thức chuẩn của bạn và Google Search)'}
`;

        const messagesPass1 = buildMessages(systemInstructionPass1, userMessage);

        // Gọi OpenRouter (Gemini Flash)
        const resultPass1 = await callOpenRouter(env.OPENROUTER_API_KEY, {
            messages: messagesPass1,
            model: MODEL_ROUTES.examGeneration,
            useOnlineSearch: true, // Grounding
            temperature: 0.7,
        });

        // Parse JSON Pass 1
        let draftQuestions;
        try {
            const jsonMatch = resultPass1.text.match(/\[[\s\S]*\]/);
            draftQuestions = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(resultPass1.text);
        } catch {
            console.warn('[generate] Pass 1 JSON parse failed, returning raw text');
            // Nếu lỗi JSON, trả về luôn text để frontend handle hoặc báo lỗi
            return jsonResponse({
                success: false,
                error: 'AI Output Error',
                raw: resultPass1.text
            }, 500, origin);
        }

        // ==========================================
        // PASS 2: CRITIC REVIEW
        // ==========================================
        console.info('[generate] Pass 2: Critic Review...');

        const criticMessage = `Hãy kiểm tra và sửa lỗi cho đề thi dưới đây (JSON):\n${JSON.stringify(draftQuestions, null, 2)}`;

        const messagesPass2 = buildMessages(SYSTEM_PROMPTS.critic_review, criticMessage, ragContext); // Kèm context để critic check

        const resultPass2 = await callOpenRouter(env.OPENROUTER_API_KEY, {
            messages: messagesPass2,
            model: MODEL_ROUTES.examGeneration, // Vẫn dùng Gemini Flash cho nhanh và rẻ
            temperature: 0.2, // Low temp cho critic chính xác
        });

        // Parse JSON Pass 2 (Final)
        let finalQuestions;
        try {
            const jsonMatch = resultPass2.text.match(/\[[\s\S]*\]/);
            finalQuestions = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(resultPass2.text);
        } catch {
            console.warn('[generate] Pass 2 parse failed, using draft');
            finalQuestions = draftQuestions;
        }

        return jsonResponse({
            success: true,
            questions: finalQuestions,
            sourceChunks: sourceChunks.length > 0 ? sourceChunks : undefined,
            matrix: body.matrix,
            criticFeedback: 'Pass 2 Completed' // Flag để biết đã qua bước 2
        }, 200, origin);

    } catch (error) {
        console.error('[generate] error:', error);
        return jsonResponse({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500, origin);
    }
}

// Chú thích: Handle stream chat (Server-Sent Events)
async function handleChatStream(request: Request, env: Env): Promise<Response> {
    const origin = getAllowedOrigin(request.headers.get('Origin'), env.CORS_ORIGIN);
    try {
        const body = await request.json() as {
            message: string;
            context?: string;
            systemPrompt?: string; // Chú thích: Cho phép frontend gửi systemPrompt tùy chỉnh
        };

        if (!body.message) {
            return jsonResponse({ error: 'Message is required' }, 400, origin);
        }

        // Chú thích: Phân loại câu hỏi để chọn model (OpenRouter routing)
        const modelRouting = classifyQueryForModel(body.message);

        // Chú thích: Build messages cho OpenRouter
        const messages = buildMessages(
            body.systemPrompt || SYSTEM_PROMPTS.chat,
            body.message,
            body.context
        );

        // Chú thích: Tạo ReadableStream cho SSE với OpenRouter
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

                try {
                    // Chú thích: Stream Chat dùng OpenRouter với multi-model routing
                    const generator = streamOpenRouter(env.OPENROUTER_API_KEY, {
                        messages,
                        model: modelRouting.model,
                        useOnlineSearch: modelRouting.useOnlineSearch,
                    });

                    for await (const chunk of generator) {
                        const data = `data: ${JSON.stringify({ text: chunk })}\n\n`;
                        controller.enqueue(encoder.encode(data));
                    }

                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    const errorData = `data: ${JSON.stringify({ error: 'Stream error' })}\n\n`;
                    controller.enqueue(encoder.encode(errorData));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                ...corsHeaders(origin),
            },
        });

    } catch (error) {
        console.error('[stream] error:', error);
        return jsonResponse({
            error: 'Internal server error'
        }, 500, origin);
    }
}

// Chú thích: Handle feedback endpoint - lưu feedback từ user về chất lượng câu trả lời
async function handleFeedback(request: Request, env: Env): Promise<Response> {
    const origin = getAllowedOrigin(request.headers.get('Origin'), env.CORS_ORIGIN);
    try {
        const body = await request.json() as {
            messageId: string;
            helpful: boolean;
            reason?: string;
            userMessage?: string;
            aiResponse?: string;
        };

        if (!body.messageId) {
            return jsonResponse({ error: 'messageId is required' }, 400, origin);
        }

        // Chú thích: Lưu vào D1 database
        try {
            await env.DB.prepare(`
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

            console.info('[feedback] saved', { messageId: body.messageId, helpful: body.helpful });
        } catch (dbError) {
            // Chú thích: Nếu DB chưa có bảng, tạo bảng và thử lại
            console.warn('[feedback] DB error, creating table...', dbError);
            await env.DB.prepare(`
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

            // Thử lại insert
            await env.DB.prepare(`
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

        return jsonResponse({
            success: true,
            message: 'Cảm ơn phản hồi của bạn!'
        }, 200, origin);

    } catch (error) {
        console.error('[feedback] error:', error);
        return jsonResponse({
            error: 'Lỗi lưu phản hồi'
        }, 500, origin);
    }
}

// Chú thích: Main fetch handler
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;
        const allowedOrigin = getAllowedOrigin(request.headers.get('Origin'), env.CORS_ORIGIN);

        // Chú thích: Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: corsHeaders(allowedOrigin),
            });
        }

        // Chú thích: Health check (đã xoá Vertex AI, chuyển sang OpenRouter + HuggingFace)
        if (path === '/' || path === '/health') {
            return jsonResponse({
                status: 'ok',
                service: 'stem-vietnam-api',
                provider: 'openrouter + huggingface + r2',
                timestamp: new Date().toISOString(),
            }, 200, allowedOrigin);
        }

        // Storage routes (R2)
        // Match: /api/storage/books/...
        if (path.startsWith('/api/storage/')) {
            return handleStorageRequest(request, env);
        }

        // Chú thích: API routes
        if (request.method === 'POST') {
            switch (path) {
                case '/api/chat':
                    return handleChat(request, env);
                case '/api/chat/stream':
                    return handleChatStream(request, env);
                case '/api/generate':
                    return handleGenerate(request, env);
                // Feedback route
                case '/api/feedback':
                    return handleFeedback(request, env);
                // Auth routes
                case '/api/auth/register':
                    return handleRegister(request, env as unknown as AuthEnv);
                case '/api/auth/login':
                    return handleLogin(request, env as unknown as AuthEnv);
                // Settings routes
                case '/api/settings/models/refresh':
                    return handleRefreshModels(request, env);
                // Conversation routes
                case '/api/conversations': {
                    const user = await getUserFromToken(request, env as unknown as AuthEnv);
                    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, env.CORS_ORIGIN);
                    return createConversation(request, user, env as unknown as ConvoEnv);
                }
                // Exam routes
                case '/api/exams': {
                    const user = await getUserFromToken(request, env as unknown as AuthEnv);
                    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, env.CORS_ORIGIN);
                    return createExam(request, user, env as unknown as ConvoEnv);
                }
            }

            // POST messages to conversation: /api/conversations/:id/messages
            const msgMatch = path.match(/^\/api\/conversations\/([^/]+)\/messages$/);
            if (msgMatch) {
                const user = await getUserFromToken(request, env as unknown as AuthEnv);
                if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, env.CORS_ORIGIN);
                return addMessageFromRequest(msgMatch[1], request, user, env as unknown as ConvoEnv);
            }
        }

        // GET routes
        if (request.method === 'GET') {
            // Auth me
            if (path === '/api/auth/me') {
                return handleMe(request, env as unknown as AuthEnv);
            }
            // Settings routes
            if (path === '/api/settings') {
                return handleGetSettings(request, env);
            }
            if (path === '/api/settings/models') {
                return handleGetModels(request, env);
            }
            // Get all conversations
            if (path === '/api/conversations') {
                const user = await getUserFromToken(request, env as unknown as AuthEnv);
                if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, env.CORS_ORIGIN);
                return getConversations(user, env as unknown as ConvoEnv);
            }
            // Get all exams
            if (path === '/api/exams') {
                const user = await getUserFromToken(request, env as unknown as AuthEnv);
                if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, env.CORS_ORIGIN);
                return getExams(user, env as unknown as ConvoEnv);
            }
            // Get single conversation
            const convoMatch = path.match(/^\/api\/conversations\/([^/]+)$/);
            if (convoMatch) {
                const user = await getUserFromToken(request, env as unknown as AuthEnv);
                if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, env.CORS_ORIGIN);
                return getConversation(convoMatch[1], user, env as unknown as ConvoEnv);
            }
            // Get single exam
            const examMatch = path.match(/^\/api\/exams\/([^/]+)$/);
            if (examMatch) {
                const user = await getUserFromToken(request, env as unknown as AuthEnv);
                if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, env.CORS_ORIGIN);
                return getExam(examMatch[1], user, env as unknown as ConvoEnv);
            }
        }

        // DELETE routes
        if (request.method === 'DELETE') {
            const convoMatch = path.match(/^\/api\/conversations\/([^/]+)$/);
            if (convoMatch) {
                const user = await getUserFromToken(request, env as unknown as AuthEnv);
                if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, env.CORS_ORIGIN);
                return deleteConversation(convoMatch[1], user, env as unknown as ConvoEnv);
            }
            // Delete exam
            const examMatch = path.match(/^\/api\/exams\/([^/]+)$/);
            if (examMatch) {
                const user = await getUserFromToken(request, env as unknown as AuthEnv);
                if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, env.CORS_ORIGIN);
                return deleteExam(examMatch[1], user, env as unknown as ConvoEnv);
            }
            // Admin: Delete user
            const adminUserMatch = path.match(/^\/api\/admin\/users\/([^/]+)$/);
            if (adminUserMatch) {
                return deleteUser(adminUserMatch[1], env as unknown as AdminEnv);
            }
        }

        // PUT routes (Admin update)
        if (request.method === 'PUT') {
            // Settings update
            if (path === '/api/settings') {
                return handleUpdateSettings(request, env);
            }
            const adminUserMatch = path.match(/^\/api\/admin\/users\/([^/]+)$/);
            if (adminUserMatch) {
                return updateUser(adminUserMatch[1], request, env as unknown as AdminEnv);
            }
        }

        // Admin GET routes
        if (request.method === 'GET') {
            if (path === '/api/admin/users') {
                return getUsers(env as unknown as AdminEnv);
            }
            if (path === '/api/admin/stats') {
                return getStats(env as unknown as AdminEnv);
            }
            const adminUserMatch = path.match(/^\/api\/admin\/users\/([^/]+)$/);
            if (adminUserMatch) {
                return getUser(adminUserMatch[1], env as unknown as AdminEnv);
            }

            // Admin Conversations routes
            if (path === '/api/admin/conversations') {
                const pageParam = url.searchParams.get('page');
                const limitParam = url.searchParams.get('limit');
                const page = pageParam ? parseInt(pageParam, 10) : 1;
                const limit = limitParam ? parseInt(limitParam, 10) : 20;
                return getAdminConversations(env as unknown as AdminEnv, page, limit);
            }
            const adminConvoMatch = path.match(/^\/api\/admin\/conversations\/([^/]+)$/);
            if (adminConvoMatch) {
                return getAdminConversation(adminConvoMatch[1], env as unknown as AdminEnv);
            }
        }

        // Admin DELETE conversation
        if (request.method === 'DELETE') {
            const adminConvoMatch = path.match(/^\/api\/admin\/conversations\/([^/]+)$/);
            if (adminConvoMatch) {
                return deleteAdminConversation(adminConvoMatch[1], env as unknown as AdminEnv);
            }
        }

        // Admin RAG routes (đã xoá Google Drive và Document AI, chỉ giữ search)
        // Chú thích: Route /api/admin/rag/list và /api/admin/rag/process đã bị xoá vì cần GCP

        if (request.method === 'POST' && path === '/api/admin/rag/search') {
            // Test RAG search (dùng HuggingFace embeddings)
            if (!env.HF_API_TOKEN) {
                return jsonResponse({ error: 'HF_API_TOKEN not configured' }, 400, env.CORS_ORIGIN);
            }

            const body = await request.json() as { query: string; filters?: { grade?: string; subject?: string } };
            if (!body.query) {
                return jsonResponse({ error: 'query is required' }, 400, env.CORS_ORIGIN);
            }

            try {
                const { context, sources } = await getRAGContext(
                    env.HF_API_TOKEN,
                    env.VECTORIZE,
                    body.query,
                    body.filters
                );
                return jsonResponse({ success: true, context, sources }, 200, env.CORS_ORIGIN);
            } catch (error) {
                return jsonResponse({
                    error: 'Search failed',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }, 500, env.CORS_ORIGIN);
            }
        }

        // Chú thích: Upload file route (đơn giản hoá, không dùng Document AI OCR)
        if (request.method === 'POST' && path === '/api/admin/rag/upload') {
            if (!env.HF_API_TOKEN) {
                return jsonResponse({ error: 'HF_API_TOKEN not configured' }, 400, env.CORS_ORIGIN);
            }

            try {
                // Parse multipart form data
                const formData = await request.formData();
                const file = formData.get('file') as File | null;
                const metadataStr = formData.get('metadata') as string | null;

                if (!file) {
                    return jsonResponse({ error: 'No file provided' }, 400, env.CORS_ORIGIN);
                }

                // Kiểm tra file type
                if (!isFileTypeSupported(file.name)) {
                    return jsonResponse({
                        error: `Unsupported file type. Supported: ${getSupportedExtensions().join(', ')}`
                    }, 400, env.CORS_ORIGIN);
                }

                // Kiểm tra file size
                if (!isFileSizeValid(file.size)) {
                    return jsonResponse({
                        error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
                    }, 400, env.CORS_ORIGIN);
                }

                // Parse metadata
                let metadata: BookMetadata;
                if (metadataStr) {
                    metadata = JSON.parse(metadataStr);
                } else {
                    // Auto-generate metadata từ filename
                    const parsed = parseMetadataFromFilename(`upload-${Date.now()}`, file.name);
                    if (!parsed) {
                        return jsonResponse({ error: 'Could not parse metadata. Please provide metadata.' }, 400, env.CORS_ORIGIN);
                    }
                    metadata = parsed;
                }

                // Read file buffer
                const fileBuffer = await file.arrayBuffer();

                // Process và index vào Vectorize (dùng HuggingFace embeddings)
                const result = await processLocalFile(
                    env.HF_API_TOKEN,
                    env.VECTORIZE,
                    fileBuffer,
                    file.name,
                    metadata
                );

                return jsonResponse({
                    success: true,
                    result,
                }, 200, env.CORS_ORIGIN);

            } catch (error) {
                console.error('[rag-upload] error:', error);
                return jsonResponse({
                    error: 'Upload failed',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }, 500, env.CORS_ORIGIN);
            }
        }

        // Chú thích: 404 for unknown routes
        return jsonResponse({ error: 'Not found' }, 404, env.CORS_ORIGIN);
    },
};
