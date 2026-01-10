-- Migration 012: Teacher Invitation System
-- Hệ thống cấp tài khoản giáo viên qua mã mời

-- Bảng invitation codes cho giáo viên
CREATE TABLE IF NOT EXISTS teacher_invitations (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,  -- Mã mời (VD: GV-ABC123)
    created_by TEXT NOT NULL,   -- Admin tạo mã
    email TEXT,                  -- Email giáo viên được mời (optional)
    name TEXT,                   -- Tên giáo viên được mời (optional)
    school_name TEXT,            -- Tên trường (optional)
    used BOOLEAN DEFAULT FALSE,
    used_by TEXT,                -- User ID của giáo viên đã dùng mã
    used_at INTEGER,
    expires_at INTEGER,          -- Thời hạn của mã mời
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_teacher_invitations_code ON teacher_invitations(code);
CREATE INDEX IF NOT EXISTS idx_teacher_invitations_email ON teacher_invitations(email);

-- Bảng schools (trường học) - cho Phase 4 Multi-School
CREATE TABLE IF NOT EXISTS schools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE,            -- Mã trường (VD: THPT-ABC)
    address TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    admin_id TEXT,               -- User quản lý trường
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Thêm school_id vào users cho giáo viên
ALTER TABLE users ADD COLUMN school_id TEXT REFERENCES schools(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN teacher_code TEXT;  -- Mã giáo viên trong trường

CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
