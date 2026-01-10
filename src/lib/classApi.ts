
import { useAuthStore } from './auth';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';

export interface Class {
    id: string;
    name: string;
    teacher_id: string;
    join_code: string;
    description?: string;
    created_at: number;
    member_count?: number;
    teacher_name?: string;
    is_member?: boolean;
}

export interface ClassMember {
    user_id: string;
    name: string;
    email: string;
    role: 'student' | 'assistant';
    joined_at: number;
}

export interface ClassAssignment {
    id: string;
    class_id: string;
    template_id: string;
    due_date?: number;
    created_at: number;
    template_title: string;
    duration_minutes: number;
    total_questions: number;
    attempts_count: number;
    max_score: number | null;
}

export interface ClassDetailResponse {
    class: Class;
    is_teacher: boolean;
    members: ClassMember[];
    assignments: ClassAssignment[];
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = useAuthStore.getState().token;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    const res = await fetch(`${API_URL}${url}`, { ...options, headers });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Lỗi kết nối' }));
        throw new Error(error.error || `Error ${res.status}`);
    }
    return res.json();
}

export const classApi = {
    // Lấy danh sách lớp
    getClasses: () => fetchWithAuth('/classes') as Promise<Class[]>,

    // Tạo lớp (Teacher)
    createClass: (name: string, description?: string) =>
        fetchWithAuth('/classes', {
            method: 'POST',
            body: JSON.stringify({ name, description })
        }) as Promise<{ id: string; join_code: string }>,

    // Tham gia lớp (Student)
    joinClass: (join_code: string) =>
        fetchWithAuth('/classes/join', {
            method: 'POST',
            body: JSON.stringify({ join_code })
        }) as Promise<{ message: string; class_id: string }>,

    // Chi tiết lớp
    getClassDetails: (id: string) => fetchWithAuth(`/classes/${id}`) as Promise<ClassDetailResponse>,

    // Giao bài tập
    createAssignment: (classId: string, templateId: string, dueDate?: number) =>
        fetchWithAuth(`/classes/${classId}/assignments`, {
            method: 'POST',
            body: JSON.stringify({ template_id: templateId, due_date: dueDate })
        }),

    // Xóa lớp
    deleteClass: (id: string) => fetchWithAuth(`/classes/${id}`, { method: 'DELETE' }),
};
