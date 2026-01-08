
// Chú thích: Shared types cho Frontend và Backend

export interface Env {
    OPENROUTER_API_KEY: string;
    HF_API_TOKEN: string;
    JWT_SECRET: string;
    DB: D1Database;
    VECTORIZE: VectorizeIndex;
    CORS_ORIGIN: string;
    BOOKS_BUCKET: R2Bucket;
}

// ==================== EXAM GENERATION TYPES ====================

export type QuestionType = 'multiple_choice' | 'true_false' | 'matching' | 'reading';

export type Difficulty = 'remember' | 'understand' | 'apply' | 'analyze';

export interface ExamMatrix {
    topic: string;
    totalQuestions: number;
    distribution: {
        remember: number;   // % (e.g., 30)
        understand: number; // %
        apply: number;      // %
        analyze: number;    // %
    };
    types: {
        multiple_choice: number; // Count
        true_false: number;     // Count
        matching?: number;      // Count
        reading?: number;       // Count
    };
    focusTopics?: string[]; // Các chủ đề trọng tâm cần tập trung
}

export interface GeneratedQuestion {
    id: number;
    type: QuestionType;
    question: string;
    options?: string[]; // For MCQ: 4 options
    statements?: string[]; // For True/False: 4 statements
    correct?: number | boolean[]; // MCQ: index; True/False: [true, false, true, false]
    matches?: Array<{ left: string; right: string }>; // For Matching
    explanation: string;
    difficulty: Difficulty;
    source: string; // Citation
    thinking?: string; // CoT reasoning
}

export interface GeneratorResponse {
    success: boolean;
    questions: GeneratedQuestion[];
    matrix: ExamMatrix;
    criticFeedback?: string; // Feedback from the Critic step
    sourceChunks?: any[];
}
