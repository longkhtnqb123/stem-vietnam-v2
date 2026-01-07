# 🎓 STEM Vietnam - Trợ Lý Học Tập Môn Công Nghệ THPT

> **Dự án Nghiên cứu Khoa học**  
> Nền tảng hỗ trợ học tập môn Công nghệ THPT tích hợp AI, giúp học sinh ôn tập và giáo viên tạo đề thi.

![STEM AI Banner](https://placehold.co/1200x300/6d28d9/ffffff?text=STEM+Vietnam+AI)

## ✨ Tính Năng

| Tính năng | Mô tả |
|-----------|-------|
| 🤖 **StemBot AI** | Chat AI thông minh, giải đáp thắc mắc 24/7 |
| 📝 **Tạo Đề Thi** | Tự động tạo đề theo cấu trúc THPT Quốc gia |
| 🔍 **Web Search** | Dữ liệu mới nhất từ internet |
| 📚 **RAG System** | Kiến thức chính xác từ SGK |

## 🏗️ Kiến Trúc

```
┌──────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                      │
│                   Vercel / Cloudflare Pages               │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│              CLOUDFLARE WORKERS (API)                     │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  OpenRouter │  │ HuggingFace │  │  DuckDuckGo │       │
│  │   (FREE)    │  │   (FREE)    │  │   (FREE)    │       │
│  │  LLM Chat   │  │  Embeddings │  │  Web Search │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│                          │                                │
│                          ▼                                │
│              ┌─────────────────────┐                     │
│              │ Cloudflare Vectorize │                     │
│              │   (RAG Database)     │                     │
│              └─────────────────────┘                     │
└──────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Backend** | Cloudflare Workers |
| **AI/LLM** | OpenRouter (Gemini, DeepSeek, MiMo - FREE) |
| **Embeddings** | HuggingFace Inference API (FREE) |
| **Database** | Cloudflare D1 (SQL), Vectorize (RAG) |
| **Search** | DuckDuckGo API (FREE) |

## 🚀 Cài Đặt

### Yêu cầu
- Node.js 18+
- Tài khoản Cloudflare
- OpenRouter API Key (free tại [openrouter.ai](https://openrouter.ai))
- HuggingFace Token (free tại [huggingface.co](https://huggingface.co/settings/tokens))

### 1. Clone & Install

```bash
git clone https://github.com/LongNgn204/totnghiepcongnghecungai1.git
cd stem-vietnam-v2

# Frontend
npm install

# Backend
cd workers && npm install
```

### 2. Cấu hình Secrets

```bash
cd workers

# API Keys (bắt buộc)
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put HF_API_TOKEN
npx wrangler secret put JWT_SECRET
```

### 3. Chạy Local

```bash
# Terminal 1 - Backend
cd workers && npx wrangler dev

# Terminal 2 - Frontend  
npm run dev
```

Truy cập: http://localhost:5173

## 📂 Cấu Trúc Dự Án

```
stem-vietnam-v2/
├── src/                    # Frontend React
│   ├── components/         # UI Components
│   ├── lib/                # API clients, utils
│   └── pages/              # Route pages
├── workers/                # Cloudflare Workers API
│   ├── src/
│   │   ├── index.ts        # Main API routes
│   │   ├── openrouter.ts   # LLM client (FREE)
│   │   ├── huggingface.ts  # Embeddings (FREE)
│   │   ├── duckduckgo.ts   # Web search (FREE)
│   │   └── vectorize.ts    # RAG vector search
│   └── wrangler.toml       # Worker config
├── public/                 # Static assets
├── ROADMAP.md              # Development roadmap
└── README.md
```

## 🌐 Deploy

### Frontend (Cloudflare Pages)
```bash
npm run build
# Deploy dist/ to Cloudflare Pages
```

### Backend (Cloudflare Workers)
```bash
cd workers
npm run deploy
```

## 💰 Chi Phí

| Service | Chi phí |
|---------|---------|
| OpenRouter | **FREE** (free models) |
| HuggingFace | **FREE** (inference API) |
| DuckDuckGo | **FREE** |
| Cloudflare Workers | **FREE** (100k req/day) |
| Cloudflare D1 | **FREE** (5GB) |
| Cloudflare Vectorize | **FREE** (30M vectors) |

**Tổng chi phí vận hành: $0/tháng** 🎉

## 📖 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/chat` | Chat với AI |
| POST | `/api/chat/stream` | Chat streaming |
| POST | `/api/generate` | Tạo câu hỏi trắc nghiệm |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/register` | Đăng ký |
| GET | `/api/conversations` | Lấy danh sách hội thoại |
| GET | `/api/exams` | Lấy danh sách đề thi |

## 🧪 Testing

```bash
# Health check
curl https://stem-vietnam-api.stu725114073.workers.dev/health

# Test chat
curl -X POST https://stem-vietnam-api.stu725114073.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Mạng LAN là gì?"}'
```

## 📝 License

MIT License © 2026 STEM Vietnam

---

**Tác giả**: Nguyễn Hoàng Long - HNUE  
**Liên hệ**: [GitHub](https://github.com/LongNgn204)
