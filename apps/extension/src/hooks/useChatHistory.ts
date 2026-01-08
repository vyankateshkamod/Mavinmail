import { useState, useEffect, useCallback } from 'react';
import { Message } from '../components/ChatMessage';

export interface Conversation {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messages: Message[];
}

const STORAGE_KEY = 'chat_history';
const MAX_HISTORY_ITEMS = 100;

export const useChatHistory = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load history on mount
    useEffect(() => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            if (result[STORAGE_KEY]) {
                setConversations(result[STORAGE_KEY] as Conversation[]);
            }
            setIsLoading(false);
        });
    }, []);

    // Save to chrome storage whenever conversations change
    const saveToStorage = useCallback((newConversations: Conversation[]) => {
        // Enforce limit (FIFO - Keep newest)
        // Sort by updatedAt desc to keep mostly recently used/created
        // But requirement says "last 100 chat history", usually implies chronological creation or update.
        // Let's sort by updatedAt descending (newest on top) and slice.

        // However, if we just appended, we might want to just slice the array if it's already sorted.
        // Let's assume we maintain the array sorted by updatedAt DESC (newest first).

        const limited = newConversations.slice(0, MAX_HISTORY_ITEMS);

        chrome.storage.local.set({ [STORAGE_KEY]: limited }, () => {
            if (chrome.runtime.lastError) {
                console.error('Failed to save chat history:', chrome.runtime.lastError);
            } else {
                setConversations(limited);
            }
        });
    }, []);

    const createConversation = useCallback((firstMessage: Message): string => {
        const newId = crypto.randomUUID();
        const title = firstMessage.text.length > 30
            ? firstMessage.text.substring(0, 30) + '...'
            : firstMessage.text;

        const newConversation: Conversation = {
            id: newId,
            title: title || 'New Chat',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: [firstMessage]
        };

        setConversations(prev => {
            const updated = [newConversation, ...prev];
            saveToStorage(updated);
            return updated;
        });

        return newId;
    }, [saveToStorage]);

    const addMessageToConversation = useCallback((conversationId: string, message: Message) => {
        setConversations(prev => {
            const index = prev.findIndex(c => c.id === conversationId);
            if (index === -1) return prev;

            const conversation = prev[index];
            const updatedConversation = {
                ...conversation,
                messages: [...conversation.messages, message],
                updatedAt: Date.now()
            };

            // Move to top
            const others = prev.filter(c => c.id !== conversationId);
            const updated = [updatedConversation, ...others];
            saveToStorage(updated);
            return updated;
        });
    }, [saveToStorage]);

    const deleteConversation = useCallback((conversationId: string) => {
        setConversations(prev => {
            const updated = prev.filter(c => c.id !== conversationId);
            saveToStorage(updated);
            return updated;
        });
    }, [saveToStorage]);

    const clearHistory = useCallback(() => {
        chrome.storage.local.remove([STORAGE_KEY], () => {
            setConversations([]);
        });
    }, []);

    const getConversation = useCallback((conversationId: string) => {
        return conversations.find(c => c.id === conversationId);
    }, [conversations]);

    return {
        conversations,
        isLoading,
        createConversation,
        addMessageToConversation,
        deleteConversation,
        clearHistory,
        getConversation
    };
};
