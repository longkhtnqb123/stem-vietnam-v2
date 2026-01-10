# 🌟 STEM Vietnam - Education Platform v3.0

> **Nền tảng học tập AI thông minh cho học sinh Việt Nam**

![Version](https://img.shields.io/badge/version-3.0-emerald)
![Status](https://img.shields.io/badge/status-production-green)

---

## 📖 Mục Lục

- [Giới Thiệu](#giới-thiệu)
- [Tính Năng](#tính-năng)
- [Cài Đặt](#cài-đặt)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Hướng Dẫn Sử Dụng](#hướng-dẫn-sử-dụng)
- [API Documentation](#api-documentation)
- [Admin Tool](#admin-tool)

---

## 🎯 Giới Thiệu

**STEM Vietnam** là nền tảng học tập tích hợp AI, được thiết kế để:
- Hỗ trợ học sinh tự học các môn STEM
- Tạo đề thi tự động với AI
- Gamification để tăng động lực học tập
- Thu thập dữ liệu cho nghiên cứu giáo dục

### Tech Stack:
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Backend | Cloudflare Workers + Hono |
| Database | Cloudflare D1 (SQLite) |
| AI | OpenRouter API (Multiple models) |
| Vector Search | Cloudflare Vectorize |

---

## ✨ Tính Năng

### 🎓 Cho Học Sinh
- **AI Chat**: Hỏi đáp với AI tutor thông minh
- **Đề Thi Online**: Làm bài thi trắc nghiệm, tự động chấm điểm
- **Gamification**: Tích XP, lên level, nhận huy hiệu
- **Daily Goals**: Mục tiêu học tập hàng ngày
- **Leaderboard**: Bảng xếp hạng với bạn bè

### 👨‍🏫 Cho Giáo Viên
- **Quản Lý Lớp**: Tạo lớp, mời học sinh
- **Tạo Đề Thi**: AI tự động tạo đề từ SGK
- **Theo Dõi Tiến Độ**: Xem điểm, tiến độ từng học sinh
- **Thống Kê**: Dashboard phân tích lớp học

### 🔐 Cho Admin
- **User Management**: Tạo/sửa/xóa user
- **Bulk Import**: Import hàng loạt từ Excel/JSON
- **Analytics**: Thống kê toàn hệ thống
- **School Management**: Quản lý nhiều trường

---

## 🚀 Cài Đặt

### Yêu Cầu
- Node.js 18+
- npm hoặc pnpm
- Wrangler CLI (Cloudflare)

### Bước 1: Clone & Install

```bash
git clone https://github.com/LongNgn204/stem-vietnam-v2.git
cd stem-vietnam-v2
npm install
```

### Bước 2: Setup Backend

```bash
cd workers
npm install
cp wrangler.toml.example wrangler.toml
# Chỉnh sửa wrangler.toml với API keys của bạn
```

### Bước 3: Tạo Database

```bash
# Tạo D1 database
npx wrangler d1 create stem-vietnam-db

# Apply schema
npx wrangler d1 execute stem-vietnam-db --local --file=schema.sql

# Apply migrations
npx wrangler d1 migrations apply stem-vietnam-db --local
```

### Bước 4: Chạy Development

```bash
# Terminal 1 - Backend
cd workers
npx wrangler dev

# Terminal 2 - Frontend
npm run dev
```

Mở trình duyệt: `http://localhost:5173`

---

## 📁 Cấu Trúc Dự Án

```
stem-vietnam-v2/
├── src/                      # Frontend React
│   ├── components/           # UI Components
│   │   ├── admin/           # Admin modals
│   │   ├── gamification/    # XP, Badges, Leaderboard
│   │   ├── landing/         # Landing page
│   │   └── layout/          # MainLayout, ImmersiveLayout
│   ├── pages/               # Page components
│   ├── stores/              # Zustand stores
│   └── styles/              # CSS files
├── workers/                  # Backend Cloudflare Workers
│   ├── src/                 # Source code
│   │   ├── auth.ts          # Authentication logic
│   │   ├── index.ts         # Main router
│   │   ├── gamification-routes.ts
│   │   ├── school-routes.ts
│   │   └── user-management.ts
│   ├── migrations/          # SQL migrations
│   └── schema.sql           # Base database schema
├── tools/                   # Standalone tools
│   └── admin-tool.html      # Admin User Management
├── docs/                    # Documentation
└── public/                  # Static assets
```

---

## 📱 Hướng Dẫn Sử Dụng

### Cho Học Sinh

1. **Đăng Ký/Đăng Nhập**: Tạo tài khoản với email
2. **Dashboard**: Xem tiến độ, mục tiêu hàng ngày
3. **AI Chat**: Click vào "Hỏi AI" để đặt câu hỏi
4. **Làm Đề Thi**: Chọn đề thi, làm bài, xem kết quả
5. **Xem Thành Tích**: Theo dõi XP, level, huy hiệu

### Cho Giáo Viên

1. **Đăng Nhập** với tài khoản Teacher
2. **Tạo Lớp**: Dashboard → Tạo lớp mới
3. **Mời Học Sinh**: Copy mã lớp, gửi cho học sinh
4. **Tạo Đề Thi**: Exam Online → Tạo đề thi AI
5. **Xem Thống Kê**: Dashboard → Thống kê lớp

### Cho Admin

Xem [Admin Tool Documentation](#admin-tool)

---

## 🔌 API Documentation

### Base URL
- **Local**: `http://localhost:8787`
- **Production**: `https://stem-vietnam-api.stu725114073.workers.dev`

### Authentication

Hầu hết API cần `Authorization` header:
```
Authorization: Bearer <JWT_TOKEN>
```

### Endpoints Chính

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Đăng ký user |
| POST | `/api/auth/login` | Đăng nhập |
| GET | `/api/auth/me` | Lấy thông tin user |
| GET | `/api/conversations` | Danh sách conversations |
| POST | `/api/conversations` | Tạo conversation mới |
| GET | `/api/exam-online/templates` | Danh sách đề thi |
| POST | `/api/exam-online/generate` | Tạo đề thi AI |
| GET | `/api/gamification/profile` | XP, Level, Badges |
| GET | `/api/gamification/leaderboard` | Bảng xếp hạng |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | Danh sách users |
| POST | `/api/admin/users` | Tạo user mới |
| PUT | `/api/admin/users/:id` | Cập nhật user |
| DELETE | `/api/admin/users/:id` | Xóa user |
| POST | `/api/admin/users/bulk` | Import hàng loạt |
| GET | `/api/admin/stats` | Thống kê hệ thống |

---

## 🔐 Admin Tool

### Mở Admin Tool

1. Mở file `tools/admin-tool.html` bằng trình duyệt
2. Đảm bảo backend đang chạy (`npx wrangler dev`)
3. URL mặc định: `http://localhost:8787`

### Tính Năng

#### 1. Xem Danh Sách Users
- Tìm kiếm theo tên/email
- Xem role (Student/Teacher/Admin)
- Thống kê số lượng

#### 2. Tạo User Mới
- Click **"Create User"**
- Điền thông tin: Name, Email, Role, Password
- Password mặc định: `StemPassword123!`

#### 3. Sửa User
- Click **"Edit"** trên dòng user
- Thay đổi Name, Email, Role, Password
- Click **"Save Changes"**

#### 4. Xóa User
- Click **"Delete"** trên dòng user
- Xác nhận xóa

#### 5. Import Hàng Loạt

**Format JSON:**
```json
[
  {"name": "Nguyen Van A", "email": "a@mail.com", "role": "student"},
  {"name": "Tran Thi B", "email": "b@mail.com", "role": "teacher"}
]
```

**Format Excel:**
| Name | Email | Role |
|------|-------|------|
| Nguyen Van A | a@mail.com | student |
| Tran Thi B | b@mail.com | teacher |

---

## 🏫 Multi-School Setup

### Tạo Trường Mới

```bash
# Sử dụng API
curl -X POST http://localhost:8787/api/schools \
  -H "Content-Type: application/json" \
  -d '{"name": "THPT ABC", "code": "ABC123"}'
```

### Assign User vào Trường

Trong Admin Tool hoặc API:
```json
PUT /api/admin/users/:id
{"school_id": "school_id_here"}
```

---

## 📊 Research Data Export

### Export User Data
```bash
GET /api/research/export/users?format=csv
```

### Export Activity Logs
```bash
GET /api/research/export/events?from=2024-01-01&to=2024-12-31
```

---

## 🛠️ Troubleshooting

### Lỗi CORS
- Kiểm tra `CORS_ORIGIN` trong `wrangler.toml`
- Đảm bảo frontend URL matches

### Lỗi Database
```bash
# Reset local DB
npx wrangler d1 execute stem-vietnam-db --local --file=schema.sql
```

### Lỗi Authentication
- Kiểm tra `JWT_SECRET` trong `wrangler.toml`
- Clear localStorage và đăng nhập lại

---

## 📝 License

MIT License - Xem file [LICENSE](LICENSE)

---

## 👥 Contributors

- **STEM Vietnam Team**
- Built with ❤️ for Vietnamese students

---

*Last updated: January 2026*
