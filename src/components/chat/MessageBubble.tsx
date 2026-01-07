// Chú thích: Message Bubble Component - Hiển thị tin nhắn với Markdown + LaTeX + Mermaid
import { useState, useEffect, useRef } from 'react';
import { User, Sparkles, BookOpen, ExternalLink, ThumbsUp, ThumbsDown, Volume2, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import mermaid from 'mermaid';
import type { ChatMessage } from '../../types';
import 'katex/dist/katex.min.css';

interface MessageBubbleProps {
    message: ChatMessage;
}

// Chú thích: TTS Component
function SpeakerButton({ text }: { text: string }) {
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const speak = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        // Clean text for speech (remove markdown symbols roughly)
        const cleanText = text
            .replace(/[*_#`[\]()]/g, '') // remove common markdown chars
            .replace(/https?:\/\/\S+/g, 'liên kết') // replace links
            .substring(0, 1000); // Limit length for stability

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'vi-VN';
        utterance.rate = 1.0;

        // Try to find a Vietnamese voice
        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find(v => v.lang.includes('vi'));
        if (viVoice) utterance.voice = viVoice;

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    return (
        <button
            onClick={speak}
            className={`p-1 rounded transition-colors ${isSpeaking
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                }`}
            title={isSpeaking ? "Dừng đọc" : "Đọc to"}
        >
            {isSpeaking ? <Square size={14} fill="currentColor" /> : <Volume2 size={14} />}
        </button>
    );
}

// Chú thích: Init mermaid với theme phù hợp
mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'loose',
    fontFamily: 'inherit',
});

// Chú thích: Component để render Mermaid diagram
function MermaidDiagram({ code }: { code: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const renderDiagram = async () => {
            try {
                // Chú thích: Render mermaid syntax thành SVG
                const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                const { svg } = await mermaid.render(id, code.trim());
                setSvg(svg);
                setError('');
            } catch (err) {
                console.error('[mermaid] render error:', err);
                setError('Không thể render sơ đồ');
            }
        };
        renderDiagram();
    }, [code]);

    if (error) {
        return (
            <div className="my-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <pre className="mt-2 text-xs text-slate-600 dark:text-slate-400 overflow-x-auto">{code}</pre>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="my-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto flex justify-center"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}

// Chú thích: Custom code block với style đẹp hơn + Mermaid support
function CodeBlock({ inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const codeString = String(children).replace(/\n$/, '');

    // Chú thích: Nếu là mermaid, render diagram
    if (language === 'mermaid') {
        return <MermaidDiagram code={codeString} />;
    }

    if (inline) {
        return (
            <code
                className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-pink-600 dark:text-pink-400 text-sm font-mono"
                {...props}
            >
                {children}
            </code>
        );
    }

    return (
        <div className="my-2 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            {language && (
                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {language}
                </div>
            )}
            <pre className="p-3 bg-slate-50 dark:bg-slate-800 overflow-x-auto">
                <code className="text-sm font-mono text-slate-800 dark:text-slate-200" {...props}>
                    {children}
                </code>
            </pre>
        </div>
    );
}

// Chú thích: Custom components cho markdown elements
const markdownComponents = {
    code: CodeBlock,
    // Chú thích: Style cho các heading
    h1: ({ children }: any) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-base font-semibold mt-2 mb-1">{children}</h3>,
    // Chú thích: Style cho list
    ul: ({ children }: any) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
    li: ({ children }: any) => <li className="ml-2">{children}</li>,
    // Chú thích: Style cho blockquote
    blockquote: ({ children }: any) => (
        <blockquote className="border-l-4 border-primary-500 pl-3 my-2 italic text-slate-600 dark:text-slate-400">
            {children}
        </blockquote>
    ),
    // Chú thích: Style cho links
    a: ({ href, children }: any) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
            {children}
        </a>
    ),
    // Chú thích: Style cho table
    table: ({ children }: any) => (
        <div className="overflow-x-auto my-2">
            <table className="min-w-full border border-slate-200 dark:border-slate-700 rounded">
                {children}
            </table>
        </div>
    ),
    th: ({ children }: any) => <th className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-left font-semibold border-b">{children}</th>,
    td: ({ children }: any) => <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">{children}</td>,
    // Chú thích: Style cho strong/bold
    strong: ({ children }: any) => <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>,
    // Chú thích: Style cho paragraph - giảm spacing
    p: ({ children }: any) => <p className="my-1.5">{children}</p>,
};

export default function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === 'user';
    const [feedbackSent, setFeedbackSent] = useState<'helpful' | 'not_helpful' | null>(null);

    // Chú thích: Gửi feedback lên API
    const sendFeedback = async (helpful: boolean) => {
        try {
            const apiUrl = (import.meta.env.VITE_API_URL || 'https://stem-vietnam-api.stu725114073.workers.dev').replace(/\/$/, '');
            await fetch(`${apiUrl}/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messageId: message.id,
                    helpful,
                    aiResponse: message.content.slice(0, 500), // Lưu 500 ký tự đầu
                }),
            });
            setFeedbackSent(helpful ? 'helpful' : 'not_helpful');
        } catch (error) {
            console.error('[feedback] error:', error);
        }
    };

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser
                ? 'bg-primary-500 text-white'
                : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                }`}>
                {isUser ? <User size={16} /> : <Sparkles size={16} />}
            </div>

            {/* Content */}
            <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
                <div className={`inline-block rounded-2xl px-4 py-3 ${isUser
                    ? 'bg-primary-500 text-white rounded-tr-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-sm shadow-sm'
                    }`}>
                    {/* Chú thích: Render với Markdown + LaTeX, user message thì giữ đơn giản */}
                    {isUser ? (
                        <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                            {message.content}
                        </div>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-[15px] leading-relaxed">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={markdownComponents}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    )}

                    {/* Attached files (if any) */}
                    {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {message.attachments.map((file, idx) => (
                                <div
                                    key={idx}
                                    className="text-xs px-2 py-1 rounded bg-white/20 dark:bg-black/20"
                                >
                                    📎 {file.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sources - Chỉ hiển thị cho assistant và khi có nguồn */}
                {!isUser && message.sourceChunks && message.sourceChunks.length > 0 && (
                    <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2 font-medium">
                            <BookOpen size={12} />
                            Nguồn tham khảo
                        </p>
                        <div className="space-y-1">
                            {message.sourceChunks.slice(0, 3).map((chunk, idx) => (
                                <a
                                    key={idx}
                                    href={chunk.document.fileUrl || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                                >
                                    <ExternalLink size={10} />
                                    [{idx + 1}] {chunk.document.title}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Feedback Buttons - Chỉ hiển thị cho assistant */}
                {!isUser && (
                    <div className="flex items-center gap-2 mt-2">
                        {/* TTS Button */}
                        <SpeakerButton text={message.content} />

                        {feedbackSent ? (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {feedbackSent === 'helpful' ? '✅ Cảm ơn phản hồi!' : '📝 Đã ghi nhận'}
                            </span>
                        ) : (
                            <>
                                <button
                                    onClick={() => sendFeedback(true)}
                                    className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-slate-400 hover:text-green-600 transition-colors"
                                    title="Hữu ích"
                                >
                                    <ThumbsUp size={14} />
                                </button>
                                <button
                                    onClick={() => sendFeedback(false)}
                                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 transition-colors"
                                    title="Chưa hữu ích"
                                >
                                    <ThumbsDown size={14} />
                                </button>
                            </>
                        )}
                        {/* Timestamp */}
                        <span className="text-[10px] text-slate-400 ml-auto">
                            {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                )}

                {/* Timestamp for user messages */}
                {isUser && (
                    <p className="text-[10px] text-slate-400 mt-1 text-right">
                        {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                )}
            </div>
        </div>
    );
}
