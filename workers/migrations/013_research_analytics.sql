-- Migration 013: Research Analytics System
-- Hệ thống thu thập dữ liệu nghiên cứu

-- Bảng event_logs (theo dõi hành vi người dùng)
CREATE TABLE IF NOT EXISTS event_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    session_id TEXT,
    event_type TEXT NOT NULL,  -- 'page_view', 'button_click', 'exam_start', 'exam_submit', 'chat_message', etc.
    event_data TEXT,           -- JSON chứa chi tiết sự kiện
    page_url TEXT,
    user_agent TEXT,
    ip_hash TEXT,              -- Hash của IP (không lưu IP thật)
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_event_logs_user_id ON event_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_type ON event_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_event_logs_created_at ON event_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_event_logs_session ON event_logs(session_id);

-- Bảng surveys (khảo sát)
CREATE TABLE IF NOT EXISTS surveys (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    questions TEXT NOT NULL,   -- JSON array of questions
    target_role TEXT,          -- 'student', 'teacher', 'all'
    is_active BOOLEAN DEFAULT TRUE,
    created_by TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    expires_at INTEGER,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Bảng survey_responses (câu trả lời khảo sát)
CREATE TABLE IF NOT EXISTS survey_responses (
    id TEXT PRIMARY KEY,
    survey_id TEXT NOT NULL,
    user_id TEXT,
    answers TEXT NOT NULL,     -- JSON object keyed by question_id
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(survey_id, user_id) -- Mỗi user chỉ trả lời 1 lần
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user ON survey_responses(user_id);

-- Bảng research_exports (lịch sử xuất dữ liệu)
CREATE TABLE IF NOT EXISTS research_exports (
    id TEXT PRIMARY KEY,
    export_type TEXT NOT NULL, -- 'events', 'attempts', 'surveys', 'users_summary'
    filters TEXT,              -- JSON filters đã áp dụng
    file_url TEXT,             -- URL file đã xuất (R2)
    record_count INTEGER,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Bảng consent_records (đồng ý tham gia nghiên cứu)
CREATE TABLE IF NOT EXISTS consent_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    consent_given BOOLEAN DEFAULT FALSE,
    consent_type TEXT,         -- 'basic_analytics', 'full_research', 'none'
    consent_date INTEGER,
    withdrawal_date INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_consent_user ON consent_records(user_id);
