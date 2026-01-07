# 🎯 ROADMAP: HỆ THỐNG HỖ TRỢ HỌC TẬP MÔN CÔNG NGHỆ THPT

> **Dự án Nghiên cứu Khoa học**  
> **Mục tiêu**: Trang web tạo đề môn Công nghệ + AI Chat với dữ liệu mới nhất  
> **Stack**: React + Cloudflare Workers + OpenRouter (FREE) + HuggingFace (FREE)

---

## 📋 MỤC LỤC

1. [Tổng quan Hệ thống](#1-tổng-quan-hệ-thống)
2. [Phân tích Lợi ích vs Hạn chế](#2-phân-tích-lợi-ích-vs-hạn-chế)
3. [Giải pháp Tối ưu Chi phí](#3-giải-pháp-tối-ưu-chi-phí)
4. [Roadmap Chi tiết](#4-roadmap-chi-tiết)
5. [Điểm Mạnh cho NCKH](#5-điểm-mạnh-cho-nckh)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Chức năng Chính

```
┌─────────────────────────────────────────────────────────────┐
│                    STEM VIETNAM                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📝 TẠO ĐỀ THI          │  💬 AI CHAT (StemBot)             │
│  ├─ Đề THPT Quốc gia    │  ├─ Giải đáp thắc mắc             │
│  ├─ Đề kiểm tra HK      │  ├─ Hướng dẫn làm bài             │
│  ├─ Đề 15 phút          │  ├─ Tra cứu kiến thức             │
│  └─ Tùy chỉnh độ khó    │  └─ Dữ liệu web mới nhất          │
│                                                              │
│  📚 THƯ VIỆN SGK        │  📊 QUẢN LÝ HỌC TẬP              │
│  ├─ SGK Công nghiệp     │  ├─ Lịch sử chat                  │
│  ├─ SGK Nông nghiệp     │  ├─ Lịch sử đề thi                │
│  └─ Chuyên đề học tập   │  └─ Đăng nhập/Đăng ký             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Kiến trúc Kỹ thuật

```
[Frontend - React]
       │
       ▼
[Cloudflare Workers API] ─── FREE Tier (100k requests/day)
       │
       ├── OpenRouter ──────── FREE Models (Gemini, DeepSeek, MiMo)
       │
       ├── HuggingFace ─────── FREE Embeddings (RAG)
       │
       ├── DuckDuckGo ──────── FREE Web Search
       │
       └── Cloudflare Vectorize ─ FREE Tier (30M vectors)
```

---

## 2. PHÂN TÍCH LỢI ÍCH VS HẠN CHẾ

### ✅ LỢI ÍCH

| Khía cạnh | Lợi ích | Điểm NCKH |
|-----------|---------|-----------|
| **Chi phí** | 100% miễn phí (OpenRouter + HuggingFace) | ⭐⭐⭐ |
| **Tốc độ** | Streaming response, UX mượt mà | ⭐⭐ |
| **Chính xác** | RAG từ SGK chính thống | ⭐⭐⭐ |
| **Cập nhật** | Web search cho tin tức mới | ⭐⭐⭐ |
| **Đa dạng** | Multiple models cho từng tác vụ | ⭐⭐ |
| **Bảo mật** | API key ở backend, không lộ | ⭐ |

### ⚠️ HẠN CHẾ & GIẢI PHÁP

| Hạn chế | Mức độ | Giải pháp |
|---------|--------|-----------|
| **Rate limit OpenRouter** | Trung bình | Implement queue + retry logic |
| **HuggingFace cold start** | Nhẹ | Cache embeddings phổ biến |
| **Model tiếng Việt** | Trung bình | Dùng prompt engineering tốt |
| **PDF scanned** | Cao | Yêu cầu user convert trước |
| **Hallucination** | Trung bình | RAG + Citation nguồn |

### 🔴 VẤN ĐỀ CHI PHÍ ĐÃ GẶP (7 triệu VND)

| Nguyên nhân | Chi phí | Đã khắc phục |
|-------------|---------|--------------|
| Google Search Grounding | ~920K/1000 lần | ✅ Dùng DuckDuckGo FREE |
| Gemini qua Vertex AI | Cao | ✅ Dùng OpenRouter FREE |
| Audio/TTS API | Rất cao | ✅ Đã xoá hoàn toàn |
| Embeddings mỗi request | Tích lũy | ✅ Dùng HuggingFace FREE |

---

## 3. GIẢI PHÁP TỐI ƯU CHI PHÍ

### 3.1 Giảm Số Lần Gọi AI

```
┌─────────────────────────────────────────────────────────────┐
│                    CHIẾN LƯỢC GIẢM API CALLS                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. SMART CLASSIFICATION                                     │
│     ├─ Chào hỏi đơn giản → Trả lời cố định, KHÔNG gọi AI    │
│     ├─ Câu hỏi học tập → Gọi AI + RAG                       │
│     └─ Tin tức/Thời sự → Gọi AI + Web Search                │
│                                                              │
│  2. RESPONSE CACHING                                         │
│     ├─ Cache câu trả lời phổ biến (FAQ)                     │
│     ├─ Cache embeddings theo hash text                       │
│     └─ TTL: 1-7 ngày tuỳ loại                               │
│                                                              │
│  3. DEBOUNCE & THROTTLE                                      │
│     ├─ Debounce typing: 500ms                               │
│     ├─ Rate limit per user: 20 msg/phút                     │
│     └─ Giới hạn độ dài tin nhắn: 2000 chars                 │
│                                                              │
│  4. LAZY LOADING                                             │
│     ├─ Chỉ load RAG khi cần thiết                           │
│     └─ Không preload tất cả documents                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Caching Strategy

```typescript
// Ví dụ: Cache FAQ responses
const FAQ_CACHE = {
  "mạng lan là gì": "LAN (Local Area Network) là mạng máy tính...",
  "tcp/ip là gì": "TCP/IP là bộ giao thức truyền thông...",
  // ... thêm các câu hỏi phổ biến
};

// Check cache trước khi gọi AI
if (FAQ_CACHE[query.toLowerCase()]) {
  return FAQ_CACHE[query];
}
```

---

## 4. ROADMAP CHI TIẾT

### Phase 1: Ổn định Hệ thống Hiện tại ✅
**Thời gian**: Đã hoàn thành

- [x] Xoá Vertex AI, chuyển sang OpenRouter
- [x] Tích hợp HuggingFace embeddings
- [x] Tích hợp DuckDuckGo search
- [x] Tạo lại Vectorize index (384 dims)
- [x] Deploy Workers

---

### Phase 2: Tối ưu Chi phí & Giảm Request
**Thời gian**: 1-2 tuần

- [ ] **2.1 Implement Response Caching**
  - [ ] Tạo FAQ cache cho câu hỏi phổ biến
  - [ ] Cache embeddings với Cloudflare KV
  - [ ] Set TTL hợp lý (24h cho chat, 7d cho embeddings)

- [ ] **2.2 Smart Query Classification**
  - [ ] Phân loại greeting → trả lời cố định
  - [ ] Phân loại spam/lặp lại → không xử lý
  - [ ] Log analytics để tối ưu

- [ ] **2.3 Rate Limiting**
  - [ ] Giới hạn 20 messages/phút/user
  - [ ] Giới hạn 100 đề thi/ngày/user
  - [ ] Thông báo thân thiện khi limit

---

### Phase 3: Nâng cấp RAG & Dữ liệu
**Thời gian**: 2-3 tuần

- [ ] **3.1 Upload SGK vào Vectorize**
  - [ ] SGK Công nghiệp lớp 10, 11, 12
  - [ ] SGK Nông nghiệp lớp 10, 11, 12
  - [ ] Chuyên đề học tập

- [ ] **3.2 Cải thiện RAG Quality**
  - [ ] Thử model embeddings tiếng Việt tốt hơn
  - [ ] Fine-tune chunking strategy
  - [ ] Thêm reranker để filter kết quả

- [ ] **3.3 Citation & Nguồn**
  - [ ] Hiển thị nguồn SGK khi trả lời
  - [ ] Link đến trang/chương cụ thể
  - [ ] Tăng độ tin cậy cho NCKH

---

### Phase 4: Nâng cấp Tạo Đề Thi
**Thời gian**: 2-3 tuần

- [ ] **4.1 Template Đề Thi**
  - [ ] Đề THPT Quốc gia (40 câu/50 phút)
  - [ ] Đề kiểm tra HK (40 câu/45 phút)
  - [ ] Đề 15 phút (15 câu)

- [ ] **4.2 Độ khó & Phân loại**
  - [ ] Nhận biết (30%)
  - [ ] Thông hiểu (40%)
  - [ ] Vận dụng (20%)
  - [ ] Vận dụng cao (10%)

- [ ] **4.3 Export & Quản lý**
  - [ ] Export PDF/Word
  - [ ] Lưu lịch sử đề đã tạo
  - [ ] Chia sẻ đề với giáo viên khác

---

### Phase 5: Analytics & Báo cáo NCKH
**Thời gian**: 1-2 tuần

- [ ] **5.1 Thu thập Dữ liệu**
  - [ ] Số lượt chat/ngày
  - [ ] Số đề thi được tạo
  - [ ] Mức độ hài lòng (feedback)
  - [ ] Thời gian phản hồi AI

- [ ] **5.2 Đánh giá Chất lượng**
  - [ ] So sánh đề AI vs đề thật
  - [ ] Khảo sát học sinh/giáo viên
  - [ ] Độ chính xác RAG

- [ ] **5.3 Báo cáo**
  - [ ] Dashboard thống kê
  - [ ] Export data cho báo cáo NCKH

---

## 5. ĐIỂM MẠNH CHO NCKH

### 5.1 Tính Mới (Novelty)

| Điểm | Mô tả |
|------|-------|
| **Multi-model Routing** | Tự động chọn model phù hợp (chat/code/reasoning) |
| **Hybrid Search** | RAG (SGK) + Web Search (tin tức) |
| **Zero-cost AI** | 100% sử dụng API miễn phí |
| **Vietnamese Optimized** | Prompt engineering cho tiếng Việt |

### 5.2 Tính Ứng dụng (Applicability)

| Đối tượng | Lợi ích |
|-----------|---------|
| **Học sinh** | Học mọi lúc mọi nơi, giải đáp 24/7 |
| **Giáo viên** | Tạo đề nhanh, tiết kiệm thời gian |
| **Nhà trường** | Công cụ hỗ trợ dạy học miễn phí |

### 5.3 Tính Khoa học (Scientific Merit)

| Khía cạnh | Phương pháp |
|-----------|-------------|
| **Đánh giá chất lượng** | So sánh với đề thi thật |
| **User study** | Khảo sát N=50+ học sinh |
| **A/B Testing** | So sánh có RAG vs không RAG |
| **Metrics** | Accuracy, Latency, User Satisfaction |

---

## 📊 BẢNG THEO DÕI TIẾN ĐỘ

| Phase | Mục tiêu | Trạng thái | Deadline |
|-------|----------|------------|----------|
| 1 | Ổn định hệ thống | ✅ Done | - |
| 2 | Tối ưu chi phí | 🔄 Todo | +2 tuần |
| 3 | Nâng cấp RAG | 🔄 Todo | +4 tuần |
| 4 | Nâng cấp đề thi | 🔄 Todo | +6 tuần |
| 5 | Analytics NCKH | 🔄 Todo | +7 tuần |

---

## 📝 GHI CHÚ

### Bài học từ 7 triệu VND:
1. **KHÔNG dùng Google Search Grounding** - cực đắt
2. **KHÔNG dùng Vertex AI trực tiếp** - có free tier nhưng dễ vượt
3. **LUÔN dùng free models qua OpenRouter** - an toàn
4. **LUÔN set budget alert** trên GCP

### Nguyên tắc phát triển:
1. **Cost-first**: Luôn nghĩ về chi phí trước
2. **Cache-everything**: Cache mọi thứ có thể
3. **Graceful-degradation**: Fallback khi service lỗi
4. **User-feedback**: Liên tục lấy feedback cải thiện
