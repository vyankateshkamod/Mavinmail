import { useState } from 'react';
import { fetchAutocomplete } from '../services/api';

export const useAutocomplete = () => {
    const [suggestion, setSuggestion] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const triggerAutocomplete = async (text: string) => {
        if (!text || !text.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetchAutocomplete(text);
            // The API returns { suggestion: string }
            if (response && response.suggestion) {
                setSuggestion(response.suggestion);
            }
        } catch (error) {
            console.error("Error triggering autocomplete:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const clearSuggestion = () => {
        setSuggestion('');
    };

    return { suggestion, triggerAutocomplete, clearSuggestion, isLoading };
};
