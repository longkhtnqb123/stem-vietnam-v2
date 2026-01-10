// Chú thích: API client cho hệ thống thi online
// Frontend dùng file này để gọi API exam-online

import { useAuthStore } from './auth';

// ==================== Types ====================

export interface ExamQuestion {
    id: string;
    content: string;
    options: string[];
    answer?: string;        // Chỉ có sau khi nộp bài
    explanation?: string;   // Chỉ có sau khi nộp bài
    level: 'remember' | 'understand' | 'apply' | 'analyze';
    chapter?: string;
    userAnswer?: string;    // Trả lời của user
    isCorrect?: boolean;    // Đúng/sai
}

export interface ExamTemplate {
    id: string;
    grade: '10' | '11' | '12';
    branch?: 'cong_nghiep' | 'nong_nghiep';
    exam_type: '15min' | 'midterm' | 'final' | 'thpt';
    title: string;
    description?: string;
    total_questions: number;
    duration_minutes: number;
    difficulty: 'easy' | 'medium' | 'hard';
    chapters?: string[];
    publisher?: string;
    created_at: number;
    times_taken: number;
}

export interface ExamAttempt {
    id: string;
    template_id: string;
    title?: string;
    grade?: string;
    branch?: string;
    exam_type?: string;
    score?: number;
    correct_count?: number;
    total_questions: number;
    duration_minutes?: number;
    started_at: number;
    submitted_at?: number;
    time_spent_seconds?: number;
    status: 'in_progress' | 'submitted' | 'reviewed';
    analysis?: {
        remember: { correct: number; total: number };
        understand: { correct: number; total: number };
        apply: { correct: number; total: number };
        analyze: { correct: number; total: number };
    };
}

export interface StartAttemptResponse {
    success: boolean;
    attempt: {
        id: string;
        template_id: string;
        title: string;
        total_questions: number;
        duration_minutes: number;
        started_at: number;
    };
    questions: ExamQuestion[];
}

export interface SubmitResult {
    success: boolean;
    result: {
        score: number;
        correct_count: number;
        total_questions: number;
        time_spent_seconds: number;
        analysis: ExamAttempt['analysis'];
        questions_with_answers: ExamQuestion[];
    };
}

// ==================== API Functions ====================

const API_URL = (import.meta.env.VITE_API_URL || 'https://stem-vietnam-api.stu725114073.workers.dev').replace(/\/$/, '');

function getAuthHeaders(): Record<string, string> {
    const token = useAuthStore.getState().token;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// ==================== Templates ====================

// Lấy danh sách đề thi (public)
export async function getExamTemplates(params?: {
    grade?: string;
    branch?: string;
    type?: string;
    limit?: number;
    offset?: number;
}): Promise<{ templates: ExamTemplate[] }> {
    const query = new URLSearchParams();
    if (params?.grade) query.set('grade', params.grade);
    if (params?.branch) query.set('branch', params.branch);
    if (params?.type) query.set('type', params.type);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    const response = await fetch(`${API_URL}/api/exam-online/templates?${query}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Không thể tải danh sách đề thi');
    }

    return response.json();
}

// Lấy chi tiết 1 template
export async function getExamTemplate(templateId: string): Promise<{ template: ExamTemplate & { questions: ExamQuestion[] } }> {
    const response = await fetch(`${API_URL}/api/exam-online/templates/${templateId}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Không tìm thấy đề thi');
    }

    return response.json();
}

// Tạo đề thi mới
export async function createExamTemplate(data: {
    grade: string;
    branch?: string;
    exam_type: string;
    title: string;
    description?: string;
    questions: ExamQuestion[];
    duration_minutes?: number;
    difficulty?: string;
    chapters?: string[];
    publisher?: string;
    is_public?: boolean;
}): Promise<{ success: boolean; template: { id: string; title: string } }> {
    const response = await fetch(`${API_URL}/api/exam-online/templates`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Không thể tạo đề thi');
    }

    return response.json();
}

// Xóa template
export async function deleteExamTemplate(templateId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/api/exam-online/templates/${templateId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Không thể xóa đề thi');
    }

    return response.json();
}

// Tạo đề thi bằng AI (RAG từ SGK)
export interface AIGenerateParams {
    grade: '10' | '11' | '12';
    branch?: 'cong_nghiep' | 'nong_nghiep';
    exam_type: '15min' | 'midterm' | 'final' | 'thpt';
    difficulty: 'easy' | 'medium' | 'hard';
    chapters?: string[];
    topic?: string;
    publisher?: string;
    save?: boolean;
}

export interface AIGenerateResponse {
    success: boolean;
    template: {
        id: string;
        title: string;
        total_questions: number;
        duration_minutes: number;
        difficulty: string;
    };
    questions: ExamQuestion[];
}

export async function generateExamWithAI(params: AIGenerateParams): Promise<AIGenerateResponse> {
    const response = await fetch(`${API_URL}/api/exam-online/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Không thể tạo đề thi bằng AI');
    }

    return response.json();
}

// ==================== Attempts ====================

// Bắt đầu làm bài
export async function startExamAttempt(templateId: string): Promise<StartAttemptResponse> {
    const response = await fetch(`${API_URL}/api/exam-online/attempts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ templateId }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Không thể bắt đầu làm bài');
    }

    return response.json();
}

// Lưu tiến độ (auto-save)
export async function saveAttemptProgress(
    attemptId: string,
    answers: Record<string, string>
): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/api/exam-online/attempts/${attemptId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ answers }),
    });

    if (!response.ok) {
        throw new Error('Không thể lưu tiến độ');
    }

    return response.json();
}

// Nộp bài
export async function submitExamAttempt(
    attemptId: string,
    answers?: Record<string, string>
): Promise<SubmitResult> {
    const response = await fetch(`${API_URL}/api/exam-online/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ answers }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Không thể nộp bài');
    }

    return response.json();
}

// Lấy lịch sử làm bài
export async function getExamAttempts(params?: {
    status?: 'in_progress' | 'submitted';
    limit?: number;
    offset?: number;
}): Promise<{ attempts: ExamAttempt[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    const response = await fetch(`${API_URL}/api/exam-online/attempts?${query}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Không thể tải lịch sử làm bài');
    }

    return response.json();
}

// Lấy chi tiết bài làm (xem lại)
export async function getExamAttempt(attemptId: string): Promise<{
    attempt: ExamAttempt;
    questions?: ExamQuestion[];
    questions_with_answers?: ExamQuestion[];
    answers?: Record<string, string>;
}> {
    const response = await fetch(`${API_URL}/api/exam-online/attempts/${attemptId}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Không tìm thấy bài làm');
    }

    return response.json();
}

// ==================== Helpers ====================

// Format thời gian (giây → mm:ss)
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Format điểm số
export function formatScore(score: number): string {
    return score.toFixed(1);
}

// Tính phần trăm
export function calculatePercentage(correct: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
}

// Map exam_type sang label tiếng Việt
export function getExamTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        '15min': 'Kiểm tra 15 phút',
        'midterm': 'Giữa kì',
        'final': 'Cuối kì',
        'thpt': 'THPT Quốc gia',
    };
    return labels[type] || type;
}

// Map difficulty sang label
export function getDifficultyLabel(difficulty: string): string {
    const labels: Record<string, string> = {
        'easy': '🟢 Dễ',
        'medium': '🟡 Trung bình',
        'hard': '🔴 Khó',
    };
    return labels[difficulty] || difficulty;
}

// Map level sang label tiếng Việt
export function getLevelLabel(level: string): string {
    const labels: Record<string, string> = {
        'remember': 'Nhận biết',
        'understand': 'Thông hiểu',
        'apply': 'Vận dụng',
        'analyze': 'Vận dụng cao',
    };
    return labels[level] || level;
}

// Thống kê template
export async function getTemplateStats(templateId: string): Promise<any> {
    const response = await fetch(`${API_URL}/api/exam-online/templates/${templateId}/stats`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Không thể tải thống kê đề thi');
    }

    return response.json();
}

// Teacher Dashboard
export async function getTeacherDashboard(): Promise<any> {
    const response = await fetch(`${API_URL}/api/teacher/dashboard`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to load dashboard');
    return response.json();
}

// Student Dashboard
export async function getStudentDashboard(): Promise<any> {
    const response = await fetch(`${API_URL}/api/student/dashboard`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to load dashboard');
    return response.json();
}

export const examOnlineApi = {
    getTemplates: getExamTemplates,
    getTemplate: getExamTemplate,
    createTemplate: createExamTemplate,
    deleteExamTemplate,
    generateExamWithAI,
    startExamAttempt,
    saveAttemptProgress,
    submitExamAttempt,
    getAttempt: getExamAttempt,
    getAttempts: getExamAttempts,
    getTemplateStats,
    getTeacherDashboard,
    getStudentDashboard,
    formatTime,
    formatScore,
    calculatePercentage,
    getExamTypeLabel,
    getDifficultyLabel,
    getLevelLabel
};
