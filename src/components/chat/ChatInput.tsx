// Add global declaration for SpeechRecognition
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Paperclip, X, Image, FileText, Film, Music, File, Mic, MicOff } from 'lucide-react';
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
        case 'image': return <Image size={16} className="lms-file-icon is-image" />;
        case 'video': return <Film size={16} className="lms-file-icon is-video" />;
        case 'audio': return <Music size={16} className="lms-file-icon is-audio" />;
        case 'document': return <FileText size={16} className="lms-file-icon is-document" />;
        default: return <File size={16} className="lms-file-icon is-other" />;
    }
}

export default function ChatInput({ onSend, isLoading, placeholder = "Nhap tin nhan..." }: ChatInputProps) {
    const [input, setInput] = useState('');
    const [files, setFiles] = useState<FileAttachment[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);

    // Chú thích: Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'vi-VN';

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    setInput(prev => {
                        const spacer = prev && !prev.endsWith(' ') ? ' ' : '';
                        return prev + spacer + finalTranscript;
                    });
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                // Auto-restart if still listening (optional, but good for long dictation)
                // For now, we just stop state
                if (isListening) {
                    // request restart? 
                    // for UX, usually better to let user manually toggle unless specifically "always listening"
                    setIsListening(false);
                }
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Web Speech API). Vui lòng dùng Chrome/Edge.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

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

        // Stop listening if sending
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }

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
            className="lms-section"
            style={{ position: 'relative' }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {files.length > 0 && (
                <div className="lms-attachments">
                    {files.map(file => (
                        <div
                            key={file.id}
                            className="lms-attachment"
                        >
                            {file.preview ? (
                                <img src={file.preview} alt="" />
                            ) : (
                                <FileIcon type={file.type} />
                            )}
                            <span className="lms-note" style={{ maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {file.file.name}
                            </span>
                            <button
                                onClick={() => removeFile(file.id)}
                                className="lms-icon-button is-danger"
                                aria-label="Remove file"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className={`lms-chat-input-box ${isDragging ? 'is-dragging' : ''}`}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFiles(e.target.files)}
                    style={{ display: 'none' }}
                    multiple
                    accept="*/*"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="lms-icon-button"
                    title="Dinh kem file"
                >
                    <Paperclip size={18} />
                </button>

                <button
                    onClick={toggleListening}
                    className={`lms-icon-button ${isListening ? 'is-active' : ''}`}
                    title={isListening ? 'Dung ghi am' : 'Nhap bang giong noi'}
                >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

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
                    placeholder={isListening ? 'Dang nghe ban noi...' : placeholder}
                    rows={1}
                    className="lms-chat-textarea"
                    disabled={isLoading}
                />

                <button
                    onClick={handleSubmit}
                    disabled={(!input.trim() && files.length === 0) || isLoading}
                    className="lms-icon-button is-primary"
                    aria-label="Send"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}

