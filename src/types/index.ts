// Chú thích: Types chính cho hệ thống RAG và form tạo đề

// Tài liệu trong thư viện
export interface Document {
    id: string;
    title: string;
    grade: '10' | '11' | '12';
    topic: string;
    source: string; // VD: "SGK Kết nối tri thức"
    fileUrl: string;
    createdAt: number;
}

// Chunk đã được embed từ tài liệu
export interface DocumentChunk {
    id: string;
    documentId: string;
    content: string;
    chunkIndex: number;
    embeddingId?: string;
}

// Kết quả retrieve từ RAG
export interface RetrievedChunk {
    chunk: DocumentChunk;
    score: number;
    document: Document;
}

// Câu hỏi trắc nghiệm
export interface Question {
    id: string;
    content: string;
    type: 'multiple_choice' | 'true_false';
    options: string[];
    correctAnswer: number | boolean[];
    difficulty: 'remember' | 'understand' | 'apply' | 'analyze';
    topic: string;
    sourceChunkIds?: string[]; // RAG traceability
}

// Đề thi
export interface Exam {
    id: string;
    title: string;
    type: 'thpt' | 'midterm' | 'final';
    grade: '10' | '11' | '12';
    subject: 'cong_nghiep' | 'nong_nghiep';
    questions: Question[];
    createdAt: number;
    sourceChunkIds: string[];
}

// Form input cho tạo câu hỏi
export interface QuestionFormInput {
    topic: string;
    grade: '10' | '11' | '12';
    difficulty: 'remember' | 'understand' | 'apply' | 'analyze';
    count: number;
    customPrompt?: string;
}

// Form input cho tạo đề THPT
export interface ExamFormInput {
    subject: 'cong_nghiep' | 'nong_nghiep';
    customPrompt?: string;
}

// Form input cho tạo đề giữa/cuối kỳ
export interface SemesterExamFormInput {
    grade: '10' | '11' | '12';
    examType: 'midterm' | 'final';
    customPrompt?: string;
}

// Chat message
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    attachments?: { name: string; type: string; url: string }[];
    sourceChunks?: RetrievedChunk[]; // RAG sources
}

// Chat session
export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: number;
    updatedAt: number;
}
