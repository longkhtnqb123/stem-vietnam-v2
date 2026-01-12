# 🎓 Học Công Nghệ - Nền Tảng Học Tập AI

> **Ứng dụng học tập thông minh cho môn Công Nghệ THPT (GDPT 2018)**

![Version](https://img.shields.io/badge/version-3.0-emerald)
![Status](https://img.shields.io/badge/status-production-green)
![License](https://img.shields.io/badge/license-MIT-blue)

🌐 **Live Demo**: [hoccongnghe.pages.dev](https://hoccongnghe.pages.dev)

---

## ✨ Tính Năng Chính

### 🤖 AI Chat Thông Minh
- Trả lời câu hỏi về môn Công Nghệ (Lớp 10-12)
- Hỗ trợ cả định hướng **Công nghiệp** và **Nông nghiệp**
- RAG (Retrieval-Augmented Generation) với kiến thức từ SGK Cánh Diều

### 📝 Thi Online
- Tạo đề thi tự động bằng AI theo chuẩn **GDPT 2018**
- 4 mức độ tư duy: Nhận biết → Thông hiểu → Vận dụng → Vận dụng cao
- Tự động chấm điểm, phân tích kết quả

### 🎮 Gamification
- Tích XP, lên Level
- Daily Streak, Achievements
- Leaderboard

### 🎨 Giao Diện
- 4 Theme: Sáng, Tối (AMOLED), Sepia (đỡ mỏi mắt), Tự động
- Responsive trên Mobile/Tablet/Desktop
- PWA - Cài như app native

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, Vite 7 |
| **Backend** | Cloudflare Workers, Hono |
| **Database** | Cloudflare D1 (SQLite at Edge) |
| **Vector DB** | Cloudflare Vectorize (RAG) |
| **Storage** | Cloudflare R2 (PDFs) |
| **AI** | OpenRouter (DeepSeek R1, MiMo, Gemini 2.0) |
| **Embeddings** | HuggingFace (MiniLM-L6) |

### AI Models

| Tác vụ | Model |
|--------|-------|
| Chat | `xiaomi/mimo-v2-flash:free` |
| Tạo đề thi | `tngtech/deepseek-r1t2-chimera:free` |
| Web Search | `google/gemini-2.0-flash-lite:free:online` |

---

## 🚀 Cài Đặt

### Yêu cầu
- Node.js 20+
- Cloudflare Account (free)

### 1. Clone & Install

```bash
git clone https://github.com/LongNgn204/stem-vietnam-v2.git
cd stem-vietnam-v2
npm install
```

### 2. Setup Backend

```bash
cd workers
npm install

# Tạo database
npx wrangler d1 create stem-vietnam-db
npx wrangler d1 execute stem-vietnam-db --local --file=schema.sql

# Set secrets
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put HF_API_TOKEN
npx wrangler secret put JWT_SECRET
```

### 3. Chạy Local

```bash
# Terminal 1 - Backend (port 8787)
cd workers && npx wrangler dev

# Terminal 2 - Frontend (port 5173)
npm run dev
```

### 4. Deploy

```bash
# Frontend → Cloudflare Pages
npm run build
# Push to GitHub (auto-deploy)

# Backend → Cloudflare Workers
cd workers && npm run deploy
```

---

## 📁 Cấu Trúc

```
stem-vietnam-v2/
├── src/                    # Frontend React
│   ├── components/         # UI Components
│   ├── pages/              # Route pages
│   ├── hooks/              # Custom hooks
│   ├── lib/                # API clients
│   └── stores/             # Zustand state
├── workers/                # Backend Workers
│   ├── src/
│   │   ├── index.ts        # Main router
│   │   ├── openrouter.ts   # AI client
│   │   ├── prompts.ts      # System prompts
│   │   └── exam-online-routes.ts
│   └── migrations/         # SQL migrations
└── public/                 # Static assets
```

---

## 🔑 API Endpoints

**Base URL**: `https://stem-vietnam-api.stu725114073.workers.dev`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/chat` | Chat với AI |
| GET | `/api/exam-online/templates` | Danh sách đề thi |
| POST | `/api/exam-online/generate` | Tạo đề thi AI |
| POST | `/api/exam-online/attempts` | Bắt đầu làm bài |
| GET | `/api/gamification/profile` | XP, Level |

---

## 📚 GDPT 2018 - Chương Trình Công Nghệ

| Lớp | Định hướng | Nội dung |
|-----|------------|----------|
| 10 | Công nghiệp | Vẽ kỹ thuật, Cơ khí, Điện dân dụng |
| 10 | Nông nghiệp | Trồng trọt, Chăn nuôi, Lâm nghiệp |
| 11 | Cơ khí | Chế tạo cơ khí, Động cơ đốt trong |
| 11 | Chăn nuôi | Giống vật nuôi, Thức ăn, Phòng bệnh |
| 12 | Điện - Điện tử | Mạch điện, Điện tử số, PLC |
| 12 | Thuỷ sản | Nuôi trồng, Chế biến thuỷ sản |

---

## 🐛 Troubleshooting

### CORS Error
```bash
# Kiểm tra wrangler.toml
CORS_ORIGIN = "http://localhost:5173;https://hoccongnghe.pages.dev"

# Redeploy
cd workers && npm run deploy
```

### AI 500 Error
- Kiểm tra `OPENROUTER_API_KEY` đã set chưa
- Thử đổi model trong `openrouter.ts`

### Database Error
```bash
npx wrangler d1 execute stem-vietnam-db --local --file=schema.sql
```

---

## 👨‍💻 Author

**Nguyễn Hoàng Long**  
Applied AI Engineer | Full-stack Developer  
Hanoi National University of Education (HNUE)

---

## 📄 License

MIT License - Free for educational use.

---

*Built with ❤️ for Vietnamese students • Updated: January 2026*
