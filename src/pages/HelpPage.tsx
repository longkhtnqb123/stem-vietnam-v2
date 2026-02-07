import { useState } from 'react';
import { Link } from 'react-router-dom';

type TabType = 'student' | 'teacher';

interface GuideSection {
    title: string;
    description: string;
    steps: string[];
    link?: string;
    linkText?: string;
}

const STUDENT_GUIDES: GuideSection[] = [
    {
        title: 'Chat AI',
        description: 'Hỏi đáp và giải bài tập với AI.',
        steps: [
            'Mở menu Chat AI',
            'Nhập câu hỏi và gửi',
            'Đọc giải thích và gợi ý',
        ],
        link: '/chat',
        linkText: 'Mở Chat AI',
    },
    {
        title: 'Lớp học',
        description: 'Tham gia lớp học và làm bài tập.',
        steps: [
            'Mở menu Lớp học',
            'Nhập mã tham gia',
            'Theo dõi bài tập',
        ],
        link: '/classes',
        linkText: 'Vào lớp',
    },
    {
        title: 'Thi online',
        description: 'Làm bài thi trực tuyến và xem kết quả.',
        steps: [
            'Chọn đề thi',
            'Bắt đầu làm bài',
            'Nộp bài và xem điểm',
        ],
        link: '/exam',
        linkText: 'Làm bài thi',
    },
    {
        title: 'Thư viện',
        description: 'Xem tài liệu, SGK và đề mẫu.',
        steps: [
            'Mở menu Thư viện',
            'Lọc theo lớp',
            'Tải về tài liệu',
        ],
        link: '/library',
        linkText: 'Mở thư viện',
    },
    {
        title: 'Cài đặt',
        description: 'Tùy chỉnh AI và giao diện.',
        steps: [
            'Mở Cài đặt',
            'Nhập API key nếu cần',
            'Lưu thay đổi',
        ],
        link: '/settings',
        linkText: 'Mở cài đặt',
    },
];

const TEACHER_GUIDES: GuideSection[] = [
    {
        title: 'Tạo đề thi AI',
        description: 'Tạo đề thi nhanh theo ma trận.',
        steps: [
            'Mở Thi online',
            'Chọn Tạo đề AI',
            'Xem trước và lưu',
        ],
        link: '/exam',
        linkText: 'Tạo đề thi',
    },
    {
        title: 'Quản lý lớp học',
        description: 'Tạo lớp, mời học sinh, giao bài tập.',
        steps: [
            'Tạo lớp mới',
            'Gửi mã tham gia',
            'Giao bài tập',
        ],
        link: '/classes',
        linkText: 'Quản lý lớp',
    },
    {
        title: 'Thống kê',
        description: 'Xem điểm và tiến độ của học sinh.',
        steps: [
            'Mở đề thi',
            'Xem thống kê',
        ],
        link: '/exam',
        linkText: 'Xem thống kê',
    },
    {
        title: 'Tạo đề thủ công',
        description: 'Tạo đề thi từ câu hỏi sẵn có.',
        steps: [
            'Mở Thi online',
            'Tạo đề mới',
            'Lưu đề thi',
        ],
        link: '/exam',
        linkText: 'Tạo đề thủ công',
    },
    {
        title: 'RAG từ SGK',
        description: 'AI tạo câu hỏi theo SGK.',
        steps: [
            'Chọn lớp và định hướng',
            'Tạo câu hỏi AI',
        ],
    },
    {
        title: 'Chat AI hỗ trợ soạn bài',
        description: 'Sử dụng Chat AI để soạn bài giảng.',
        steps: [
            'Mở Chat AI',
            'Nhập yêu cầu',
        ],
        link: '/chat',
        linkText: 'Mở Chat AI',
    },
];

export default function HelpPage() {
    const [activeTab, setActiveTab] = useState<TabType>('student');
    const guides = activeTab === 'student' ? STUDENT_GUIDES : TEACHER_GUIDES;

    return (
        <div className="lms-page">
            <section className="lms-card">
                <div className="lms-card-header">
                    <div>
                        <div className="lms-card-title">Hướng dẫn sử dụng</div>
                        <div className="lms-card-subtitle">Chọn vai trò để xem hướng dẫn</div>
                    </div>
                    <div className="lms-row">
                        <button
                            onClick={() => setActiveTab('student')}
                            className={activeTab === 'student' ? 'lms-button' : 'lms-button-secondary'}
                        >
                            Học sinh
                        </button>
                        <button
                            onClick={() => setActiveTab('teacher')}
                            className={activeTab === 'teacher' ? 'lms-button' : 'lms-button-secondary'}
                        >
                            Giáo viên
                        </button>
                    </div>
                </div>
            </section>

            <section className="lms-grid lms-grid-2">
                {guides.map((guide) => {
                    const tag = guide.title
                        .split(' ')
                        .map(word => word[0])
                        .join('')
                        .slice(0, 3)
                        .toUpperCase();

                    return (
                        <article key={guide.title} className="lms-card">
                            <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                                <div className="lms-row">
                                    <span className="lms-guide-tag">{tag}</span>
                                    <div>
                                        <div className="lms-card-title">{guide.title}</div>
                                        <div className="lms-card-subtitle">{guide.description}</div>
                                    </div>
                                </div>
                            </div>
                            <ul className="lms-section">
                                {guide.steps.map((step, idx) => (
                                    <li key={idx} className="lms-note">- {step}</li>
                                ))}
                            </ul>
                            {guide.link && guide.linkText && (
                                <Link to={guide.link} className="lms-button-secondary">
                                    {guide.linkText}
                                </Link>
                            )}
                        </article>
                    );
                })}
            </section>
        </div>
    );
}
