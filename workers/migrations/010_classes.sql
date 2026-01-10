-- Migration: 010_classes.sql
-- Hệ thống Lớp học: Classes, Members, Assignments

-- 1. Bảng Classes (Lớp học)
CREATE TABLE classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    join_code TEXT UNIQUE, -- Mã tham gia (VD: STEAM123)
    description TEXT,
    created_at INTEGER DEFAULT (unixepoch() * 1000),
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index cho join_code để tìm nhanh
CREATE INDEX idx_classes_join_code ON classes(join_code);
CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);

-- 2. Bảng Class Members (Thành viên lớp)
CREATE TABLE class_members (
    class_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'student', -- 'student' hoặc 'assistant'
    joined_at INTEGER DEFAULT (unixepoch() * 1000),
    PRIMARY KEY (class_id, user_id),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_class_members_user_id ON class_members(user_id);

-- 3. Bảng Class Assignments (Bài tập giao cho lớp)
CREATE TABLE class_assignments (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    template_id TEXT NOT NULL, -- ID của đề thi đã tạo
    due_date INTEGER, -- Deadline (optional)
    created_at INTEGER DEFAULT (unixepoch() * 1000),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES exam_templates(id) ON DELETE CASCADE
);

CREATE INDEX idx_assignments_class_id ON class_assignments(class_id);
