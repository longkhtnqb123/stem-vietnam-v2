-- Migration 008: Exam Online System
-- Chú thích: Hệ thống thi trắc nghiệm online với tự động chấm điểm

-- ==================== Bảng exam_templates ====================
-- Lưu các đề thi mẫu (template)
CREATE TABLE IF NOT EXISTS exam_templates (
    id TEXT PRIMARY KEY,
    grade TEXT NOT NULL,              -- '10', '11', '12'
    branch TEXT,                      -- 'cong_nghiep', 'nong_nghiep', null (lớp 10)
    exam_type TEXT NOT NULL,          -- '15min', 'midterm', 'final', 'thpt'
    title TEXT NOT NULL,
    description TEXT,
    questions TEXT NOT NULL,          -- JSON array của câu hỏi
    total_questions INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
    chapters TEXT,                    -- JSON array các chương được chọn
    publisher TEXT,                   -- Bộ sách: 'Cánh Diều', 'KNTT', 'CTST'
    created_at INTEGER NOT NULL,
    created_by TEXT,                  -- user_id hoặc 'system'
    is_public INTEGER DEFAULT 1,      -- 1 = public, 0 = private
    times_taken INTEGER DEFAULT 0     -- Số lần được làm
);

-- ==================== Bảng exam_attempts ====================
-- Lưu các lượt làm bài của user
CREATE TABLE IF NOT EXISTS exam_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    template_id TEXT NOT NULL,
    answers TEXT NOT NULL,            -- JSON object {questionId: selectedAnswer}
    score REAL,                       -- Điểm số (null nếu chưa nộp)
    correct_count INTEGER,            -- Số câu đúng
    total_questions INTEGER NOT NULL,
    started_at INTEGER NOT NULL,
    submitted_at INTEGER,             -- null nếu đang làm
    time_spent_seconds INTEGER,       -- Thời gian làm bài (giây)
    status TEXT DEFAULT 'in_progress', -- 'in_progress', 'submitted', 'reviewed'
    
    -- Phân tích theo mức độ tư duy
    analysis TEXT,                    -- JSON: {remember: {correct, total}, understand: {...}, ...}
    
    FOREIGN KEY (template_id) REFERENCES exam_templates(id)
);

-- ==================== Indexes ====================
-- Tối ưu query
CREATE INDEX IF NOT EXISTS idx_attempts_user ON exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON exam_attempts(status);
CREATE INDEX IF NOT EXISTS idx_attempts_template ON exam_attempts(template_id);
CREATE INDEX IF NOT EXISTS idx_attempts_submitted ON exam_attempts(submitted_at);

CREATE INDEX IF NOT EXISTS idx_templates_grade ON exam_templates(grade);
CREATE INDEX IF NOT EXISTS idx_templates_type ON exam_templates(exam_type);
CREATE INDEX IF NOT EXISTS idx_templates_branch ON exam_templates(branch);
CREATE INDEX IF NOT EXISTS idx_templates_public ON exam_templates(is_public);

-- ==================== Sample Data (Optional) ====================
-- Chú thích: Đề mẫu để test

-- INSERT INTO exam_templates (id, grade, branch, exam_type, title, questions, total_questions, duration_minutes, created_at, created_by)
-- VALUES (
--     'sample-001',
--     '10',
--     NULL,
--     '15min',
--     'Đề kiểm tra 15 phút - Trồng trọt - Chương 1',
--     '[{"id":"q1","content":"Câu 1...","options":["A","B","C","D"],"answer":"A","level":"remember"}]',
--     15,
--     15,
--     1704873600000,
--     'system'
-- );
