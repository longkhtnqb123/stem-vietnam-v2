import { useState } from 'react';
import type { Conversation } from '../../types/chat';

interface ChatSidebarProps {
    conversations: Conversation[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
    onDelete: (id: string) => void;
    isCollapsed?: boolean;
}

export default function ChatSidebar({
    conversations,
    activeId,
    onSelect,
    onNew,
    onDelete,
    isCollapsed = false
}: ChatSidebarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const filteredConversations = conversations.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isCollapsed) {
        return (
            <div className="lms-chat-sidebar is-collapsed">
                <button
                    onClick={onNew}
                    className="lms-icon-button is-primary"
                    aria-label="New conversation"
                >
                    +
                </button>
            </div>
        );
    }

    return (
        <div className="lms-chat-sidebar">
            <div className="lms-chat-sidebar-header">
                <button
                    onClick={onNew}
                    className="lms-button"
                    style={{ width: '100%' }}
                >
                    Tạo cuộc trò chuyện
                </button>
            </div>

            <div className="lms-chat-sidebar-search">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="lms-input"
                />
            </div>

            <div className="lms-chat-list">
                {filteredConversations.length === 0 ? (
                    <div className="lms-note" style={{ textAlign: 'center', padding: '12px 0' }}>
                        {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có cuộc trò chuyện nào'}
                    </div>
                ) : (
                    <div className="lms-list">
                        {filteredConversations.map((conv, index) => (
                            <div
                                key={conv.id}
                                className={`lms-chat-item ${activeId === conv.id ? 'is-active' : ''}`}
                                onClick={() => onSelect(conv.id)}
                                onMouseEnter={() => setHoveredId(conv.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                <span className="lms-chat-item-index">{String(index + 1).padStart(2, '0')}</span>
                                <span className="lms-chat-item-title">{conv.title}</span>

                                {hoveredId === conv.id && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(conv.id);
                                        }}
                                        className="lms-icon-button lms-chat-delete"
                                        aria-label="Delete conversation"
                                    >
                                        X
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="lms-chat-sidebar-footer">
                {conversations.length} cuộc trò chuyện
            </div>
        </div>
    );
}
