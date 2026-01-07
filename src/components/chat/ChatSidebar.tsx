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
            <div className="w-16 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center py-4 gap-2">
                <button
                    onClick={onNew}
                    className="p-3 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-all shadow-lg hover:shadow-xl"
                >
                    <Plus size={20} />
                </button>
            </div>
        );
    }

    return (
        <div className="w-72 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={onNew}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-all shadow-lg hover:shadow-xl font-medium"
                >
                    <Plus size={20} />
                    Cuộc trò chuyện mới
                </button>
            </div>

            {/* Search */}
            <div className="p-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm..."
                        className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto px-2 pb-4">
                {filteredConversations.length === 0 ? (
                    <div className="text-center text-slate-400 dark:text-slate-500 py-8 text-sm">
                        {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có cuộc trò chuyện nào'}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredConversations.map((conv) => (
                            <div
                                key={conv.id}
                                className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all ${activeId === conv.id
                                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                                onClick={() => onSelect(conv.id)}
                                onMouseEnter={() => setHoveredId(conv.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                <MessageSquare size={18} className="flex-shrink-0 opacity-60" />
                                <span className="flex-1 truncate text-sm font-medium">
                                    {conv.title}
                                </span>

                                {/* Delete button on hover */}
                                {hoveredId === conv.id && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(conv.id);
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-all"
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
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-center">
                <p className="text-xs text-slate-400">
                    {conversations.length} cuộc trò chuyện
                </p>
            </div>
        </div>
    );
}
