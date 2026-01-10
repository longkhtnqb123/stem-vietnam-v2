// Chú thích: Trang Hướng dẫn sử dụng - 2 tab: Học sinh và Giáo viên
import { useState } from 'react';
import {
    GraduationCap,
    Users,
    MessageCircle,
    BookOpen,
    Trophy,
    Settings,
    Sparkles,
    ChevronRight,
    PlayCircle,
    BarChart3,
    Brain,
    Search,
    School
} from 'lucide-react';
import { Link } from 'react-router-dom';

type TabType = 'student' | 'teacher';

interface GuideSection {
    icon: React.ReactNode;
    title: string;
    description: string;
    steps: string[];
    link?: string;
    linkText?: string;
}

// Chú thích: Nội dung hướng dẫn cho học sinh
const STUDENT_GUIDES: GuideSection[] = [
    {
        icon: <MessageCircle className="w-8 h-8 text-blue-500" />,
        title: '💬 Chat với AI Thông Minh',
        description: 'Hỏi đáp với AI bách khoa - giải bài tập, giải thích khái niệm, viết code, và hơn thế nữa.',
        steps: [
            'Nhấn vào menu "Chat AI" ở thanh bên trái',
            'Nhập câu hỏi vào ô chat và nhấn Enter',
            'AI sẽ trả lời dựa trên kiến thức SGK và internet',
            'Có thể gửi kèm hình ảnh để AI phân tích',
            'Sử dụng "Deep Think" để AI suy luận sâu hơn',
        ],
        link: '/chat',
        linkText: 'Bắt đầu Chat →',
    },
    {
        icon: <School className="w-8 h-8 text-orange-500" />,
        title: '🏫 Lớp Học & Bài Tập',
        description: 'Tham gia lớp học của giáo viên và làm bài tập được giao.',
        steps: [
            'Vào menu "Lớp Học" -> Nhấn "Tham Gia Lớp"',
            'Nhập mã Join Code (do giáo viên cung cấp)',
            'Xem danh sách bài tập trong lớp',
            'Nhấn nộp bài để gửi kết quả cho giáo viên',
        ],
        link: '/classes',
        linkText: 'Vào lớp học →',
    },
    {
        icon: <Trophy className="w-8 h-8 text-yellow-500" />,
        title: '🏆 Thi Trắc Nghiệm Online',
        description: 'Làm bài thi trực tuyến với đồng hồ đếm ngược, tự động lưu, và xem kết quả chi tiết.',
        steps: [
            'Vào menu "Thi Online" ở thanh bên',
            'Chọn đề thi phù hợp (lớp, loại đề)',
            'Nhấn "Bắt đầu làm bài"',
            'Chọn đáp án cho từng câu hỏi',
            'Nhấn "Nộp bài" khi hoàn thành',
            'Xem kết quả và giải thích chi tiết',
        ],
        link: '/exam-online',
        linkText: 'Làm bài thi →',
    },
    {
        icon: <BookOpen className="w-8 h-8 text-green-500" />,
        title: '📚 Thư Viện Tài Liệu',
        description: 'Truy cập SGK, Chuyên đề, và Đề thi mẫu môn Công nghệ THPT.',
        steps: [
            'Vào menu "Thư viện" ở thanh bên',
            'Lọc theo lớp (10, 11, 12) và định hướng',
            'Nhấn vào tài liệu để xem chi tiết',
            'Có thể tải về hoặc đọc trực tuyến',
        ],
        link: '/library',
        linkText: 'Xem thư viện →',
    },
    {
        icon: <Settings className="w-8 h-8 text-slate-500" />,
        title: '⚙️ Tùy Chỉnh AI',
        description: 'Thay đổi AI model theo sở thích - có nhiều model miễn phí!',
        steps: [
            'Vào menu "Cài đặt"',
            'Chọn Provider (khuyến nghị: OpenRouter)',
            'Nhập API Key (lấy miễn phí từ OpenRouter)',
            'Chọn model (các model có 🆓 là miễn phí)',
            'Nhấn "Lưu" để áp dụng',
        ],
        link: '/settings',
        linkText: 'Cài đặt →',
    },
];

// Chú thích: Nội dung hướng dẫn cho giáo viên
const TEACHER_GUIDES: GuideSection[] = [
    {
        icon: <Sparkles className="w-8 h-8 text-purple-500" />,
        title: '✨ Tạo Đề Thi Bằng AI',
        description: 'AI tự động tạo đề thi trắc nghiệm dựa trên SGK với đầy đủ đáp án và giải thích.',
        steps: [
            'Vào menu "Thi Online"',
            'Nhấn nút "Tạo đề bằng AI" (màu tím)',
            'Chọn lớp, định hướng, loại đề, độ khó',
            'Nhập chủ đề cụ thể (nếu muốn)',
            'Nhấn "Tạo đề" và chờ AI xử lý',
            'Xem trước đề → Chỉnh sửa nếu cần → Lưu',
        ],
        link: '/exam-online',
        linkText: 'Tạo đề thi →',
    },
    {
        icon: <School className="w-8 h-8 text-orange-500" />,
        title: '🏫 Quản Lý Lớp Học',
        description: 'Tạo lớp, quản lý học sinh và giao bài tập trắc nghiệm.',
        steps: [
            'Vào menu "Lớp Học" -> "Tạo Lớp Mới"',
            'Copy mã Join Code gửi cho học sinh',
            'Vào chi tiết lớp -> Tab "Bài Tập" -> "Giao Bài"',
            'Chọn đề thi có sẵn để giao cho cả lớp',
        ],
        link: '/classes',
        linkText: 'Quản lý lớp →',
    },
    {
        icon: <BarChart3 className="w-8 h-8 text-blue-500" />,
        title: '📊 Xem Thống Kê Lớp',
        description: 'Theo dõi điểm số, phân bổ điểm, và bảng xếp hạng của học sinh.',
        steps: [
            'Vào chi tiết đề thi đã tạo',
            'Nhấn tab "Thống kê"',
            'Xem: Điểm trung bình, cao nhất, thấp nhất',
            'Xem biểu đồ phân bổ điểm',
            'Xem Top 10 học sinh xuất sắc',
        ],
        link: '/exam-online',
        linkText: 'Xem thống kê →',
    },
    {
        icon: <PlusCircle className="w-8 h-8 text-green-500" />,
        title: '📝 Tạo Đề Thủ Công',
        description: 'Upload đề thi có sẵn hoặc tạo từng câu hỏi.',
        steps: [
            'Vào menu "Thi Online"',
            'Nhấn "Tạo đề mới"',
            'Nhập thông tin đề (tiêu đề, thời gian...)',
            'Thêm từng câu hỏi với 4 đáp án',
            'Đánh dấu đáp án đúng và thêm giải thích',
            'Lưu đề để học sinh làm bài',
        ],
        link: '/exam-online',
        linkText: 'Tạo đề →',
    },
    {
        icon: <Brain className="w-8 h-8 text-pink-500" />,
        title: '🧠 Sử Dụng RAG từ SGK',
        description: 'AI sử dụng kiến thức trực tiếp từ SGK để tạo câu hỏi chính xác.',
        steps: [
            'Hệ thống đã index sẵn SGK Công nghệ THPT',
            'Khi tạo đề, AI sẽ tìm kiến thức phù hợp',
            'Câu hỏi được tạo dựa trên nội dung SGK',
            'Đảm bảo tính chính xác theo chương trình',
        ],
    },
    {
        icon: <Search className="w-8 h-8 text-orange-500" />,
        title: '🔍 Chat AI Hỗ Trợ Soạn Bài',
        description: 'Dùng Chat AI để soạn giáo án, tạo bài tập, giải thích khái niệm.',
        steps: [
            'Vào Chat AI',
            'Hỏi: "Soạn giáo án bài [tên bài]"',
            'Hỏi: "Tạo 5 câu hỏi vận dụng về [chủ đề]"',
            'Hỏi: "Giải thích [khái niệm] dễ hiểu cho học sinh"',
            'Copy kết quả để sử dụng',
        ],
        link: '/chat',
        linkText: 'Chat AI →',
    },
];

export default function HelpPage() {
    const [activeTab, setActiveTab] = useState<TabType>('student');

    const guides = activeTab === 'student' ? STUDENT_GUIDES : TEACHER_GUIDES;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
                        📖 Hướng Dẫn Sử Dụng
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">
                        Tìm hiểu cách sử dụng các tính năng của STEM Vietnam
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex p-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                        <button
                            onClick={() => setActiveTab('student')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'student'
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            <GraduationCap size={20} />
                            Dành cho Học sinh
                        </button>
                        <button
                            onClick={() => setActiveTab('teacher')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'teacher'
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            <Users size={20} />
                            Dành cho Giáo viên
                        </button>
                    </div>
                </div>

                {/* Guide Cards */}
                <div className="space-y-6">
                    {guides.map((guide, idx) => (
                        <div
                            key={idx}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                        >
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800">
                                        {guide.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                            {guide.title}
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            {guide.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Steps */}
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-4">
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                        <PlayCircle size={16} />
                                        Các bước thực hiện:
                                    </h4>
                                    <ol className="space-y-2">
                                        {guide.steps.map((step, stepIdx) => (
                                            <li key={stepIdx} className="flex items-start gap-3">
                                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs flex items-center justify-center font-bold">
                                                    {stepIdx + 1}
                                                </span>
                                                <span className="text-slate-700 dark:text-slate-300 text-sm">
                                                    {step}
                                                </span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>

                                {/* Action Button */}
                                {guide.link && (
                                    <Link
                                        to={guide.link}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium hover:from-blue-700 hover:to-cyan-700 transition-colors"
                                    >
                                        {guide.linkText}
                                        <ChevronRight size={18} />
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Prompt Guide Section */}
                <div className="mt-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                            <Sparkles className="w-8 h-8 text-yellow-300" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Bí Kíp "Prompt" Chat AI Hiệu Quả</h2>
                            <p className="text-indigo-100">Nghệ thuật đặt câu hỏi để khai thác tối đa sức mạnh AI</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Formula */}
                        <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
                            <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-yellow-300">
                                🧪 Công Thức Vàng
                            </h3>
                            <div className="space-y-4">
                                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">1</span>
                                        <span className="font-bold text-blue-200">Ngữ Cảnh (Context)</span>
                                    </div>
                                    <p className="text-sm text-slate-200 ml-8">Bạn là ai? Môn gì? Lớp mấy? Mục tiêu là gì?</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold">2</span>
                                        <span className="font-bold text-green-200">Nhiệm Vụ (Task)</span>
                                    </div>
                                    <p className="text-sm text-slate-200 ml-8">Động từ chỉ hành động rõ ràng: "Soạn", "Giải thích", "Tóm tắt", "So sánh".</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold">3</span>
                                        <span className="font-bold text-orange-200">Định Dạng (Format)</span>
                                    </div>
                                    <p className="text-sm text-slate-200 ml-8">Kết quả trả về là: Bảng, Danh sách gạch đầu dòng, Code, hay Sơ đồ tư duy?</p>
                                </div>
                            </div>
                        </div>

                        {/* Examples */}
                        <div className="space-y-4">
                            <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                                <p className="text-sm text-red-300 font-bold mb-1 flex items-center gap-1">❌ Câu hỏi Sơ Sài:</p>
                                <p className="text-sm italic opacity-80">"Soạn bài công nghệ 10."</p>
                                <p className="text-xs text-red-200 mt-1">-> AI không biết bài nào, mục đích gì, độ dài bao nhiêu.</p>
                            </div>

                            <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/40 shadow-lg">
                                <p className="text-sm text-green-300 font-bold mb-2 flex items-center gap-1">✅ Prompt Chuẩn (Dành cho Giáo viên):</p>
                                <p className="text-sm italic font-medium">"Đóng vai giáo viên Công nghệ 10. Hãy soạn giáo án 45 phút cho bài 'Hệ thống bôi trơn', bao gồm: Mục tiêu bài học, Hoạt động khởi động thú vị, Nội dung chính, và 5 câu hỏi trắc nghiệm củng cố (kèm đáp án)."</p>
                            </div>

                            <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/40 shadow-lg">
                                <p className="text-sm text-blue-300 font-bold mb-2 flex items-center gap-1">✅ Prompt Chuẩn (Dành cho Học sinh):</p>
                                <p className="text-sm italic font-medium">"Giải thích nguyên lý làm việc của Động cơ Diesel 4 kỳ. Hãy dùng ngôn ngữ đơn giản, dễ hiểu, lấy ví dụ thực tế so sánh với 'Xe máy', và trình bày các bước dưới dạng danh sách."</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-12 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        ❓ Câu Hỏi Thường Gặp
                    </h2>

                    <div className="space-y-4">
                        <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                                Có cần trả phí để sử dụng không?
                            </h4>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                Không! Hầu hết các tính năng đều miễn phí. Bạn có thể sử dụng các AI model miễn phí (có đánh dấu 🆓) từ OpenRouter.
                            </p>
                        </div>

                        <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                                Làm sao để lấy API Key?
                            </h4>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                Vào Settings → Chọn OpenRouter → Nhấn link "Lấy API Key" → Đăng ký tài khoản miễn phí → Copy key về paste vào.
                            </p>
                        </div>

                        <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                                AI có trả lời chính xác không?
                            </h4>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                AI sử dụng kiến thức từ SGK Việt Nam và được cấu hình để trả lời chính xác. Tuy nhiên, bạn nên kiểm tra lại thông tin quan trọng.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                                Cần hỗ trợ thêm?
                            </h4>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                Liên hệ qua email: support@stem-vietnam.edu.vn hoặc chat trực tiếp với AI để được hỗ trợ.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="mt-8 text-center">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                        ← Quay về trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
}
