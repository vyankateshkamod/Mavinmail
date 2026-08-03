import { useState, useEffect } from "react";
import { Trash2, MessageSquare, AlertTriangle, Activity, FileText } from "lucide-react";
import { Conversation } from "../hooks/useChatHistory";
import { getRecentActivity } from "../services/api"; // Added import

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
    const [activeTab, setActiveTab] = useState<'chats' | 'tasks'>('chats');
    const [activities, setActivities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'tasks') {
            fetchActivity();
        }
    }, [activeTab]);

    const fetchActivity = async () => {
        setIsLoading(true);
        try {
            const data = await getRecentActivity(20);
            setActivities(data);
        } catch (error) {
            console.error("Failed to fetch activity:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white">
            {/* Header with Tabs */}
            <div className="p-4 border-b border-gray-300 dark:border-[#262626] bg-gray-50 dark:bg-[#121212] sticky top-0 z-10 space-y-3">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-[#22d3ee]">History</h2>
                    {activeTab === 'chats' && conversations.length > 0 && (
                        <button
                            onClick={() => {
                                if (confirm("Delete ALL chat history?")) onClearAll();
                            }}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3" /> Clear
                        </button>
                    )}
                </div>

                <div className="flex p-1 bg-white dark:bg-[#1e1e1e] rounded-lg border border-gray-300 dark:border-transparent">
                    <button
                        onClick={() => setActiveTab('chats')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'chats' ? 'bg-gray-100 dark:bg-[#262626] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        Chats
                    </button>
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'tasks' ? 'bg-gray-100 dark:bg-[#262626] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        Task Activity
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-[#22d3ee]/20">

                {/* CHATS TAB */}
                {activeTab === 'chats' && (
                    <div className="space-y-2">
                        {conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                                <MessageSquare className="w-10 h-10 mb-2 opacity-20" />
                                <p className="text-sm">No chat history.</p>
                            </div>
                        ) : (
                            conversations.map((chat) => (
                                <div
                                    key={chat.id}
                                    className="group flex items-center justify-between p-3 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#262626] hover:border-[#22d3ee]/50 cursor-pointer"
                                    onClick={() => onSelectConversation(chat.id)}
                                >
                                    <div className="flex-1 min-w-0 pr-3">
                                        <h3 className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate group-hover:text-gray-900 dark:group-hover:text-white">
                                            {chat.title}
                                        </h3>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            {new Date(chat.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("Delete this conversation?")) onDeleteConversation(chat.id);
                                        }}
                                        className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                        {conversations.length > 0 && (
                            <div className="mt-4 text-center text-[10px] text-gray-600 flex items-center justify-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Storage limited to 100 chats
                            </div>
                        )}
                    </div>
                )}

                {/* TASKS ACTIVITY TAB */}
                {activeTab === 'tasks' && (
                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="text-center py-10 text-gray-500">Loading activity...</div>
                        ) : activities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                                <Activity className="w-10 h-10 mb-2 opacity-20" />
                                <p className="text-sm">No recent task activity.</p>
                            </div>
                        ) : (
                            activities.map((item) => (
                                <div key={item.id} className="p-3 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#262626]">
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${item.action === 'digest' ? 'bg-pink-500/10 text-pink-500 dark:bg-pink-500/20 dark:text-pink-400' :
                                                item.action === 'check-reply' ? 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400' :
                                                    'bg-gray-100 text-gray-600 dark:bg-[#262626] dark:text-gray-400'
                                                }`}>
                                                {item.action === 'digest' ? 'Briefing' : item.action}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                {new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{item.description}</p>

                                    {/* Show summary result if available logic similar to dashboard */}
                                    {item.action === 'digest' && item.metadata?.summary && (
                                        <div className="mt-2 p-3 bg-gray-50 dark:bg-[#121212] rounded-lg border border-gray-300 dark:border-[#333] text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed relative font-sans">
                                            <FileText className="w-4 h-4 absolute top-3 right-3 text-pink-500/50" />
                                            {item.metadata.summary}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
