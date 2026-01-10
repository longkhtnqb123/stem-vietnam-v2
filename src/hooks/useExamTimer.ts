// Chú thích: Hook quản lý timer countdown cho bài thi
// Tự động đếm ngược, auto-submit khi hết giờ

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseExamTimerOptions {
    durationMinutes: number;      // Thời gian làm bài (phút)
    startedAt: number;            // Timestamp bắt đầu
    onTimeUp?: () => void;        // Callback khi hết giờ
    autoSubmit?: boolean;         // Tự động nộp khi hết giờ
    warningThreshold?: number;    // Cảnh báo khi còn X giây (mặc định 60)
}

interface UseExamTimerReturn {
    remainingSeconds: number;     // Số giây còn lại
    formattedTime: string;        // Format mm:ss
    isTimeUp: boolean;            // Đã hết giờ chưa
    isWarning: boolean;           // Đang trong thời gian cảnh báo
    elapsedSeconds: number;       // Số giây đã trôi qua
    percentRemaining: number;     // % thời gian còn lại
    pause: () => void;            // Tạm dừng (debug only)
    resume: () => void;           // Tiếp tục
}

export function useExamTimer({
    durationMinutes,
    startedAt,
    onTimeUp,
    autoSubmit = true,
    warningThreshold = 60,
}: UseExamTimerOptions): UseExamTimerReturn {
    const totalSeconds = durationMinutes * 60;
    const endTime = startedAt + totalSeconds * 1000;

    // State
    const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        return remaining;
    });
    const [isPaused, setIsPaused] = useState(false);
    const [isTimeUp, setIsTimeUp] = useState(false);
    const onTimeUpCalled = useRef(false);

    // Cập nhật timer mỗi giây
    useEffect(() => {
        if (isPaused || isTimeUp) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
            setRemainingSeconds(remaining);

            if (remaining === 0 && !onTimeUpCalled.current) {
                setIsTimeUp(true);
                onTimeUpCalled.current = true;

                if (onTimeUp && autoSubmit) {
                    console.log('[Timer] Time is up! Auto-submitting...');
                    onTimeUp();
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [endTime, isPaused, isTimeUp, onTimeUp, autoSubmit]);

    // Format time mm:ss
    const formattedTime = useCallback(() => {
        const mins = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, [remainingSeconds]);

    // Pause/Resume (chỉ dùng để debug)
    const pause = useCallback(() => setIsPaused(true), []);
    const resume = useCallback(() => setIsPaused(false), []);

    // Computed values
    const elapsedSeconds = totalSeconds - remainingSeconds;
    const percentRemaining = (remainingSeconds / totalSeconds) * 100;
    const isWarning = remainingSeconds > 0 && remainingSeconds <= warningThreshold;

    return {
        remainingSeconds,
        formattedTime: formattedTime(),
        isTimeUp,
        isWarning,
        elapsedSeconds,
        percentRemaining,
        pause,
        resume,
    };
}

// ==================== Helper Hook: Auto-save ====================

interface UseAutoSaveOptions {
    attemptId: string;
    answers: Record<string, string>;
    saveInterval?: number;        // Interval in ms (default 30s)
    onSave: (answers: Record<string, string>) => Promise<void>;
}

export function useAutoSave({
    attemptId,
    answers,
    saveInterval = 30000,
    onSave,
}: UseAutoSaveOptions) {
    const answersRef = useRef(answers);
    const lastSavedRef = useRef<string>('');

    // Update ref when answers change
    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    // Auto-save interval
    useEffect(() => {
        const interval = setInterval(async () => {
            const currentAnswersStr = JSON.stringify(answersRef.current);

            // Chỉ save nếu có thay đổi
            if (currentAnswersStr !== lastSavedRef.current) {
                try {
                    await onSave(answersRef.current);
                    lastSavedRef.current = currentAnswersStr;
                    console.log('[AutoSave] Saved answers', Object.keys(answersRef.current).length, 'answers');
                } catch (error) {
                    console.error('[AutoSave] Failed to save:', error);
                }
            }
        }, saveInterval);

        return () => clearInterval(interval);
    }, [attemptId, saveInterval, onSave]);

    // Manual save
    const saveNow = useCallback(async () => {
        try {
            await onSave(answersRef.current);
            lastSavedRef.current = JSON.stringify(answersRef.current);
        } catch (error) {
            console.error('[AutoSave] Manual save failed:', error);
            throw error;
        }
    }, [onSave]);

    return { saveNow };
}
