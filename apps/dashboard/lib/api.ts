import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

import { getSession, signOut } from "next-auth/react";

// Request interceptor to add auth token to all requests
api.interceptors.request.use(
  async (config) => {
    // 1. Try to get token from NextAuth session first
    const session = await getSession();
    const token = (session as any)?.accessToken || (session as any)?.token;

    // 2. Fallback to localStorage (legacy/dev support) or specialized headers
    const selectedModel = typeof window !== 'undefined' ? localStorage.getItem('selectedModel') : null;

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (selectedModel) {
      config.headers['x-model-id'] = selectedModel;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If 401, we should sign out the user from NextAuth too
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        signOut({ callbackUrl: '/login' });
      }
    }
    return Promise.reject(error);
  }
);

// ====================================================================
// Auth API Functions
// ====================================================================

export const signup = async (userData: { email: string; password: string }) => {
  try {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Something went wrong during signup');
  }
};

export const login = async (userData: { email: string; password: string }) => {
  try {
    const response = await api.post('/auth/login', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Something went wrong during login');
  }
};

// ====================================================================
// Google OAuth API Functions
// ====================================================================

export const getGoogleUrl = async (): Promise<string> => {
  try {
    const response = await api.get('/auth/google/url');
    return response.data.url;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(error.response?.data?.error || 'Failed to get Google URL');
  }
};

export const getGoogleCredentials = async (): Promise<{ googleClientId: string | null; hasCustomCredentials: boolean }> => {
  try {
    const response = await api.get('/user/google-credentials');
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch Google credentials status:', error);
    return { googleClientId: null, hasCustomCredentials: false };
  }
};

export const updateGoogleCredentials = async (data: { googleClientId?: string; googleClientSecret?: string }): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await api.put('/user/google-credentials', data);
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.response?.data?.error || 'Failed to update credentials' };
  }
};

// ====================================================================
// Connection Status API Functions
// ====================================================================

export interface ConnectionStatus {
  isConnected: boolean;
  email?: string;
}

export interface ConnectedAccount {
  id: number;
  provider: string;
  email: string;
  status: 'Active' | 'Re-auth Needed' | 'Error';
  lastSync?: string;
}

// Get connection status for a user (single account)
export const checkConnectionStatus = async (): Promise<ConnectionStatus> => {
  try {
    const response = await api.get('/user/connection-status');
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch connection status:', error);
    return { isConnected: false };
  }
};

// Get all connected accounts for a user (multiple accounts)
export const getConnectedAccounts = async (): Promise<ConnectedAccount[]> => {
  try {
    const response = await api.get('/user/connections');
    return response.data.accounts || [];
  } catch (error: any) {
    // If endpoint doesn't exist yet (404), fallback to single account check
    if (error.response?.status === 404) {
      try {
        const status = await checkConnectionStatus();
        if (status.isConnected && status.email) {
          return [{
            id: 1,
            provider: 'Gmail',
            email: status.email,
            status: 'Active',
          }];
        }
      } catch (fallbackError) {
        console.warn('Connection status fallback also failed:', fallbackError);
      }
    } else {
      console.error('Failed to fetch connected accounts:', error);
    }
    return [];
  }
};

// Disconnect a Google account
export const disconnectGoogle = async (accountId?: number) => {
  try {
    // Backend currently only supports /user/connections/google endpoint
    // accountId parameter is for future enhancement when backend supports multiple accounts
    // For now, always use the Google-specific endpoint
    const response = await api.delete('/user/connections/google');
    return response.data || { success: true };
  } catch (error: any) {
    console.error('Disconnect error:', error);
    throw new Error(error.response?.data?.message || 'Failed to disconnect account');
  }
};

// ====================================================================
// User Preferences API Functions
// ====================================================================

export const getModelPreference = async (): Promise<string> => {
  try {
    const response = await api.get('/user/preferences');
    return response.data.preferredModel || '';
  } catch (error) {
    console.error('Failed to fetch model preference:', error);
    return '';
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

// ====================================================================
// Dashboard API Functions
// ====================================================================

import type {
  DashboardStats,
  ActivityItem,
  UsageTrend,
} from './types';

/**
 * Generate mock dashboard stats for development/fallback
 */
const getMockDashboardStats = (): DashboardStats => ({
  totalEmails: 1234,
  emailsToday: 45,
  emailsIndexed: 1189,
  draftsGenerated: 89,
  questionsAnswered: 156,
  threadsSummarized: 234,
  textEnhancements: 67,
  timeSavedMinutes: 750,
  lastSyncTime: new Date().toISOString(),
  connectedAccounts: 1,
});

/**
 * Generate mock activity feed for development/fallback
 */
const getMockActivityFeed = (): ActivityItem[] => [
  {
    id: 1,
    action: 'summarize',
    description: 'Summarized 25-email thread from Project Alpha',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    success: true,
  },
  {
    id: 2,
    action: 'draft',
    description: "Drafted reply to Sarah's meeting request",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    success: true,
  },
  {
    id: 3,
    action: 'enhance',
    description: 'Enhanced email tone to formal',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    success: true,
  },
  {
    id: 4,
    action: 'rag_query',
    description: 'Answered: "What\'s the deadline for the report?"',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    success: true,
  },
  {
    id: 5,
    action: 'digest',
    description: 'Generated daily digest with 32 emails',
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    success: true,
  },
];

/**
 * Generate mock usage trends for development/fallback
 */
const getMockUsageTrends = (): UsageTrend[] => {
  const trends: UsageTrend[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    trends.push({
      date: date.toISOString().split('T')[0],
      total: Math.floor(Math.random() * 30) + 10,
      summarize: Math.floor(Math.random() * 10) + 2,
      draft: Math.floor(Math.random() * 8) + 1,
      enhance: Math.floor(Math.random() * 6) + 1,
      rag: Math.floor(Math.random() * 12) + 3,
    });
  }
  return trends;
};

/**
 * Fetch dashboard statistics
 * Falls back to mock data if backend endpoint is unavailable
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data.stats || response.data;
  } catch (error: any) {
    console.warn('Dashboard stats endpoint unavailable, using mock data:', error.message);
    return getMockDashboardStats();
  }
};

/**
 * Get scheduled tasks
 */
export const getTasks = async () => {
  try {
    const response = await api.get('/tasks');
    return response.data;
  } catch (error: any) {
    console.warn('Tasks endpoint unavailable, returning empty list:', error.message);
    return [];
  }
};

/**
 * Create a new scheduled task
 */
export const createTask = async (taskData: any) => {
  try {
    const response = await api.post('/tasks', taskData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to create task');
  }
};

/**
 * Delete (cancel) a task
 */
export const cancelTask = async (taskId: number) => {
  try {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to delete task');
  }
};

/**
 * Fetch recent AI activity feed
 * Falls back to mock data if backend endpoint is unavailable
 */
export const getActivityFeed = async (limit: number = 10): Promise<ActivityItem[]> => {
  try {
    const response = await api.get(`/dashboard/activity?limit=${limit}`);
    // Backend returns { activity: [...] }
    return response.data.activity || response.data.activities || response.data;
  } catch (error: any) {
    console.warn('Activity feed endpoint unavailable, using mock data:', error.message);
    return getMockActivityFeed();
  }
};

/**
 * Delete a specific activity log
 */
export const deleteActivity = async (id: number): Promise<{ success: boolean }> => {
  try {
    const response = await api.delete(`/dashboard/activity/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to delete activity log');
  }
};

/**
 * Fetch usage trends for charts
 * Falls back to mock data if backend endpoint is unavailable
 */
export const getUsageTrends = async (days: number = 7): Promise<UsageTrend[]> => {
  try {
    // Backend endpoint is /dashboard/trends (not /dashboard/usage-trends)
    const response = await api.get(`/dashboard/trends?days=${days}`);
    return response.data.trends || response.data;
  } catch (error: any) {
    console.warn('Usage trends endpoint unavailable, using mock data:', error.message);
    return getMockUsageTrends();
  }
};

// ====================================================================
// User Profile API Functions
// ====================================================================

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  currentPassword?: string; // Required when changing email
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

/**
 * Get user profile information
 */
export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const response = await api.get('/user/profile');
    return {
      firstName: response.data.firstName || '',
      lastName: response.data.lastName || '',
      email: response.data.email || '',
    };
  } catch (error: any) {
    console.warn('User profile endpoint unavailable:', error.message);
    return { firstName: '', lastName: '', email: 'user@example.com' };
  }
};

/**
 * Update user profile information
 * Note: Email changes require currentPassword for security
 */
export const updateUserProfile = async (data: UpdateProfileData): Promise<{
  success: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  error?: string;
  code?: string;
}> => {
  try {
    const response = await api.put('/user/profile', data);
    return response.data;
  } catch (error: any) {
    const errorData = error.response?.data || {};
    return {
      success: false,
      error: errorData.error || 'Failed to update profile',
      code: errorData.code,
    };
  }
};

export const changeUserPassword = async (data: ChangePasswordData): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
}> => {
  try {
    const response = await api.put('/user/password', data);
    return response.data;
  } catch (error: any) {
    const errorData = error.response?.data || {};
    return {
      success: false,
      error: errorData.error || 'Failed to update password',
      code: errorData.code,
    };
  }
};

// ====================================================================
// Admin API Functions
// ====================================================================

export const getAdminStats = async () => {
  try {
    const response = await api.get('/admin/stats');
    return response.data;
  } catch (error: any) {
    console.warn('Admin stats endpoint unavailable:', error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch admin stats');
  }
};

export const getUsers = async (params: { page?: number; limit?: number; search?: string; role?: string; isActive?: boolean }) => {
  try {
    const response = await api.get('/admin/users', { params });
    return response.data;
  } catch (error: any) {
    console.warn('Users endpoint unavailable:', error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch users');
  }
};

export const createAdminUser = async (data: any) => {
  try {
    const response = await api.post('/admin/users', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to create user');
  }
};

export const getUserDetails = async (id: number) => {
  try {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch user details');
  }
};

export const suspendUser = async (id: number, reason: string) => {
  try {
    const response = await api.post(`/admin/users/${id}/suspend`, { reason });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to suspend user');
  }
};

export const activateUser = async (id: number) => {
  try {
    const response = await api.post(`/admin/users/${id}/activate`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to activate user');
  }
};

export const updateUserRole = async (id: number, role: string) => {
  try {
    const response = await api.put(`/admin/users/${id}`, { role });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to update user role');
  }
};

export const getAuditLogs = async (params: { page?: number; limit?: number; actorId?: number; action?: string }) => {
  try {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch audit logs');
  }
};

// ====================================================================
// Support Ticket API Functions
// ====================================================================

export interface SupportTicket {
  id: number;
  userId: number;
  title: string;
  description: string;
  source: string;
  status: string;
  priority: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: number;
  user?: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  resolver?: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface TicketStats {
  total: number;
  byStatus: {
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  byPriority: Record<string, number>;
  bySource: Record<string, number>;
}

// User: Create a support ticket
export const createSupportTicket = async (data: { title: string; description: string; priority?: string }) => {
  try {
    const response = await api.post('/support/tickets', {
      ...data,
      source: 'dashboard',
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to create support ticket');
  }
};

// User: Get own tickets
export const getUserSupportTickets = async (params?: { page?: number; limit?: number; status?: string }) => {
  try {
    const response = await api.get('/support/tickets', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch support tickets');
  }
};

// Admin: Get all support tickets
export const getAdminSupportTickets = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  source?: string;
  search?: string;
}) => {
  try {
    const response = await api.get('/admin/support-tickets', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch support tickets');
  }
};

// Admin: Get single ticket by ID
export const getAdminSupportTicketById = async (id: number) => {
  try {
    const response = await api.get(`/admin/support-tickets/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch ticket');
  }
};

// Admin: Update a support ticket
export const updateSupportTicket = async (id: number, data: {
  status?: string;
  priority?: string;
  adminNotes?: string;
}) => {
  try {
    const response = await api.put(`/admin/support-tickets/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to update ticket');
  }
};

// Admin: Get ticket statistics
export const getSupportTicketStats = async (): Promise<TicketStats> => {
  try {
    const response = await api.get('/admin/support-tickets/stats');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch ticket stats');
  }
};

// Admin: Delete a support ticket
export const deleteSupportTicket = async (id: number) => {
  try {
    const response = await api.delete(`/admin/support-tickets/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to delete ticket');
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
  createdAt?: string;
  updatedAt?: string;
}

// User/Public: Get active models for selection
export const getAvailableModels = async (): Promise<AIModel[]> => {
  try {
    const response = await api.get('/models');
    return response.data.models || [];
  } catch (error: any) {
    console.warn('Failed to fetch available models:', error.message);
    return [];
  }
};

// Admin: Get all models with full metadata
export const getAdminModels = async (): Promise<AIModel[]> => {
  try {
    const response = await api.get('/models/admin');
    return response.data.models || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to fetch models');
  }
};

// Admin: Get local Ollama models (if available)
export const getAdminOllamaModels = async (): Promise<AIModel[]> => {
  try {
    const response = await api.get('/models/admin/ollama');
    return response.data.models || [];
  } catch (error: any) {
    console.warn('Failed to fetch Ollama models:', error.message);
    return [];
  }
};

// Admin: Create a new model
export const createAIModel = async (data: {
  modelId: string;
  displayName: string;
  description?: string;
  isActive?: boolean;
}): Promise<AIModel> => {
  try {
    const response = await api.post('/models/admin', data);
    return response.data.model;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to create model');
  }
};

// Admin: Update a model
export const updateAIModel = async (id: number, data: {
  displayName?: string;
  description?: string;
  isActive?: boolean;
}): Promise<AIModel> => {
  try {
    const response = await api.put(`/models/admin/${id}`, data);
    return response.data.model;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to update model');
  }
};

// Admin: Delete a model
export const deleteAIModel = async (id: number): Promise<{ success: boolean }> => {
  try {
    const response = await api.delete(`/models/admin/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to delete model');
  }
};

// Admin: Set a model as default
export const setDefaultAIModel = async (id: number): Promise<{ success: boolean; defaultModelId: string }> => {
  try {
    const response = await api.put(`/models/admin/${id}/set-default`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to set default model');
  }
};

// ====================================================================
// System Settings API Functions (Admin)
// ====================================================================

export interface SystemSettings {
  maintenance_mode: boolean;
  maintenance_message: string;
  system_announcement: string;
  system_announcement_active: boolean;
}

// Get all system settings
export const getSystemSettings = async (): Promise<SystemSettings> => {
  try {
    const response = await api.get('/admin/settings');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to get system settings');
  }
};

// Update system settings
export const updateSystemSettings = async (settings: Partial<SystemSettings>): Promise<SystemSettings> => {
  try {
    const response = await api.put('/admin/settings', settings);
    return response.data.settings;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to update system settings');
  }
};

// Get public system status (no auth required)
export const getPublicSystemStatus = async (): Promise<{
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcement: string;
  announcementActive: boolean;
}> => {
  try {
    const response = await api.get('/system/status');
    return response.data;
  } catch (error: any) {
    // In case of error, return defaults (system is up)
    return {
      maintenanceMode: false,
      maintenanceMessage: '',
      announcement: '',
      announcementActive: false,
    };
  }
};

// ====================================================================
// Credit System API Functions
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

export default api;
