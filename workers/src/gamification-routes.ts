// Gamification API Routes for STEM Vietnam
// Xử lý XP, Badges, Daily Goals, Leaderboard

import { Hono } from 'hono';
import { Bindings } from './types';
import { verifyJWT } from './auth-routes';

const app = new Hono<{ Bindings: Bindings }>();

// XP Configuration
const XP_CONFIG = {
    EXAM_COMPLETE: 10,        // Hoàn thành bài thi
    EXAM_PASS: 20,            // Đạt điểm >= 5
    EXAM_EXCELLENT: 50,       // Đạt điểm >= 8
    PERFECT_SCORE: 100,       // Đạt điểm 10
    STREAK_BONUS: 15,         // Bonus mỗi ngày streak
    DAILY_GOAL_COMPLETE: 25,  // Hoàn thành mục tiêu ngày
};

// Level thresholds (cumulative XP needed)
const LEVEL_THRESHOLDS = [
    0,      // Level 1
    100,    // Level 2
    250,    // Level 3
    500,    // Level 4
    1000,   // Level 5
    1750,   // Level 6
    2750,   // Level 7
    4000,   // Level 8
    5500,   // Level 9
    7500,   // Level 10+
];

function calculateLevel(xp: number): number {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) {
            return i + 1;
        }
    }
    return 1;
}

// GET /api/gamification/profile - Lấy thông tin gamification của user
app.get('/profile', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user XP/Level info
    const user = await c.env.DB.prepare(`
        SELECT id, name, xp, level, streak, last_activity_date
        FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user) {
        return c.json({ error: 'User not found' }, 404);
    }

    // Get earned badges
    const badges = await c.env.DB.prepare(`
        SELECT b.id, b.name, b.description, b.icon, b.category, ub.earned_at
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = ?
        ORDER BY ub.earned_at DESC
    `).bind(userId).all();

    // Get today's goal
    const today = new Date().toISOString().split('T')[0];
    let dailyGoal = await c.env.DB.prepare(`
        SELECT * FROM daily_goals WHERE user_id = ? AND date = ?
    `).bind(userId, today).first();

    // Create today's goal if not exists
    if (!dailyGoal) {
        const goalId = crypto.randomUUID();
        await c.env.DB.prepare(`
            INSERT INTO daily_goals (id, user_id, date, target_exams, completed_exams)
            VALUES (?, ?, ?, 3, 0)
        `).bind(goalId, userId, today).run();
        dailyGoal = { id: goalId, target_exams: 3, completed_exams: 0, achieved: false };
    }

    // Calculate level progress
    const currentLevel = user.level as number || 1;
    const currentXP = user.xp as number || 0;
    const currentLevelXP = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
    const nextLevelXP = LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const progressToNextLevel = Math.min(100, ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100);

    return c.json({
        xp: currentXP,
        level: currentLevel,
        streak: user.streak || 0,
        progressToNextLevel: Math.round(progressToNextLevel),
        xpToNextLevel: nextLevelXP - currentXP,
        badges: badges.results || [],
        dailyGoal: dailyGoal,
    });
});

// POST /api/gamification/add-xp - Thêm XP (internal use)
app.post('/add-xp', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const { amount, reason, referenceId } = await c.req.json();

    // Add XP transaction
    const transactionId = crypto.randomUUID();
    await c.env.DB.prepare(`
        INSERT INTO xp_transactions (id, user_id, amount, reason, reference_id)
        VALUES (?, ?, ?, ?, ?)
    `).bind(transactionId, userId, amount, reason, referenceId).run();

    // Update user XP and recalculate level
    const user = await c.env.DB.prepare(`SELECT xp FROM users WHERE id = ?`).bind(userId).first();
    const newXP = ((user?.xp as number) || 0) + amount;
    const newLevel = calculateLevel(newXP);

    await c.env.DB.prepare(`
        UPDATE users SET xp = ?, level = ? WHERE id = ?
    `).bind(newXP, newLevel, userId).run();

    return c.json({
        success: true,
        newXP,
        newLevel,
        xpGained: amount,
    });
});

// GET /api/gamification/leaderboard - Bảng xếp hạng
app.get('/leaderboard', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);

    // Get top 10 users by XP
    const leaderboard = await c.env.DB.prepare(`
        SELECT id, name, xp, level, streak,
               (SELECT COUNT(*) FROM user_badges WHERE user_id = users.id) as badge_count
        FROM users
        WHERE xp > 0
        ORDER BY xp DESC
        LIMIT 10
    `).all();

    // Get current user's rank if authenticated
    let userRank = null;
    if (userId) {
        const rank = await c.env.DB.prepare(`
            SELECT COUNT(*) + 1 as rank
            FROM users
            WHERE xp > (SELECT xp FROM users WHERE id = ?)
        `).bind(userId).first();
        userRank = rank?.rank || null;
    }

    return c.json({
        leaderboard: leaderboard.results || [],
        userRank,
    });
});

// GET /api/gamification/badges - Danh sách tất cả badges
app.get('/badges', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);

    const allBadges = await c.env.DB.prepare(`SELECT * FROM badges`).all();

    let earnedBadgeIds: string[] = [];
    if (userId) {
        const earned = await c.env.DB.prepare(`
            SELECT badge_id FROM user_badges WHERE user_id = ?
        `).bind(userId).all();
        earnedBadgeIds = (earned.results || []).map((b: any) => b.badge_id);
    }

    const badges = (allBadges.results || []).map((badge: any) => ({
        ...badge,
        earned: earnedBadgeIds.includes(badge.id),
    }));

    return c.json({ badges });
});

// POST /api/gamification/check-badges - Kiểm tra và cấp badges mới
app.post('/check-badges', async (c) => {
    const authHeader = c.req.header('Authorization');
    const userId = await verifyJWT(authHeader, c.env.JWT_SECRET);
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user stats
    const userStats = await c.env.DB.prepare(`
        SELECT u.streak, u.xp,
               (SELECT COUNT(*) FROM exam_attempts WHERE user_id = u.id AND submitted_at IS NOT NULL) as total_exams,
               (SELECT AVG(score) FROM exam_attempts WHERE user_id = u.id AND submitted_at IS NOT NULL) as avg_score,
               (SELECT MAX(score) FROM exam_attempts WHERE user_id = u.id AND submitted_at IS NOT NULL) as max_score
        FROM users u WHERE u.id = ?
    `).bind(userId).first();

    if (!userStats) {
        return c.json({ error: 'User not found' }, 404);
    }

    // Get all badges not yet earned
    const unearnedBadges = await c.env.DB.prepare(`
        SELECT * FROM badges 
        WHERE id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = ?)
    `).bind(userId).all();

    const newBadges: any[] = [];

    for (const badge of (unearnedBadges.results || [])) {
        let earned = false;

        switch (badge.criteria_type) {
            case 'total_exams':
                earned = (userStats.total_exams as number || 0) >= badge.criteria_value;
                break;
            case 'streak_days':
                earned = (userStats.streak as number || 0) >= badge.criteria_value;
                break;
            case 'avg_score':
                earned = (userStats.avg_score as number || 0) >= badge.criteria_value;
                break;
            case 'perfect_score':
                earned = (userStats.max_score as number || 0) >= badge.criteria_value;
                break;
        }

        if (earned) {
            // Award badge
            const ubId = crypto.randomUUID();
            await c.env.DB.prepare(`
                INSERT INTO user_badges (id, user_id, badge_id) VALUES (?, ?, ?)
            `).bind(ubId, userId, badge.id).run();

            // Award XP
            if (badge.xp_reward > 0) {
                const txId = crypto.randomUUID();
                await c.env.DB.prepare(`
                    INSERT INTO xp_transactions (id, user_id, amount, reason, reference_id)
                    VALUES (?, ?, ?, 'badge_earned', ?)
                `).bind(txId, userId, badge.xp_reward, badge.id).run();

                await c.env.DB.prepare(`
                    UPDATE users SET xp = xp + ? WHERE id = ?
                `).bind(badge.xp_reward, userId).run();
            }

            newBadges.push(badge);
        }
    }

    return c.json({ newBadges });
});

export { app as gamificationRoutes };
