import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface TourStep {
    title: string;
    description: string;
    tag: string;
    targetPath?: string;
}

const TOUR_STEPS: TourStep[] = [
    {
        title: 'Chao mung den STEM Vietnam',
        description: 'Huong dan nhanh de ban lam quen voi he thong.',
        tag: 'NEW',
    },
    {
        title: 'Chat AI',
        description: 'Hoi dap va giai bai tap voi AI.',
        tag: 'AI',
        targetPath: '/chat',
    },
    {
        title: 'Thu vien',
        description: 'Tra cuu SGK va tai lieu hoc tap.',
        tag: 'DOC',
        targetPath: '/library',
    },
    {
        title: 'Thi online',
        description: 'Lam bai thi va xem ket qua.',
        tag: 'EX',
        targetPath: '/exam',
    },
    {
        title: 'Cai dat',
        description: 'Tuy chinh AI va giao dien.',
        tag: 'CFG',
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
        <div className="lms-modal">
            <div className="lms-modal-panel" style={{ maxWidth: 560 }}>
                <div className="lms-modal-header">
                    <div className="lms-card-title">Huong dan nhanh</div>
                    <button onClick={handleSkip} className="lms-button-ghost">
                        Dong
                    </button>
                </div>
                <div className="lms-modal-body lms-section">
                    <div className="lms-row">
                        <span className="lms-guide-tag">{step.tag}</span>
                        <div>
                            <div className="lms-card-title">{step.title}</div>
                            <div className="lms-note">{step.description}</div>
                        </div>
                    </div>
                    {step.targetPath && (
                        <button onClick={handleGoToFeature} className="lms-button-secondary">
                            Di den muc nay
                        </button>
                    )}
                </div>
                <div className="lms-modal-footer">
                    <button onClick={handlePrev} disabled={isFirstStep} className="lms-button-secondary">
                        Truoc
                    </button>
                    <button onClick={handleNext} className="lms-button">
                        {isLastStep ? 'Bat dau' : 'Tiep'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function useTourGuide() {
    const STORAGE_KEY = 'stem-vietnam-tour-completed';
    const [showTour, setShowTour] = useState(false);

    useEffect(() => {
        const completed = localStorage.getItem(STORAGE_KEY);
        if (!completed) {
            setTimeout(() => setShowTour(true), 1500);
        }
    }, []);

    const completeTour = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setShowTour(false);
    };

    return { showTour, completeTour };
}
