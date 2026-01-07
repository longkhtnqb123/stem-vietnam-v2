// Chú thích: Form tạo đề thi THPT Quốc gia (28 câu)
// Format: 24 trắc nghiệm + 4 Đúng/Sai (theo cấu trúc 2025-2026)
// Lưu ý: Đề THPT tập trung vào lớp 12, nhưng hiện chưa có SGK lớp 12
import { useState } from 'react';
// import { useNavigate } from 'react-router-dom'; // TODO: Uncomment khi cần redirect
import { ClipboardList, Sparkles, BookOpen, AlertTriangle, Info, FileText, FileDown, History, Archive } from 'lucide-react';
import { generateExamWithRAG } from '../../lib/rag/generator';
import { createExam, getExams, getExam, type ExamHistoryItem } from '../../lib/examApi';
import { useAuthStore } from '../../lib/auth';
import { EXAM_GENERATOR_PROMPT } from '../../lib/prompts';
import { BOOK_PUBLISHERS } from '../../data/library/defaultBooks';
import { exportExamToWord } from '../../lib/exam-export';
import type { RetrievedChunk } from '../../types';
import RichTextEditor from '../common/RichTextEditor';

// Chú thích: Các loại đề thi THPT
const EXAM_PURPOSES = {
    practice: {
        label: '📖 Ôn tập cơ bản',
        description: 'Ôn kiến thức, không quá khó',
        sgkRatio: 95,
        note: 'Tập trung SGK, ít Chuyên đề',
    },
    mock: {
        label: '📝 Thi thử THPT',
        description: 'Theo cấu trúc đề minh họa Bộ GD&ĐT 2026',
        sgkRatio: 80,
        note: 'SGK là trọng tâm, Chuyên đề cho câu VDC',
    },
    advanced: {
        label: '🏆 Đề phân loại / HSG',
        description: 'Nhiều câu Vận dụng cao từ Chuyên đề',
        sgkRatio: 60,
        note: '40% câu hỏi từ Chuyên đề để phân loại',
    },
} as const;

type ExamPurpose = keyof typeof EXAM_PURPOSES;

// Chú thích: Mức độ khó
const DIFFICULTY_LEVELS = {
    easy: { label: '🟢 Dễ', distribution: '10 Nhớ, 10 Hiểu, 6 VD, 2 VDC' },
    medium: { label: '🟡 Chuẩn', distribution: '8 Nhớ, 8 Hiểu, 8 VD, 4 VDC' },
    hard: { label: '🔴 Khó', distribution: '6 Nhớ, 6 Hiểu, 10 VD, 6 VDC' },
} as const;

type DifficultyLevel = keyof typeof DIFFICULTY_LEVELS;

export default function ExamFormPage() {
    // const navigate = useNavigate(); // TODO: Dùng khi cần redirect
    const [formData, setFormData] = useState({
        subject: 'cong_nghiep' as 'cong_nghiep' | 'nong_nghiep',
        examPurpose: 'mock' as ExamPurpose,
        difficulty: 'medium' as DifficultyLevel,
        bookPublisher: 'all' as 'all' | string,
        customPrompt: '',
    });
    const { token } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [_error, setError] = useState<string | null>(null); // Prefix _ để suppress warning
    const [result, setResult] = useState<string>(''); // This will hold the generated exam text
    const [editedContent, setEditedContent] = useState<string>('');
    // const [isEditing, setIsEditing] = useState(false); // TODO: Dùng khi implement edit mode
    const [sources, setSources] = useState<RetrievedChunk[]>([]);

    // History State
    const [showHistory, setShowHistory] = useState(false);
    const [historyList, setHistoryList] = useState<ExamHistoryItem[]>([]);
    // const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile history? No, modal.

    // Chú thích: Khi có kết quả mới, sync với editedContent
    const handleResultChange = (newResult: string) => {
        setResult(newResult);
        setEditedContent(newResult);
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setResult('');
        setError(null);
        setEditedContent(''); // Clear edited content on new generation

        try {
            const purposeInfo = EXAM_PURPOSES[formData.examPurpose];
            const difficultyInfo = DIFFICULTY_LEVELS[formData.difficulty];

            // Chú thích: Build prompt với logic SGK + Chuyên đề
            const structurePrompt = `
Cấu trúc đề THPT Quốc gia 2026:
- Phần I: 24 câu trắc nghiệm nhiều lựa chọn(4 phương án, 1 đúng)
    - Phần II: 4 câu Đúng / Sai(mỗi câu có 4 ý a, b, c, d)
        - Phân bố mức độ: ${difficultyInfo.distribution}

QUAN TRỌNG - Phân bổ nguồn kiến thức:
- ${purposeInfo.sgkRatio}% câu hỏi từ SGK(nội dung cốt lõi Công nghệ ${formData.subject === 'cong_nghiep' ? 'Công nghiệp' : 'Nông nghiệp'})
    - ${100 - purposeInfo.sgkRatio}% câu hỏi từ Chuyên đề học tập
${formData.examPurpose === 'mock'
                    ? '- Các câu Đúng/Sai và VDC có thể lồng ghép kiến thức từ cả SGK và Chuyên đề để phân loại học sinh'
                    : ''
                }
${formData.examPurpose === 'advanced'
                    ? '- Câu VDC BẮT BUỘC lấy từ Chuyên đề (dự án, vi điều khiển, công nghệ cao...)'
                    : ''
                }

PHẢI có ĐÁP ÁN đầy đủ ở cuối đề.
`;

            const bookPrompt = formData.bookPublisher !== 'all'
                ? `Ưu tiên nội dung từ bộ sách ${formData.bookPublisher} `
                : '';

            const fullCustomPrompt = [
                structurePrompt,
                bookPrompt,
                formData.customPrompt,
            ].filter(Boolean).join('\n');

            const response = await generateExamWithRAG({
                subject: formData.subject,
                systemPrompt: EXAM_GENERATOR_PROMPT,
                customPrompt: fullCustomPrompt || undefined,
            });

            handleResultChange(response.text);
            setSources(response.sourceChunks || []);

            // Chú thích: Save to history if logged in
            if (token && response.text) {
                createExam(token, {
                    topic: `Đề thi ${formData.subject === 'cong_nghiep' ? 'Công nghiệp' : 'Nông nghiệp'} - ${EXAM_PURPOSES[formData.examPurpose].label}`,
                    config: formData,
                    content: response.text,
                }).catch(e => console.error('Failed to save exam history', e));
            }
        } catch (err) {
            console.error('[exam-form] generate error:', err);
            setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo đề. Vui lòng thử lại.');
            // Keep previous content if failed
        } finally {
            setIsLoading(false);
        }
    };



    const loadHistory = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const list = await getExams(token);
            setHistoryList(list);
            setShowHistory(true);
        } catch (e) {
            console.error('Failed to load exam history', e);
            setError('Không thể tải lịch sử đề thi.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectHistory = async (id: string) => {
        if (!token) return;
        setIsLoading(true);
        try {
            const detail = await getExam(id, token);
            if (detail) {
                handleResultChange(detail.content);
                setSources([]); // History doesn't save sources yet, clear for now.
                setFormData(detail.config || formData);
                setShowHistory(false);
            }
        } catch (e) {
            console.error('Failed to load exam from history', e);
            setError('Không thể tải đề thi từ lịch sử.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <History className="text-primary-500" />
                                Lịch sử đề thi
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                                <Archive size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {historyList.length === 0 ? (
                                <p className="text-center text-slate-500 p-4">Chưa có đề thi nào được lưu.</p>
                            ) : (
                                historyList.map(item => (
                                    <div key={item.id}
                                        onClick={() => handleSelectHistory(item.id)}
                                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                                    >
                                        <div className="font-medium truncate">{item.topic}</div>
                                        <div className="text-xs text-slate-500 flex justify-between mt-1">
                                            <span>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                                            {item.config?.difficulty && (
                                                <span className={`px - 1.5 py - 0.5 rounded text - [10px] ${item.config.difficulty === 'hard' ? 'bg-red-100 text-red-600' :
                                                    item.config.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                                        'bg-green-100 text-green-600'
                                                    } `}>
                                                    {item.config.difficulty === 'hard' ? 'Khó' : item.config.difficulty === 'medium' ? 'Vừa' : 'Dễ'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ClipboardList className="text-primary-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Tạo Đề Thi THPT Quốc Gia 2026
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            28 câu hỏi (24 trắc nghiệm + 4 Đúng/Sai) • Theo cấu trúc mới nhất
                        </p>
                    </div>
                </div>
                {token && (
                    <button
                        onClick={loadHistory}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        <History size={16} />
                        Lịch sử
                    </button>
                )}
            </div>

            {/* Warning - Chưa có SGK lớp 12 */}
            <div className="glass-card p-3 mb-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <span><strong>Lưu ý:</strong> Đề THPT tập trung lớp 12, nhưng hiện chỉ có SGK lớp 10-11. AI sẽ tạo dựa trên kiến thức hiện có.</span>
                </p>
            </div>

            {/* RAG notice */}
            <div className="glass-card p-3 mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                    <BookOpen size={16} />
                    <span><strong>RAG:</strong> AI sử dụng SGK + Chuyên đề trong Thư viện</span>
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="glass-panel p-6 space-y-5">
                    {/* Chọn môn */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Định hướng
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, subject: 'cong_nghiep' }))}
                                className={`p - 3 rounded - xl text - center transition - all border - 2 ${formData.subject === 'cong_nghiep'
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-slate-200 dark:border-slate-700'
                                    } `}
                            >
                                <p className="font-semibold text-sm">🏭 Công nghiệp</p>
                                <p className="text-xs text-slate-500">Cơ khí, Điện, Ô tô...</p>
                            </button>
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, subject: 'nong_nghiep' }))}
                                className={`p - 3 rounded - xl text - center transition - all border - 2 ${formData.subject === 'nong_nghiep'
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-slate-200 dark:border-slate-700'
                                    } `}
                            >
                                <p className="font-semibold text-sm">🌾 Nông nghiệp</p>
                                <p className="text-xs text-slate-500">Trồng trọt, Chăn nuôi...</p>
                            </button>
                        </div>
                    </div>

                    {/* Loại đề - MỚI */}
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
                                        className={`w - full p - 3 rounded - xl text - left transition - all border - 2 ${formData.examPurpose === purpose
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                            } `}
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

                    {/* Mức độ khó */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Mức độ khó
                        </label>
                        <div className="flex gap-2">
                            {(Object.keys(DIFFICULTY_LEVELS) as DifficultyLevel[]).map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setFormData(prev => ({ ...prev, difficulty: level }))}
                                    className={`flex - 1 py - 2.5 px - 3 rounded - xl text - sm font - medium transition - all ${formData.difficulty === level
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                        } `}
                                >
                                    {DIFFICULTY_LEVELS[level].label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bộ sách */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Ưu tiên bộ sách
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

                    {/* Info box */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                            <Info size={14} className="mt-0.5 shrink-0" />
                            <span>
                                <strong>Tỷ lệ SGK/Chuyên đề:</strong> {EXAM_PURPOSES[formData.examPurpose].note}
                            </span>
                        </p>
                    </div>

                    {/* Custom Prompt */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Tuỳ chỉnh thêm
                        </label>
                        <textarea
                            value={formData.customPrompt}
                            onChange={(e) => setFormData(prev => ({ ...prev, customPrompt: e.target.value }))}
                            placeholder="VD: Tập trung vào chương mạng điện gia đình..."
                            rows={2}
                            className="input-field resize-none"
                        />
                    </div>

                    {/* Generate button */}
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                Đang tạo đề...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Tạo Đề Thi
                            </>
                        )}
                    </button>
                </div>

                {/* Result */}
                <div className="lg:col-span-2 glass-panel p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                            Đề Thi THPT - {formData.subject === 'cong_nghiep' ? 'Công nghiệp' : 'Nông nghiệp'}
                        </h3>
                        {result && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">
                                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <FileText className="text-blue-500" />
                                        Nội dung đề thi
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => exportExamToWord(editedContent, formData.subject)}
                                            disabled={!editedContent}
                                            className="btn btn-primary text-sm py-1.5 px-3 flex items-center gap-2"
                                            title="Xuất file Word"
                                        >
                                            <FileDown size={16} />
                                            Xuất Word
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 p-0 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
                                    <RichTextEditor
                                        value={editedContent}
                                        onChange={setEditedContent}
                                        className="border-0 shadow-none rounded-none h-full"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {result ? (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <FileText className="text-blue-500" />
                                    Nội dung đề thi
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => exportExamToWord(editedContent, formData.subject)}
                                        disabled={!editedContent}
                                        className="btn btn-primary text-sm py-1.5 px-3 flex items-center gap-2"
                                        title="Xuất file Word"
                                    >
                                        <FileDown size={16} />
                                        Xuất Word
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 p-0 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
                                <RichTextEditor
                                    value={editedContent}
                                    onChange={setEditedContent}
                                    className="border-0 shadow-none rounded-none h-full"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="h-96 flex flex-col items-center justify-center text-slate-400">
                            <ClipboardList size={48} className="mb-4 opacity-50" />
                            <p>Đề thi sẽ hiển thị ở đây</p>
                            <p className="text-sm mt-2">24 câu TN + 4 câu Đ/S + đáp án</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sources - Nguồn tham khảo */}
            {sources.length > 0 && (
                <div className="lg:col-span-3 glass-panel p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <BookOpen size={20} className="text-primary-500" />
                        Nguồn tham khảo ({sources.length} tài liệu)
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {sources.map((source, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="flex items-start gap-2">
                                    <FileText size={16} className="text-primary-500 mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                                            {source.document.title}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Lớp {source.document.grade} • Đoạn {source.chunk.chunkIndex + 1}
                                        </p>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                                            {source.chunk.content.slice(0, 100)}...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
