// Chú thích: Landing Page với slide motion animations
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
    MessageCircle,
    FileQuestion,
    ClipboardList,
    GraduationCap,
    Library,
    Sparkles,
    ChevronRight,
    Play,
    BookOpen,
    Zap,
    Users,
    Award,
    ArrowRight
} from 'lucide-react';


// Chú thích: Custom hook cho scroll-triggered animations
function useInView(threshold = 0.1) {
    const ref = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                }
            },
            { threshold }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [threshold]);

    return { ref, isInView };
}

// Chú thích: Animated section wrapper
function AnimatedSection({
    children,
    className = '',
    animation = 'fade-up',
    delay = 0
}: {
    children: ReactNode;
    className?: string;
    animation?: 'fade-up' | 'slide-left' | 'slide-right' | 'zoom';
    delay?: number;
}) {
    const { ref, isInView } = useInView();

    const animationClasses = {
        'fade-up': 'translate-y-12 opacity-0',
        'slide-left': '-translate-x-16 opacity-0',
        'slide-right': 'translate-x-16 opacity-0',
        'zoom': 'scale-95 opacity-0'
    };

    return (
        <div
            ref={ref}
            className={`transform transition-all duration-700 ease-out ${className}`}
            style={{
                transitionDelay: `${delay}ms`,
                ...(isInView ? {} : { transform: animationClasses[animation].split(' ')[0] === 'scale-95' ? 'scale(0.95)' : undefined })
            }}
        >
            <div className={`transform transition-all duration-700 ease-out ${isInView ? 'translate-y-0 translate-x-0 scale-100 opacity-100' : animationClasses[animation]}`}
                style={{ transitionDelay: `${delay}ms` }}>
                {children}
            </div>
        </div>
    );
}

// Chú thích: Feature card component
function FeatureCard({
    icon: Icon,
    title,
    description,
    href,
    gradient,
    delay
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    href: string;
    gradient: string;
    delay: number;
}) {
    const { ref, isInView } = useInView();

    return (
        <div
            ref={ref}
            className={`transform transition-all duration-700 ease-out ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <Link
                to={href}
                className="group block p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 
                           hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-2 
                           transition-all duration-300"
            >
                <div className={`w-14 h-14 rounded-xl ${gradient} flex items-center justify-center mb-4
                                group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {description}
                </p>
                <div className="mt-4 flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Khám phá ngay <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
            </Link>
        </div>
    );
}

// Chú thích: Stats counter with animation
function StatCounter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
    const [count, setCount] = useState(0);
    const { ref, isInView } = useInView();

    useEffect(() => {
        if (isInView) {
            const duration = 2000;
            const steps = 60;
            const increment = value / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= value) {
                    setCount(value);
                    clearInterval(timer);
                } else {
                    setCount(Math.floor(current));
                }
            }, duration / steps);

            return () => clearInterval(timer);
        }
    }, [isInView, value]);

    return (
        <div ref={ref} className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-white">
                {count.toLocaleString()}{suffix}
            </div>
            <p className="text-slate-300 mt-2 font-medium">{label}</p>
        </div>
    );
}

// Chú thích: Typewriter effect for demo
function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
    const [displayText, setDisplayText] = useState('');
    const [started, setStarted] = useState(false);
    const { ref, isInView } = useInView();

    useEffect(() => {
        if (isInView && !started) {
            const timer = setTimeout(() => {
                setStarted(true);
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [isInView, delay, started]);

    useEffect(() => {
        if (started) {
            let i = 0;
            const timer = setInterval(() => {
                if (i < text.length) {
                    setDisplayText(text.slice(0, i + 1));
                    i++;
                } else {
                    clearInterval(timer);
                }
            }, 30);
            return () => clearInterval(timer);
        }
    }, [started, text]);

    return (
        <span ref={ref}>
            {displayText}
            {started && displayText.length < text.length && (
                <span className="animate-pulse">|</span>
            )}
        </span>
    );
}

// Chú thích: Floating particles background
function ParticlesBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
                <div
                    key={i}
                    className="absolute w-2 h-2 bg-primary-400/20 rounded-full animate-float"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${3 + Math.random() * 4}s`
                    }}
                />
            ))}
        </div>
    );
}

export default function LandingPage() {
    // const { isDarkMode, toggleDarkMode } = useAppStore();

    const features = [
        {
            icon: MessageCircle,
            title: 'Chat AI Thông Minh',
            description: 'Hỏi đáp kiến thức môn Công nghệ với AI được huấn luyện từ SGK chính thống.',
            href: '/chat',
            gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500'
        },
        {
            icon: FileQuestion,
            title: 'Tạo Câu Hỏi Trắc Nghiệm',
            description: 'Tự động sinh câu hỏi trắc nghiệm theo chủ đề và mức độ khó tùy chọn.',
            href: '/questions',
            gradient: 'bg-gradient-to-br from-purple-500 to-pink-500'
        },
        {
            icon: ClipboardList,
            title: 'Đề Thi THPT Quốc Gia',
            description: 'Tạo đề thi thử theo cấu trúc chuẩn của Bộ Giáo dục.',
            href: '/exam/thpt',
            gradient: 'bg-gradient-to-br from-orange-500 to-red-500'
        },
        {
            icon: GraduationCap,
            title: 'Đề Thi Giữa/Cuối Kỳ',
            description: 'Luyện tập với các đề kiểm tra định kỳ theo chương trình học.',
            href: '/exam/semester',
            gradient: 'bg-gradient-to-br from-green-500 to-emerald-500'
        },
        {
            icon: Library,
            title: 'Thư Viện Tài Liệu',
            description: 'Kho SGK và tài liệu học tập phong phú, cập nhật liên tục.',
            href: '/library',
            gradient: 'bg-gradient-to-br from-indigo-500 to-violet-500'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                                Học Công Nghệ
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Dark mode button removed */}
                            <Link
                                to="/chat"
                                className="hidden sm:flex btn-primary text-sm py-2 px-4"
                            >
                                Bắt Đầu Ngay
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-primary-950 animate-gradient" />

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiLz48cGF0aCBkPSJNNDAgMEgwdjQwaDQwVjB6TTEgMWgzOHYzOEgxVjF6IiBmaWxsPSIjZTJlOGYwIiBmaWxsLW9wYWNpdHk9Ii4zIi8+PC9nPjwvc3ZnPg==')] opacity-50 dark:opacity-10" />

                <ParticlesBackground />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <AnimatedSection animation="fade-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8">
                            <Zap className="w-4 h-4" />
                            AI hỗ trợ – Thầy cô kiểm chứng – Học sinh tiến bộ
                        </div>
                    </AnimatedSection>

                    <AnimatedSection animation="fade-up" delay={100}>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white leading-tight">
                            Luyện đề{' '}
                            <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Công Nghệ
                            </span>
                            <br />
                            theo chuẩn chương trình
                        </h1>
                    </AnimatedSection>

                    <AnimatedSection animation="fade-up" delay={200}>
                        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                            Nền tảng học tập thông minh giúp bạn ôn luyện kiến thức, tạo đề thi và hỏi đáp
                            với AI được huấn luyện từ sách giáo khoa chính thống.
                        </p>
                    </AnimatedSection>

                    <AnimatedSection animation="fade-up" delay={300}>
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/chat"
                                className="group btn-primary text-lg px-8 py-4 flex items-center gap-2"
                            >
                                <Play className="w-5 h-5" />
                                Bắt Đầu Học Ngay
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a
                                href="#features"
                                className="btn-secondary text-lg px-8 py-4 flex items-center gap-2"
                            >
                                <BookOpen className="w-5 h-5" />
                                Khám Phá Tính Năng
                            </a>
                        </div>
                    </AnimatedSection>

                    {/* Hero illustration / mockup */}
                    <AnimatedSection animation="zoom" delay={500}>
                        <div className="mt-16 relative mx-auto max-w-4xl">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary-500/20 border border-slate-200 dark:border-slate-700">
                                {/* Mock chat interface */}
                                <div className="bg-white dark:bg-slate-800 p-6">
                                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white">STEM AI Assistant</p>
                                            <p className="text-xs text-green-500">● Online</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-end">
                                            <div className="bg-primary-600 text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-xs">
                                                Giải thích về quy trình trồng trọt?
                                            </div>
                                        </div>
                                        <div className="flex justify-start">
                                            <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-tl-none px-4 py-3 max-w-md text-slate-700 dark:text-slate-200">
                                                <TypewriterText
                                                    text="Quy trình trồng trọt gồm 4 giai đoạn chính: Làm đất → Gieo trồng → Chăm sóc → Thu hoạch. Mỗi giai đoạn đều có những yêu cầu kỹ thuật riêng..."
                                                    delay={1000}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl -z-10 animate-float opacity-60" />
                            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full -z-10 animate-float opacity-40" style={{ animationDelay: '1s' }} />
                        </div>
                    </AnimatedSection>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 rounded-full border-2 border-slate-400 flex items-start justify-center p-2">
                        <div className="w-1 h-2 bg-slate-400 rounded-full animate-pulse" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <AnimatedSection animation="fade-up" className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                            Tất Cả Công Cụ Bạn Cần
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Từ hỏi đáp AI đến tạo đề thi tự động, tất cả được tích hợp trong một nền tảng duy nhất.
                        </p>
                    </AnimatedSection>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <FeatureCard
                                key={feature.href}
                                {...feature}
                                delay={index * 100}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
                <div className="max-w-7xl mx-auto">
                    <AnimatedSection animation="fade-up" className="text-center mb-16">
                        <p className="text-emerald-400 font-semibold tracking-wider uppercase text-sm mb-3">Thống Kê Nền Tảng</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                            Đồng Hành Cùng Thế Hệ Học Sinh Mới
                        </h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Hệ thống được xây dựng dựa trên chương trình SGK mới nhất của Bộ Giáo dục và Đào tạo
                        </p>
                    </AnimatedSection>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                            <StatCounter value={500} label="Câu Hỏi Trắc Nghiệm" suffix="+" />
                        </div>
                        <div className="text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                            <StatCounter value={35} label="Bài Học SGK" suffix="+" />
                        </div>
                        <div className="text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                            <StatCounter value={100} label="Phủ Sóng Chương Trình" suffix="%" />
                        </div>
                        <div className="text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                            <StatCounter value={24} label="Hỗ Trợ AI" suffix="/7" />
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <AnimatedSection animation="fade-up" className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                            Học Thông Minh Hơn, Không Phải Học Nhiều Hơn
                        </h2>
                    </AnimatedSection>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'Chọn Chủ Đề', desc: 'Lựa chọn bài học hoặc chương cần ôn tập' },
                            { step: '02', title: 'AI Hỗ Trợ', desc: 'Hỏi đáp và nhận giải thích chi tiết từ AI' },
                            { step: '03', title: 'Luyện Tập', desc: 'Làm đề thi và câu hỏi được tạo tự động' }
                        ].map((item, index) => (
                            <AnimatedSection key={item.step} animation="fade-up" delay={index * 150}>
                                <div className="text-center p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
                                    <div className="text-6xl font-bold text-primary-100 dark:text-primary-900/50 mb-4">
                                        {item.step}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                        {item.title}
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400">
                                        {item.desc}
                                    </p>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <AnimatedSection animation="zoom">
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-12 text-center">
                            {/* Decorative circles */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
                                    <Sparkles className="w-4 h-4" />
                                    Công cụ học tập thông minh
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                                    Bắt Đầu Hành Trình Chinh Phục Môn Công Nghệ
                                </h2>
                                <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                                    Trải nghiệm ngay nền tảng ôn thi Công nghệ THPT được phát triển bởi
                                    sinh viên Khoa Kỹ thuật và Công nghệ - Trường Đại học Sư phạm Hà Nội.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Link
                                        to="/chat"
                                        className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold px-8 py-4 rounded-xl 
                                                   hover:bg-emerald-50 hover:scale-105 transition-all duration-300 shadow-xl"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        Hỏi Đáp Với AI
                                    </Link>
                                    <Link
                                        to="/library"
                                        className="inline-flex items-center gap-2 bg-white/20 text-white font-bold px-8 py-4 rounded-xl 
                                                   hover:bg-white/30 transition-all duration-300 border border-white/30"
                                    >
                                        <Library className="w-5 h-5" />
                                        Xem Thư Viện SGK
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                                    Học Công Nghệ
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Luyện đề Công nghệ theo chuẩn chương trình.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Tính Năng</h4>
                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <li><Link to="/chat" className="hover:text-primary-600 dark:hover:text-primary-400">Chat AI</Link></li>
                                <li><Link to="/questions" className="hover:text-primary-600 dark:hover:text-primary-400">Tạo Câu Hỏi</Link></li>
                                <li><Link to="/exam/thpt" className="hover:text-primary-600 dark:hover:text-primary-400">Đề Thi THPT</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Tài Nguyên</h4>
                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <li><Link to="/library" className="hover:text-primary-600 dark:hover:text-primary-400">Thư Viện</Link></li>
                                <li><Link to="/exam/semester" className="hover:text-primary-600 dark:hover:text-primary-400">Đề Giữa/Cuối Kỳ</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Liên Hệ</h4>
                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <li className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>Hỗ trợ 24/7. Email: stu725114073@hnue.edu.vn</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Award className="w-4 h-4" />
                                    <span>Phát triển bởi sinh viên Khoa Kỹ thuật và Công nghệ - Trường Đại học Sư phạm Hà Nội.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
                        © 2026 Học Công Nghệ. Long Nguyen
                    </div>
                </div>
            </footer>
        </div>
    );
}
