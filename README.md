# 🎓 STEM Vietnam v2.0 - Hệ Thống Dạy & Học Thông Minh

![STEM AI Banner](https://placehold.co/1200x350/0f172a/ffffff?text=STEM+Vietnam+v2.0)

> **Dự án Nghiên cứu Khoa học & Chuyển đổi số Giáo dục**
> Nền tảng học tập thông minh tích hợp AI, RAG (Retrieval-Augmented Generation) và Hệ thống quản lý lớp học, hỗ trợ toàn diện môn Công Nghệ THPT.

---

## 🏗️ Kiến Trúc Hệ Thống (System Architecture)

Hệ thống được xây dựng trên nền tảng Serverless hiện đại của Cloudflare, tối ưu chi phí và hiệu năng.

```mermaid
graph TD
    Client[🖥️ Frontend Client\n(React + Vite)] <-->|HTTPS / JWT| Worker[⚡ Cloudflare Worker\n(API Gateway)]
    
    subgraph "Core Services"
        Worker --> Auth[🔐 Auth Service]
        Worker --> Exam[📝 Exam System]
        Worker --> Class[🏫 Class System]
        Worker --> RAG[🧠 RAG Pipeline]
    end

    subgraph "Data Layer"
        Exam & Class --> D1[(🗄️ D1 Database\nSQL Relational)]
        RAG --> Vectorize[(💠 Vectorize\nVector Database)]
        RAG --> R2[(📦 R2 Storage\nFile Storage)]
    end

    subgraph "AI & External"
        RAG -->|Embeddings| HF[🤗 HuggingFace API\n(Sentence Transformers)]
        RAG & Exam -->|Inference| AI[🤖 OpenRouter / Gemini\n(LLM Generation)]
    end
```

---

## 🔄 Quy Trình Xử Lý Logic (Logic Flows)

### 1. Luồng RAG (Retrieval-Augmented Generation)
Quy trình nạp dữ liệu (SGK) và tìm kiếm thông tin cho AI.

```mermaid
sequenceDiagram
    participant Admin
    participant Script as Ingest Script
    participant API as RAG API
    participant HF as HuggingFace
    participant Vec as Vectorize DB

    Note over Admin, Vec: 📥 Giai đoạn Ingest (Nạp dữ liệu)
    Admin->>Script: 1. Upload SGK (PDF/TXT)
    Script->>API: 2. Send File & Metadata
    API->>API: 3. Parse & Chunk Text
    API->>HF: 4. Request Embeddings (Batch)
    HF-->>API: 5. Return Vector Embeddings
    API->>Vec: 6. Insert Vectors + Metadata
    API-->>Admin: 7. Success

    Note over API, Vec: 🔍 Giai đoạn Search (Khi tạo đề)
    API->>Vec: 1. Query Vector Search
    Vec-->>API: 2. Return Top-K Contexts
```

### 2. Luồng Hệ Thống Lớp Học & Thi Cử
Kết hợp giữa Giáo viên, Học sinh và AI để tạo nên vòng lặp học tập khép kín.

```mermaid
sequenceDiagram
    participant T as 👨‍🏫 Giáo Viên
    participant S as 👨‍🎓 Học Sinh
    participant Sys as ⚙️ Hệ Thống
    participant AI as 🤖 AI Model

    %% Giai đoạn 1: Tạo Đề
    Note over T, AI: 1. Tạo Đề Thi Thông Minh
    T->>Sys: Yêu cầu tạo đề (Chủ đề, Lớp, Độ khó)
    Sys->>Sys: RAG Search (Lấy kiến thức SGK)
    Sys->>AI: Prompt (Context + Yêu cầu)
    AI-->>Sys: Trả về JSON Đề Thi
    Sys->>Sys: Lưu Template vào DB

    %% Giai đoạn 2: Lớp Học
    Note over T, S: 2. Quản Lý Lớp & Giao Bài
    T->>Sys: Tạo Lớp học mới
    Sys-->>T: Cấp Mã tham gia (Join Code)
    T->>S: Chia sẻ mã Join Code
    S->>Sys: Tham gia lớp
    T->>Sys: Giao Đề Thi cho Lớp

    %% Giai đoạn 3: Làm Bài
    Note over S, Sys: 3. Làm Bài & Chấm Điểm
    S->>Sys: Nhận thông báo & Bắt đầu làm
    S->>Sys: Nộp bài (Submit)
    Sys->>Sys: Tự động chấm điểm (Auto-grading)
    Sys->>Sys: Phân tích mức độ tư duy (Bloom)

    %% Giai đoạn 4: Báo Cáo
    Note over T, S: 4. Phản Hồi & Thống Kê
    Sys-->>S: Hiện Điểm & Đáp án chi tiết
    Sys-->>T: Cập nhật Dashboard (Phổ điểm, Top HS)
```

### 3. Luồng Xác Thực (Authentication Flow)
Quy trình đăng ký, đăng nhập và phân quyền người dùng.

```mermaid
flowchart TD
    Start([Người dùng truy cập]) --> CheckAuth{Đã đăng nhập?}
    
    CheckAuth -->|Chưa| LoginPage[Trang Đăng nhập/Đăng ký]
    CheckAuth -->|Rồi| Dashboard[Dashboard theo Role]
    
    LoginPage --> Register[Đăng ký mới]
    LoginPage --> Login[Đăng nhập]
    
    Register --> InputInfo[Nhập: Email, Mật khẩu, Họ tên]
    InputInfo --> SelectRole{Chọn vai trò}
    SelectRole -->|Học sinh| RoleStudent[role = student]
    SelectRole -->|Giáo viên| RoleTeacher[role = teacher]
    RoleStudent & RoleTeacher --> HashPwd[Hash mật khẩu BCrypt]
    HashPwd --> SaveDB[(Lưu vào D1 Database)]
    SaveDB --> GenJWT[Tạo JWT Token]
    
    Login --> VerifyPwd[Xác minh mật khẩu]
    VerifyPwd -->|Sai| Error[Thông báo lỗi]
    VerifyPwd -->|Đúng| GenJWT
    
    GenJWT --> SetCookie[Lưu Token vào LocalStorage]
    SetCookie --> Dashboard
    
    Dashboard --> CheckRole{Kiểm tra Role}
    CheckRole -->|student| StudentView[🎓 Giao diện Học sinh]
    CheckRole -->|teacher| TeacherView[👨‍🏫 Giao diện Giáo viên]
    CheckRole -->|admin| AdminView[⚙️ Giao diện Admin]
```

### 4. Luồng Chat AI (RAG-Powered Chat)
Cách hệ thống trả lời câu hỏi của học sinh với ngữ cảnh từ SGK.

```mermaid
sequenceDiagram
    participant U as 👨‍🎓 Học Sinh
    participant FE as 🖥️ Frontend
    participant API as ⚡ API Worker
    participant Vec as 💠 Vectorize
    participant LLM as 🤖 LLM (OpenRouter)
    
    U->>FE: 1. Gõ câu hỏi
    FE->>API: 2. POST /api/chat (question, history)
    
    Note over API, Vec: Semantic Search
    API->>Vec: 3. Query embeddings của câu hỏi
    Vec-->>API: 4. Trả về Top-5 chunks liên quan
    
    API->>API: 5. Xây dựng Prompt (System + Context + History + Question)
    
    API->>LLM: 6. Gửi prompt đến LLM
    LLM-->>API: 7. Stream response
    
    API-->>FE: 8. Stream về Frontend
    FE-->>U: 9. Hiển thị câu trả lời (Markdown + LaTeX)
    
    Note over API: Lưu conversation vào D1
```

### 5. Luồng Làm Bài Thi Chi Tiết (Exam Taking Flow)
Quy trình từ khi bắt đầu làm bài đến khi xem kết quả.

```mermaid
stateDiagram-v2
    [*] --> BrowseExams: Vào trang Thi Online
    
    BrowseExams --> SelectExam: Chọn đề thi
    SelectExam --> StartAttempt: Bấm "Bắt đầu làm bài"
    
    state StartAttempt {
        [*] --> CreateRecord: Tạo record exam_attempt
        CreateRecord --> LoadQuestions: Tải câu hỏi (không có đáp án)
        LoadQuestions --> StartTimer: Khởi động Timer
    }
    
    StartAttempt --> DoingExam: Làm bài
    
    state DoingExam {
        [*] --> AnswerQuestion: Chọn đáp án
        AnswerQuestion --> AutoSave: Auto-save (mỗi 30s)
        AutoSave --> AnswerQuestion: Tiếp tục làm
        AnswerQuestion --> CheckTime: Kiểm tra thời gian
        CheckTime --> AnswerQuestion: Còn thời gian
    }
    
    DoingExam --> SubmitExam: Nộp bài / Hết giờ
    
    state SubmitExam {
        [*] --> CompareAnswers: So sánh với đáp án đúng
        CompareAnswers --> CalcScore: Tính điểm (thang 10)
        CalcScore --> AnalyzeBloom: Phân tích theo Bloom
        AnalyzeBloom --> UpdateStats: Cập nhật times_taken
    }
    
    SubmitExam --> ShowResult: Hiển thị kết quả
    ShowResult --> ReviewAnswers: Xem chi tiết từng câu
    ReviewAnswers --> [*]
```

### 6. Luồng Dashboard & Thống Kê
Cách dữ liệu được tổng hợp để hiển thị trên Dashboard.

```mermaid
flowchart LR
    subgraph "📊 Data Sources"
        ET[(exam_templates)]
        EA[(exam_attempts)]
        CL[(classes)]
        CM[(class_members)]
    end
    
    subgraph "🔄 Aggregation"
        ET --> TeacherAgg[Đếm đề đã tạo]
        EA --> ScoreAgg[Tính điểm TB, Pass Rate]
        EA --> BloomAgg[Phân tích Bloom]
        EA --> StreakCalc[Tính Streak]
        CL & CM --> ClassStats[Thống kê lớp học]
    end
    
    subgraph "👨‍🏫 Teacher Dashboard"
        TeacherAgg --> TOverview[Tổng quan]
        ScoreAgg --> TChart[Biểu đồ phân bổ điểm]
        EA --> TTop10[Top 10 học sinh]
        ClassStats --> TClasses[Danh sách lớp]
    end
    
    subgraph "🎓 Student Dashboard"
        ScoreAgg --> SProgress[Tiến độ 7 ngày]
        BloomAgg --> SBloom[Radar Chart Bloom]
        StreakCalc --> SStreak[Hiển thị Streak]
        EA --> SRecent[Bài làm gần đây]
        EA --> SSuggest[Gợi ý ôn tập AI]
    end
```

### 7. Luồng Quản Lý Lớp Học (Class Management)
Chi tiết các thao tác trong hệ thống lớp học.

```mermaid
flowchart TD
    subgraph "👨‍🏫 Giáo Viên"
        T1[Tạo lớp mới] --> GenCode[Hệ thống tạo Join Code 6 ký tự]
        GenCode --> SaveClass[(Lưu vào bảng classes)]
        
        T2[Giao bài tập] --> SelectTemplate[Chọn đề thi đã tạo]
        SelectTemplate --> CreateAssign[(Tạo record class_assignments)]
        
        T3[Xem lớp] --> ViewMembers[Danh sách thành viên]
        T3 --> ViewProgress[Tiến độ làm bài từng HS]
        
        T4[Xóa lớp] --> DeleteCascade[Xóa members + assignments]
    end
    
    subgraph "👨‍🎓 Học Sinh"
        S1[Nhập Join Code] --> ValidateCode{Mã hợp lệ?}
        ValidateCode -->|Không| ErrorCode[Báo lỗi]
        ValidateCode -->|Có| CheckDup{Đã tham gia?}
        CheckDup -->|Rồi| AlreadyIn[Báo đã là thành viên]
        CheckDup -->|Chưa| JoinClass[(Thêm vào class_members)]
        JoinClass --> ShowClass[Hiển thị lớp + bài tập]
        
        S2[Làm bài được giao] --> StartExam[Bắt đầu attempt]
        StartExam --> NormalFlow[Luồng làm bài bình thường]
    end
    
    CreateAssign -.->|Thông báo| ShowClass
```

---

## ✨ Tính Năng Chi Tiết

### 1. 🔐 Hệ Thống Phân Quyền (RBAC)
*   **Học Sinh:**
    *   Dashboard cá nhân: Tiến độ, Streak, Gợi ý ôn tập.
    *   Làm bài thi Online (có đếm giờ, auto-save).
    *   Xem lịch sử bài làm và đáp án chi tiết.
*   **Giáo Viên:**
    *   Dashboard quản lý: Thống kê tổng quan, Biểu đồ phân bổ điểm.
    *   Tạo đề thi bằng AI (nhanh chóng, chính xác nhờ RAG).
    *   Quản lý lớp học và giao bài tập.

### 2. 🧠 RAG System (AI Core)
*   **Real Data:** Chỉ sử dụng dữ liệu từ Sách Giáo Khoa và tài liệu chính thống đã được verified.
*   **Hybrid Search:** Kết hợp tìm kiếm theo ngữ nghĩa (Vector) và từ khóa.
*   **AI Models:** Hỗ trợ linh hoạt Gemini Flash 2.0, GPT-4o-mini qua OpenRouter.

### 3. 🏫 Class System (Lớp Học)
*   Tạo lớp học với mã tham gia duy nhất (6 ký tự).
*   Giao bài tập (Assignments) cho toàn bộ thành viên.
*   Theo dõi trạng thái làm bài của từng học sinh.

---

---

## 📖 Hướng Dẫn Sử Dụng Chi Tiết (User Manual)

### 👨‍🏫 Dành Cho Giáo Viên (Teacher)

#### 1. Quản Lý Dashboard
*   Truy cập **"📊 Dashboard GV"** để xem tổng quan.
*   **Chỉ số:** "Tổng số đề thi", "Tổng lượt làm bài", "Điểm trung bình" của học sinh.
*   **Biểu đồ:** Xem phân bổ điểm (0-2, 2-4, ..., 8-10) để đánh giá chất lượng đề thi.
*   **Top Học Sinh:** Xem danh sách 10 học sinh có điểm cao nhất.

#### 2. Tạo Đề Thi Thông Minh (AI)
1.  Vào menu **"Tạo Câu Hỏi"**.
2.  Chọn tab **"Tạo đề bằng AI"**.
3.  Điền thông tin:
    *   **Khối:** 10, 11, hoặc 12.
    *   **Phân môn:** Công nghiệp hoặc Nông nghiệp.
    *   **Loại đề:** 15 phút, Giữa kỳ, Cuối kỳ (hệ thống tự chỉnh số câu).
    *   **Độ khó:** Dễ, Trung bình, Khó.
    *   **Chủ đề/Chương:** Nhập tên bài học (VD: "Mạch điện xoay chiều").
4.  Bấm **"Tạo đề thi"**. Hệ thống sẽ tìm kiến thức trong SGK và sinh câu hỏi.
5.  **Quan trọng:** Review lại từng câu hỏi -> Bấm **"Lưu đề thi"**.

#### 3. Quản Lý Lớp Học
*   **Tạo Lớp:** Vào menu **"Lớp Học"** -> Bấm "+ Tạo Lớp Mới" -> Nhập tên & mô tả.
*   **Mã Join Code:** Sau khi tạo, copy mã 6 ký tự (VD: `X7Y9Z2`) gửi cho học sinh.
*   **Giao Bài:**
    1.  Vào chi tiết lớp -> Chọn tab **"Bài Tập"**.
    2.  Bấm "+ Giao Bài Tập".
    3.  Chọn đề thi từ danh sách đã tạo.
    4.  Học sinh trong lớp sẽ thấy bài tập này ngay lập tức.

---

### 👨‍🎓 Dành Cho Học Sinh (Student)

#### 1. Theo Dõi Tiến Độ
*   Truy cập **"📈 Tiến Độ"**.
*   Xem biểu đồ điểm số 7 ngày gần đây.
*   **Radar Chart:** Xem kỹ năng tư duy (Nhận biết, Thông hiểu...).
*   **Gợi ý:** Hệ thống tự động đề xuất bài học cần ôn tập dựa trên câu sai.

#### 2. Tham Gia Lớp Học & Làm Bài
1.  Vào menu **"Lớp Học"**.
2.  Bấm **"Tham Gia Lớp"** -> Nhập mã Code giáo viên cung cấp.
3.  Vào chi tiết lớp, tab **"Bài Tập"** sẽ hiện danh sách bài được giao.
4.  Bấm **"Làm bài ngay"** (hoặc xem điểm nếu đã làm).

#### 3. Thi Online & Tự Luyện
*   Vào menu **"🔥 Thi Online"**.
*   Chọn một đề thi công khai bất kỳ.
*   **Giao diện thi:**
    *   Đồng hồ đếm ngược (tự nộp khi hết giờ).
    *   Danh sách câu hỏi bên phải để chuyển nhanh.
    *   Hệ thống **Auto-save** sau mỗi câu trả lời.
*   **Nộp bài:** Xem ngay điểm số, thời gian làm bài, và đáp án chi tiết.

#### 4. Chat AI Gia Sư
*   Vào menu **"Chat AI"**.
*   Hỏi bất kỳ kiến thức nào (VD: "Giải thích định luật Ohm").
*   AI sẽ tìm trong SGK và trả lời kèm trích dẫn (nếu có).

---

## 🛠️ Cài Đặt & Triển Khai (Setup)

### 1. Yêu Cầu
*   Node.js 18+
*   Cloudflare Account (Free plan OK)

### 2. Cài Đặt Dependencies
```bash
npm install
```

### 3. Cấu Hình Môi Trường
Tạo file `.dev.vars` trong thư mục `workers/`:
```ini
AI_API_KEY=your_key
HF_API_TOKEN=your_huggingface_token
JWT_SECRET=your_secret
```

### 4. Chạy Local
```bash
# Chạy Backend (Worker)
cd workers
npx wrangler dev

# Chạy Frontend (Vite)
npm run dev
```

### 5. Nạp Dữ Liệu RAG (Ingest)
Copy file SGK (PDF/TXT) vào thư mục `data/` và chạy:
```powershell
./scripts/run-ingest.ps1
```

---

## 📂 Cấu Trúc Dự Án

```
stem-vietnam-v2/
├── 📂 data/                 # Thư mục chứa tài liệu để Ingest RAG
├── 📂 scripts/              # Scripts tiện ích (Ingest, Versioning)
├── 📂 src/                  # Frontend Source
│   ├── 📂 components/       # Reusable UI Components
│   ├── 📂 pages/            # Page Views (Exam, Dashboard, Classes...)
│   ├── 📂 lib/              # API Clients & Utilities
│   └── 📂 stores/           # State Management (Zustand)
├── 📂 workers/              # Backend Source (Cloudflare Workers)
│   ├── 📂 migrations/       # D1 SQL Migrations
│   ├── 📂 src/              # Worker Logic
│   │   ├── index.ts         # Main Router
│   │   ├── exam-online-routes.ts # Xử lý thi cử
│   │   ├── class-routes.ts  # Xử lý lớp học
│   │   ├── rag-pipeline.ts  # Logic RAG & Vector Search
│   │   └── ingest.ts        # Xử lý upload file
│   └── wrangler.toml        # Cloudflare Config
└── package.json
```

---
© 2026 STEM Vietnam Project. All rights reserved.
