// Chú thích: Chat Page - Gemini-style UI với Sidebar và File Upload
import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, BrainCircuit, Clock, ArrowDown, Cloud, CloudOff, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import ChatSidebar from './ChatSidebar';
import { addMessage } from '../../lib/conversationApi';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
// import { sendChatMessage } from '../../lib/api'; // Comment out unused or remove
import * as conversationApi from '../../lib/conversationApi';
import type { ChatMessage } from '../../types';
import type { Conversation, FileAttachment } from '../../types/chat';
import { useAuthStore } from '../../lib/auth';
import { useSettingsStore } from '../../stores/settingsStore';
import { sendClientSideChat, type ChatMessage as ServiceChatMessage } from '../../lib/chatService';

// Chú thích: LocalStorage key prefix
const STORAGE_PREFIX = 'stem-vietnam-chat-history';

function getStorageKey(userId: string) {
    return `${STORAGE_PREFIX}-${userId}`;
}

// Chú thích: Load conversations từ localStorage theo userId
function loadConversations(userId: string): Conversation[] {
    try {
        const data = localStorage.getItem(getStorageKey(userId));
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

// Chú thích: Save conversations vào localStorage theo userId
function saveConversations(userId: string, conversations: Conversation[]) {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(conversations));
}

// Chú thích: Generate title từ first message
function generateTitle(message: string): string {
    const maxLength = 30;
    const cleaned = message.replace(/\n/g, ' ').trim();
    return cleaned.length > maxLength ? cleaned.slice(0, maxLength) + '...' : cleaned;
}

export default function ChatPage() {
    const { user, token } = useAuthStore();
    const location = useLocation();
    // Chú thích: Đã bỏ useDefaultLibrary - Chat AI không dùng RAG nữa
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [thinkingStep, setThinkingStep] = useState<string>('Đang suy nghĩ...');
    const [isSynced, setIsSynced] = useState(true); // Default synced (local)
    const [suggestions, setSuggestions] = useState<string[]>([]); // Chú thích: Gợi ý câu hỏi tiếp theo
    const [elapsedTime, setElapsedTime] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    // Chú thích: Track vị trí scroll để smart auto-scroll
    const [isNearBottom, setIsNearBottom] = useState(true);
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Chú thích: Load saved conversations on mount or user change - offline-first
    useEffect(() => {
        if (!user?.id) return;

        // Bước 1: Load từ localStorage trước (nhanh)
        const localSaved = loadConversations(user.id);
        setConversations(localSaved);
        if (localSaved.length > 0) {
            setActiveId(localSaved[0].id);
        }

        // Bước 2: Sync từ D1 backend nếu có token
        if (token) {
            syncFromBackend();
        }
    }, [user?.id, token]);


    // Chú thích: Sync từ D1 backend - merge với localStorage
    const syncFromBackend = async () => {
        if (!token || !user?.id) return;

        try {
            console.info('[chat] Syncing from D1...');
            const remoteConvos = await conversationApi.getConversations(token);

            if (remoteConvos.length === 0) {
                // Chú thích: Backend trống, giữ localStorage
                return;
            }

            // Chú thích: Convert API format -> local Conversation format
            const remoteFormatted: Conversation[] = await Promise.all(
                remoteConvos.map(async (c) => {
                    // Lấy messages cho mỗi conversation
                    const detail = await conversationApi.getConversation(c.id, token);
                    const messages: ChatMessage[] = detail?.messages?.map(m => ({
                        id: m.id,
                        role: m.role,
                        content: m.content,
                        timestamp: typeof m.created_at === 'string' ? new Date(m.created_at).getTime() : m.created_at,
                    })) || [];

                    return {
                        id: c.id,
                        title: c.title,
                        messages,
                        createdAt: typeof c.created_at === 'string' ? new Date(c.created_at).getTime() : c.created_at,
                        updatedAt: typeof c.updated_at === 'string' ? new Date(c.updated_at).getTime() : c.updated_at,
                    };
                })
            );

            // Chú thích: Merge - ưu tiên remote nếu có conflicts
            setConversations(remoteFormatted);
            saveConversations(user.id, remoteFormatted); // Update localStorage
            if (remoteFormatted.length > 0 && !activeId) {
                setActiveId(remoteFormatted[0].id);
            }
            console.info('[chat] Sync complete:', remoteFormatted.length, 'conversations');
            setIsSynced(true);
        } catch (error) {
            console.warn('[chat] Sync failed, using localStorage:', error);
            // Offline mode - sử dụng localStorage
            setIsSynced(false);
        }
    };

    // Chú thích: Save whenever conversations change
    useEffect(() => {
        if (user?.id && conversations.length > 0) {
            saveConversations(user.id, conversations);
            if (!token) setIsSynced(false); // No token = local only
        }
    }, [conversations, user?.id, token]);

    // Chú thích: Smart auto-scroll - chỉ scroll khi user đang ở gần cuối
    useEffect(() => {
        if (isNearBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [conversations, isNearBottom]);

    // Chú thích: Scroll xuống cuối khi chuyển conversation
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
        setIsNearBottom(true);
        setShowScrollButton(false);
    }, [activeId]);

    // Chú thích: Xử lý scroll event để detect vị trí
    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        // Chú thích: Coi là "gần cuối" nếu < 150px từ bottom
        const nearBottom = distanceFromBottom < 150;

        setIsNearBottom(nearBottom);
        setShowScrollButton(!nearBottom && distanceFromBottom > 300);
    }, []);

    // Chú thích: Hàm scroll xuống cuối khi click nút
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setShowScrollButton(false);
    }, []);

    // Chú thích: Get active conversation
    const activeConversation = conversations.find(c => c.id === activeId);
    const messages = activeConversation?.messages || [];

    // Chú thích: Create new conversation - sync lên D1 nếu có token
    const handleNewConversation = useCallback(async () => {
        const localId = Date.now().toString();
        let newConv: Conversation = {
            id: localId,
            title: 'Cuộc trò chuyện mới',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        // Chú thích: Thử tạo trên backend trước
        if (token) {
            try {
                const remote = await conversationApi.createConversation(newConv.title, token);
                if (remote) {
                    newConv = { ...newConv, id: remote.id }; // Dùng ID từ backend
                }
            } catch (error) {
                console.warn('[chat] Create remote failed, using local ID');
            }
        }

        setConversations(prev => [newConv, ...prev]);
        setActiveId(newConv.id);
    }, [token]);

    // Chú thích: Delete conversation - sync lên D1 nếu có token
    const handleDeleteConversation = useCallback(async (id: string) => {
        // Xóa trên backend
        if (token) {
            try {
                await conversationApi.deleteConversation(id, token);
            } catch (error) {
                console.warn('[chat] Delete remote failed');
            }
        }

        setConversations(prev => {
            const filtered = prev.filter(c => c.id !== id);
            if (activeId === id && filtered.length > 0) {
                setActiveId(filtered[0].id);
            } else if (filtered.length === 0) {
                setActiveId(null);
            }
            return filtered;
        });
    }, [activeId, token]);

    // Chú thích: Import Settings Store (Moved to top)
    const { provider, apiKey, selectedModel } = useSettingsStore();
    // import { sendClientSideChat ... } removed from here

    // Chú thích: Send message logic updated for Client-side
    const handleSend = async (message: string, files: FileAttachment[], hiddenContext?: string) => {
        if (!message.trim() && files.length === 0) return;

        // Check if settings are configured
        if (!apiKey || !selectedModel || provider === 'default') {
            // Fallback hoặc báo lỗi. 
            // Tạm thời nếu chưa config, báo user vào settings
            // Nhưng để trải nghiệm tốt, có thể fallback về backend cũ hoặc báo lỗi
            // User yêu cầu "chạy qua frontend sau khi đã lưu api", nên expect đã có api.
            // Nếu chưa có, alert nhẹ.
        }

        // Chú thích: Nếu chưa có conversation, tạo mới
        let currentId = activeId;
        if (!currentId) {
            const newConv: Conversation = {
                id: Date.now().toString(),
                title: generateTitle(message),
                messages: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                context: hiddenContext,
            };
            setConversations(prev => [newConv, ...prev]);
            setActiveId(newConv.id);
            currentId = newConv.id;
        }

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: message,
            timestamp: Date.now(),
            attachments: files.map(f => ({ name: f.file.name, type: f.type, url: URL.createObjectURL(f.file) })),
        };

        // Chú thích: Add user message to UI immediately
        setConversations(prev => prev.map(c => {
            if (c.id === currentId) {
                const isFirstMessage = c.messages.length === 0;
                const messagesToAdd = [userMessage];

                // Welcome message logic
                if (isFirstMessage) {
                    const welcomeMessage: ChatMessage = {
                        id: 'welcome',
                        role: 'assistant',
                        content: 'Chào bạn! Mình là **StemBot** - trợ lý AI chuyên về học tập và công nghệ.\n\nMình có thể giúp gì cho bạn hôm nay?',
                        timestamp: Date.now(),
                    };
                    messagesToAdd.unshift(welcomeMessage);
                }

                // Sync to backend (optional log)
                if (token && currentId && !hiddenContext) {
                    addMessage(currentId, {
                        role: 'user',
                        content: message,
                        attachments: files.length > 0 ? files.map(f => ({ name: f.file.name, type: f.type })) : undefined
                    }, token).catch(e => console.error('Failed to sync user msg', e));
                }

                return {
                    ...c,
                    title: isFirstMessage ? generateTitle(message) : c.title,
                    messages: [...c.messages, ...messagesToAdd],
                    updatedAt: Date.now(),
                };
            }
            return c;
        }));

        setIsLoading(true);
        const startTime = Date.now();
        setThinkingStep('Kết nối AI Provider...');
        setElapsedTime(0);

        const timerInterval = setInterval(() => {
            setElapsedTime((Date.now() - startTime) / 1000);
        }, 100);

        setTimeout(() => setThinkingStep('Đang gửi yêu cầu...'), 800);

        try {
            // Chú thích: Prepare messages for API
            // 1. Get history
            const currentConv = conversations.find(c => c.id === currentId);
            const history = currentConv?.messages || [];

            // 2. Format history to ServiceChatMessage[]
            // Lấy 10 tin nhắn gần nhất
            const apiMessages: ServiceChatMessage[] = history.slice(-10).map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
                // TODO: handle history images if needed
            }));

            // 3. Add Context / System Prompt
            const contextToUse = currentConv?.context || (hiddenContext && !activeId ? hiddenContext : undefined);

            // System Message
            const systemPrompt = `Bạn là StemBot, trợ lý học tập thông minh. 
            Hãy trả lời ngắn gọn, chính xác, tập trung vào công nghệ và lập trình.
            Nếu có câu hỏi về code, hãy viết code trong markdown block.
            ${contextToUse ? `\n\nThông tin bối cảnh:\n${contextToUse}` : ''}`;

            apiMessages.unshift({ role: 'system', content: systemPrompt });

            // 4. Add current message (handled in history slice if setConversations worked fast enough? 
            // No, setConversations is async. We constructed apiMessages from `conversations` state which might act funny with closure.
            // Better to append the new user message explicitly since state update might not reflect yet in this closure.
            // Actually `currentConv` depends on `conversations` which is from closure scope.
            // Is `conversations` updated? No, `setConversations` schedules update.
            // So `history` does NOT contain `userMessage` yet.

            // Convert images
            const imageAttachments = files.filter(f => f.type === 'image');
            const imagesBase64: string[] = [];
            if (imageAttachments.length > 0) {
                for (const img of imageAttachments) {
                    const reader = new FileReader();
                    const promise = new Promise<string>((resolve) => {
                        reader.onload = (e) => resolve(e.target?.result as string);
                    });
                    reader.readAsDataURL(img.file);
                    imagesBase64.push(await promise);
                }
            }

            apiMessages.push({
                role: 'user',
                content: message,
                images: imagesBase64.length > 0 ? imagesBase64 : undefined
            });


            // 5. Call Client-side Service
            // Check config again
            const currentProvider = provider === 'default' ? 'openrouter' : provider; // Fallback? Default is OpenRouter?
            // User said "tất cả chạy qua frontend... đã lưu api". 
            // If default, maybe use some hardcoded demo key? Or fail?
            // Assuming user configured properly.

            if (!apiKey) {
                throw new Error('Vui lòng nhập API Key trong phần Cài đặt để chat.');
            }

            const response = await sendClientSideChat(
                currentProvider,
                apiKey,
                selectedModel || 'google/gemini-2.0-flash-exp:free', // Fallback model
                apiMessages
            );

            if (!response.success || !response.response) {
                throw new Error(response.error || 'Failed to get response');
            }

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.response,
                timestamp: Date.now(),
            };

            // Sync AI message
            if (token && currentId) {
                addMessage(currentId, {
                    role: 'assistant',
                    content: response.response,
                }, token).catch(e => console.error('Failed to sync AI msg', e));
            }

            setConversations(prev => prev.map(c => {
                if (c.id === currentId) {
                    return {
                        ...c,
                        messages: [...c.messages, assistantMessage],
                        updatedAt: Date.now(),
                    };
                }
                return c;
            }));

        } catch (error) {
            clearInterval(timerInterval);
            console.error('[chat] error:', error);
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `⚠️ Lỗi: ${error instanceof Error ? error.message : 'Đã có lỗi xảy ra'}`,
                timestamp: Date.now(),
            };
            setConversations(prev => prev.map(c => {
                if (c.id === currentId) {
                    return { ...c, messages: [...c.messages, errorMessage] };
                }
                return c;
            }));
        } finally {
            setIsLoading(false);
            clearInterval(timerInterval);
        }
    };

    // Chú thích: Handle navigation state (e.g. "Chat with Exam")
    useEffect(() => {
        if (location.state?.initialContext && !isLoading) {
            // Check to ensure we don't duplicate (simple check: if active convo is brand new with similar message)
            // But actually, simpler is to just check if we have handled this state.
            // Best way: check if the location.state is fresh. 
            // React Router doesn't clear state auto. We must clear it.

            const context = location.state.initialContext as string;
            const introMsg = 'Hãy giúp mình giải đáp thắc mắc và ôn tập dựa trên đề thi vừa tạo này nhé.';

            // Clear state immediately to prevent loops
            window.history.replaceState({}, document.title);

            // Start new chat
            // We need to wait a tick for setConversations/ActiveId potentially? 
            // handleSend handles new convo creation if activeId is null.
            // Ensure activeId is null if we want a NEW chat, or user flow decides.
            // Assumption: When coming from Exam, we want a NEW chat.

            setActiveId(null); // Force new conversation

            // Use setTimeout to ensure state update processes or just call it.
            // handleSend is async but we don't await it here.
            setTimeout(() => {
                handleSend(introMsg, [], context);
            }, 100);
        }
    }, [location.state]);

    return (
        <div className="h-[calc(100vh-4rem)] flex bg-slate-100 dark:bg-slate-900 -m-6 -mt-4">
            {/* Sidebar */}
            <div className={`transition-all duration-300 relative ${isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}`}>
                <ChatSidebar
                    conversations={conversations}
                    activeId={activeId}
                    onSelect={setActiveId}
                    onNew={handleNewConversation}
                    onDelete={handleDeleteConversation}
                />
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="absolute top-4 right-2 p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 border border-slate-200 dark:border-slate-700 shadow-sm"
                    title="Đóng Sidebar"
                >
                    <PanelLeftClose size={16} />
                </button>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title={isSidebarOpen ? "Đóng Sidebar" : "Mở Sidebar"}
                    >
                        {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <Sparkles size={16} className="text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-semibold text-slate-900 dark:text-white">StemBot - Trợ lý học tập</h1>
                                {user?.id && (
                                    <div title={isSynced ? "Đã đồng bộ đám mây" : "Chế độ Offline / Đang lưu..."}>
                                        {isSynced ? (
                                            <Cloud size={14} className="text-emerald-500" />
                                        ) : (
                                            <CloudOff size={14} className="text-slate-400" />
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <span className="uppercase font-medium text-primary-600 dark:text-primary-400">
                                    {provider === 'default' ? 'OpenRouter' : provider}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="truncate max-w-[200px]" title={selectedModel || 'Default Model'}>
                                    {selectedModel ? selectedModel.split('/').pop() : 'Default Model'}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scroll-smooth relative"
                >
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
                                <Sparkles size={36} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                Xin chào! Tôi là STEM AI
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md">
                                Tôi có thể giúp bạn với mọi câu hỏi - từ kiến thức Công nghệ THPT đến tin tức mới nhất.
                                Hãy hỏi bất cứ điều gì!
                            </p>
                            <div className="mt-6 flex flex-wrap gap-2 justify-center">
                                {['Mạng máy tính là gì?', 'Tin tức AI hôm nay', 'Giải thích TCP/IP'].map(q => (
                                    <button
                                        key={q}
                                        onClick={() => handleSend(q, [])}
                                        className="px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map(msg => (
                                <MessageBubble key={msg.id} message={msg} />
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none p-4 shadow-sm border border-slate-100 dark:border-slate-700 max-w-[80%]">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center animate-pulse">
                                                    <BrainCircuit className="text-primary-600 animate-spin-slow" size={18} />
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5">
                                                    <Clock size={10} className="text-slate-400" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                    {thinkingStep}
                                                </p>
                                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                                    <span>{elapsedTime.toFixed(1)}s</span>
                                                    <span>•</span>
                                                    <span className="text-primary-500">Google Search</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Suggestions - Gợi ý câu hỏi tiếp theo */}
                            {!isLoading && suggestions.length > 0 && (
                                <div className="flex flex-wrap gap-2 justify-center mt-4">
                                    {suggestions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                handleSend(q, []);
                                                setSuggestions([]);
                                            }}
                                            className="px-4 py-2 rounded-full bg-gradient-to-r from-primary-50 to-violet-50 dark:from-primary-900/30 dark:to-violet-900/30 border border-primary-200 dark:border-primary-700 text-sm text-primary-700 dark:text-primary-300 hover:from-primary-100 hover:to-violet-100 dark:hover:from-primary-900/50 dark:hover:to-violet-900/50 transition-all shadow-sm hover:shadow-md"
                                        >
                                            💡 {q}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    <div ref={messagesEndRef} />

                    {/* Chú thích: Nút floating scroll to bottom */}
                    {showScrollButton && (
                        <button
                            onClick={scrollToBottom}
                            className="fixed bottom-28 right-8 z-50 w-12 h-12 rounded-full bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center animate-bounce-slow group"
                            title="Cuộn xuống cuối"
                        >
                            <ArrowDown size={20} className="group-hover:translate-y-0.5 transition-transform" />
                        </button>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <ChatInput
                        onSend={handleSend}
                        isLoading={isLoading}
                        placeholder="Nhập câu hỏi của bạn..."
                    />
                </div>
            </div>
        </div>
    );
}
