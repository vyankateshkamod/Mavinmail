import axios from 'axios';
import {
  autocompleteWithLocalModel,
  enhanceWithLocalModel,
  generalChatWithLocalModel,
  getLocalModelAccessError,
  isLocalModel,
  summarizeWithLocalModel,
} from './localLlm.js';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/$/, '');

export type UsageAction =
  | 'summarize'
  | 'draft'
  | 'enhance'
  | 'rag_query'
  | 'digest'
  | 'thread_summary'
  | 'autocomplete';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    // 1. We MUST use chrome.storage in an extension, not localStorage.
    const result = await chrome.storage.local.get(['token', 'selectedModel']);
    const token = result.token;
    const selectedModel = result.selectedModel;

    console.log('API Interceptor: Token found:', !!token, 'Model:', selectedModel);

    // 2. If the token exists, add the Authorization header.
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add model header if selected
    if (selectedModel) {
      config.headers['x-model-id'] = selectedModel;
    }

    // 3. Return the modified config.
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// We can add an interceptor here later if needed, but for login it's not required.

export const login = async (credentials: { email: string; password: string }) => {
  try {
    const response = await api.post('/auth/login', credentials);
    // The response from your backend should contain the token
    return response.data;
  } catch (error: any) {
    if (!error.response) {
      throw new Error(`Could not reach the API at ${API_URL}. Start the backend or update VITE_API_URL.`);
    }
    if (error.response?.status === 429) {
      throw new Error(error.response.data.error || 'Too many attempts. Please try again after 15 minutes.');
    }
    throw new Error(error.response?.data?.error || 'Login failed. Please check your credentials.');
  }
};

const getStoredModelContext = async (): Promise<{ token: string | null; selectedModel: string | null }> => {
  const result = await chrome.storage.local.get(['token', 'selectedModel']);

  return {
    token: typeof result.token === 'string' ? result.token : null,
    selectedModel: typeof result.selectedModel === 'string' ? result.selectedModel : null,
  };
};

const getAuthorizedLocalModel = async (): Promise<string | null> => {
  const { token, selectedModel } = await getStoredModelContext();
  if (!isLocalModel(selectedModel)) {
    return null;
  }

  const accessError = getLocalModelAccessError(token, selectedModel);
  if (accessError) {
    throw new Error(accessError);
  }

  return selectedModel;
};

export const trackUsageEvent = async (
  action: UsageAction,
  metadata: Record<string, unknown> = {},
  success: boolean = true
): Promise<void> => {
  try {
    await api.post('/dashboard/usage', { action, metadata, success });
  } catch (error) {
    console.warn('Failed to track usage event:', error);
  }
};

export const summarizeEmailText = async (text: string): Promise<{ summary: Record<string, unknown> | string }> => {
  try {
    const localModel = await getAuthorizedLocalModel();
    if (localModel) {
      const summary = await summarizeWithLocalModel(text, localModel);
      await trackUsageEvent('summarize', { model: localModel, local: true });
      return { summary };
    }

    // The interceptor will automatically add the auth token
    const response = await api.post('/ai/summarize', { text });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to get summary.');
  }
};



// auto complete
export const fetchAutocomplete = async (text: string): Promise<{ suggestion: string }> => {
  try {
    const localModel = await getAuthorizedLocalModel();
    if (localModel) {
      const suggestion = await autocompleteWithLocalModel(text, localModel);
      await trackUsageEvent('autocomplete', { model: localModel, local: true });
      return { suggestion };
    }

    // The interceptor will automatically add the auth token
    const response = await api.post('/ai/autocomplete', { text });
    return response.data;
  } catch (error: any) {
    console.error("Autocomplete fetch failed:", error);
    // Return a failed state that won't cause a crash
    return { suggestion: '' };
  }
};

export default api;



//rag

// ====================================================================
// Email Sync API Functions (with dedup support)
// ====================================================================

export interface SyncResult {
  message: string;
  synced: number;
  skipped: number;
  total?: number;
}

export interface SyncStatusData {
  isConnected: boolean;
  initialSyncDone: boolean;
  lastSyncAt: string | null;
  totalEmailsSynced: number;
  hasHistoryId: boolean;
}

/**
 * Sync emails with optional count and date filter.
 * Backend handles deduplication — already-synced emails are skipped.
 */
export const syncEmails = async (params?: {
  count?: number;
  afterDate?: string;
}): Promise<SyncResult> => {
  const response = await api.post('/sync/emails', params || {});
  return response.data;
};

/**
 * Incremental sync — checks for new emails since last sync.
 * Used by background alarm polling.
 */
export const syncNewEmails = async (): Promise<SyncResult> => {
  const response = await api.post('/sync/new-emails');
  return response.data;
};

/**
 * Get current sync status for the logged-in user.
 */
export const getSyncStatus = async (): Promise<SyncStatusData> => {
  try {
    const response = await api.get('/sync/status');
    return response.data;
  } catch (error) {
    return {
      isConnected: false,
      initialSyncDone: false,
      lastSyncAt: null,
      totalEmailsSynced: 0,
      hasHistoryId: false,
    };
  }
};

export const askQuestion = async (question: string, useRag: boolean = true): Promise<{ answer: string }> => {
  const localModel = await getAuthorizedLocalModel();
  if (localModel && !useRag) {
    const answer = await generalChatWithLocalModel(question, localModel);
    await trackUsageEvent('rag_query', { query: question, model: localModel, useRag: false, local: true });
    return { answer };
  }

  const response = await api.post('/ai/ask', { question, useRag });
  return response.data;
};

/**
 * 🚀 STREAMING: Ask a question with real-time streaming response
 * Uses EventSource to receive SSE stream and calls callbacks for updates
 */
export const askQuestionStream = async (
  question: string,
  useRag: boolean,
  onStatus: (status: string) => void,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): Promise<void> => {
  const result = await chrome.storage.local.get(['token', 'selectedModel']);
  const token = typeof result.token === 'string' ? result.token : null;
  const selectedModel = typeof result.selectedModel === 'string' ? result.selectedModel : null;

  try {
    if (isLocalModel(selectedModel) && !useRag) {
      const accessError = getLocalModelAccessError(token, selectedModel);
      if (accessError) {
        throw new Error(accessError);
      }

      onStatus('Using local Ollama model...');
      const answer = await generalChatWithLocalModel(question, selectedModel);
      if (answer) {
        onChunk(answer);
      }
      await trackUsageEvent('rag_query', { query: question, model: selectedModel, useRag: false, local: true });
      onDone();
      return;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
    if (selectedModel) {
      headers['x-model-id'] = String(selectedModel);
    }

    const response = await fetch(`${API_URL}/ai/ask/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ question, useRag }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'status') {
              onStatus(parsed.message);
            } else if (parsed.type === 'answer') {
              onChunk(parsed.content);
            } else if (parsed.type === 'error') {
              onError(parsed.message);
            }
          } catch (e) {
            // Ignore parse errors for individual lines
          }
        }
      }
    }

    onDone();
  } catch (error: any) {
    onError(error.message || 'Streaming failed');
  }
};


export const getDailyDigest = async (): Promise<{ summary: string }> => {
  const response = await api.get('/gmail/digest'); // Model header added by interceptor
  return response.data;
};

// ====================================================================
// =====> NEW: Sync Model Preference <=====
// ====================================================================
export const syncModelPreference = async () => {
  try {
    const response = await api.get('/user/preferences');
    const { preferredModel } = response.data;
    if (preferredModel) {
      await chrome.storage.local.set({ selectedModel: preferredModel });
      console.log('✅ Extension synced model preference:', preferredModel);
    }
  } catch (error) {
    console.error('Failed to sync model preference:', error);
  }
};

export const updateModelPreference = async (modelId: string) => {
  try {
    const response = await api.put('/user/preferences', { preferredModel: modelId });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update preferences');
  }
};


// --- Text Enhancement ---
export const enhanceText = async (text: string, type: 'formal' | 'concise' | 'casual' | 'clarity' | 'more') => {
  try {
    const localModel = await getAuthorizedLocalModel();
    if (localModel) {
      const enhancedText = await enhanceWithLocalModel(text, type, localModel);
      await trackUsageEvent('enhance', { type, model: localModel, local: true });
      return enhancedText;
    }

    const response = await api.post('/ai/enhance', { text, type });
    return response.data.enhancedText;
  } catch (error) {
    console.error('Error enhancing text:', error);
    throw error;
  }
};

export const getUserStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export const getConnectionStatus = async (): Promise<{ isConnected: boolean; email?: string }> => {
  const response = await api.get('/user/connection-status');
  return response.data;
};

export const getRecentActivity = async (limit: number = 10) => {
  const response = await api.get(`/dashboard/activity?limit=${limit}`);
  return response.data.activity;
};

export const deleteActivity = async (id: number): Promise<{ success: boolean }> => {
  const response = await api.delete(`/dashboard/activity/${id}`);
  return response.data;
};

// User Profile
export const getUserProfile = async (): Promise<{ firstName: string; lastName: string; email: string }> => {
  try {
    const response = await api.get('/user/profile');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to get profile.');
  }
};

export const updateUserProfile = async (profile: { firstName: string; lastName: string; email: string }) => {
  try {
    const response = await api.put('/user/profile', profile);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to update profile.');
  }
};

// ====================================================================
// Support Tickets
// ====================================================================

export interface SupportTicket {
  id: number;
  title: string;
  description: string;
  source: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export const createSupportTicket = async (data: { title: string; description: string; priority?: string }) => {
  try {
    const response = await api.post('/support/tickets', {
      ...data,
      source: 'extension',
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to create support ticket.');
  }
};

export const getUserSupportTickets = async (): Promise<{ tickets: SupportTicket[]; pagination: any }> => {
  try {
    const response = await api.get('/support/tickets');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to get support tickets.');
  }
};

export const deleteSupportTicket = async (id: number): Promise<{ success: boolean; deletedId: number }> => {
  try {
    const response = await api.delete(`/support/tickets/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to delete support ticket.');
  }
};

// ====================================================================
// AI Model API Functions
// ====================================================================

export interface AIModel {
  id: number;
  modelId: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
}

// Get active models for selection dropdown
export const getAvailableModels = async (): Promise<AIModel[]> => {
  try {
    const response = await api.get('/models');
    return response.data.models || [];
  } catch (error: any) {
    console.error('Failed to fetch available models:', error);
    return [];
  }
};

// ====================================================================
// System Status
// ====================================================================

export const getPublicSystemStatus = async (): Promise<{
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcement: string;
  announcementActive: boolean;
}> => {
  try {
    // This endpoint should be public (no auth required)
    const response = await api.get('/system/status');
    return response.data;
  } catch (error: any) {
    // Fail silently/gracefully by returning "everything is fine"
    return {
      maintenanceMode: false,
      maintenanceMessage: '',
      announcement: '',
      announcementActive: false,
    };
  }
};

// ====================================================================
// Credit System
// ====================================================================

export interface CreditInfo {
  credits: number;
  plan: string;
}

export const getUserCredits = async (): Promise<CreditInfo> => {
  try {
    const response = await api.get('/user/credits');
    return response.data;
  } catch (error: any) {
    console.warn('Credits endpoint unavailable:', error.message);
    return { credits: 0, plan: 'FREE' };
  }
};

export const upgradeToPro = async (code: string): Promise<{ message: string; credits: number; plan: string }> => {
  const response = await api.post('/upgrade/pro', { code });
  return response.data;
};

export const topUpCredits = async (code: string): Promise<{ message: string; credits: number; plan: string }> => {
  const response = await api.post('/upgrade/top-up', { code });
  return response.data;
};
