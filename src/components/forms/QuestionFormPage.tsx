// Chú thích: Form tạo câu hỏi trắc nghiệm với RAG
import { useState } from 'react';
import { FileQuestion, Sparkles, Copy } from 'lucide-react';
import { generateQuestionsWithRAG } from '../../lib/rag/generator';
import { QUESTION_GENERATOR_PROMPT } from '../../lib/prompts';

export default function QuestionFormPage() {
    const [formData, setFormData] = useState({
        topic: '',
        grade: '12' as '10' | '11' | '12',
        difficulty: 'understand' as 'remember' | 'understand' | 'apply' | 'analyze',
        count: 5,
        customPrompt: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string>('');

    const handleGenerate = async () => {
        if (!formData.topic.trim()) return;

        setIsLoading(true);
        setResult('');

        try {
            const response = await generateQuestionsWithRAG({
                topic: formData.topic,
                grade: formData.grade,
                difficulty: formData.difficulty,
                count: formData.count,
                systemPrompt: QUESTION_GENERATOR_PROMPT,
                customPrompt: formData.customPrompt || undefined,
            });

            setResult(response.text);
        } catch (error) {
            console.error('[question-form] error:', error);
            setResult('Đã có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const difficultyLabels = {
        remember: 'Nhớ (Dễ)',
        understand: 'Hiểu (TB)',
        apply: 'Vận dụng (Khá)',
        analyze: 'VD Cao (Khó)',
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <FileQuestion className="text-primary-500" />
                    Tạo Câu Hỏi Trắc Nghiệm
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    AI sẽ tạo câu hỏi dựa trên nội dung SGK trong thư viện
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="glass-panel p-6 space-y-5">
                    {/* Chủ đề */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Chủ đề *
                        </label>
                        <input
                            type="text"
                            value={formData.topic}
                            onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                            placeholder="VD: Mạng máy tính, Ô tô, Động cơ đốt trong..."
                            className="input-field"
                        />
                    </div>

                    {/* Lớp */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Lớp
                        </label>
                        <div className="flex gap-2">
                            {(['10', '11', '12'] as const).map((grade) => (
                                <button
                                    key={grade}
                                    onClick={() => setFormData(prev => ({ ...prev, grade }))}
                                    className={`flex-1 py-2 rounded-lg font-medium transition-all ${formData.grade === grade
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    Lớp {grade}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mức độ */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Mức độ nhận thức
                        </label>
                        <select
                            value={formData.difficulty}
                            onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                            className="input-field"
                        >
                            {Object.entries(difficultyLabels).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Số lượng */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Số lượng câu hỏi: {formData.count}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={formData.count}
                            onChange={(e) => setFormData(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                            className="w-full"
                        />
                    </div>

                    {/* Custom Prompt */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Tuỳ chỉnh AI
                            <span className="text-slate-400 font-normal ml-2">(Có thể bỏ qua)</span>
                        </label>
                        <textarea
                            value={formData.customPrompt}
                            onChange={(e) => setFormData(prev => ({ ...prev, customPrompt: e.target.value }))}
                            placeholder="VD: Tập trung vào phần lý thuyết, không hỏi về công thức tính toán..."
                            rows={3}
                            className="input-field resize-none"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            💡 Để trống = AI tự động tối ưu dựa trên tài liệu
                        </p>
                    </div>

                    {/* Generate button */}
                    <button
                        onClick={handleGenerate}
                        disabled={!formData.topic.trim() || isLoading}
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
                                Tạo Câu Hỏi
                            </>
                        )}
                    </button>
                </div>

                {/* Result */}
                <div className="glass-panel p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                        Kết quả
                    </h3>

                    {result ? (
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap text-sm bg-slate-50 dark:bg-slate-900 p-4 rounded-xl overflow-auto max-h-[500px]">
                                {result}
                            </pre>
                            <button className="btn-secondary mt-4 flex items-center gap-2">
                                <Copy size={16} />
                                Sao chép
                            </button>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-slate-400">
                            <p>Kết quả sẽ hiển thị ở đây</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
