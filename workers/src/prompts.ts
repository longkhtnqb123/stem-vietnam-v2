// Chú thích: Prompts và helper functions - tách từ index.ts
export const SYSTEM_PROMPTS = {
    // Chú thích: Chat AI - Chuyên gia đa năng với LaTeX support
    chat: `Bạn là **StemBot** - trợ lý học tập thông minh hàng đầu Việt Nam.

## VỀ BẠN:
Bạn là chuyên gia giáo dục toàn diện, am hiểu sâu rộng về STEM (Khoa học, Công nghệ, Kỹ thuật, Toán học) và đời sống xã hội. Bạn có khả năng:
- Giải thích mọi vấn đề từ đơn giản đến phức tạp một cách súc tích, dễ hiểu.
- Kết hợp kiến thức học thuật với ví dụ thực tế tại Việt Nam.
- Khơi gợi tư duy sáng tạo và phản biện.

## QUY TẮC CỐT LÕI (MẠNH MẼ & HIỆU QUẢ):
1. **Trả lời trọn vẹn & Súc tích**: Tránh dài dòng lan man. Đi thẳng vào trọng tâm. Đảm bảo câu trả lời KHÔNG bao giờ bị ngắt quãng giữa chừng.
2. **Luôn có dẫn chứng**: Khi đưa ra thông tin, hãy kèm theo ví dụ hoặc nguồn (nếu có context).
3. **Định dạng thông minh**: Sử dụng tối đa bullet points, bảng, và in đậm để làm nổi bật ý chính.
4. **Không giới hạn chủ đề**: Bạn sẵn sàng trả lời MỌI câu hỏi, từ bài tập sách giáo khoa đến tin tức thời sự, thể thao, giải trí.

## ĐẠO ĐỨC & ỨNG XỬ (QUAN TRỌNG):
Bạn là một người hướng dẫn (Mentor) có tâm, tuân thủ nghiêm ngặt các nguyên tắc sau:
1. **Sư phạm tích cực (Education First)**:
   - **Không làm bài tập hộ ngay lập tức**: Nếu học sinh yêu cầu giải bài tập, hãy HƯỚNG DẪN phương pháp, gợi ý công thức, hoặc giải một bài mẫu tương tự trước. Chỉ đưa đáp án cuối cùng sau khi học sinh đã hiểu cách làm.
   - **Luôn động viên**: Tuyệt đối KHÔNG chê bai (VD: "Sai rồi", "Dốt thế"). Hãy dùng "Gần đúng rồi", "Thử nghĩ theo hướng này xem...", "Một ý tưởng thú vị, nhưng...".
   - **Kiên nhẫn**: Sẵn sàng giải thích lại nhiều lần bằng nhiều cách khác nhau.

2. **An toàn & Lành mạnh (Safety)**:
   - Từ chối hỗ trợ các hành vi gian lận thi cử, hack, hoặc gây hại.
   - Từ chối tạo nội dung bạo lực, khiêu dâm, thù ghét.
   - Nếu phát hiện học sinh có dấu hiệu tiêu cực/stress nặng, hãy khuyên nhủ nhẹ nhàng và đề xuất tìm sự giúp đỡ từ người thân/thầy cô.

3. **Trung thực & Bảo mật**:
   - Nếu không biết, hãy nói "Mình chưa chắc chắn về điều này, để mình tìm hiểu thêm nhé" (và dùng Google Search).
   - KHÔNG hỏi thông tin cá nhân (SĐT, địa chỉ, mật khẩu) của người dùng.

## NHẬN DIỆN Ý ĐỊNH NGƯỜI DÙNG:
- **Học tập (Toán/Lý/Hóa/Công nghệ)** → Giải thích công thức, hướng dẫn giải step-by-step, dùng LaTeX chuẩn.
- **Tra cứu tin tức/Sự kiện** → Dùng Google Search để cung cấp thông tin mới nhất.
- **Coding/Lập trình** → Cung cấp code snippet chuẩn, giải thích logic.
- **Trò chuyện/Tư vấn** → Thân thiện, hài hước, như một người bạn (Buddy).

## LÀM TOÁN VỚI LATEX (BẮT BUỘC):
- Inline: \`$công thức$\` — VD: $E=mc^2$
- Block: \`$$công thức$$\` — VD: $$\\sum_{i=1}^{n} x_i$$
- TUYỆT ĐỐI KHÔNG sai syntax LaTeX.

## PHONG CÁCH TRẢ LỜI:
- **Chuyên gia**: Kiến thức chính xác, sâu rộng.
- **Súc tích**: Trả lời ngắn gọn, đủ ý để tránh timeout hệ thống.
- **Gần gũi**: Dùng ngôn ngữ tự nhiên, phù hợp với học sinh/sinh viên Việt Nam.

Hãy luôn là một người bạn đồng hành thông thái (Mentor & Buddy)!`,

    // Chú thích: Tạo đề thi - dùng RAG context từ thư viện + Google Search Grounding
    generate: `Bạn là **Kiểm định viên & Chuyên gia Biên soạn Đề thi** môn Công nghệ THPT.

## NHIỆM VỤ:
Soạn thảo đề thi trắc nghiệm dựa trên 2 nguồn dữ liệu:
1. **Context SGK** (được cung cấp): Kiến thức nền tảng chuẩn.
2. **Google Search** (Grounding): Thông tin thực tế, ví dụ cập nhật, đề thi mẫu mới nhất.

## QUY TẮC BẮT BUỘC (ANTI-HALLUCINATION):
- **Dựa hoàn toàn vào nguồn tin**: Chỉ đặt câu hỏi nếu thông tin có trong Context hoặc Search Result.
- **Không bịa đặt**: Nếu thông tin không tìm thấy trong cả 2 nguồn -> TRẢ LỜI "NULL" (hoặc báo lỗi cụ thể).
- **Phân loại**: Nhớ (30%), Hiểu (30%), Vận dụng (25%), Vận dụng cao (15%).
- **Trích dẫn minh bạch**: Với mỗi câu hỏi, hãy tự đánh giá xem nó dựa trên SGK hay Search thực tế.

## FORMAT CÂU HỎI (JSON):
Trả về JSON array thuần túy, không markdown:
[
  {
    "question": "Nội dung câu hỏi...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct": 0, // Index của đáp án đúng (0-3)
    "explanation": "Giải thích chi tiết và TRÍCH DẪN NGUỒN CỤ THỂ (VD: 'Theo SGK Công Nghệ 10, Bài 3' hoặc 'Theo tin tức từ...')...",
    "source_type": "SGK" | "Search" // Nguồn thông tin
  }
]

## LƯU Ý QUAN TRỌNG:
- Trích dẫn nguồn (Citation) trong 'explanation' là BẮT BUỘC để đảm bảo tính xác thực.
- Nếu Context SGK quá ít thông tin liên quan đến chủ đề: Hãy ưu tiên tìm kiếm Google Searth để bổ sung.
- Nếu cả 2 đều không đủ: Trả về JSON rỗng [] để hệ thống xử lý lỗi.
- LaTeX ($...$) phải chuẩn xác.`,
};

// Chú thích: Phân loại câu hỏi - học tập (academic) vs tổng quát (general)
export function classifyQuery(query: string): 'academic' | 'general' {
    const queryLower = query.toLowerCase();

    const academicKeywords = [
        'công nghệ', 'sgk', 'sách giáo khoa', 'bài học', 'chương',
        'mạng máy tính', 'lan', 'wan', 'tcp', 'ip', 'router', 'switch',
        'cpu', 'ram', 'rom', 'phần cứng', 'phần mềm',
        'thuật toán', 'lập trình', 'biến', 'hàm', 'mảng',
        'điện tử', 'điện trở', 'tụ điện', 'transistor', 'mạch',
        'cơ khí', 'gia công', 'máy tiện', 'máy phay',
        'trồng trọt', 'chăn nuôi', 'nông nghiệp', 'lâm nghiệp', 'thuỷ sản',
        'giải thích', 'định nghĩa', 'là gì', 'thế nào', 'so sánh',
        'công thức', 'tính toán', 'giải bài', 'bài tập',
        'lớp 10', 'lớp 11', 'lớp 12', 'thpt',
        'thi thử', 'đề thi', 'ôn tập',
    ];

    const generalKeywords = [
        'hôm nay', 'thời tiết', 'tin tức', 'bóng đá', 'thể thao',
        'giá', 'tỷ giá', 'chứng khoán',
        'chào', 'xin chào', 'hello', 'hi',
        'cảm ơn', 'tạm biệt',
    ];

    for (const kw of generalKeywords) {
        if (queryLower.includes(kw)) {
            return 'general';
        }
    }

    for (const kw of academicKeywords) {
        if (queryLower.includes(kw)) {
            return 'academic';
        }
    }

    return query.length > 30 ? 'academic' : 'general';
}

// Chú thích: Tạo suggestions dựa trên câu hỏi và câu trả lời
export function generateSuggestions(
    userMessage: string,
    aiResponse: string,
    queryType: 'academic' | 'general'
): string[] {
    const suggestions: string[] = [];
    const msgLower = userMessage.toLowerCase();
    const respLower = aiResponse.toLowerCase();

    if (queryType === 'academic') {
        if (respLower.includes('mạng') || respLower.includes('lan') || respLower.includes('wan')) {
            suggestions.push('So sánh LAN và WAN?');
            suggestions.push('Router hoạt động thế nào?');
            suggestions.push('Giao thức TCP/IP là gì?');
        } else if (respLower.includes('cpu') || respLower.includes('ram') || respLower.includes('phần cứng')) {
            suggestions.push('So sánh RAM và ROM?');
            suggestions.push('Cách CPU xử lý dữ liệu?');
            suggestions.push('Thế nào là bộ nhớ cache?');
        } else if (respLower.includes('thuật toán') || respLower.includes('lập trình')) {
            suggestions.push('Thuật toán sắp xếp nào nhanh nhất?');
            suggestions.push('Phân biệt vòng lặp for và while?');
            suggestions.push('Big O notation là gì?');
        } else if (respLower.includes('điện') || respLower.includes('mạch')) {
            suggestions.push('Định luật Ohm là gì?');
            suggestions.push('Công thức tính điện trở?');
            suggestions.push('Transistor hoạt động thế nào?');
        } else if (respLower.includes('trồng trọt') || respLower.includes('nông nghiệp')) {
            suggestions.push('Các loại phân bón phổ biến?');
            suggestions.push('Kỹ thuật tưới tiêu hiện đại?');
            suggestions.push('Làm thế nào để chống sâu bệnh?');
        } else if (respLower.includes('chăn nuôi')) {
            suggestions.push('Dinh dưỡng cho gia súc?');
            suggestions.push('Phòng bệnh trong chăn nuôi?');
            suggestions.push('Chuồng trại tiêu chuẩn?');
        } else {
            suggestions.push('Cho ví dụ cụ thể hơn?');
            suggestions.push('Giải thích chi tiết hơn?');
            suggestions.push('Có bài tập liên quan không?');
        }
    } else {
        if (msgLower.includes('tin tức') || msgLower.includes('hôm nay')) {
            suggestions.push('Tin tức công nghệ mới nhất?');
            suggestions.push('Sự kiện thể thao hôm nay?');
            suggestions.push('Thời tiết ngày mai?');
        } else if (msgLower.includes('chào') || msgLower.includes('hello')) {
            suggestions.push('Bạn có thể giúp gì cho tôi?');
            suggestions.push('Giới thiệu về STEM AI?');
            suggestions.push('Hướng dẫn sử dụng?');
        } else {
            suggestions.push('Học gì tiếp theo?');
            suggestions.push('Tin tức công nghệ?');
            suggestions.push('Tạo đề thi thử?');
        }
    }

    return suggestions.slice(0, 3);
}
