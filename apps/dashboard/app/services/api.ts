import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ====================================================================
// =====> THE FIX: Add a request interceptor <=====
// This function will be called before every request is sent.
// ====================================================================
api.interceptors.request.use(
  (config) => {
    // 1. Get the token from localStorage
    const token = localStorage.getItem('token');
    const selectedModel = localStorage.getItem('selectedModel');

    console.log('Interceptor found token:', !!token, 'Model:', selectedModel);

    // 2. If the token exists, add the Authorization header
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add model header if selected
    if (selectedModel) {
      config.headers['x-model-id'] = selectedModel;
    }

    // 3. Return the modified config
    return config;
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);
// ====================================================================

// --- Your existing functions can now be simplified ---

export const signup = async (userData: any) => {
  try {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response.data.error || 'Something went wrong during signup');
  }
};

export const login = async (userData: any) => {
  try {
    const response = await api.post('/auth/login', userData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response.data.error || 'Something went wrong during login');
  }
};

// This function no longer needs to add the header manually!
export const getGoogleUrl = async (): Promise<string> => {
  try {
    // The interceptor will automatically add the 'Authorization' header
    const response = await api.get('/auth/google/url');
    return response.data.url;
  } catch (error: any) {
    // Check for a 401 status specifically for better error messages
    if (error.response && error.response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(error.response?.data?.error || 'Failed to get Google URL');
  }
};

export default api;

export interface ConnectionStatus {
  isConnected: boolean;
  email?: string;
}

// Function to check the user's connection status
export const checkConnectionStatus = async (): Promise<ConnectionStatus> => {
  try {
    // The interceptor will automatically add the auth header
    const response = await api.get('/user/connection-status');
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch connection status:', error);
    // Return a default disconnected state on error
    return { isConnected: false };
  }
};

// Function to disconnect the Google account
export const disconnectGoogle = async () => {
  try {
    const response = await api.delete('/user/connections/google');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to disconnect account');
  }
};

// ====================================================================
// =====> NEW: API wrapper for User Preferences <=====
// ====================================================================

export const getModelPreference = async (): Promise<string> => {
  try {
    const response = await api.get('/user/preferences');
    return response.data.preferredModel;
  } catch (error) {
    console.error('Failed to fetch model preference:', error);
    return ''; // Return empty string to indicate failure/use default
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