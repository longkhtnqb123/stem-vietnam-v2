const API_URL = (import.meta.env.VITE_API_URL || 'https://stem-vietnam-api.stu725114073.workers.dev').replace(/\/$/, '');

export interface ExamHistoryItem {
    id: string;
    topic: string;
    config: any;
    created_at: number;
}

export interface ExamDetail extends ExamHistoryItem {
    content: string;
}

function getAuthHeaders(token: string): HeadersInit {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

export async function getExams(token: string): Promise<ExamHistoryItem[]> {
    try {
        const res = await fetch(`${API_URL}/api/exams`, {
            headers: getAuthHeaders(token),
        });

        if (!res.ok) {
            console.warn('[examApi] getExams failed:', res.status);
            return [];
        }

        const data = await res.json();
        return data.exams || [];
    } catch (error) {
        console.error('[examApi] getExams error:', error);
        return [];
    }
}

export async function getExam(id: string, token: string): Promise<ExamDetail | null> {
    try {
        const res = await fetch(`${API_URL}/api/exams/${id}`, {
            headers: getAuthHeaders(token),
        });

        if (!res.ok) {
            console.warn('[examApi] getExam failed:', res.status);
            return null;
        }

        const data = await res.json();
        return data.exam || null;
    } catch (error) {
        console.error('[examApi] getExam error:', error);
        return null;
    }
}

export async function createExam(
    token: string,
    data: { topic: string; config: any; content: string }
): Promise<ExamHistoryItem | null> {
    try {
        const res = await fetch(`${API_URL}/api/exams`, {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            console.warn('[examApi] createExam failed:', res.status);
            return null;
        }

        const result = await res.json();
        return result.exam || null;
    } catch (error) {
        console.error('[examApi] createExam error:', error);
        return null;
    }
}

export async function deleteExam(id: string, token: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_URL}/api/exams/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(token),
        });

        return res.ok;
    } catch (error) {
        console.error('[examApi] deleteExam error:', error);
        return false;
    }
}
