// Chú thích: Tour Guide component cho user mới đăng ký
// Sử dụng multi-step overlay để hướng dẫn các tính năng chính

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, BookOpen, Trophy, MessageCircle, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TourStep {
    title: string;
    description: string;
    icon: React.ReactNode;
    targetPath?: string;
    highlight?: string; // CSS selector để highlight
}

const TOUR_STEPS: TourStep[] = [
    {
        title: '🎉 Chào mừng đến STEM Vietnam!',
        description: 'Đây là nền tảng học tập STEM thông minh với AI hỗ trợ. Hãy cùng khám phá các tính năng chính!',
        icon: <Sparkles className="w-12 h-12 text-purple-500" />,
    },
    {
        title: '💬 Chat AI Thông Minh',
        description: 'Hỏi đáp với AI bách khoa - giải bài tập, tìm kiếm thông tin, viết code, và hơn thế nữa. AI sử dụng kiến thức từ SGK Việt Nam.',
        icon: <MessageCircle className="w-12 h-12 text-blue-500" />,
        targetPath: '/chat',
    },
    {
        title: '📚 Thư Viện SGK',
        description: 'Truy cập hàng trăm tài liệu SGK, Chuyên đề, và Đề thi mẫu môn Công nghệ THPT theo cả 2 định hướng Công nghiệp và Nông nghiệp.',
        icon: <BookOpen className="w-12 h-12 text-green-500" />,
        targetPath: '/library',
    },
    {
        title: '🏆 Thi Online',
        description: 'Làm bài thi trắc nghiệm trực tuyến với tự động chấm điểm, xem lịch sử và phân tích kết quả. Giáo viên có thể tạo đề bằng AI!',
        icon: <Trophy className="w-12 h-12 text-yellow-500" />,
        targetPath: '/exam-online',
    },
    {
        title: '⚙️ Cài Đặt AI',
        description: 'Tùy chỉnh AI provider và model theo ý thích. Hỗ trợ OpenRouter, OpenAI, Google Gemini, Claude, và nhiều hơn nữa.',
        icon: <Settings className="w-12 h-12 text-slate-500" />,
        targetPath: '/settings',
    },
];

interface TourGuideProps {
    onComplete: () => void;
    isOpen: boolean;
}

export default function TourGuide({ onComplete, isOpen }: TourGuideProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const navigate = useNavigate();

    // Chú thích: Reset step khi mở lại
    useEffect(() => {
        if (isOpen) setCurrentStep(0);
    }, [isOpen]);

    if (!isOpen) return null;

    const step = TOUR_STEPS[currentStep];
    const isLastStep = currentStep === TOUR_STEPS.length - 1;
    const isFirstStep = currentStep === 0;

    function handleNext() {
        if (isLastStep) {
            onComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    }

    function handlePrev() {
        if (!isFirstStep) {
            setCurrentStep(prev => prev - 1);
        }
    }

    function handleSkip() {
        onComplete();
    }

    function handleGoToFeature() {
        if (step.targetPath) {
            onComplete();
            navigate(step.targetPath);
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip} />

            {/* Tour Card */}
            <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Progress bar */}
                <div className="h-1 bg-slate-200 dark:bg-slate-700">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
                    />
                </div>

                {/* Close button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    <X size={20} className="text-slate-400" />
                </button>

                {/* Content */}
                <div className="p-8 pt-6">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                            {step.icon}
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-3">
                        {step.title}
                    </h2>

                    {/* Description */}
                    <p className="text-slate-600 dark:text-slate-300 text-center leading-relaxed mb-6">
                        {step.description}
                    </p>

                    {/* Go to feature button */}
                    {step.targetPath && (
                        <button
                            onClick={handleGoToFeature}
                            className="w-full mb-4 py-2.5 px-4 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                        >
                            👉 Đi đến tính năng này
                        </button>
                    )}

                    {/* Step indicator */}
                    <div className="flex justify-center gap-2 mb-6">
                        {TOUR_STEPS.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentStep(idx)}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentStep
                                        ? 'bg-purple-500 w-6'
                                        : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handlePrev}
                            disabled={isFirstStep}
                            className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${isFirstStep
                                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            <ChevronLeft size={18} />
                            Trước
                        </button>
                        <button
                            onClick={handleNext}
                            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium flex items-center justify-center gap-2 hover:from-purple-700 hover:to-pink-700 transition-colors"
                        >
                            {isLastStep ? 'Bắt đầu!' : 'Tiếp'}
                            {!isLastStep && <ChevronRight size={18} />}
                        </button>
                    </div>

                    {/* Skip link */}
                    <button
                        onClick={handleSkip}
                        className="w-full mt-3 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        Bỏ qua hướng dẫn
                    </button>
                </div>
            </div>
        </div>
    );
}

// Chú thích: Hook để quản lý trạng thái Tour Guide
export function useTourGuide() {
    const STORAGE_KEY = 'stem-vietnam-tour-completed';

    const [showTour, setShowTour] = useState(false);

    useEffect(() => {
        // Chỉ hiển thị tour nếu chưa hoàn thành
        const completed = localStorage.getItem(STORAGE_KEY);
        if (!completed) {
            // Delay một chút để trang load xong
            const timer = setTimeout(() => setShowTour(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    function completeTour() {
        localStorage.setItem(STORAGE_KEY, 'true');
        setShowTour(false);
    }

    function resetTour() {
        localStorage.removeItem(STORAGE_KEY);
        setShowTour(true);
    }

    return { showTour, completeTour, resetTour };
}
