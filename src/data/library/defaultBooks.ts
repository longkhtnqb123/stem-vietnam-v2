// Chú thích: Danh sách tài liệu THỰC TẾ đã có trong public/books
// Cập nhật dựa trên file đã upload - ưu tiên Cánh Diều

import type { Document } from '../../types';

// Chú thích: Các bộ sách được Bộ GD&ĐT phê duyệt
export const BOOK_PUBLISHERS = {
    CANH_DIEU: 'Cánh Diều',
    KET_NOI: 'Kết nối tri thức & cuộc sống',
    CHAN_TROI: 'Chân trời sáng tạo',
    BO_GDDT: 'Bộ GD&ĐT',
} as const;

export type BookPublisher = typeof BOOK_PUBLISHERS[keyof typeof BOOK_PUBLISHERS];

// ==================== SGK - Sách Giáo Khoa ====================
const SGK_BOOKS: Document[] = [
    {
        id: 'sgk-trong-trot-10',
        title: 'SGK Công nghệ Trồng trọt 10',
        grade: '10',
        topic: 'Trồng trọt',
        source: BOOK_PUBLISHERS.CANH_DIEU,
        fileUrl: '/books/sgk/SGK Công nghệ Trồng trọt 10.pdf',
        createdAt: Date.now(),
    },
    {
        id: 'sgk-thiet-ke-cong-nghe-10',
        title: 'SGK Chuyên đề Thiết kế và Công nghệ 10',
        grade: '10',
        topic: 'Thiết kế & Công nghệ',
        source: BOOK_PUBLISHERS.CANH_DIEU,
        fileUrl: '/books/sgk/SGKchuyên đề thiết kế và công nghệ 10.pdf',
        createdAt: Date.now(),
    },
    {
        id: 'sgk-chan-nuoi-11',
        title: 'SGK Công nghệ Chăn nuôi 11',
        grade: '11',
        topic: 'Chăn nuôi',
        source: BOOK_PUBLISHERS.CANH_DIEU,
        fileUrl: '/books/sgk/SGK công nghệ Chăn nuôi 11.pdf',
        createdAt: Date.now(),
    },
    {
        id: 'sgk-co-khi-11',
        title: 'SGK Công nghệ 11 – Công nghệ cơ khí (Cánh Diều)',
        grade: '11',
        topic: 'Cơ khí',
        source: BOOK_PUBLISHERS.CANH_DIEU,
        fileUrl: '/books/sgk/Sách giáo khoa Công nghệ 11 – Công nghệ cơ khí (Cánh Diều).pdf',
        createdAt: Date.now(),
    },
    {
        id: 'sgk-lam-nghiep-thuy-san-12',
        title: 'SGK Công nghệ Lâm Nghiệp Thuỷ sản 12',
        grade: '12',
        topic: 'Lâm nghiệp & Thuỷ sản',
        source: BOOK_PUBLISHERS.CANH_DIEU,
        fileUrl: '/books/sgk/SGK Công nghệ Lâm Nghiệp Thuỷ sản 12.pdf',
        createdAt: Date.now(),
    },
    {
        id: 'sgk-dien-dien-tu-12',
        title: 'SGK Công nghệ Điện - Điện tử 12',
        grade: '12',
        topic: 'Điện - Điện tử',
        source: BOOK_PUBLISHERS.CANH_DIEU,
        fileUrl: '/books/sgk/SGK Công nghệ điện - điện tử 12.pdf',
        createdAt: Date.now(),
    },
];

// ==================== CHUYÊN ĐỀ HỌC TẬP ====================
const CHUYEN_DE_BOOKS: Document[] = [
    {
        id: 'cd-trong-trot-10',
        title: 'Chuyên đề Công nghệ Trồng trọt 10',
        grade: '10',
        topic: 'Trồng trọt',
        source: BOOK_PUBLISHERS.CANH_DIEU,
        fileUrl: '/books/chuyen_de/Chuyên đề công nghệ trồng trọt 10.pdf',
        createdAt: Date.now(),
    },
    {
        id: 'cd-thiet-ke-cong-nghe-10',
        title: 'Chuyên đề học tập Thiết kế và Công nghệ 10',
        grade: '10',
        topic: 'Thiết kế & Công nghệ',
        source: BOOK_PUBLISHERS.CANH_DIEU,
        fileUrl: '/books/chuyen_de/Chuyên đề học tập Thiết kế và Công nghệ 10 - Cánh diều.pdf',
        createdAt: Date.now(),
    },
    {
        id: 'cd-chan-nuoi-11',
        title: 'Chuyên đề học tập Công nghệ 11 – Công nghệ chăn nuôi',
        grade: '11',
        topic: 'Chăn nuôi',
        source: BOOK_PUBLISHERS.CANH_DIEU,
        fileUrl: '/books/chuyen_de/Chuyên đề học tập Công nghệ 11 – Công nghệ chăn nuôi (Cánh Diều).pdf',
        createdAt: Date.now(),
    },
    {
        id: 'cd-co-khi-11',
        title: 'Chuyên đề học tập Công nghệ 11 – Công nghệ cơ khí',
        grade: '11',
        topic: 'Cơ khí',
        source: BOOK_PUBLISHERS.CANH_DIEU,
        fileUrl: '/books/chuyen_de/Chuyên đề học tập Công nghệ 11 – Công nghệ cơ khí (Cánh Diều).pdf',
        createdAt: Date.now(),
    },
    {
        id: 'cd-lam-nghiep-thuy-san-12',
        title: 'Chuyên đề học tập 12 - Lâm nghiệp & Thuỷ sản',
        grade: '12',
        topic: 'Lâm nghiệp & Thuỷ sản',
        source: BOOK_PUBLISHERS.CANH_DIEU,
        fileUrl: '/books/chuyen_de/Chuyên đề học tập 12, lâm nghiệp - Thuỷ sản.pdf',
        createdAt: Date.now(),
    },
];

// ==================== KHO TÀI LIỆU TỔNG HỢP (GOOGLE DRIVE) ====================
const MASTER_LIBRARY: Document[] = [
    {
        id: 'master-drive-link',
        title: 'KHO TÀI LIỆU CÔNG NGHỆ THPT (SGK, Chuyên đề, Sách GV)',
        grade: '12',
        topic: 'Thư viện tổng hợp',
        source: BOOK_PUBLISHERS.BO_GDDT,
        fileUrl: 'https://drive.google.com/drive/folders/1EMT1HMKsmyA2yoSbDQGnOQ93YwX5J4i_?usp=sharing',
        createdAt: Date.now(),
    }
];

// ==================== ĐỀ THI MẪU (SAMPLES) ====================
const SAMPLE_EXAMS: Document[] = [
    {
        id: 'exam-10-hk1-2023',
        title: 'Đề cương ôn tập HK1 Công nghệ 10 (2023-2024)',
        grade: '10',
        topic: 'Đề thi mẫu',
        source: BOOK_PUBLISHERS.BO_GDDT,
        fileUrl: '/books/de_thi/Lớp 10/DE CUONG ON TAP HK I 20232024.docx',
        createdAt: Date.now(),
    },
    {
        id: 'exam-10-ma-de-001',
        title: 'Mã đề 001 - Công nghệ 10',
        grade: '10',
        topic: 'Đề thi mẫu',
        source: BOOK_PUBLISHERS.BO_GDDT,
        fileUrl: '/books/de_thi/Lớp 10/Ma_de_001.docx',
        createdAt: Date.now(),
    },
    {
        id: 'exam-10-ma-de-002',
        title: 'Mã đề 002 - Công nghệ 10',
        grade: '10',
        topic: 'Đề thi mẫu',
        source: BOOK_PUBLISHERS.BO_GDDT,
        fileUrl: '/books/de_thi/Lớp 10/Ma_de_002.docx',
        createdAt: Date.now(),
    },
    // Chú thích: Thêm đại diện từ Lớp 11, 12 nếu cần
];

// ==================== TỔNG HỢP ====================
export const DEFAULT_LIBRARY: Document[] = [
    ...SGK_BOOKS,
    ...CHUYEN_DE_BOOKS,
    ...SAMPLE_EXAMS, // Add samples to library
    ...MASTER_LIBRARY
];

// Chú thích: Helper để lấy tài liệu theo lớp
export function getDocumentsByGrade(grade: '10' | '11' | '12'): Document[] {
    return DEFAULT_LIBRARY.filter(doc => doc.grade === grade);
}

// Chú thích: Helper để lấy tài liệu theo bộ sách
export function getDocumentsByPublisher(publisher: BookPublisher): Document[] {
    return DEFAULT_LIBRARY.filter(doc => doc.source === publisher);
}

// Chú thích: Helper để lấy theo loại
export function getDocumentsByType(type: 'sgk' | 'chuyen_de' | 'all'): Document[] {
    if (type === 'sgk') return SGK_BOOKS;
    if (type === 'chuyen_de') return CHUYEN_DE_BOOKS;
    return DEFAULT_LIBRARY;
}

// Chú thích: Kiểm tra file PDF có tồn tại không (dùng cho UI)
export async function checkDocumentExists(fileUrl: string): Promise<boolean> {
    try {
        const response = await fetch(fileUrl, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}

// Chú thích: Thống kê thư viện
export const LIBRARY_STATS = {
    totalSGK: SGK_BOOKS.length,
    totalChuyenDe: CHUYEN_DE_BOOKS.length,
    total: DEFAULT_LIBRARY.length,
};
