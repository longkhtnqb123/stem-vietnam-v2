# 🎓 STEM Vietnam v2.0 - Trợ Lý Học Tập & Thi Online

> **Dự án Nghiên cứu Khoa học 2026**
> Nền tảng Giáo dục thông minh tích hợp AI RAG (Retrieval-Augmented Generation), hỗ trợ toàn diện dạy và học môn Công nghệ THPT.

![STEM AI Banner](https://placehold.co/1200x350/0f172a/ffffff?text=STEM+Vietnam+v2.0)

## ✨ Tính Năng Mới (v2.0)

### 🔐 Phân Quyền Thông Minh
- **Học sinh:** Làm bài thi, xem tiến độ, chat AI, thư viện số.
- **Giáo viên:** Tạo đề thi AI, quản lý lớp, xem thống kê chi tiết (pass rate, điểm TB).
- **Admin:** Quản lý hệ thống, ingest dữ liệu SGK.

### 📊 Dashboard Chuyên Biệt
| 🎓 Dashboard Học Sinh | 🏫 Dashboard Giáo Viên |
|-----------------------|------------------------|
| • **Tiến độ học tập** 7 ngày gần nhất | • **Thống kê tổng quan** lớp học |
| • **Phân tích Bloom:** Nhận biết -> Vận dụng | • **Biểu đồ phân bổ điểm** chi tiết |
| • **Gợi ý ôn tập** AI dựa trên điểm yếu | • **Top học sinh** xuất sắc nhất |
| • **Streak** chuỗi ngày học tập | • **Quản lý kho đề thi** |

### 🧠 RAG System (SGK Index)
- Dữ liệu chuẩn từ **Sách Giáo Khoa (Cánh Diều, KNTT...)**
- **Vector Search** (Cloudflare Vectorize) giúp AI trả lời chính xác, có trích dẫn.
- Hỗ trợ cả **PDF, DOCX, TXT**.

---

## 🏗️ Kiến Trúc Hệ Thống

```mermaid
graph TD
    User[Người dùng] --> Frontend[Frontend (React/Vite)]
    Frontend --> Cloudflare[Cloudflare Workers API]
    
    subgraph "AI Core"
        Cloudflare --> LLM[OpenRouter / DeepSeek]
        Cloudflare --> Embed[HuggingFace Embeddings]
        Cloudflare --> Search[DuckDuckGo Search]
    end
    
    subgraph "Data Storage"
        Cloudflare --> D1[(D1 Database SQL)]
        Cloudflare --> Vectorize[(Vectorize DB)]
        Cloudflare --> R2[(R2 Storage)]
    end
    
    Ingest[Ingest Script] --> R2
    Ingest --> Embed
    Embed --> Vectorize
```

## 🛠️ Công Nghệ Sử Dụng

| Layer | Công nghệ | Phiên bản |
|-------|-----------|-----------|
| **Frontend** | React, TypeScript, TailwindCSS, Recharts, Lucide | v18+ |
| **Backend** | Cloudflare Workers, Hono-like routing | Latest |
| **AI Model** | Google Gemini 2.0 Flash, DeepSeek v3 (via OpenRouter) | 2026 |
| **Database** | Cloudflare D1 (SQLite), Vectorize (Vector DB) | Alpha |
| **Storage** | Cloudflare R2 (Object Storage) | - |

---

## 🚀 Hướng Dẫn Cài Đặt

### 1. Chuẩn bị môi trường
- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)
- Tài khoản Cloudflare (đã kích hoạt D1, Vectorize, R2)

### 2. Clone & Install
```bash
git clone https://github.com/LongNgn204/stem-vietnam-v2.git
cd stem-vietnam-v2

# Cài đặt dependencies
npm install
cd workers && npm install
```

### 3. Cấu hình Env
```bash
cd workers
# Tạo file .dev.vars hoặc set secrets
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put HF_API_TOKEN
npx wrangler secret put JWT_SECRET
```

### 4. Chạy Local
```bash
# Terminal 1: Backend
cd workers && npx wrangler dev

# Terminal 2: Frontend
npm run dev
```

### 5. Ingest Dữ liệu SGK
```powershell
# Windows PowerShell
cd scripts
.\run-ingest.ps1
```

## 🌍 Triển Khai (Deploy)

Dự án được tối ưu để deploy hoàn toàn miễn phí trên hệ sinh thái Cloudflare.

- **Frontend:** Cloudflare Pages (Build command: `npm run build`, Output: `dist`)
- **Backend:** `npx wrangler deploy`

## 🧪 API Endpoints Chính

| Method | Endpoint | Role | Mô tả |
|--------|----------|------|-------|
| `GET` | `/api/teacher/dashboard` | 👨‍🏫 | Lấy thống kê giáo viên |
| `GET` | `/api/student/dashboard` | 👨‍🎓 | Lấy thống kê học sinh |
| `POST` | `/api/exam-online/generate` | 👨‍🏫 | Tạo đề thi bằng AI (RAG) |
| `POST` | `/api/ingest` | 👮 | Ingest tài liệu vào Vector DB |

---

**© 2026 STEM Vietnam** - Developed by Nguyễn Hoàng Long (HNUE)
