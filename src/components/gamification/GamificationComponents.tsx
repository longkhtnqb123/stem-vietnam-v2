// Gamification Components cho STEM Vietnam
// XP Bar, Badge Display, Streak Counter, Level Indicator

import React from 'react';

interface XPBarProps {
    currentXP: number;
    level: number;
    progressToNextLevel: number;
    xpToNextLevel: number;
}

export function XPBar({ currentXP, level, progressToNextLevel, xpToNextLevel }: XPBarProps) {
    return (
        <div className="bento-card-highlight p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">LV</span>
                    </div>
                    <div>
                        <p className="text-sm text-white/80">Level</p>
                        <p className="text-2xl font-bold">{level}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm text-white/80">Tong XP</p>
                    <p className="text-xl font-semibold">{currentXP.toLocaleString()}</p>
                </div>
            </div>
            <div className="mt-4">
                <div className="flex justify-between text-xs text-white/70 mb-1">
                    <span>Tien do level {level + 1}</span>
                    <span>{xpToNextLevel} XP con thieu</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-500"
                        style={{ width: `${progressToNextLevel}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

interface StreakCounterProps {
    streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
    const isHot = streak >= 7;
    return (
        <div className={`bento-card flex items-center gap-4 ${isHot ? 'border-amber-300 dark:border-amber-800' : ''}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isHot
                ? 'bg-gradient-to-br from-amber-500 to-orange-500 animate-pulse'
                : 'bg-gradient-to-br from-amber-400 to-amber-500'
                }`}>
                <span className="text-xs font-bold text-white">STK</span>
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Streak</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {streak} <span className="text-lg">ngay</span>
                </p>
                {streak >= 7 && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                        Ban dang tien bo, tiep tuc phat huy.
                    </p>
                )}
            </div>
        </div>
    );
}

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    earned?: boolean;
    earned_at?: number;
}

interface BadgeDisplayProps {
    badges: Badge[];
    showAll?: boolean;
}

export function BadgeDisplay({ badges, showAll = false }: BadgeDisplayProps) {
    const displayBadges = showAll ? badges : badges.slice(0, 6);

    return (
        <div className="bento-card">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="lms-guide-tag">BAD</span>
                    Huy hieu
                </h3>
                <span className="text-sm text-slate-500">
                    {badges.filter(b => b.earned).length}/{badges.length}
                </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {displayBadges.map((badge) => (
                    <div
                        key={badge.id}
                        className={`flex flex-col items-center p-3 rounded-xl transition-all ${badge.earned
                            ? 'bg-primary-50 dark:bg-primary-900/20 hover:scale-105'
                            : 'bg-slate-100 dark:bg-slate-700/30 opacity-50 grayscale'
                            }`}
                        title={badge.description}
                    >
                        <span className="text-2xl">{badge.icon}</span>
                        <span className="text-xs text-center mt-1 font-medium truncate max-w-full">
                            {badge.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface DailyGoalProps {
    targetExams: number;
    completedExams: number;
    achieved: boolean;
}

export function DailyGoalCard({ targetExams, completedExams, achieved }: DailyGoalProps) {
    const progress = Math.min(100, (completedExams / targetExams) * 100);

    return (
        <div className={`bento-card ${achieved ? 'border-primary-300 dark:border-primary-700' : ''}`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="lms-guide-tag">GOAL</span>
                    Muc tieu hom nay
                </h3>
                {achieved && (
                    <span className="px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full">
                        Hoan thanh
                    </span>
                )}
            </div>
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600 dark:text-slate-400">Bai thi</span>
                        <span className="font-medium">{completedExams}/{targetExams}</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${achieved
                                ? 'bg-gradient-to-r from-primary-500 to-secondary-500'
                                : 'bg-secondary-500'
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
                <div className="text-center px-3 py-2 bg-accent-400/10 rounded-xl">
                    <span className="text-xs font-bold text-accent-600">XP</span>
                    <span className="text-xs font-medium text-accent-600 block">+25</span>
                </div>
            </div>
        </div>
    );
}

interface LeaderboardEntry {
    id: string;
    name: string;
    xp: number;
    level: number;
    streak: number;
    badge_count: number;
}

interface LeaderboardProps {
    entries: LeaderboardEntry[];
    currentUserId?: string;
    userRank?: number;
}

export function Leaderboard({ entries, currentUserId, userRank }: LeaderboardProps) {
    return (
        <div className="bento-card row-span-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <span className="lms-guide-tag">TOP</span>
                Bang xep hang
            </h3>

            {userRank && userRank > 10 && (
                <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-sm">
                    Xep hang cua ban: <span className="font-bold">#{userRank}</span>
                </div>
            )}

            <div className="space-y-2">
                {entries.map((entry, index) => {
                    const isCurrentUser = entry.id === currentUserId;
                    const rank = index + 1;
                    const rankLabel = rank <= 3 ? `Top ${rank}` : `#${rank}`;

                    return (
                        <div
                            key={entry.id}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isCurrentUser
                                ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                                }`}
                        >
                            <span className="w-10 text-center font-bold text-slate-600 dark:text-slate-400">
                                {rankLabel}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-xs font-bold">
                                {entry.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 dark:text-white truncate">
                                    {entry.name}
                                    {isCurrentUser && <span className="text-xs text-primary-600 ml-1">(Ban)</span>}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Lv.{entry.level} - {entry.streak} ngay - {entry.badge_count} huy hieu
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-primary-600 dark:text-primary-400">
                                    {entry.xp.toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-500">XP</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface AchievementToastProps {
    badge: Badge;
    xpReward: number;
    onClose: () => void;
}

export function AchievementToast({ badge, xpReward, onClose }: AchievementToastProps) {
    React.useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-4 right-4 z-50 animate-slide-left">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-primary-200 dark:border-primary-800 p-4 max-w-sm">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-2xl">
                        {badge.icon}
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                            Huy hieu moi
                        </p>
                        <p className="font-bold text-slate-900 dark:text-white">{badge.name}</p>
                        <p className="text-xs text-slate-500">{badge.description}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-accent-500">+{xpReward}</p>
                        <p className="text-xs text-slate-500">XP</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
