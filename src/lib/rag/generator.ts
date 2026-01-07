// Chú thích: RAG Generator - kết hợp retrieved context với Gemini
import { callGemini } from '../gemini';
import { getRAGContext, type RetrieveFilters } from './retriever';
import type { RetrievedChunk } from '../../types';

// Chú thích: Response từ RAG generator
export interface RAGGeneratorResponse {
    text: string;
    sourceChunks: RetrievedChunk[];
}

// Chú thích: Danh sách từ khóa để phân loại câu hỏi học tập
const ACADEMIC_KEYWORDS = [
    // Các pattern hỏi đáp học thuật
    'là gì', 'là sao', 'như thế nào', 'giải thích', 'định nghĩa', 'khái niệm',
    'công thức', 'tính toán', 'phương pháp', 'nguyên lý', 'cơ chế',
    // Từ khóa môn Công nghệ
    'mạng', 'tcp', 'ip', 'lan', 'wan', 'man', 'internet', 'router', 'switch',
    'máy tính', 'computer', 'lập trình', 'code', 'thuật toán', 'algorithm',
    'cơ sở dữ liệu', 'database', 'phần mềm', 'software', 'phần cứng', 'hardware',
    'công nghệ', 'điện tử', 'cơ khí', 'nông nghiệp', 'công nghiệp',
    'ô tô', 'động cơ', 'điện', 'mạch',
    // Từ khóa giáo dục
    'sgk', 'sách giáo khoa', 'bài tập', 'ví dụ', 'bài học',
    'lớp 10', 'lớp 11', 'lớp 12', 'thpt', 'thi', 'kiểm tra',
    'chương', 'bài', 'đề thi', 'trắc nghiệm',
    // Toán và Khoa học
    'tính', 'giải', 'chứng minh', 'vẽ', 'sơ đồ', 'biểu đồ'
];

// Chú thích: Từ khóa cho câu hỏi tự nhiên/chào hỏi
const GENERAL_KEYWORDS = [
    'xin chào', 'hello', 'hi', 'chào bạn', 'khỏe không', 'bạn tên gì',
    'cảm ơn', 'thanks', 'tạm biệt', 'bye', 'haha', 'okay', 'ok',
    'bạn là ai', 'bạn có thể làm gì', 'giúp tôi', 'help'
];

// Chú thích: Phân loại câu hỏi - học tập (dùng RAG) vs tự nhiên (không cần RAG)
function classifyQuery(query: string): 'academic' | 'general' {
    const queryLower = query.toLowerCase().trim();

    // Chú thích: Kiểm tra xem có phải câu chào/tự nhiên không
    if (GENERAL_KEYWORDS.some(kw => queryLower.includes(kw))) {
        // Nếu câu ngắn và chỉ là chào hỏi -> general
        if (queryLower.length < 50) {
            console.info('[rag-classify] general (greeting)', { query: queryLower.slice(0, 30) });
            return 'general';
        }
    }

    // Chú thích: Kiểm tra từ khóa học thuật
    const hasAcademicKeyword = ACADEMIC_KEYWORDS.some(kw => queryLower.includes(kw));
    if (hasAcademicKeyword) {
        console.info('[rag-classify] academic (keyword match)', { query: queryLower.slice(0, 30) });
        return 'academic';
    }

    // Chú thích: Mặc định nếu câu hỏi dài (>30 từ) thì coi như academic
    const wordCount = queryLower.split(/\s+/).length;
    if (wordCount > 15) {
        console.info('[rag-classify] academic (long query)', { wordCount });
        return 'academic';
    }

    // Chú thích: Còn lại là general
    console.info('[rag-classify] general (default)', { query: queryLower.slice(0, 30) });
    return 'general';
}

// Chú thích: Generate response với RAG pipeline (có smart classification)
export async function generateWithRAG(params: {
    query: string;
    systemPrompt: string;
    chatHistory?: string; // Lịch sử chat để AI nhớ context
    customPrompt?: string;
    filters?: RetrieveFilters;
}): Promise<RAGGeneratorResponse> {
    const { query, systemPrompt, chatHistory, customPrompt, filters } = params;

    // Chú thích: Step 1 - Phân loại câu hỏi
    const queryType = classifyQuery(query);

    let context = '';
    let chunks: RetrievedChunk[] = [];

    // Chú thích: Step 2 - Chỉ retrieve context nếu là câu hỏi học tập
    if (queryType === 'academic') {
        const ragResult = await getRAGContext(query, filters);
        context = ragResult.context;
        chunks = ragResult.chunks;

        if (chunks.length === 0) {
            console.warn('[rag-gen] No context found for academic query, will use general knowledge');
        }
    } else {
        console.info('[rag-gen] Skipping RAG for general query');
    }

    // Chú thích: Step 3 - Build full context với chat history
    let fullContext = '';
    if (chatHistory) {
        fullContext += `=== LỊCH SỬ HỘI THOẠI ===\n${chatHistory}\n\n`;
    }
    if (context) {
        fullContext += `=== TÀI LIỆU THAM KHẢO ===\n${context}`;
    }

    // Chú thích: Step 4 - Generate với Gemini
    const response = await callGemini({
        systemPrompt,
        userMessage: query,
        context: fullContext || undefined,
        customPrompt,
    });

    // Chú thích: Chỉ trả về sourceChunks khi là academic query và có context
    return {
        text: response.text,
        sourceChunks: queryType === 'academic' && chunks.length > 0 ? chunks : [],
    };
}

// Chú thích: Generate câu hỏi với RAG
export async function generateQuestionsWithRAG(params: {
    topic: string;
    grade: '10' | '11' | '12';
    difficulty: string;
    count: number;
    systemPrompt: string;
    customPrompt?: string;
}): Promise<RAGGeneratorResponse> {
    const { topic, grade, difficulty, count, systemPrompt, customPrompt } = params;

    const query = `Tạo ${count} câu hỏi trắc nghiệm về chủ đề "${topic}" cho học sinh lớp ${grade}, mức độ ${difficulty}`;

    return generateWithRAG({
        query,
        systemPrompt,
        customPrompt,
        filters: { grade },
    });
}

// Chú thích: Generate đề thi với RAG thông qua API Workers mới
import { generateQuestions } from '../api';

export async function generateExamWithRAG(params: {
    subject: 'cong_nghiep' | 'nong_nghiep';
    systemPrompt: string; // (Deprecated - worker dùng prompt riêng)
    customPrompt?: string;
}): Promise<RAGGeneratorResponse> {
    const { subject, customPrompt } = params;

    const subjectName = subject === 'cong_nghiep' ? 'Công nghiệp' : 'Nông nghiệp';
    const topic = `Đề thi THPT Quốc gia môn Công nghệ ${subjectName}. ${customPrompt || ''}`;

    // Chú thích: Gọi API Worker thay vì local Gemini
    const response = await generateQuestions(topic, 28, 'medium');

    if (!response.success || !response.questions) {
        throw new Error(response.error || 'Failed to generate exam');
    }

    // Chú thích: Format JSON questions thành text hiển thị
    // Frontend hiện tại expect text để hiển thị và sửa
    let formattedText = `**ĐỀ THI THỬ THPT QUỐC GIA MÔN CÔNG NGHỆ (${subjectName.toUpperCase()})**\n\n`;

    response.questions.forEach((q, index) => {
        const sourceTag = q.source_type ? ` *[Nguồn: ${q.source_type}]*` : '';
        formattedText += `**Câu ${index + 1}:** ${q.question}${sourceTag}\n`;
        q.options.forEach(opt => {
            formattedText += `${opt}\n`;
        });
        formattedText += `\n`; // Spacer
    });

    formattedText += `\n---\n**ĐÁP ÁN & GIẢI THÍCH CHI TIẾT**\n`;
    response.questions.forEach((q, index) => {
        const correctChar = String.fromCharCode(65 + q.correct); // 0->A, 1->B...
        formattedText += `\n**Câu ${index + 1}: ${correctChar}**\n*Giải thích:* ${q.explanation}\n`;
    });

    // Chú thích: Map sourceChunks từ API
    // Cần convert sang RetrievedChunk type giả định
    const mappedSources = (response.sourceChunks || []).map((chunk, idx) => ({
        chunk: {
            id: `chunk-${idx}`,
            documentId: 'doc-api',
            content: chunk.content,
            chunkIndex: idx,
        },
        score: 1, // Fake score
        document: {
            id: 'doc-api',
            title: chunk.source,
            grade: '12',
            topic: subjectName,
            source: chunk.source,
            fileUrl: '',
            createdAt: Date.now(),
        }
    })) as RetrievedChunk[];

    return {
        text: formattedText,
        sourceChunks: mappedSources,
    };
}
