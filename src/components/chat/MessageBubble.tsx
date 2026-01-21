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
            className={isSpeaking ? 'lms-icon-button is-accent' : 'lms-icon-button'}
            title={isSpeaking ? "Dung doc" : "Doc to"}
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
            <div
                className="lms-alert"
                style={{ background: '#fbeceb', color: 'var(--lms-danger)', borderColor: 'rgba(217, 48, 37, 0.3)' }}
            >
                <p>{error}</p>
                <pre className="lms-code-pre">{code}</pre>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="lms-card"
            style={{ marginTop: 12, marginBottom: 12, padding: 12, overflowX: 'auto' }}
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
                className="lms-code-inline"
                {...props}
            >
                {children}
            </code>
        );
    }

    return (
        <div className="lms-code-block">
            {language && (
                <div className="lms-code-header">
                    {language}
                </div>
            )}
            <pre className="lms-code-pre">
                <code {...props}>
                    {children}
                </code>
            </pre>
        </div>
    );
}

// Chú thích: Custom components cho markdown elements
const markdownComponents = {
    code: CodeBlock,
    a: ({ href, children }: any) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className="lms-link">
            {children}
        </a>
    ),
    table: ({ children }: any) => (
        <div style={{ overflowX: 'auto' }}>
            <table>{children}</table>
        </div>
    ),
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
        <div className={`lms-message ${isUser ? 'is-user' : ''}`}>
            <div className={`lms-message-avatar ${isUser ? '' : 'is-assistant'}`}>
                {isUser ? <User size={16} /> : <Sparkles size={16} />}
            </div>

            <div className="lms-message-body" style={{ textAlign: isUser ? 'right' : 'left' }}>
                <div className={`lms-message-bubble ${isUser ? 'is-user' : 'is-assistant'}`}>
                    {isUser ? (
                        <div style={{ whiteSpace: 'pre-wrap' }}>
                            {message.content}
                        </div>
                    ) : (
                        <div className="lms-markdown">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={markdownComponents}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    )}

                    {message.attachments && message.attachments.length > 0 && (
                        <div className="lms-row" style={{ marginTop: 8 }}>
                            {message.attachments.map((file, idx) => (
                                <span key={idx} className="lms-badge">
                                    File: {file.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {!isUser && message.sourceChunks && message.sourceChunks.length > 0 && (
                    <div className="lms-message-sources">
                        <div className="lms-row" style={{ gap: 6, marginBottom: 6 }}>
                            <BookOpen size={12} />
                            <span className="lms-note">Nguon tham khao</span>
                        </div>
                        <div className="lms-section" style={{ gap: 6 }}>
                            {message.sourceChunks.slice(0, 3).map((chunk, idx) => (
                                <a
                                    key={idx}
                                    href={chunk.document.fileUrl || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="lms-link"
                                >
                                    <span>[{idx + 1}] {chunk.document.title}</span>
                                    <ExternalLink size={12} />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {!isUser && (
                    <div className="lms-message-meta">
                        <SpeakerButton text={message.content} />

                        {feedbackSent ? (
                            <span className="lms-note">
                                {feedbackSent === 'helpful' ? 'Cam on phan hoi!' : 'Da ghi nhan'}
                            </span>
                        ) : (
                            <>
                                <button
                                    onClick={() => sendFeedback(true)}
                                    className="lms-icon-button"
                                    title="Huu ich"
                                >
                                    <ThumbsUp size={14} />
                                </button>
                                <button
                                    onClick={() => sendFeedback(false)}
                                    className="lms-icon-button"
                                    title="Chua huu ich"
                                >
                                    <ThumbsDown size={14} />
                                </button>
                            </>
                        )}
                        <span className="lms-meta-spacer" />
                        <span>
                            {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                )}

                {isUser && (
                    <p className="lms-note" style={{ marginTop: 6 }}>
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

