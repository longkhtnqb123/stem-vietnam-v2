// Chú thích: Chat Sidebar - Lịch sử conversations giống Gemini AI
import { useState } from 'react';
import { Plus, MessageSquare, Trash2, Search } from 'lucide-react';
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

    // Chú thích: Filter conversations theo search
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
                    <Plus size={18} />
                </button>
            </div>
        );
    }

    return (
        <div className="lms-chat-sidebar">
            {/* Header */}
            <div className="lms-chat-sidebar-header">
                <button
                    onClick={onNew}
                    className="lms-button"
                    style={{ width: '100%' }}
                >
                    <Plus size={18} />
                    Cuộc trò chuyện mới
                </button>
            </div>

            {/* Search */}
            <div className="lms-chat-sidebar-search">
                <div className="lms-input-group">
                    <Search size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm..."
                        className="lms-input"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="lms-chat-list">
                {filteredConversations.length === 0 ? (
                    <div className="lms-note" style={{ textAlign: 'center', padding: '12px 0' }}>
                        {searchQuery ? 'Khong tim thay ket qua' : 'Chua co cuoc tro chuyen nao'}
                    </div>
                ) : (
                    <div className="lms-list">
                        {filteredConversations.map((conv) => (
                            <div
                                key={conv.id}
                                className={`lms-chat-item ${activeId === conv.id ? 'is-active' : ''}`}
                                onClick={() => onSelect(conv.id)}
                                onMouseEnter={() => setHoveredId(conv.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                <MessageSquare size={16} />
                                <span className="lms-nav-label">
                                    {conv.title}
                                </span>

                                {/* Delete button on hover */}
                                {hoveredId === conv.id && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(conv.id);
                                        }}
                                        className="lms-icon-button lms-chat-delete"
                                        aria-label="Delete conversation"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="lms-chat-sidebar-footer">
                {conversations.length} cuoc tro chuyen
            </div>
        </div>
    );
}
