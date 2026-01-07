// Chú thích: Entry point cho Cloudflare Workers API (OpenRouter + Auth + Conversations + Admin + RAG)
// Đã chuyển hoàn toàn từ Vertex AI sang OpenRouter + HuggingFace (miễn phí)
import { callOpenRouter, streamOpenRouter, buildMessages, classifyQueryForModel, MODEL_ROUTES, MODELS } from './openrouter';
import { webSearch, formatSearchResultsAsContext } from './duckduckgo';
import { handleRegister, handleLogin, handleMe, getUserFromToken, AuthEnv } from './auth-routes';
import { getConversations, getConversation, createConversation, deleteConversation, addMessage, addMessageFromRequest, ConvoEnv } from './conversation-routes';
import {
    getExams,
    getExam,
    createExam,
    deleteExam
} from './exam-routes';
import { getUsers, getUser, deleteUser, updateUser, getStats, getAdminConversations, getAdminConversation, deleteAdminConversation, AdminEnv } from './admin-routes';
import { searchVectors, buildContextFromResults } from './vectorize';
import { processLocalFile, getRAGContext, parseMetadataFromFilename, type RAGPipelineConfig, type BookMetadata } from './rag-pipeline';
import { isFileTypeSupported, isFileSizeValid, MAX_FILE_SIZE, getSupportedExtensions } from './file-parser';

// Chú thích: Environment interface (đã xoá Vertex AI, chuyển sang HuggingFace)
interface Env {
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
}

const SYSTEM_PROMPTS = {
    // Chú thích: Chat AI - Chuyên gia đa năng với LaTeX support
    chat: `Bạn là **StemBot** - trợ lý học tập thông minh hàng đầu Việt Nam.

## VỀ BẠN:
Bạn là chuyên gia giáo dục toàn diện, am hiểu sâu rộng về STEM (Khoa học, Công nghệ, Kỹ thuật, Toán học) và đời sống xã hội. Bạn có khả năng:
- Giải thích mọi vấn đề từ đơn giản đến phức tạp một cách súc tích, dễ hiểu.
- Kết hợp kiến thức học thuật với ví dụ thực tế tại Việt Nam.
- Khơi gợi tư duy sáng tạo và phản biện.

## QUY TẮC CỐT LÕI (MẠNH MẼ & HIỆU QUẢ):
1. **Trả lời trọn vẹn & Súc tích**: Tránh dài dòng lan man. Đi thẳng vào trọng tâm. Đảm bảo câu trả lời KHÔNG bao giờ bị ngắt quãng giữa chừng.
2. **Luôn có dẫn chứng**: Khi đưa ra thông tin, hãy kèm theo ví dụ hoặc nguồn (nếu có context).
3. **Định dạng thông minh**: Sử dụng tối đa bullet points, bảng, và in đậm để làm nổi bật ý chính.
4. **Không giới hạn chủ đề**: Bạn sẵn sàng trả lời MỌI câu hỏi, từ bài tập sách giáo khoa đến tin tức thời sự, thể thao, giải trí.

## ĐẠO ĐỨC & ỨNG XỬ (QUAN TRỌNG):
Bạn là một người hướng dẫn (Mentor) có tâm, tuân thủ nghiêm ngặt các nguyên tắc sau:
1. **Sư phạm tích cực (Education First)**:
   - **Không làm bài tập hộ ngay lập tức**: Nếu học sinh yêu cầu giải bài tập, hãy HƯỚNG DẪN phương pháp, gợi ý công thức, hoặc giải một bài mẫu tương tự trước. Chỉ đưa đáp án cuối cùng sau khi học sinh đã hiểu cách làm.
   - **Luôn động viên**: Tuyệt đối KHÔNG chê bai (VD: "Sai rồi", "Dốt thế"). Hãy dùng "Gần đúng rồi", "Thử nghĩ theo hướng này xem...", "Một ý tưởng thú vị, nhưng...".
   - **Kiên nhẫn**: Sẵn sàng giải thích lại nhiều lần bằng nhiều cách khác nhau.

2. **An toàn & Lành mạnh (Safety)**:
   - Từ chối hỗ trợ các hành vi gian lận thi cử, hack, hoặc gây hại.
   - Từ chối tạo nội dung bạo lực, khiêu dâm, thù ghét.
   - Nếu phát hiện học sinh có dấu hiệu tiêu cực/stress nặng, hãy khuyên nhủ nhẹ nhàng và đề xuất tìm sự giúp đỡ từ người thân/thầy cô.

3. **Trung thực & Bảo mật**:
   - Nếu không biết, hãy nói "Mình chưa chắc chắn về điều này, để mình tìm hiểu thêm nhé" (và dùng Google Search).
   - KHÔNG hỏi thông tin cá nhân (SĐT, địa chỉ, mật khẩu) của người dùng.

## NHẬN DIỆN Ý ĐỊNH NGƯỜI DÙNG:
- **Học tập (Toán/Lý/Hóa/Công nghệ)** → Giải thích công thức, hướng dẫn giải step-by-step, dùng LaTeX chuẩn.
- **Tra cứu tin tức/Sự kiện** → Dùng Google Search để cung cấp thông tin mới nhất.
- **Coding/Lập trình** → Cung cấp code snippet chuẩn, giải thích logic.
- **Trò chuyện/Tư vấn** → Thân thiện, hài hước, như một người bạn (Buddy).

## LÀM TOÁN VỚI LATEX (BẮT BUỘC):
- Inline: \`$công thức$\` — VD: $E=mc^2$
- Block: \`$$công thức$$\` — VD: $$\\sum_{i=1}^{n} x_i$$
- TUYỆT ĐỐI KHÔNG sai syntax LaTeX.

## PHONG CÁCH TRẢ LỜI:
- **Chuyên gia**: Kiến thức chính xác, sâu rộng.
- **Súc tích**: Trả lời ngắn gọn, đủ ý để tránh timeout hệ thống.
- **Gần gũi**: Dùng ngôn ngữ tự nhiên, phù hợp với học sinh/sinh viên Việt Nam.

Hãy luôn là một người bạn đồng hành thông thái (Mentor & Buddy)!`,



    // Chú thích: Tạo đề thi - dùng RAG context từ thư viện
    // Chú thích: Tạo đề thi - dùng RAG context từ thư viện + Google Search Grounding
    generate: `Bạn là **Kiểm định viên & Chuyên gia Biên soạn Đề thi** môn Công nghệ THPT.

## NHIỆM VỤ:
Soạn thảo đề thi trắc nghiệm dựa trên 2 nguồn dữ liệu:
1. **Context SGK** (được cung cấp): Kiến thức nền tảng chuẩn.
2. **Google Search** (Grounding): Thông tin thực tế, ví dụ cập nhật, đề thi mẫu mới nhất.

## QUY TẮC BẮT BUỘC (ANTI-HALLUCINATION):
- **Dựa hoàn toàn vào nguồn tin**: Chỉ đặt câu hỏi nếu thông tin có trong Context hoặc Search Result.
- **Không bịa đặt**: Nếu thông tin không tìm thấy trong cả 2 nguồn -> TRẢ LỜI "NULL" (hoặc báo lỗi cụ thể).
- **Phân loại**: Nhớ (30%), Hiểu (30%), Vận dụng (25%), Vận dụng cao (15%).
- **Trích dẫn minh bạch**: Với mỗi câu hỏi, hãy tự đánh giá xem nó dựa trên SGK hay Search thực tế.

## FORMAT CÂU HỎI (JSON):
Trả về JSON array thuần túy, không markdown:
[
  {
    "question": "Nội dung câu hỏi...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct": 0, // Index của đáp án đúng (0-3)
    "explanation": "Giải thích chi tiết và TRÍCH DẪN NGUỒN CỤ THỂ (VD: 'Theo SGK Công Nghệ 10, Bài 3' hoặc 'Theo tin tức từ...')...",
    "source_type": "SGK" | "Search" // Nguồn thông tin
  }
]

## LƯU Ý QUAN TRỌNG:
- Trích dẫn nguồn (Citation) trong 'explanation' là BẮT BUỘC để đảm bảo tính xác thực.
- Nếu Context SGK quá ít thông tin liên quan đến chủ đề: Hãy ưu tiên tìm kiếm Google Searth để bổ sung.
- Nếu cả 2 đều không đủ: Trả về JSON rỗng [] để hệ thống xử lý lỗi.
- LaTeX ($...$) phải chuẩn xác.`,
};

// Chú thích: CORS headers
function corsHeaders(origin: string): HeadersInit {
    return {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

// Chú thích: JSON response helper
function jsonResponse(data: unknown, status: number, origin: string): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(origin),
        },
    });
}

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
    try {
        // Chú thích: Validate API key trước
        if (!env.OPENROUTER_API_KEY) {
            console.error('[chat] OPENROUTER_API_KEY not configured!');
            return jsonResponse({
                error: 'AI service not configured',
                details: 'OPENROUTER_API_KEY is missing. Run: wrangler secret put OPENROUTER_API_KEY'
            }, 500, env.CORS_ORIGIN);
        }

        const body = await request.json() as {
            message: string;
            context?: string;
            systemPrompt?: string;
        };

        if (!body.message) {
            return jsonResponse({ error: 'Message is required' }, 400, env.CORS_ORIGIN);
        }

        // Chú thích: Phân loại câu hỏi để quyết định có dùng RAG không
        const queryType = classifyQuery(body.message);
        let ragContext = '';
        let sources: unknown[] = [];

        // Chú thích: Nếu là câu hỏi học tập → tìm RAG context từ thư viện sách
        if (queryType === 'academic' && env.VECTORIZE && env.HF_API_TOKEN) {
            try {
                console.info('[chat] Academic query detected, searching RAG...');
                const ragResult = await getRAGContext(
                    env.HF_API_TOKEN,
                    env.VECTORIZE,
                    body.message,
                    undefined // Không filter theo grade/subject
                );
                ragContext = ragResult.context;
                sources = ragResult.sources;
                console.info('[chat] RAG found', { sourcesCount: sources.length });
            } catch (error) {
                console.warn('[chat] RAG search failed, continuing without context:', error);
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

        // Chú thích: Build messages cho OpenRouter
        const messages = buildMessages(
            body.systemPrompt || SYSTEM_PROMPTS.chat,
            body.message,
            fullContext || undefined
        );

        // Chú thích: Gọi OpenRouter với model được chọn tự động
        const result = await callOpenRouter(env.OPENROUTER_API_KEY, {
            messages,
            model: modelRouting.model,
            useOnlineSearch: modelRouting.useOnlineSearch,
        });

        // Chú thích: Tạo suggestions dựa trên nội dung trả lời
        const suggestions = generateSuggestions(body.message, result.text, queryType);

        return jsonResponse({
            success: true,
            response: result.text,
            sources: sources.length > 0 ? sources : undefined,
            queryType,
            suggestions, // Gợi ý câu hỏi tiếp theo
            model: result.model, // Trả về model đã sử dụng để debug
        }, 200, env.CORS_ORIGIN);


    } catch (error) {
        console.error('[chat] error:', error);
        return jsonResponse({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500, env.CORS_ORIGIN);
    }
}

// Chú thích: Handle generate endpoint (tạo câu hỏi)
async function handleGenerate(request: Request, env: Env): Promise<Response> {
    try {
        const body = await request.json() as {
            topic: string;
            count?: number;
            difficulty?: 'easy' | 'medium' | 'hard';
        };

        if (!body.topic) {
            return jsonResponse({ error: 'Topic is required' }, 400, env.CORS_ORIGIN);
        }

        const count = body.count || 1;
        const difficulty = body.difficulty || 'medium';

        const userMessage = `Tạo ${count} câu hỏi trắc nghiệm về chủ đề: ${body.topic}
Độ khó: ${difficulty}
Trả về dưới dạng JSON array.`;

        // Chú thích: Hybrid RAG - Tìm context từ SGK trước
        let ragContext = '';
        let examStyleContext = ''; // Context về đề thi mẫu
        let sourceChunks: unknown[] = [];
        if (env.VECTORIZE && env.HF_API_TOKEN) {
            try {
                console.info('[generate] Searching RAG for topic:', body.topic);

                // 1. Tìm kiến thức SGK
                const knowledgePromise = getRAGContext(
                    env.HF_API_TOKEN,
                    env.VECTORIZE,
                    body.topic,
                    undefined
                );

                // 2. Tìm đề thi mẫu (Style Mimicking)
                const examStylePromise = getRAGContext(
                    env.HF_API_TOKEN,
                    env.VECTORIZE,
                    `Đề thi kiểm tra trắc nghiệm ${body.topic}`,
                    undefined
                );

                const [knowledgeResult, styleResult] = await Promise.all([knowledgePromise, examStylePromise]);

                ragContext = knowledgeResult.context;
                examStyleContext = styleResult.context;

                // Merge sources (ưu tiên knowledge)
                sourceChunks = [...knowledgeResult.sources, ...styleResult.sources];

                // Pre-check: Cảnh báo nếu không tìm thấy gì
                if (!ragContext) {
                    console.warn('[generate] No RAG context found for topic');
                }
            } catch (error) {
                console.warn('[generate] RAG search failed:', error);
            }
        }

        // Build Full Message with Context
        const systemInstructionWithContext = `
${SYSTEM_PROMPTS.generate}

=== TÀI LIỆU KIẾN THỨC (SGK) ===
${ragContext || '(Dựa vào Google Search)'}

=== ĐỀ THI MẪU THAM KHẢO (STYLE) ===
${examStyleContext || '(Không tìm thấy đề mẫu, hãy dùng format chuẩn Bộ GD&ĐT)'}

LƯU Ý: Hãy học văn phong và cách đặt câu hỏi từ phần "ĐỀ THI MẪU" (nếu có), nhưng nội dung kiến thức phải dựa trên "TÀI LIỆU KIẾN THỨC".
`;

        // Chú thích: Tạo đề dùng OpenRouter Gemini Flash + web search
        const messages = buildMessages(systemInstructionWithContext, userMessage);
        const result = await callOpenRouter(env.OPENROUTER_API_KEY, {
            messages,
            model: MODEL_ROUTES.examGeneration,
            useOnlineSearch: true, // Bật web search để verify thông tin
        });

        // Chú thích: Parse JSON từ response
        let questions;
        try {
            // Chú thích: Extract JSON từ response (có thể có text thừa)
            const jsonMatch = result.text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                questions = JSON.parse(jsonMatch[0]);
            } else {
                questions = JSON.parse(result.text);
            }
        } catch {
            questions = [{ raw: result.text }];
        }

        return jsonResponse({
            success: true,
            questions,
            sourceChunks: sourceChunks.length > 0 ? sourceChunks : undefined, // Trả về nguồn SGK để frontend hiển thị
        }, 200, env.CORS_ORIGIN);

    } catch (error) {
        console.error('[generate] error:', error);
        return jsonResponse({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500, env.CORS_ORIGIN);
    }
}

// Chú thích: Handle stream chat (Server-Sent Events)
async function handleChatStream(request: Request, env: Env): Promise<Response> {
    try {
        const body = await request.json() as {
            message: string;
            context?: string;
            systemPrompt?: string; // Chú thích: Cho phép frontend gửi systemPrompt tùy chỉnh
        };

        if (!body.message) {
            return jsonResponse({ error: 'Message is required' }, 400, env.CORS_ORIGIN);
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
                ...corsHeaders(env.CORS_ORIGIN),
            },
        });

    } catch (error) {
        console.error('[stream] error:', error);
        return jsonResponse({
            error: 'Internal server error'
        }, 500, env.CORS_ORIGIN);
    }
}

// Chú thích: Handle feedback endpoint - lưu feedback từ user về chất lượng câu trả lời
async function handleFeedback(request: Request, env: Env): Promise<Response> {
    try {
        const body = await request.json() as {
            messageId: string;
            helpful: boolean;
            reason?: string;
            userMessage?: string;
            aiResponse?: string;
        };

        if (!body.messageId) {
            return jsonResponse({ error: 'messageId is required' }, 400, env.CORS_ORIGIN);
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
        }, 200, env.CORS_ORIGIN);

    } catch (error) {
        console.error('[feedback] error:', error);
        return jsonResponse({
            error: 'Lỗi lưu phản hồi'
        }, 500, env.CORS_ORIGIN);
    }
}

// Chú thích: Main fetch handler
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;

        // Chú thích: Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: corsHeaders(env.CORS_ORIGIN),
            });
        }

        // Chú thích: Health check (đã xoá Vertex AI, chuyển sang OpenRouter + HuggingFace)
        if (path === '/' || path === '/health') {
            return jsonResponse({
                status: 'ok',
                service: 'stem-vietnam-api',
                provider: 'openrouter + huggingface',
                timestamp: new Date().toISOString(),
            }, 200, env.CORS_ORIGIN);
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
