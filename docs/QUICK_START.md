# ⚡ Quick Start - Cài Đặt Nhanh

> 5 phút để chạy STEM Vietnam trên máy local

---

## Bước 1: Clone Project

```bash
git clone https://github.com/LongNgn204/stem-vietnam-v2.git
cd stem-vietnam-v2
```

## Bước 2: Cài Dependencies

```bash
# Frontend
npm install

# Backend
cd workers
npm install
cd ..
```

## Bước 3: Tạo Database Local

```bash
cd workers

# Tạo D1 database
npx wrangler d1 create stem-vietnam-db --local

# Apply schema
npx wrangler d1 execute stem-vietnam-db --local --file=schema.sql

# Apply migrations
npx wrangler d1 migrations apply stem-vietnam-db --local
```

## Bước 4: Cấu Hình API Keys

Tạo file `workers/.dev.vars`:

```env
JWT_SECRET=stem-vietnam-secret-key-2024
OPENROUTER_API_KEY=sk-or-v1-your-key-here
HF_API_TOKEN=hf_your-token-here
CORS_ORIGIN=http://localhost:5173
```

## Bước 5: Chạy ứng dụng

**Terminal 1 - Backend:**
```bash
cd workers
npx wrangler dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Bước 6: Truy Cập

| URL | Mô tả |
|-----|-------|
| http://localhost:5173 | Frontend App |
| http://localhost:8787 | Backend API |
| `tools/admin-tool.html` | Admin Tool (mở bằng browser) |

---

## 🧪 Test Nhanh

### Tạo User Đầu Tiên

Sử dụng `tools/admin-tool.html`:
1. Mở file bằng trình duyệt
2. Click **"Create User"**
3. Điền: Admin Test / admin@test.com / admin / StemPassword123!
4. Đăng nhập với tài khoản vừa tạo

### Hoặc Dùng API

```bash
# Đăng ký
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"123456"}'

# Đăng nhập
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

---

## ❓ Gặp Lỗi?

| Lỗi | Giải pháp |
|-----|-----------|
| `CORS error` | Kiểm tra backend đang chạy |
| `Database not found` | Chạy lại schema.sql |
| `Unauthorized` | Đăng nhập lại |
| `Port in use` | Đổi port hoặc kill process cũ |

---

*Xem chi tiết: [README.md](README.md)*
