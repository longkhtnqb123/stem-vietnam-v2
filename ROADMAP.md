# 🎯 ROADMAP DÀI HẠN: HỆ THỐNG HỖ TRỢ HỌC TẬP MÔN CÔNG NGHỆ THPT

> **Dự án Nghiên cứu Khoa học - Phiên bản 2.0**  
> **Mục tiêu**: Nền tảng học tập môn Công nghệ THPT với AI, triển khai thử nghiệm tại các trường học  
> **Quy mô mục tiêu**: 1,000 Học sinh + 10 Giáo viên + 3-5 Trường THPT  
> **Stack**: React 19 + Cloudflare Workers + D1 Database + Vectorize + OpenRouter (FREE)

---

## 📋 MỤC LỤC

1. [Tổng quan Dự án NCKH](#1-tổng-quan-dự-án-nckh)
2. [Quy mô & Đối tượng](#2-quy-mô--đối-tượng)
3. [Roadmap Chi tiết 6 Phase](#3-roadmap-chi-tiết-6-phase)
4. [Kế hoạch Redesign UI/UX](#4-kế-hoạch-redesign-uiux)
5. [Chiến lược Thu hút User](#5-chiến-lược-thu-hút-user)
6. [Metrics & Đánh giá NCKH](#6-metrics--đánh-giá-nckh)
7. [Kế hoạch Triển khai Trường học](#7-kế-hoạch-triển-khai-trường-học)
8. [Rủi ro & Phương án Dự phòng](#8-rủi-ro--phương-án-dự-phòng)

---

## 1. TỔNG QUAN DỰ ÁN NCKH

### 1.1 Mục tiêu Nghiên cứu

| Tiêu chí | Chi tiết |
|----------|----------|
| **Tên đề tài** | Xây dựng hệ thống hỗ trợ học tập môn Công nghệ THPT ứng dụng trí tuệ nhân tạo |
| **Đối tượng** | Học sinh THPT lớp 10, 11, 12 + Giáo viên Công nghệ |
| **Phạm vi** | Chương trình GDPT 2018 - Môn Công nghệ (Công nghiệp & Nông nghiệp) |
| **Giá trị khoa học** | RAG từ SGK, AI tạo đề, Phân tích Bloom Taxonomy |

### 1.2 Chức năng Hệ thống (Phiên bản 2.0)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                         STEM VIETNAM v2.0 - LEARNING PLATFORM                  │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ╔══════════════════════╗    ╔══════════════════════╗    ╔══════════════════╗ │
│  ║  🤖 AI ASSISTANT     ║    ║  📝 THI TRẮC NGHIỆM  ║    ║  🏫 LỚP HỌC      ║ │
│  ╠══════════════════════╣    ╠══════════════════════╣    ╠══════════════════╣ │
│  ║ • Chat với RAG SGK   ║    ║ • Thi online có giờ  ║    ║ • Tạo lớp (GV)   ║ │
│  ║ • Giải đáp 24/7      ║    ║ • Auto-save, chấm    ║    ║ • Join Code      ║ │
│  ║ • Tạo đề bằng AI     ║    ║ • Bloom Analysis     ║    ║ • Giao bài tập   ║ │
│  ║ • Multi-model        ║    ║ • Lịch sử & Review   ║    ║ • Xem tiến độ HS ║ │
│  ╚══════════════════════╝    ╚══════════════════════╝    ╚══════════════════╝ │
│                                                                                │
│  ╔══════════════════════╗    ╔══════════════════════╗    ╔══════════════════╗ │
│  ║  📊 DASHBOARD        ║    ║  🏆 GAMIFICATION     ║    ║  📚 THƯ VIỆN     ║ │
│  ╠══════════════════════╣    ╠══════════════════════╣    ╠══════════════════╣ │
│  ║ • Tiến độ cá nhân    ║    ║ • Streak 🔥          ║    ║ • SGK Lớp 10-12  ║ │
│  ║ • Điểm mạnh/yếu      ║    ║ • Bảng xếp hạng      ║    ║ • Công nghiệp    ║ │
│  ║ • Gợi ý ôn tập       ║    ║ • Achievement badges ║    ║ • Nông nghiệp    ║ │
│  ║ • Thống kê GV        ║    ║ • Social share       ║    ║ • Chuyên đề      ║ │
│  ╚══════════════════════╝    ╚══════════════════════╝    ╚══════════════════╝ │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Kiến trúc Kỹ thuật

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM ARCHITECTURE                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐                                                     │
│  │  📱 FRONTEND    │  React 19 + Vite + TypeScript + TailwindCSS 4      │
│  │  (PWA Ready)    │  Zustand State + React Router 7                     │
│  └────────┬────────┘                                                     │
│           │ HTTPS / JWT                                                  │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │  ⚡ CLOUDFLARE  │  Workers (API Gateway) - 100K req/day FREE         │
│  │    WORKERS      │  KV (Cache) + R2 (Storage)                          │
│  └────────┬────────┘                                                     │
│           │                                                              │
│  ┌────────┴────────────────────────────────────────┐                     │
│  │                   DATA LAYER                     │                     │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │                     │
│  │  │ D1 Database│  │ Vectorize  │  │ R2 Storage │ │                     │
│  │  │ (SQL)      │  │ (Vectors)  │  │ (Files)    │ │                     │
│  │  └────────────┘  └────────────┘  └────────────┘ │                     │
│  └─────────────────────────────────────────────────┘                     │
│                                                                          │
│  ┌─────────────────────────────────────────────────┐                     │
│  │                   AI LAYER (FREE)                │                     │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │                     │
│  │  │ OpenRouter │  │ HuggingFace│  │ DuckDuckGo │ │                     │
│  │  │ (LLM)      │  │ (Embeddings)│  │ (Search)   │ │                     │
│  │  └────────────┘  └────────────┘  └────────────┘ │                     │
│  └─────────────────────────────────────────────────┘                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. QUY MÔ & ĐỐI TƯỢNG

### 2.1 Quy mô Triển khai

| Giai đoạn | Quy mô | Timeline |
|-----------|--------|----------|
| **Pilot** | 100 HS + 3 GV + 1 Trường | Tháng 1-2 |
| **Mở rộng** | 500 HS + 5 GV + 2 Trường | Tháng 3-4 |
| **Đầy đủ** | 1000 HS + 10 GV + 3-5 Trường | Tháng 5-6 |

### 2.2 Đối tượng & Persona

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER PERSONAS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  👨‍🎓 HỌC SINH (Primary User)                                            │
│  ├─ Lớp: 10, 11, 12                                                     │
│  ├─ Nhu cầu: Ôn tập, làm đề, hỏi AI                                     │
│  ├─ Pain points: Không hiểu bài, thiếu đề ôn luyện                      │
│  └─ Goal: Điểm cao, hiểu kiến thức                                      │
│                                                                          │
│  👨‍🏫 GIÁO VIÊN (Secondary User)                                         │
│  ├─ Môn: Công nghệ                                                      │
│  ├─ Nhu cầu: Tạo đề nhanh, quản lý lớp                                  │
│  ├─ Pain points: Mất thời gian soạn đề, khó track tiến độ HS            │
│  └─ Goal: Tiết kiệm thời gian, nắm bắt tình hình lớp                    │
│                                                                          │
│  🏫 NHÀ TRƯỜNG (Stakeholder)                                            │
│  ├─ Nhu cầu: Công cụ hỗ trợ miễn phí, báo cáo                           │
│  ├─ Pain points: Ngân sách hạn chế, thiếu công cụ số hóa                │
│  └─ Goal: Nâng cao chất lượng dạy học                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Ước tính Tài nguyên

| Resource | Quy mô 1000 User | Chi phí/tháng |
|----------|------------------|---------------|
| **Cloudflare Workers** | ~3M requests/tháng | $0 (Free tier) |
| **D1 Database** | ~10GB | $0 (Free tier) |
| **OpenRouter API** | ~100K tokens/ngày | $0 (Free models) |
| **Vectorize** | ~1M vectors | $0 (Free tier) |
| **Domain + SSL** | 1 domain | ~$12/năm |
| **TOTAL** | | **~$1/tháng** |

---

## 3. ROADMAP CHI TIẾT 6 PHASE

### 📊 TỔNG QUAN TIMELINE

```
   Phase 1        Phase 2        Phase 3        Phase 4        Phase 5        Phase 6
 [Ổn định] ──▶  [Redesign] ──▶  [Gamify] ──▶  [Scale] ──▶   [NCKH] ──▶    [Mở rộng]
  2 tuần          3 tuần         2 tuần        3 tuần        2 tuần         Ongoing

    ✅              🔄             🔄            🔄            🔄              🔄
  DONE           CURRENT                   
```

---

### 🟢 PHASE 1: Ổn Định Hệ Thống ✅ HOÀN THÀNH
**Timeline**: Đã xong

| Task | Trạng thái |
|------|------------|
| Chuyển từ Vertex AI sang OpenRouter | ✅ Done |
| Tích hợp HuggingFace embeddings | ✅ Done |
| Setup D1 Database + Auth | ✅ Done |
| Hệ thống thi online + chấm điểm | ✅ Done |
| Classroom system với Join Code | ✅ Done |
| Dashboard học sinh/giáo viên | ✅ Done |

---

### 🔵 PHASE 2: Redesign UI/UX 🔄 ĐANG THỰC HIỆN
**Timeline**: 3 tuần
**Mục tiêu**: Giao diện mới, đẹp hơn, khác biệt với AI-generated layouts

#### 2.1 Design System Mới

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        NEW DESIGN DIRECTION                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  🎨 STYLE: "Educational Modern" - Friendly + Professional               │
│                                                                          │
│  COLOR PALETTE:                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Primary: Teal/Emerald (#10B981) - Fresh, học tập, tích cực          │ │
│  │ Secondary: Indigo (#6366F1) - Công nghệ, AI, hiện đại               │ │
│  │ Accent: Amber (#F59E0B) - Highlight, achievement, gamification      │ │
│  │ Background: Warm Gray (#FAFAF9) - Nhẹ nhàng, không mỏi mắt          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  TYPOGRAPHY:                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Headings: Be Vietnam Pro (Vietnamese-optimized)                     │ │
│  │ Body: Inter (Clean, readable)                                        │ │
│  │ Code: JetBrains Mono                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  VISUAL ELEMENTS:                                                        │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ • Rounded corners (16px - 24px) - Thân thiện                        │ │
│  │ • Soft shadows - Không harsh                                         │ │
│  │ • Illustrations thay cho icons đơn thuần                            │ │
│  │ • Micro-animations - Hover, transitions                              │ │
│  │ • Custom mascot character? 🤖                                        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 2.2 Landing Page Redesign

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     NEW LANDING PAGE STRUCTURE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SECTION 1: Hero (Above the fold)                                        │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ • Headline: "Học Công Nghệ Thông Minh với AI"                       │ │
│  │ • Subheadline: Giải thích ngắn gọn value                            │ │
│  │ • CTA Button: "Thử Làm Đề Miễn Phí" (KHÔNG cần đăng nhập)          │ │
│  │ • Illustration: Student + AI robot learning together                │ │
│  │ • Trust badges: "1000+ học sinh", "10+ trường", "FREE"             │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  SECTION 2: Features Showcase (Bento Grid Layout - KHÁC BIỆT)           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ • Bento boxes với screenshots thật                                   │ │
│  │ • Hover animations                                                   │ │
│  │ • Live demo snippets                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  SECTION 3: How It Works (3-step visual flow)                           │
│                                                                          │
│  SECTION 4: Testimonials/Social Proof                                    │
│  • Quotes từ GV/HS pilot                                                │
│                                                                          │
│  SECTION 5: CTA Final                                                    │
│  • "Giáo viên: Đăng ký quản lý lớp" / "Học sinh: Bắt đầu học"          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 2.3 App Layout Redesign

```
HIỆN TẠI (Cũ):                          MỚI (Redesign):
┌──────┬──────────────┐                  ┌──────────────────────────────┐
│      │              │                  │ [Top Nav - Minimal]          │
│ Side │   Content    │        ──▶       ├────────┬─────────────────────┤
│ bar  │              │                  │  Mini  │                     │
│      │              │                  │  Side  │     Main Content    │
└──────┴──────────────┘                  │  Nav   │     (Wider)         │
                                         │        │                     │
Vấn đề: Sidebar chiếm nhiều             └────────┴─────────────────────┘
không gian, layout đơn điệu              Better: Icon-only sidebar, 
                                         expandable on hover

HOẶC: Tab-based Navigation (Mobile-first)
┌──────────────────────────────────────┐
│                                      │
│           Main Content               │
│                                      │
├──────────────────────────────────────┤
│ 🏠  📝  💬  📊  👤                   │  <- Bottom tab bar
└──────────────────────────────────────┘
```

#### 2.4 Dashboard Redesign (Học sinh)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STUDENT DASHBOARD - NEW DESIGN                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │  👋 Xin chào, [Tên HS]!              🔥 Streak: 7 ngày      │        │
│  │  Hôm nay bạn đã học được 30 phút     ⭐ XP: 1,250 điểm     │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                          │
│  ┌───────────────────┐  ┌───────────────────┐  ┌──────────────────┐    │
│  │  📈 Tiến độ tuần  │  │  🎯 Mục tiêu      │  │  🏆 Thành tích   │    │
│  │  ▓▓▓▓▓▓░░░ 70%   │  │  Làm 5 đề/tuần    │  │  Perfect Score!  │    │
│  │  7/10 bài đã làm │  │  [████████░░] 80%  │  │  + 3 badges mới │    │
│  └───────────────────┘  └───────────────────┘  └──────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │  📚 GỢI Ý HÔM NAY                                           │        │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │        │
│  │  │ Ôn lại:     │ │ Đề mới:     │ │ Bài yếu:    │            │        │
│  │  │ Mạch điện   │ │ KT 15 phút  │ │ Động cơ     │            │        │
│  │  │ [Xem ngay]  │ │ [Làm bài]   │ │ [Luyện tập] │            │        │
│  │  └─────────────┘ └─────────────┘ └─────────────┘            │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 2.5 Tasks Phase 2

| Task | Priority | Effort |
|------|----------|--------|
| Định nghĩa Design System mới (colors, typography) | 🔴 High | 2 ngày |
| Redesign Landing Page | 🔴 High | 3 ngày |
| Redesign Sidebar → Mini Nav | 🟡 Medium | 2 ngày |
| Redesign Student Dashboard | 🔴 High | 3 ngày |
| Redesign Teacher Dashboard | 🟡 Medium | 2 ngày |
| Redesign Exam Taking UI | 🟡 Medium | 2 ngày |
| Redesign Chat AI interface | 🟡 Medium | 2 ngày |
| Add illustrations/mascot | 🟢 Low | 3 ngày |
| Mobile responsive polish | 🔴 High | 2 ngày |

---

### 🟣 PHASE 3: Gamification & Engagement
**Timeline**: 2 tuần
**Mục tiêu**: Tăng retention, tạo động lực học tập

#### 3.1 Streak System

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         STREAK SYSTEM                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  🔥 STREAK RULES:                                                        │
│  ├─ Làm ít nhất 1 bài thi/ngày = +1 streak                              │
│  ├─ Miss 1 ngày = Reset về 0                                            │
│  ├─ Freeze (1 lần/tuần) = Bảo vệ streak                                 │
│  └─ Milestone rewards: 7, 30, 100 ngày                                  │
│                                                                          │
│  🎁 STREAK REWARDS:                                                      │
│  ├─ 7 ngày: Badge "Người kiên trì" + 100 XP                             │
│  ├─ 30 ngày: Badge "Chiến binh" + 500 XP + Avatar frame                │
│  └─ 100 ngày: Badge "Huyền thoại" + 2000 XP + Special title            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 3.2 Leaderboard System

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        LEADERBOARD SYSTEM                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📊 RANKING TYPES:                                                       │
│  ├─ 🏆 Toàn hệ thống (Top 100 overall)                                  │
│  ├─ 🏫 Theo trường (Cùng trường)                                        │
│  ├─ 📚 Theo lớp (Trong lớp học)                                         │
│  └─ 📅 Theo tuần/tháng (Reset weekly)                                   │
│                                                                          │
│  📈 RANKING CRITERIA:                                                    │
│  ├─ XP tích lũy (40%)                                                   │
│  ├─ Điểm trung bình (30%)                                               │
│  ├─ Số bài hoàn thành (20%)                                             │
│  └─ Streak (10%)                                                        │
│                                                                          │
│  🔗 SOCIAL SHARE:                                                        │
│  ├─ Share khi vào Top 10                                                │
│  ├─ Share weekly summary                                                 │
│  └─ Challenge friends                                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 3.3 Achievement System

```
🏅 BADGES:

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  🥇 First    │  │  ⭐ Perfect  │  │  🔥 Hot      │  │  🧠 Smart    │
│    Blood     │  │    Score     │  │   Streak     │  │   Thinker    │
├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤
│ Làm bài      │  │ Đạt 10/10    │  │ 7 ngày       │  │ 10 câu vận   │
│ đầu tiên     │  │ điểm         │  │ liên tiếp    │  │ dụng cao đúng│
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  📚 Book     │  │  🎯 Sharp    │  │  ⚡ Speed    │  │  👑 Top 10   │
│    Worm      │  │   Shooter    │  │   Runner     │  │   Weekly     │
├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤
│ Xem 50+ bài  │  │ 100 câu đúng │  │ Làm bài      │  │ Vào Top 10   │
│ thư viện     │  │ liên tiếp    │  │ trong 50%    │  │ tuần         │
│              │  │              │  │ thời gian    │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

#### 3.4 Tasks Phase 3

| Task | Priority | Effort |
|------|----------|--------|
| Database schema cho XP, Streak, Badges | 🔴 High | 1 ngày |
| Streak tracking logic | 🔴 High | 2 ngày |
| Leaderboard API + UI | 🔴 High | 3 ngày |
| Badge system + unlock logic | 🟡 Medium | 2 ngày |
| Social share buttons | 🟡 Medium | 1 ngày |
| Push notifications (streak reminder) | 🟢 Low | 2 ngày |

---

### 🟠 PHASE 4: Scale & Optimize for 1000 Users
**Timeline**: 3 tuần
**Mục tiêu**: Sẵn sàng cho 1000 user concurrent

#### 4.1 Performance Optimization

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PERFORMANCE CHECKLIST                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ⚡ FRONTEND:                                                            │
│  ├─ [ ] Code splitting tất cả routes                                    │
│  ├─ [ ] Image optimization (WebP, lazy load)                            │
│  ├─ [ ] Bundle size < 200KB gzipped                                     │
│  ├─ [ ] Lighthouse score > 90                                           │
│  └─ [ ] Service Worker caching                                          │
│                                                                          │
│  🔧 BACKEND:                                                             │
│  ├─ [ ] Response caching với KV                                         │
│  ├─ [ ] Rate limiting per user                                          │
│  ├─ [ ] Database query optimization                                     │
│  ├─ [ ] Connection pooling                                              │
│  └─ [ ] Error handling + retry logic                                    │
│                                                                          │
│  📊 MONITORING:                                                          │
│  ├─ [ ] Cloudflare Analytics                                            │
│  ├─ [ ] Error tracking (Sentry)                                         │
│  ├─ [ ] API latency monitoring                                          │
│  └─ [ ] User behavior analytics                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 4.2 Security Hardening

| Area | Implementation |
|------|----------------|
| **Auth** | JWT with refresh tokens, secure httpOnly cookies |
| **Input** | Zod validation, SQL injection prevention |
| **Rate Limit** | 100 req/min/user, 1000 req/min/IP |
| **CORS** | Whitelist allowed origins |
| **XSS** | Content Security Policy headers |

#### 4.3 Tasks Phase 4

| Task | Priority | Effort |
|------|----------|--------|
| Implement comprehensive caching | 🔴 High | 3 ngày |
| Rate limiting system | 🔴 High | 2 ngày |
| Load testing (1000 concurrent) | 🔴 High | 2 ngày |
| Error tracking setup | 🟡 Medium | 1 ngày |
| Security audit | 🔴 High | 2 ngày |
| Performance monitoring | 🟡 Medium | 1 ngày |

---

### 🔴 PHASE 5: NCKH Data Collection & Analysis
**Timeline**: 2 tuần
**Mục tiêu**: Thu thập dữ liệu cho báo cáo nghiên cứu

#### 5.1 Research Metrics

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      RESEARCH DATA COLLECTION                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📊 QUANTITATIVE METRICS:                                                │
│  ├─ Số lượt sử dụng hệ thống (DAU, MAU)                                 │
│  ├─ Số đề thi được tạo (by AI / by manual)                              │
│  ├─ Số lượt làm bài + điểm trung bình                                   │
│  ├─ Thời gian làm bài trung bình                                        │
│  ├─ Tỷ lệ câu đúng theo mức Bloom                                       │
│  ├─ AI response time (latency)                                          │
│  ├─ Chat interactions per session                                       │
│  └─ Retention rate (7-day, 30-day)                                      │
│                                                                          │
│  📋 QUALITATIVE DATA:                                                    │
│  ├─ Survey học sinh (Google Forms embedded)                             │
│  ├─ Survey giáo viên                                                     │
│  ├─ In-app feedback button                                               │
│  └─ Focus group interviews                                               │
│                                                                          │
│  📈 ANALYSIS:                                                            │
│  ├─ So sánh điểm trước/sau sử dụng (Pre-post test)                     │
│  ├─ A/B test: RAG vs No RAG                                             │
│  ├─ Correlation: Usage ↔ Performance                                    │
│  └─ User satisfaction score (NPS)                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 5.2 Admin Dashboard for NCKH

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ADMIN/RESEARCH DASHBOARD                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📊 Overview                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ 1,234   │ │ 10      │ │ 5,678   │ │ 7.2     │ │ 85%     │           │
│  │ Users   │ │ Teachers│ │ Exams   │ │ Avg     │ │ Ret.    │           │
│  │ Active  │ │ Active  │ │ Taken   │ │ Score   │ │ Rate    │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                                          │
│  📈 Trends (7 days / 30 days / All time)                                │
│  [Chart: Usage over time]                                                │
│  [Chart: Score distribution]                                             │
│  [Chart: Bloom taxonomy breakdown]                                       │
│                                                                          │
│  📤 Export Data                                                          │
│  [Export CSV] [Export JSON] [Generate Report]                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 5.3 Tasks Phase 5

| Task | Priority | Effort |
|------|----------|--------|
| Design survey forms | 🔴 High | 1 ngày |
| Build admin analytics dashboard | 🔴 High | 3 ngày |
| Data export functionality | 🔴 High | 2 ngày |
| Embed survey in app | 🟡 Medium | 1 ngày |
| Pre/Post test design | 🔴 High | 2 ngày |

---

### ⚫ PHASE 6: Mở Rộng & Bảo Trì
**Timeline**: Ongoing
**Mục tiêu**: Duy trì và phát triển lâu dài

#### 6.1 Long-term Roadmap

| Quarter | Focus |
|---------|-------|
| **Q1** | Hoàn thành core features + NCKH |
| **Q2** | Mở rộng sang các môn khác (Tin học, Vật lý) |
| **Q3** | Mobile app (React Native / PWA enhanced) |
| **Q4** | AI tutor personalization |

#### 6.2 Potential Features (Future)

- 🎥 Video giải thích cho câu hỏi khó
- 🗣️ Voice chat với AI (TTS/STT)
- 📱 Native mobile apps
- 🌐 Multi-language support
- 🤝 Peer-to-peer tutoring

---

## 4. KẾ HOẠCH REDESIGN UI/UX

### 4.1 Phân Tích Vấn Đề Hiện Tại

| Vấn đề | Mức độ | Giải pháp |
|--------|--------|-----------|
| Giao diện đơn điệu, giống nhau | 🔴 Cao | Thiết kế lại toàn bộ với design system mới |
| Sidebar chiếm nhiều không gian | 🟡 TB | Chuyển sang collapsible/icon-only sidebar |
| Thiếu illustrations/hình ảnh | 🔴 Cao | Thêm custom illustrations, mascot |
| Landing page chưa compelling | 🔴 Cao | Redesign với Bento grid, hero mới |
| Chưa có identity rõ ràng | 🟡 TB | Định nghĩa brand colors, typography |

### 4.2 Design System Mới

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       NEW BRAND IDENTITY                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  🎨 COLOR PALETTE:                                                       │
│                                                                          │
│  PRIMARY:     Emerald/Teal - Fresh, Educational, Growth                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                │
│  │#10B981 │ │#059669 │ │#047857 │ │#065F46 │ │#064E3B │                │
│  │ 500    │ │ 600    │ │ 700    │ │ 800    │ │ 900    │                │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘                │
│                                                                          │
│  SECONDARY:  Indigo - Tech, AI, Modern                                   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                │
│  │#6366F1 │ │#4F46E5 │ │#4338CA │ │#3730A3 │ │#312E81 │                │
│  │ 500    │ │ 600    │ │ 700    │ │ 800    │ │ 900    │                │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘                │
│                                                                          │
│  ACCENT:     Amber - Achievement, Highlight, Fun                         │
│  ┌────────┐ ┌────────┐ ┌────────┐                                       │
│  │#F59E0B │ │#D97706 │ │#B45309 │                                       │
│  │ 500    │ │ 600    │ │ 700    │                                       │
│  └────────┘ └────────┘ └────────┘                                       │
│                                                                          │
│  BACKGROUND: Warm neutrals (không lạnh, dễ chịu cho mắt)                │
│  Light: #FAFAF9 (stone-50)  |  Dark: #1C1917 (stone-900)               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| **Headings** | Be Vietnam Pro | 24-48px | 700-800 |
| **Body** | Inter | 14-16px | 400-500 |
| **Code** | JetBrains Mono | 13-14px | 400 |
| **Labels** | Inter | 12-13px | 500-600 |

### 4.4 Component Library Updates

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     NEW COMPONENT STYLES                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  BUTTONS:                                                                │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐            │
│  │  ████████████   │ │  ░░░░░░░░░░░░   │ │  ──────────────  │            │
│  │  Primary Solid  │ │  Secondary      │ │  Ghost/Text     │            │
│  │  (Gradient OK)  │ │  (Outline)      │ │  (Underline)    │            │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘            │
│                                                                          │
│  CARDS:                                                                  │
│  ┌───────────────────────┐                                              │
│  │  ╭──────────────────╮ │  • Larger border-radius (16-24px)           │
│  │  │                  │ │  • Subtle shadow (không harsh)               │
│  │  │                  │ │  • Hover lift effect                         │
│  │  │                  │ │  • Optional gradient border                  │
│  │  ╰──────────────────╯ │                                              │
│  └───────────────────────┘                                              │
│                                                                          │
│  INPUTS:                                                                 │
│  ┌───────────────────────┐                                              │
│  │ ┌───────────────────┐ │  • Larger padding                            │
│  │ │ Placeholder...    │ │  • Focus ring animation                      │
│  │ └───────────────────┘ │  • Icon support (left/right)                 │
│  └───────────────────────┘                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.5 Page Layouts Redesign

#### 4.5.1 Landing Page (NEW)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HERO SECTION                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  🎓 STEM Vietnam                               [Đăng nhập]       │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │   Học Công Nghệ                    ┌─────────────────────────┐  │    │
│  │   Thông Minh với AI                │                         │  │    │
│  │                                    │    [ILLUSTRATION:        │  │    │
│  │   Nền tảng học tập miễn phí        │     Student + AI Robot  │  │    │
│  │   theo chương trình GDPT 2018      │     learning together]  │  │    │
│  │                                    │                         │  │    │
│  │   [🚀 Thử Làm Đề Miễn Phí]        └─────────────────────────┘  │    │
│  │                                                                  │    │
│  │   ✓ 1000+ học sinh  ✓ 10+ trường  ✓ 100% miễn phí            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  FEATURES (Bento Grid - KHÁC BIỆT)                                      │
│  ┌──────────────────┐ ┌──────────────────────────────────────────┐     │
│  │                  │ │                                          │     │
│  │  🤖 AI Chat      │ │  📝 Thi Trắc Nghiệm                      │     │
│  │  [Screenshot]    │ │                                          │     │
│  │                  │ │  [Screenshot with live demo]             │     │
│  └──────────────────┘ │                                          │     │
│  ┌──────────────────┐ └──────────────────────────────────────────┘     │
│  │                  │ ┌──────────────────┐ ┌──────────────────┐        │
│  │  🏫 Lớp Học      │ │  📊 Dashboard    │ │  🏆 Gamification │        │
│  │                  │ │                  │ │                  │        │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘        │
│                                                                          │
│  HOW IT WORKS (3 steps)                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │  1. Đăng ký │ ▶  │  2. Học     │ ▶  │  3. Đạt    │                  │
│  │     miễn phí│    │     với AI  │    │     điểm cao│                  │
│  └─────────────┘    └─────────────┘    └─────────────┘                  │
│                                                                          │
│  TESTIMONIALS                                                            │
│  "Rất hữu ích cho việc ôn thi!" - HS Trường THPT X                      │
│                                                                          │
│  FINAL CTA                                                               │
│  [👨‍🏫 Giáo viên: Đăng ký quản lý lớp]  [👨‍🎓 Học sinh: Bắt đầu học]      │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 4.5.2 App Layout (NEW - Collapsible Sidebar)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Logo] STEM Vietnam                    🔔  👤 Tên User  [▼]            │
├────────┬────────────────────────────────────────────────────────────────┤
│        │                                                                │
│   🏠   │                                                                │
│        │         MAIN CONTENT AREA                                      │
│   💬   │                                                                │
│        │         (Wider, more breathing room)                           │
│   📝   │                                                                │
│        │                                                                │
│   📊   │                                                                │
│        │                                                                │
│   🏫   │                                                                │
│        │                                                                │
│   📚   │                                                                │
│        │                                                                │
│   ⚙️   │                                                                │
│        │                                                                │
├────────┴────────────────────────────────────────────────────────────────┤
│  [◀ Sidebar collapsed]   Hover to expand with labels                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. CHIẾN LƯỢC THU HÚT USER

### 5.1 User Acquisition Channels

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    USER ACQUISITION FUNNEL                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  AWARENESS (Biết đến)                                                    │
│  ├─ SEO: Keywords "đề thi công nghệ", "ôn tập công nghệ THPT"          │
│  ├─ Facebook Groups: Các group học sinh THPT, ôn thi                    │
│  ├─ TikTok/YouTube Shorts: Video hướng dẫn ngắn                         │
│  └─ Giáo viên giới thiệu: Workshop, email outreach                      │
│                                                                          │
│  ACQUISITION (Truy cập)                                                  │
│  ├─ Landing page compelling với CTA rõ ràng                             │
│  ├─ "Thử làm đề miễn phí" KHÔNG cần đăng nhập                          │
│  └─ Share từ bạn bè (social proof)                                      │
│                                                                          │
│  ACTIVATION (Sử dụng lần đầu)                                           │
│  ├─ Onboarding tour hướng dẫn                                           │
│  ├─ First exam experience mượt mà                                       │
│  └─ Đăng ký để xem đáp án chi tiết                                      │
│                                                                          │
│  RETENTION (Quay lại)                                                    │
│  ├─ Streak system + daily reminder                                      │
│  ├─ Leaderboard competition                                             │
│  ├─ New exams notification                                              │
│  └─ Progress tracking motivates                                         │
│                                                                          │
│  REFERRAL (Giới thiệu)                                                   │
│  ├─ Share điểm số lên Facebook                                          │
│  ├─ Invite friends, earn badges                                         │
│  └─ Teacher invites students (classroom)                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 SEO Keywords

| Priority | Keyword | Volume Est. | Difficulty |
|----------|---------|-------------|------------|
| 🔴 High | đề thi công nghệ 10 | High | Medium |
| 🔴 High | trắc nghiệm công nghệ 11 | Medium | Low |
| 🔴 High | ôn tập công nghệ 12 | Medium | Low |
| 🟡 Medium | đề thi THPT môn công nghệ | Medium | High |
| 🟡 Medium | AI hỗ trợ học tập | Low | High |

### 5.3 Content Marketing Plan

| Week | Content | Channel |
|------|---------|---------|
| 1 | "5 cách ôn tập công nghệ hiệu quả" | Blog + Facebook |
| 2 | Video demo thi online | TikTok + YouTube |
| 3 | "AI giúp học sinh như thế nào?" | Blog |
| 4 | Teacher testimonial | Facebook Page |
| Monthly | Đề thi mẫu PDF | Download + Email |

---

## 6. METRICS & ĐÁNH GIÁ NCKH

### 6.1 Key Performance Indicators (KPIs)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        NCKH METRICS FRAMEWORK                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📊 USAGE METRICS:                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Metric              │ Target (6 tháng) │ Measurement            │    │
│  ├─────────────────────┼──────────────────┼────────────────────────┤    │
│  │ Monthly Active Users│ 1,000            │ Unique logins/month    │    │
│  │ Daily Active Users  │ 200              │ Unique logins/day      │    │
│  │ Exams Completed     │ 10,000           │ Total submissions      │    │
│  │ Chat Interactions   │ 50,000           │ Total messages         │    │
│  │ Avg Session Duration│ 15 minutes       │ Time on platform       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  📈 ENGAGEMENT METRICS:                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Metric              │ Target           │ Formula                │    │
│  ├─────────────────────┼──────────────────┼────────────────────────┤    │
│  │ Retention (7-day)   │ 40%              │ D7 users / D0 users    │    │
│  │ Retention (30-day)  │ 25%              │ D30 users / D0 users   │    │
│  │ Exams per User      │ 10               │ Total exams / Users    │    │
│  │ Streak Avg          │ 5 days           │ Avg streak length      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  🎓 LEARNING METRICS:                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Metric              │ Target           │ Measurement            │    │
│  ├─────────────────────┼──────────────────┼────────────────────────┤    │
│  │ Avg Score           │ 7.0/10           │ Mean of all attempts   │    │
│  │ Score Improvement   │ +1.0 điểm        │ Post-score - Pre-score │    │
│  │ Pass Rate (>5)      │ 80%              │ Passed / Total         │    │
│  │ Bloom Analysis      │ Balanced         │ % by level             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  😊 SATISFACTION METRICS:                                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Metric              │ Target           │ Method                 │    │
│  ├─────────────────────┼──────────────────┼────────────────────────┤    │
│  │ NPS Score           │ > 50             │ Survey (0-10)          │    │
│  │ User Rating         │ 4.5/5            │ In-app rating          │    │
│  │ Teacher Satisfaction│ 80% positive     │ Survey                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Research Methodology

| Phase | Method | Sample Size | Timeline |
|-------|--------|-------------|----------|
| Pre-test | Baseline exam | N=100 | Week 1 |
| Treatment | Use platform | 8 weeks | Week 2-9 |
| Post-test | Same exam | N=100 | Week 10 |
| Survey | Google Forms | N=100+ | Week 10-11 |
| Interview | Focus group | N=20 | Week 11 |

### 6.3 Expected Outcomes

| Hypothesis | Expected Result | Statistical Test |
|------------|-----------------|------------------|
| H1: Score improvement | +1.0 điểm avg | Paired t-test |
| H2: Time efficiency | -20% study time | Before/After |
| H3: User satisfaction | NPS > 50 | Survey analysis |

---

## 7. KẾ HOẠCH TRIỂN KHAI TRƯỜNG HỌC

### 7.1 School Pilot Program

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SCHOOL DEPLOYMENT PLAN                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  GIAI ĐOẠN 1: CHUẨN BỊ (2 tuần)                                         │
│  ├─ [ ] Liên hệ trường THPT (email/gặp trực tiếp)                       │
│  ├─ [ ] Giới thiệu dự án NCKH với BGH                                   │
│  ├─ [ ] Xin phép và ký cam kết                                          │
│  ├─ [ ] Chọn 2-3 lớp pilot (10, 11, 12)                                 │
│  └─ [ ] Training giáo viên (1 buổi online/offline)                      │
│                                                                          │
│  GIAI ĐOẠN 2: TRIỂN KHAI PILOT (4 tuần)                                 │
│  ├─ [ ] Tạo tài khoản GV/HS (bulk import)                               │
│  ├─ [ ] Setup lớp học trên hệ thống                                     │
│  ├─ [ ] GV giao đề thi đầu tiên                                         │
│  ├─ [ ] Monitor và hỗ trợ kỹ thuật                                      │
│  └─ [ ] Thu thập feedback hàng tuần                                     │
│                                                                          │
│  GIAI ĐOẠN 3: MỞ RỘNG (4 tuần)                                          │
│  ├─ [ ] Mở rộng sang các lớp khác trong trường                          │
│  ├─ [ ] Liên hệ thêm trường (2-3 trường)                                │
│  ├─ [ ] Điều chỉnh tính năng theo feedback                              │
│  └─ [ ] Chuẩn bị data cho NCKH                                          │
│                                                                          │
│  GIAI ĐOẠN 4: THU THẬP & BÁO CÁO (2 tuần)                               │
│  ├─ [ ] Export data từ hệ thống                                         │
│  ├─ [ ] Thực hiện survey cuối kỳ                                        │
│  ├─ [ ] Phân tích dữ liệu                                               │
│  └─ [ ] Viết báo cáo NCKH                                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Teacher Training Curriculum

| Session | Duration | Content |
|---------|----------|---------|
| **1** | 30 phút | Giới thiệu hệ thống, đăng nhập |
| **2** | 30 phút | Tạo đề bằng AI, preview, lưu |
| **3** | 30 phút | Quản lý lớp, giao bài tập |
| **4** | 30 phút | Xem dashboard, thống kê |

### 7.3 Support Channels

| Channel | Response Time | For |
|---------|---------------|-----|
| **Zalo Group** | < 4 giờ | Quick questions |
| **Email** | < 24 giờ | Bug reports, feedback |
| **Video Call** | Hẹn trước | Training, complex issues |

---

## 8. RỦI RO & PHƯƠNG ÁN DỰ PHÒNG

### 8.1 Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| API rate limit (OpenRouter) | 🟡 Medium | 🔴 High | Implement queue, fallback models |
| Cloudflare downtime | 🟢 Low | 🔴 High | Status monitoring, notify users |
| User data loss | 🟢 Low | 🔴 High | Daily backups, D1 replication |
| Low user adoption | 🟡 Medium | 🟡 Medium | Better onboarding, incentives |
| Teacher resistance | 🟡 Medium | 🟡 Medium | Demo value, ease of use |
| Budget overrun | 🟢 Low | 🟡 Medium | Stay on free tiers, monitor |

### 8.2 Contingency Plans

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CONTINGENCY SCENARIOS                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SCENARIO A: OpenRouter Free Tier Exhausted                              │
│  ├─ Trigger: >100K tokens/day consistently                              │
│  ├─ Action 1: Switch to backup model (DeepSeek free)                    │
│  ├─ Action 2: Implement stricter rate limiting                          │
│  └─ Action 3: Request educational tier from OpenRouter                  │
│                                                                          │
│  SCENARIO B: Low School Adoption                                         │
│  ├─ Trigger: <50% target users after 4 weeks                            │
│  ├─ Action 1: Gather feedback, identify blockers                        │
│  ├─ Action 2: Simplify onboarding                                       │
│  └─ Action 3: Offer 1-on-1 teacher support                              │
│                                                                          │
│  SCENARIO C: Data Security Incident                                      │
│  ├─ Trigger: Unauthorized access detected                               │
│  ├─ Action 1: Immediate password reset all users                        │
│  ├─ Action 2: Audit logs, identify breach                               │
│  └─ Action 3: Notify stakeholders, fix vulnerability                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📅 MASTER TIMELINE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PROJECT TIMELINE (6 MONTHS)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  MONTH 1         MONTH 2         MONTH 3         MONTH 4                │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐            │
│  │Phase 1-2│     │Phase 2-3│     │Phase 3-4│     │Phase 4-5│            │
│  │Stabilize│     │Redesign │     │Gamify   │     │Scale    │            │
│  │UI Start │     │Complete │     │Complete │     │Schools  │            │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘            │
│                                                                          │
│  MONTH 5         MONTH 6                                                 │
│  ┌─────────┐     ┌─────────┐                                            │
│  │Phase 5-6│     │Phase 6  │                                            │
│  │NCKH Data│     │Report   │                                            │
│  │Collect  │     │Complete │                                            │
│  └─────────┘     └─────────┘                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST TỔNG HỢP

### Immediate Actions (This Week)

- [ ] Finalize new color palette
- [ ] Create design mockups for landing page
- [ ] Set up analytics tracking
- [ ] Contact 1st pilot school

### Short-term (1-4 Weeks)

- [ ] Complete UI redesign phase
- [ ] Implement streak system
- [ ] Deploy leaderboard
- [ ] Start pilot at 1 school

### Medium-term (1-3 Months)

- [ ] Scale to 3-5 schools
- [ ] Reach 500+ active users
- [ ] Complete gamification features
- [ ] Begin NCKH data collection

### Long-term (3-6 Months)

- [ ] Reach 1000+ active users
- [ ] Complete NCKH report
- [ ] Plan expansion to other subjects
- [ ] Consider mobile app development

---

## 📝 BÀI HỌC KINH NGHIỆM

### Từ Phase 1:

1. **Cost awareness**: Luôn ưu tiên free tiers
2. **Simplicity first**: Không over-engineer
3. **User feedback**: Lắng nghe và iterate

### Nguyên tắc Phát triển:

1. **Ship fast, iterate**: Không hoàn hảo từ đầu
2. **Data-driven**: Quyết định dựa trên metrics
3. **User-centric**: Đặt user làm trung tâm

---

*Last Updated: January 2026*
*Author: STEM Vietnam Team*
*Version: 2.0*

---

## 4. KẾ HOẠCH REDESIGN UI/UX

### 4.1 Phân Tích Vấn Đề Hiện Tại

| Vấn đề | Mức độ | Giải pháp |
|--------|--------|-----------|
| Giao diện đơn điệu, giống nhau | 🔴 Cao | Thiết kế lại toàn bộ với design system mới |
| Sidebar chiếm nhiều không gian | 🟡 TB | Chuyển sang collapsible/icon-only sidebar |
| Thiếu illustrations/hình ảnh | 🔴 Cao | Thêm custom illustrations, mascot |
| Landing page chưa compelling | 🔴 Cao | Redesign với Bento grid, hero mới |
| Chưa có identity rõ ràng | 🟡 TB | Định nghĩa brand colors, typography |

### 4.2 Design System Mới

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       NEW BRAND IDENTITY                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  🎨 COLOR PALETTE:                                                       │
│                                                                          │
│  PRIMARY:     Emerald/Teal - Fresh, Educational, Growth                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                │
│  │#10B981 │ │#059669 │ │#047857 │ │#065F46 │ │#064E3B │                │
│  │ 500    │ │ 600    │ │ 700    │ │ 800    │ │ 900    │                │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘                │
│                                                                          │
│  SECONDARY:  Indigo - Tech, AI, Modern                                   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                │
│  │#6366F1 │ │#4F46E5 │ │#4338CA │ │#3730A3 │ │#312E81 │                │
│  │ 500    │ │ 600    │ │ 700    │ │ 800    │ │ 900    │                │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘                │
│                                                                          │
│  ACCENT:     Amber - Achievement, Highlight, Fun                         │
│  ┌────────┐ ┌────────┐ ┌────────┐                                       │
│  │#F59E0B │ │#D97706 │ │#B45309 │                                       │
│  │ 500    │ │ 600    │ │ 700    │                                       │
│  └────────┘ └────────┘ └────────┘                                       │
│                                                                          │
│  BACKGROUND: Warm neutrals (không lạnh, dễ chịu cho mắt)                │
│  Light: #FAFAF9 (stone-50)  |  Dark: #1C1917 (stone-900)               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| **Headings** | Be Vietnam Pro | 24-48px | 700-800 |
| **Body** | Inter | 14-16px | 400-500 |
| **Code** | JetBrains Mono | 13-14px | 400 |
| **Labels** | Inter | 12-13px | 500-600 |

---

## 5. CHIẾN LƯỢC THU HÚT USER

### 5.1 User Acquisition Channels

| Channel | Expected % | Action |
|---------|-----------|--------|
| **SEO** | 40-50% | Keywords "đề thi công nghệ 10/11/12" |
| **Facebook Groups** | 25-30% | Share to THPT study groups |
| **TikTok/Zalo** | 15-20% | Short tutorial videos |
| **Teacher referrals** | 10-15% | Email outreach, workshops |

### 5.2 Key Features for Engagement

1. **Streak System** 🔥 - Học mỗi ngày để giữ streak
2. **Leaderboard** 🏆 - Xếp hạng theo tuần/tháng/trường
3. **Achievements** 🏅 - Badges khi đạt mục tiêu
4. **Social Share** 📱 - Share điểm lên Facebook/Zalo

---

## 6. METRICS & ĐÁNH GIÁ NCKH

### 6.1 Key Performance Indicators

| Metric | Target | Measurement |
|--------|--------|-------------|
| Monthly Active Users | 1,000 | Unique logins/month |
| Daily Active Users | 200 | Unique logins/day |
| Exams Completed | 10,000 | Total submissions |
| Avg Score | 7.0/10 | Mean of all attempts |
| 7-day Retention | 40% | D7/D0 users |
| NPS Score | >50 | Survey |

### 6.2 Research Methodology

| Phase | Method | Sample | Timeline |
|-------|--------|--------|----------|
| Pre-test | Baseline exam | N=100 | Week 1 |
| Treatment | Use platform | 8 weeks | Week 2-9 |
| Post-test | Same exam | N=100 | Week 10 |
| Survey | Google Forms | N=100+ | Week 10-11 |

---

## 7. KẾ HOẠCH TRIỂN KHAI TRƯỜNG HỌC

### 7.1 Pilot Program Phases

| Phase | Duration | Activities |
|-------|----------|------------|
| **Chuẩn bị** | 2 tuần | Liên hệ trường, training GV |
| **Pilot** | 4 tuần | 100 HS + 3 GV, 1 trường |
| **Mở rộng** | 4 tuần | 500 HS, 2-3 trường |
| **Đầy đủ** | 4 tuần | 1000 HS, 3-5 trường |

### 7.2 Teacher Training

| Session | Duration | Content |
|---------|----------|---------|
| 1 | 30 phút | Giới thiệu, đăng nhập |
| 2 | 30 phút | Tạo đề bằng AI |
| 3 | 30 phút | Quản lý lớp |
| 4 | 30 phút | Xem thống kê |

---

## 8. RỦI RO & DỰ PHÒNG

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| API rate limit | 🟡 Medium | 🔴 High | Queue, fallback models |
| Low adoption | 🟡 Medium | 🟡 Medium | Better onboarding |
| Data loss | 🟢 Low | 🔴 High | Daily backups |
| Budget overrun | 🟢 Low | 🟡 Medium | Stay on free tiers |

---

## 📅 MASTER TIMELINE (6 THÁNG)

| Month | Focus | Deliverables |
|-------|-------|--------------|
| **1** | Stabilize + UI Start | Phase 1-2 |
| **2** | Redesign Complete | New landing, dashboard |
| **3** | Gamify Complete | Streak, leaderboard |
| **4** | Scale to Schools | 500+ users |
| **5** | NCKH Data | Collect metrics |
| **6** | Report Complete | Final NCKH report |

---

## ✅ IMMEDIATE ACTIONS

### This Week:
- [ ] Finalize new color palette
- [ ] Create landing page mockups
- [ ] Set up analytics
- [ ] Contact 1st pilot school

### This Month:
- [ ] Complete UI redesign
- [ ] Implement streak system
- [ ] Deploy leaderboard
- [ ] Start pilot

---

*Last Updated: January 2026*
*Version: 2.0*
