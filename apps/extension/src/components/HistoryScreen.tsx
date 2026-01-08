import { Trash2, MessageSquare, AlertTriangle } from "lucide-react";
import { Conversation } from "../hooks/useChatHistory";

interface HistoryScreenProps {
    conversations: Conversation[];
    onSelectConversation: (id: string) => void;
    onDeleteConversation: (id: string) => void;
    onClearAll: () => void;
}

export default function HistoryScreen({
    conversations,
    onSelectConversation,
    onDeleteConversation,
    onClearAll
}: HistoryScreenProps) {

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
                <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">No chat history yet.</p>
                <p className="text-xs mt-1">Start a new conversation!</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#121212] text-white">
            {/* Header */}
            <div className="p-4 border-b border-[#262626] flex justify-between items-center bg-[#121212] sticky top-0 z-10">
                <h2 className="text-lg font-semibold text-[#22d3ee]">History</h2>

                <button
                    onClick={() => {
                        if (confirm("Are you sure you want to delete ALL chat history? This cannot be undone.")) {
                            onClearAll();
                        }
                    }}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-400/10 transition-colors"
                >
                    <Trash2 className="w-3 h-3" />
                    Clear All
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-[#22d3ee]/20 scrollbar-track-transparent">
                <div className="space-y-2">
                    {conversations.map((chat) => (
                        <div
                            key={chat.id}
                            className="group flex items-center justify-between p-3 rounded-lg bg-[#1e1e1e] border border-[#262626] hover:border-[#22d3ee]/50 hover:bg-[#262626] transition-all cursor-pointer"
                            onClick={() => onSelectConversation(chat.id)}
                        >
                            <div className="flex-1 min-w-0 pr-3">
                                <h3 className="font-medium text-sm text-gray-200 truncate group-hover:text-white transition-colors">
                                    {chat.title}
                                </h3>
                                <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-2">
                                    {new Date(chat.updatedAt).toLocaleDateString()} • {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent opening the chat
                                    if (confirm("Delete this conversation?")) {
                                        onDeleteConversation(chat.id);
                                    }
                                }}
                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Delete Chat"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-gray-600 flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Local storage limited to last 100 chats
                    </p>
                </div>
            </div>
        </div>
    );
}
