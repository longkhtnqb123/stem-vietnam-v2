// Chú thích: Form tạo đề giữa kỳ / cuối kỳ
// Cấu trúc: 28 câu trắc nghiệm + 2 câu tự luận + đáp án đầy đủ
// Lưu ý: Lớp 12 chưa hỗ trợ (chưa có SGK)
import { useState } from 'react';
import { GraduationCap, Sparkles, Download, BookOpen, AlertTriangle } from 'lucide-react';
import { generateWithRAG } from '../../lib/rag/generator';
import { SEMESTER_EXAM_PROMPT } from '../../lib/prompts';
import { BOOK_PUBLISHERS } from '../../data/library/defaultBooks';

// Chú thích: Loại đề - ảnh hưởng đến tỷ lệ SGK/Chuyên đề
const EXAM_PURPOSES = {
    basic: {
        label: '📖 Ôn tập cơ bản',
        description: 'Tập trung SGK (90% SGK, 10% Chuyên đề)',
        sgkRatio: 90,
    },
    practice: {
        label: '📝 Kiểm tra định kỳ',
        description: 'Chuẩn GK/CK (70-80% SGK, 20-30% Chuyên đề)',
        sgkRatio: 75,
    },
    advanced: {
        label: '🏆 Thi thử / HSG',
        description: 'Phân loại cao (60% SGK, 40% Chuyên đề)',
        sgkRatio: 60,
    },
} as const;

type ExamPurpose = keyof typeof EXAM_PURPOSES;

export default function SemesterExamFormPage() {
    const [formData, setFormData] = useState({
        grade: '10' as '10' | '11' | '12',
        examType: 'midterm' as 'midterm' | 'final',
        examPurpose: 'practice' as ExamPurpose,
        bookPublisher: 'all' as 'all' | string,
        customPrompt: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string>('');

    // Chú thích: Lớp 12 chưa hỗ trợ
    const isGrade12 = formData.grade === '12';

    const handleGenerate = async () => {
        if (isGrade12) return; // Block nếu chọn lớp 12

        setIsLoading(true);
        setResult('');

        try {
            const examTypeName = formData.examType === 'midterm' ? 'giữa kỳ' : 'cuối kỳ';
            const purposeInfo = EXAM_PURPOSES[formData.examPurpose];

            // Chú thích: Build query
            const query = `Tạo đề kiểm tra ${examTypeName} môn Công nghệ lớp ${formData.grade}`;

            // Chú thích: Build custom prompt với logic SGK + Chuyên đề
            const structurePrompt = `
Cấu trúc đề BẮT BUỘC:
- PHẦN I: 28 câu trắc nghiệm (A, B, C, D)
  + Phân bố: 10 Nhớ, 10 Hiểu, 6 Vận dụng, 2 Vận dụng cao
- PHẦN II: 2 câu tự luận
  + Câu 1: Vận dụng (2 điểm)
  + Câu 2: Vận dụng cao (1 điểm)
- PHẢI có ĐÁP ÁN đầy đủ ở cuối đề

QUAN TRỌNG - Tỷ lệ nội dung:
- ${purposeInfo.sgkRatio}% câu hỏi từ SGK (nội dung cốt lõi)
- ${100 - purposeInfo.sgkRatio}% câu hỏi từ Chuyên đề học tập (nội dung nâng cao)
${formData.examPurpose === 'advanced'
                    ? '- Các câu Vận dụng cao BẮT BUỘC lấy từ Chuyên đề để phân loại học sinh giỏi'
                    : ''}
`;

            const bookPrompt = formData.bookPublisher !== 'all'
                ? `Ưu tiên nội dung từ bộ sách ${formData.bookPublisher}`
                : '';

            const fullCustomPrompt = [
                structurePrompt,
                bookPrompt,
                formData.customPrompt,
            ].filter(Boolean).join('\n');

            const response = await generateWithRAG({
                query,
                systemPrompt: SEMESTER_EXAM_PROMPT,
                customPrompt: fullCustomPrompt,
                filters: { grade: formData.grade },
            });

            setResult(response.text);
        } catch (error) {
            console.error('[semester-exam] error:', error);
            setResult('Đã có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <GraduationCap className="text-primary-500" />
                    Tạo Đề Giữa Kỳ / Cuối Kỳ
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Hỗ trợ THPT (Lớp 10, 11) • Chưa hỗ trợ THCS/Tiểu học
                </p>
            </div>

            {/* RAG notice */}
            <div className="glass-card p-3 mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                    <BookOpen size={16} />
                    <span><strong>RAG Enabled:</strong> AI sử dụng SGK + Chuyên đề trong Thư viện</span>
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="glass-panel p-6 space-y-5">
                    {/* Chọn lớp */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Lớp
                        </label>
                        <div className="flex gap-2">
                            {(['10', '11', '12'] as const).map((grade) => {
                                const isDisabled = grade === '12';
                                return (
                                    <button
                                        key={grade}
                                        onClick={() => !isDisabled && setFormData(prev => ({ ...prev, grade }))}
                                        disabled={isDisabled}
                                        className={`flex-1 py-3 rounded-xl font-semibold transition-all relative ${isDisabled
                                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                                : formData.grade === grade
                                                    ? 'bg-primary-600 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                            }`}
                                    >
                                        Lớp {grade}
                                        {isDisabled && (
                                            <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                                Sắp có
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Warning nếu chọn lớp 12 */}
                    {isGrade12 && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                            <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                                <AlertTriangle size={16} />
                                <span>Lớp 12 chưa hỗ trợ do chưa có SGK trong thư viện.</span>
                            </p>
                        </div>
                    )}

                    {/* Loại đề */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Loại kiểm tra
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, examType: 'midterm' }))}
                                className={`p-4 rounded-xl text-center transition-all border-2 ${formData.examType === 'midterm'
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-slate-200 dark:border-slate-700'
                                    }`}
                            >
                                <p className="font-semibold">📋 Giữa kỳ</p>
                                <p className="text-xs text-slate-500 mt-1">Nửa đầu học kỳ</p>
                            </button>
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, examType: 'final' }))}
                                className={`p-4 rounded-xl text-center transition-all border-2 ${formData.examType === 'final'
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-slate-200 dark:border-slate-700'
                                    }`}
                            >
                                <p className="font-semibold">📝 Cuối kỳ</p>
                                <p className="text-xs text-slate-500 mt-1">Toàn bộ học kỳ</p>
                            </button>
                        </div>
                    </div>

                    {/* Mục đích đề - MỚI */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Mục đích sử dụng
                        </label>
                        <div className="space-y-2">
                            {(Object.keys(EXAM_PURPOSES) as ExamPurpose[]).map((purpose) => {
                                const info = EXAM_PURPOSES[purpose];
                                return (
                                    <button
                                        key={purpose}
                                        onClick={() => setFormData(prev => ({ ...prev, examPurpose: purpose }))}
                                        className={`w-full p-3 rounded-xl text-left transition-all border-2 ${formData.examPurpose === purpose
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                            }`}
                                    >
                                        <p className="font-semibold text-sm text-slate-900 dark:text-white">
                                            {info.label}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {info.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bộ sách */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Bộ sách
                        </label>
                        <select
                            value={formData.bookPublisher}
                            onChange={(e) => setFormData(prev => ({ ...prev, bookPublisher: e.target.value }))}
                            className="input-field"
                        >
                            <option value="all">Tất cả bộ sách</option>
                            {Object.values(BOOK_PUBLISHERS).map(pub => (
                                <option key={pub} value={pub}>{pub}</option>
                            ))}
                        </select>
                    </div>

                    {/* Cấu trúc đề */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Cấu trúc đề:</p>
                        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            <li>• <strong>28 câu trắc nghiệm</strong> (A, B, C, D)</li>
                            <li>• <strong>2 câu tự luận</strong> (VD + VDC)</li>
                            <li>• Có <strong>đáp án đầy đủ</strong></li>
                        </ul>
                    </div>

                    {/* Custom Prompt */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Tuỳ chỉnh thêm
                            <span className="text-slate-400 font-normal ml-2">(Có thể bỏ qua)</span>
                        </label>
                        <textarea
                            value={formData.customPrompt}
                            onChange={(e) => setFormData(prev => ({ ...prev, customPrompt: e.target.value }))}
                            placeholder="VD: Tập trung vào chương 1-3..."
                            rows={2}
                            className="input-field resize-none"
                        />
                    </div>

                    {/* Generate button */}
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || isGrade12}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                Đang tạo...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Tạo Đề Kiểm Tra
                            </>
                        )}
                    </button>
                </div>

                {/* Result */}
                <div className="lg:col-span-2 glass-panel p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                            Đề Kiểm Tra {formData.examType === 'midterm' ? 'Giữa Kỳ' : 'Cuối Kỳ'} Lớp {formData.grade}
                        </h3>
                        {result && (
                            <button className="btn-secondary py-2 px-4 flex items-center gap-2 text-sm">
                                <Download size={16} />
                                Tải PDF
                            </button>
                        )}
                    </div>

                    {result ? (
                        <pre className="whitespace-pre-wrap text-sm bg-slate-50 dark:bg-slate-900 p-4 rounded-xl overflow-auto max-h-[600px]">
                            {result}
                        </pre>
                    ) : (
                        <div className="h-96 flex flex-col items-center justify-center text-slate-400">
                            <GraduationCap size={48} className="mb-4 opacity-50" />
                            <p>Đề kiểm tra sẽ hiển thị ở đây</p>
                            <p className="text-sm mt-2">28 câu TN + 2 câu tự luận + đáp án</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
