// Chú thích: Chat Input với File Upload - Hỗ trợ mọi file, không giới hạn
import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, X, Image, FileText, Film, Music, File } from 'lucide-react';
import type { FileAttachment } from '../../types/chat';

interface ChatInputProps {
    onSend: (message: string, files: FileAttachment[]) => void;
    isLoading: boolean;
    placeholder?: string;
}

// Chú thích: Hàm phân loại file type
function getFileType(file: File): FileAttachment['type'] {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) return 'document';
    return 'other';
}

// Chú thích: Icon theo file type
function FileIcon({ type }: { type: FileAttachment['type'] }) {
    switch (type) {
        case 'image': return <Image size={16} className="text-green-500" />;
        case 'video': return <Film size={16} className="text-purple-500" />;
        case 'audio': return <Music size={16} className="text-pink-500" />;
        case 'document': return <FileText size={16} className="text-blue-500" />;
        default: return <File size={16} className="text-slate-400" />;
    }
}

export default function ChatInput({ onSend, isLoading, placeholder = "Nhập tin nhắn..." }: ChatInputProps) {
    const [input, setInput] = useState('');
    const [files, setFiles] = useState<FileAttachment[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Chú thích: Xử lý file selection
    const handleFiles = useCallback((selectedFiles: FileList | null) => {
        if (!selectedFiles) return;

        const newFiles: FileAttachment[] = Array.from(selectedFiles).map(file => {
            const attachment: FileAttachment = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                file,
                type: getFileType(file),
            };

            // Chú thích: Tạo preview cho images
            if (attachment.type === 'image') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setFiles(prev => prev.map(f =>
                        f.id === attachment.id ? { ...f, preview: e.target?.result as string } : f
                    ));
                };
                reader.readAsDataURL(file);
            }

            return attachment;
        });

        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    // Chú thích: Drag & Drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    // Chú thích: Remove file
    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    // Chú thích: Submit
    const handleSubmit = () => {
        if ((!input.trim() && files.length === 0) || isLoading) return;
        onSend(input.trim(), files);
        setInput('');
        setFiles([]);
    };

    // Chú thích: Auto-resize textarea
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    };

    return (
        <div
            className={`relative transition-all ${isDragging ? 'ring-2 ring-primary-500 ring-offset-2 rounded-2xl' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* File Previews */}
            {files.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    {files.map(file => (
                        <div
                            key={file.id}
                            className="relative group flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm"
                        >
                            {file.preview ? (
                                <img src={file.preview} alt="" className="w-8 h-8 rounded object-cover" />
                            ) : (
                                <FileIcon type={file.type} />
                            )}
                            <span className="text-sm text-slate-700 dark:text-slate-300 max-w-[150px] truncate">
                                {file.file.name}
                            </span>
                            <button
                                onClick={() => removeFile(file.id)}
                                className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="flex items-end gap-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-2 shadow-lg">
                {/* File Upload Button */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                    multiple
                    accept="*/*"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all"
                    title="Đính kèm file"
                >
                    <Paperclip size={20} />
                </button>

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                    placeholder={placeholder}
                    rows={1}
                    className="flex-1 resize-none bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 py-3 px-2 max-h-[200px]"
                    disabled={isLoading}
                />

                {/* Send Button */}
                <button
                    onClick={handleSubmit}
                    disabled={(!input.trim() && files.length === 0) || isLoading}
                    className="p-3 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                    <Send size={20} />
                </button>
            </div>

            {/* Drag Overlay */}
            {isDragging && (
                <div className="absolute inset-0 bg-primary-500/10 rounded-2xl flex items-center justify-center border-2 border-dashed border-primary-500">
                    <p className="text-primary-600 dark:text-primary-400 font-medium">
                        Thả file vào đây
                    </p>
                </div>
            )}
        </div>
    );
}
