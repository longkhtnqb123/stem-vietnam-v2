// Chú thích: Export đề thi sang file Word (.docx)
// Sử dụng docx package để tạo file Word format chuẩn
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

// Chú thích: Tạo document Word từ đề thi
export async function exportExamToWord(
    content: string,
    subject: 'cong_nghiep' | 'nong_nghiep',
    examType: string = 'THPT Quốc gia 2026'
): Promise<void> {
    const subjectName = subject === 'cong_nghiep' ? 'Công nghệ Công nghiệp' : 'Công nghệ Nông nghiệp';
    const today = new Date();

    // Chú thích: Tạo paragraphs từ nội dung
    const paragraphs: Paragraph[] = [];

    // Header - Tiêu đề đề thi
    paragraphs.push(
        new Paragraph({
            children: [
                new TextRun({ text: 'BỘ GIÁO DỤC VÀ ĐÀO TẠO', bold: true, size: 24 }),
            ],
            alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
            children: [
                new TextRun({ text: 'ĐỀ THI CHÍNH THỨC', bold: true, size: 24 }),
            ],
            alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
            children: [
                new TextRun({ text: `KỲ THI ${examType.toUpperCase()}`, bold: true, size: 28 }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
        }),
        new Paragraph({
            children: [
                new TextRun({ text: `Bài thi: ${subjectName}`, bold: true, size: 26 }),
            ],
            alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
            children: [
                new TextRun({ text: 'Thời gian làm bài: 50 phút, không kể thời gian phát đề', italics: true, size: 22 }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        }),
    );

    // Thông tin thí sinh
    paragraphs.push(
        new Paragraph({
            children: [
                new TextRun({ text: 'Họ và tên thí sinh: .....................................................', size: 22 }),
            ],
            spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
            children: [
                new TextRun({ text: 'Số báo danh: .................   Mã đề thi: 001', size: 22 }),
            ],
            spacing: { after: 300 },
        }),
    );

    // Chia line
    paragraphs.push(
        new Paragraph({
            border: {
                bottom: { color: '000000', space: 1, size: 6, style: BorderStyle.SINGLE },
            },
            spacing: { after: 300 },
        }),
    );

    // Nội dung đề thi - xuất raw content
    const lines = content.split('\n');
    for (const line of lines) {
        if (line.trim()) {
            const isBold = /^(Câu\s*\d+|Phần\s*\w+|PHẦN|ĐÁP ÁN)/i.test(line.trim());
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: line,
                            bold: isBold,
                            size: 24, // 12pt
                        }),
                    ],
                    spacing: { after: 100 },
                }),
            );
        }
    }

    // Tạo document
    const doc = new Document({
        sections: [{
            properties: {},
            children: paragraphs,
        }],
    });

    // Export sang blob và download
    const blob = await Packer.toBlob(doc);
    const fileName = `de-thi-${subject}-${today.getTime()}.docx`;
    saveAs(blob, fileName);

    console.info('[exam-export] Exported to', fileName);
}
