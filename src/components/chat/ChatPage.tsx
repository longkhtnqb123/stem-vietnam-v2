// Chú thích: Chat Page - Gemini-style UI với Sidebar và File Upload
import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, BrainCircuit, Clock, ArrowDown, Cloud, CloudOff, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import ChatSidebar from './ChatSidebar';
import { addMessage } from '../../lib/conversationApi';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import * as conversationApi from '../../lib/conversationApi';
import type { ChatMessage } from '../../types';
import type { Conversation, FileAttachment } from '../../types/chat';
import { useAuthStore } from '../../lib/auth';
import { useSettingsStore } from '../../stores/settingsStore';
import { sendClientSideChat, type ChatMessage as ServiceChatMessage } from '../../lib/chatService';
import { useSettings } from '../../hooks/useSettings';

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
    // Sync Settings from D1 to Store
    const { settings: d1Settings } = useSettings();
    const { setSelectedModel, setOpenRouterKey, setApiKey } = useSettingsStore();

    useEffect(() => {
        if (d1Settings) {
            if (d1Settings.chatModel) setSelectedModel(d1Settings.chatModel);
            if (d1Settings.apiKeys?.openRouter) {
                setOpenRouterKey(d1Settings.apiKeys.openRouter);
                setApiKey(d1Settings.apiKeys.openRouter);
            }
        }
    }, [d1Settings, setSelectedModel, setOpenRouterKey, setApiKey]);

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
    const { provider, apiKey, selectedModel, useBackendProxy } = useSettingsStore();
    // import { sendClientSideChat ... } removed from here

    // Chú thích: Send message logic updated for Client-side or Backend Proxy
    const handleSend = async (message: string, files: FileAttachment[], hiddenContext?: string) => {
        if (!message.trim() && files.length === 0) return;

        // Chú thích: Check settings - cho phép backend proxy mode không cần API key
        const isBackendMode = useBackendProxy;

        if (!isBackendMode && (!apiKey || provider === 'default')) {
            // Nếu không dùng backend proxy và chưa config API key, báo lỗi
            console.warn('[chat] No API key configured and backend proxy disabled');
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


            // 5. Gọi API - chọn backend proxy hoặc client-side
            let responseText: string;

            if (isBackendMode) {
                // Chú thích: Dùng backend proxy miễn phí - không cần API key
                setThinkingStep('Đang gọi AI qua server...');
                const API_BASE = (import.meta.env.VITE_API_URL || 'https://stem-vietnam-api.stu725114073.workers.dev').replace(/\/$/, '');

                const backendResponse = await fetch(`${API_BASE}/api/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        message: message,
                        conversationId: currentId,
                        images: imagesBase64.length > 0 ? imagesBase64 : undefined,
                        context: contextToUse,
                    }),
                });

                if (!backendResponse.ok) {
                    const errText = await backendResponse.text();
                    throw new Error(`Backend error: ${backendResponse.status} - ${errText}`);
                }

                const data = await backendResponse.json();
                responseText = data.response || data.text || 'Không có phản hồi';
            } else {
                // Chú thích: Dùng API key riêng - gọi trực tiếp từ frontend
                const currentProvider = provider === 'default' ? 'openrouter' : provider;

                if (!apiKey) {
                    throw new Error('Vui lòng nhập API Key trong phần Cài đặt, hoặc bật "Chế độ Backend miễn phí" trong Giao diện.');
                }

                const response = await sendClientSideChat(
                    currentProvider,
                    apiKey,
                    selectedModel || 'google/gemini-2.0-flash-exp:free',
                    apiMessages
                );

                if (!response.success || !response.response) {
                    throw new Error(response.error || 'Failed to get response');
                }
                responseText = response.response;
            }

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText,
                timestamp: Date.now(),
            };

            // Sync AI message
            if (token && currentId) {
                addMessage(currentId, {
                    role: 'assistant',
                    content: responseText,
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
        <div className="lms-page">
            <div className="lms-chat">
                <ChatSidebar
                    conversations={conversations}
                    activeId={activeId}
                    onSelect={setActiveId}
                    onNew={handleNewConversation}
                    onDelete={handleDeleteConversation}
                    isCollapsed={!isSidebarOpen}
                />

                <div className="lms-chat-main">
                    <div className="lms-chat-header">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lms-icon-button"
                            title={isSidebarOpen ? 'Dong danh sach' : 'Mo danh sach'}
                        >
                            {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                        </button>
                        <div className="lms-chat-brand">
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <div className="lms-row" style={{ gap: 6 }}>
                                <div className="lms-chat-title">StemBot - Tro ly hoc tap</div>
                                {user?.id && (
                                    <span title={isSynced ? 'Da dong bo' : 'Offline'}>
                                        {isSynced ? <Cloud size={14} /> : <CloudOff size={14} />}
                                    </span>
                                )}
                            </div>
                            <div className="lms-row" style={{ gap: 8 }}>
                                <span className="lms-badge">
                                    {provider === 'default' ? 'OpenRouter' : provider}
                                </span>
                                <span
                                    className="lms-note"
                                    style={{ maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                    title={selectedModel || 'Default Model'}
                                >
                                    {selectedModel ? selectedModel.split('/').pop() : 'Default Model'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div
                        ref={messagesContainerRef}
                        onScroll={handleScroll}
                        className="lms-chat-messages"
                    >
                        {messages.length === 0 ? (
                            <div className="lms-chat-empty">
                                <div className="lms-chat-brand">
                                    <Sparkles size={20} />
                                </div>
                                <h2 className="lms-chat-title">Xin chao! Toi la STEM AI</h2>
                                <p className="lms-note" style={{ maxWidth: 360 }}>
                                    Toi co the giup ban voi moi cau hoi. Hay bat dau bang mot cau hoi bat ky.
                                </p>
                                <div className="lms-chat-suggestions">
                                    {['Mang may tinh la gi?', 'Tin tuc AI hom nay', 'Giai thich TCP/IP'].map(q => (
                                        <button
                                            key={q}
                                            onClick={() => handleSend(q, [])}
                                            className="lms-chip"
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
                                    <div className="lms-message">
                                        <div className="lms-message-avatar is-assistant">
                                            <BrainCircuit size={16} />
                                        </div>
                                        <div className="lms-message-body">
                                            <div className="lms-message-bubble lms-message-bubble is-assistant">
                                                <div className="lms-section">
                                                    <div className="lms-row" style={{ justifyContent: 'space-between' }}>
                                                        <span>{thinkingStep}</span>
                                                        <span className="lms-note">{elapsedTime.toFixed(1)}s</span>
                                                    </div>
                                                    <span className="lms-note">Google Search</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!isLoading && suggestions.length > 0 && (
                                    <div className="lms-chat-suggestions">
                                        {suggestions.map((q, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    handleSend(q, []);
                                                    setSuggestions([]);
                                                }}
                                                className="lms-chip is-active"
                                            >
                                                Goi y: {q}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                        <div ref={messagesEndRef} />

                        {showScrollButton && (
                            <button
                                onClick={scrollToBottom}
                                className="lms-chat-scroll"
                                title="Cuon xuong cuoi"
                            >
                                <ArrowDown size={18} />
                            </button>
                        )}
                    </div>

                    <div className="lms-chat-input">
                        <ChatInput
                            onSend={handleSend}
                            isLoading={isLoading}
                            placeholder="Nhap cau hoi cua ban..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

