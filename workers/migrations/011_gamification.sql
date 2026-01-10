-- Migration 011: Gamification System
-- Thêm hệ thống XP, Badges, Daily Goals cho học sinh

-- Thêm cột XP và Level vào bảng users
ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_activity_date TEXT;

-- Bảng badges (huy hiệu)
CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,  -- emoji hoặc icon name
    category TEXT NOT NULL DEFAULT 'general',  -- 'streak', 'score', 'completion', 'special'
    criteria_type TEXT NOT NULL,  -- 'streak_days', 'total_exams', 'avg_score', 'perfect_score'
    criteria_value INTEGER NOT NULL,  -- threshold để đạt badge
    xp_reward INTEGER DEFAULT 0,  -- XP được thưởng khi đạt badge
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Bảng user_badges (badges đã đạt được)
CREATE TABLE IF NOT EXISTS user_badges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    badge_id TEXT NOT NULL,
    earned_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE(user_id, badge_id)
);

-- Bảng daily_goals (mục tiêu hàng ngày)
CREATE TABLE IF NOT EXISTS daily_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,  -- YYYY-MM-DD format
    target_exams INTEGER DEFAULT 3,
    completed_exams INTEGER DEFAULT 0,
    target_score REAL DEFAULT 7.0,
    achieved BOOLEAN DEFAULT FALSE,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, date)
);

-- Bảng xp_transactions (lịch sử XP)
CREATE TABLE IF NOT EXISTS xp_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,  -- positive = gain, negative = loss
    reason TEXT NOT NULL,  -- 'exam_complete', 'badge_earned', 'streak_bonus', 'daily_goal'
    reference_id TEXT,  -- ID của exam hoặc badge liên quan
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_goals_user_date ON daily_goals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id);

-- Insert default badges
INSERT OR IGNORE INTO badges (id, name, description, icon, category, criteria_type, criteria_value, xp_reward) VALUES
('badge_first_exam', 'Người mới', 'Hoàn thành bài thi đầu tiên', '🎯', 'completion', 'total_exams', 1, 50),
('badge_5_exams', 'Chăm chỉ', 'Hoàn thành 5 bài thi', '📚', 'completion', 'total_exams', 5, 100),
('badge_10_exams', 'Siêu cần cù', 'Hoàn thành 10 bài thi', '🏆', 'completion', 'total_exams', 10, 200),
('badge_streak_3', 'Streak 3 ngày', 'Học 3 ngày liên tục', '🔥', 'streak', 'streak_days', 3, 75),
('badge_streak_7', 'Streak 7 ngày', 'Học 7 ngày liên tục', '⚡', 'streak', 'streak_days', 7, 150),
('badge_streak_30', 'Streak Master', 'Học 30 ngày liên tục', '👑', 'streak', 'streak_days', 30, 500),
('badge_perfect_score', 'Điểm 10', 'Đạt điểm 10 trong một bài thi', '💯', 'score', 'perfect_score', 10, 200),
('badge_avg_8', 'Học giỏi', 'Điểm trung bình trên 8.0', '⭐', 'score', 'avg_score', 8, 150),
('badge_avg_9', 'Xuất sắc', 'Điểm trung bình trên 9.0', '🌟', 'score', 'avg_score', 9, 300);
