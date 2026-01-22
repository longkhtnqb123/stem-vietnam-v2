// Add global declaration for SpeechRecognition
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

import { useState, useRef, useCallback, useEffect } from 'react';
import type { FileAttachment } from '../../types/chat';

interface ChatInputProps {
    onSend: (message: string, files: FileAttachment[]) => void;
    isLoading: boolean;
    placeholder?: string;
}

function getFileType(file: File): FileAttachment['type'] {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) return 'document';
    return 'other';
}

function FileTag({ type }: { type: FileAttachment['type'] }) {
    const labelMap: Record<FileAttachment['type'], string> = {
        image: 'IMG',
        video: 'VID',
        audio: 'AUD',
        document: 'DOC',
        other: 'FILE',
    };

    return <span className={`lms-file-tag is-${type}`}>{labelMap[type]}</span>;
}

export default function ChatInput({ onSend, isLoading, placeholder = "Nhap tin nhan..." }: ChatInputProps) {
    const [input, setInput] = useState('');
    const [files, setFiles] = useState<FileAttachment[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);

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
                if (isListening) {
                    setIsListening(false);
                }
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Trinh duyet cua ban khong ho tro nhan dien giong noi. Vui long dung Chrome/Edge.');
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

    const handleFiles = useCallback((selectedFiles: FileList | null) => {
        if (!selectedFiles) return;

        const newFiles: FileAttachment[] = Array.from(selectedFiles).map(file => {
            const attachment: FileAttachment = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                file,
                type: getFileType(file),
            };

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

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleSubmit = () => {
        if ((!input.trim() && files.length === 0) || isLoading) return;

        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }

        onSend(input.trim(), files);
        setInput('');
        setFiles([]);
    };

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
                                <FileTag type={file.type} />
                            )}
                            <span className="lms-note" style={{ maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {file.file.name}
                            </span>
                            <button
                                onClick={() => removeFile(file.id)}
                                className="lms-text-button"
                                aria-label="Remove file"
                            >
                                X
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
                    className="lms-text-button"
                    title="Dinh kem file"
                >
                    File
                </button>

                <button
                    onClick={toggleListening}
                    className={`lms-text-button ${isListening ? 'is-active' : ''}`}
                    title={isListening ? 'Dung ghi am' : 'Nhap bang giong noi'}
                >
                    {isListening ? 'Dung' : 'Mic'}
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
                    className="lms-text-button is-primary"
                    aria-label="Send"
                >
                    Gui
                </button>
            </div>
        </div>
    );
}
