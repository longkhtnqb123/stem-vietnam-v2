# 📚 Hướng Dẫn Sử Dụng - STEM Vietnam

## Dành cho Học Sinh

---

### 🎯 Bắt Đầu

#### 1. Đăng Ký Tài Khoản

1. Truy cập trang web STEM Vietnam
2. Click **"Đăng Ký"**
3. Điền thông tin:
   - Họ và tên
   - Email
   - Mật khẩu (ít nhất 6 ký tự)
4. Click **"Tạo tài khoản"**

#### 2. Đăng Nhập

1. Nhập Email và Mật khẩu
2. Click **"Đăng nhập"**
3. Bạn sẽ được chuyển đến Dashboard

---

### 🏠 Dashboard

Dashboard là trang chính hiển thị:

| Phần | Mô tả |
|------|-------|
| **XP Bar** | Thanh tiến trình XP hiện tại |
| **Level** | Cấp độ của bạn |
| **Streak** | Số ngày liên tiếp học tập |
| **Daily Goals** | Mục tiêu hôm nay |
| **Recent Activity** | Hoạt động gần đây |

---

### 💬 Hỏi AI

1. Click vào nút **"Chat với AI"**
2. Gõ câu hỏi của bạn (VD: "Giải thích định luật Newton")
3. AI sẽ trả lời dựa trên sách giáo khoa
4. Bạn có thể hỏi thêm để hiểu rõ hơn

**Tips:**
- Hỏi cụ thể để được trả lời tốt hơn
- Có thể upload hình ảnh bài tập
- AI hỗ trợ Toán, Lý, Hóa, Sinh, Tin học

---

### 📝 Làm Đề Thi

#### Bước 1: Chọn Đề Thi
1. Vào **"Exam Online"**
2. Xem danh sách đề thi có sẵn
3. Lọc theo môn học, khối lớp
4. Click **"Bắt đầu làm bài"**

#### Bước 2: Làm Bài
1. Đọc câu hỏi và chọn đáp án
2. Sử dụng nút **"Tiếp"** / **"Trước"** để di chuyển
3. Xem thời gian còn lại ở góc trên
4. Khi hoàn thành, click **"Nộp bài"**

#### Bước 3: Xem Kết Quả
1. Điểm số và % đúng
2. Đáp án đúng cho từng câu
3. Giải thích chi tiết (nếu có)

---

### 🎮 Gamification

#### XP (Experience Points)
Bạn nhận XP khi:
- Hoàn thành bài thi: **+50 XP**
- Đúng 100%: **+20 XP bonus**
- Đạt streak: **+10 XP/ngày**
- Chat với AI: **+5 XP/câu**

#### Levels
| Level | XP Cần |
|-------|--------|
| 1 | 0 |
| 2 | 100 |
| 3 | 250 |
| 4 | 500 |
| 5 | 1000 |
| ... | ... |

#### Badges (Huy Hiệu)
- 🌟 **First Steps**: Hoàn thành bài đầu tiên
- 🔥 **On Fire**: 7 ngày streak
- 🏆 **Perfect Score**: Đạt 100% một bài
- 📚 **Bookworm**: Chat 50 câu với AI
- 💎 **Diamond**: Level 10+

#### Daily Goals
- Mục tiêu mặc định: 3 bài/ngày
- Hoàn thành → Nhận XP bonus
- Reset lúc 00:00

---

### 📊 Leaderboard

Xem bảng xếp hạng:
- **Top tuần**: Người học nhiều nhất tuần này
- **Top tháng**: Xếp hạng tháng
- **Top lớp**: So với các bạn cùng lớp

---

### ⚙️ Cài Đặt

Trong **Settings**, bạn có thể:
- Đổi tên, avatar
- Đổi mật khẩu
- Bật/tắt Dark Mode
- Chọn AI Model ưa thích

---

## Dành cho Giáo Viên

---

### 🏫 Quản Lý Lớp

#### Tạo Lớp Mới
1. Dashboard → **"Tạo lớp"**
2. Điền tên lớp (VD: "10A1 - Toán")
3. Click **"Tạo"**
4. Copy **mã lớp** gửi cho học sinh

#### Mời Học Sinh
- Học sinh sử dụng mã lớp để tham gia
- Hoặc gửi link mời trực tiếp

#### Xem Thống Kê Lớp
- Số học sinh đã tham gia
- Điểm trung bình các bài thi
- Hoạt động học tập

---

### 📝 Tạo Đề Thi

#### Tạo Thủ Công
1. **Exam Online** → **"Tạo đề mới"**
2. Điền thông tin đề thi
3. Thêm từng câu hỏi
4. Lưu và publish

#### Tạo Bằng AI (Recommended)
1. **Exam Online** → **"Tạo đề AI"**
2. Chọn:
   - Môn học
   - Khối lớp
   - Số câu hỏi
   - Độ khó
3. AI tự động tạo đề từ SGK
4. Review và chỉnh sửa nếu cần
5. Publish cho học sinh

---

### 📊 Theo Dõi Học Sinh

- Xem điểm từng bài thi
- Biểu đồ tiến độ theo thời gian
- Phát hiện học sinh cần hỗ trợ
- Export báo cáo Excel

---

## Dành cho Admin

---

### 🔐 Admin Tool

Sử dụng file `tools/admin-tool.html` để quản lý users:

1. **Mở file** bằng trình duyệt
2. **Backend** phải đang chạy
3. Các tính năng:
   - Xem danh sách users
   - Tạo user mới
   - Sửa thông tin/role
   - Xóa user
   - Import hàng loạt

Chi tiết: Xem [README.md](../README.md#admin-tool)

---

### 🏫 Quản Lý Trường

- Tạo trường mới qua API
- Assign users vào trường
- Xem thống kê theo trường

---

## ❓ FAQ

**Q: Quên mật khẩu?**
A: Liên hệ Admin để reset

**Q: AI trả lời sai?**
A: AI có thể sai, nên kiểm tra lại với SGK

**Q: Không vào được?**
A: Kiểm tra kết nối mạng, thử reload trang

---

*Cập nhật: Tháng 1/2026*
