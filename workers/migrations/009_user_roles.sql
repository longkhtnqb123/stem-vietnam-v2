-- Migration 009: Thêm role cho users
-- Chú thích: Phân quyền student/teacher/admin

-- Thêm cột role vào bảng users
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student' 
  CHECK(role IN ('student', 'teacher', 'admin'));

-- Index cho filter theo role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Cập nhật users hiện tại thành student (nếu chưa có role)
-- SQLite không hỗ trợ UPDATE với condition trên cột mới, nên mặc định đã là 'student'
