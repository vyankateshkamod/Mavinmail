import { useState, useEffect, useCallback } from 'react';
import { login as apiLogin } from '../services/api';

interface AuthState {
  token: string | null;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    token: null,
  });

  // Check storage when the extension first loads
  useEffect(() => {
    chrome.storage.local.get(['token'], (result) => {
      if (result.token) {
        // --- CONSOLE LOG ---
        console.log('Auth state initialized: Token found in storage.');
        setAuthState({ token: result.token as string, isLoading: false });
      } else {
        // --- CONSOLE LOG ---
        console.log('Auth state initialized: No token found.');
        setAuthState({ token: null, isLoading: false });
      }
    });
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    const { token } = await apiLogin(credentials);
    if (token) {
      // --- CONSOLE LOG ---
      console.log('✅ Login successful! Token received and saved.');
      await chrome.storage.local.set({ token });
      setAuthState({ token, isLoading: false });
    }
  }, []);

  const logout = useCallback(async () => {
    // --- CONSOLE LOG ---
    console.log('User logged out. Token removed.');
    await chrome.storage.local.remove(['token']);
    setAuthState({ token: null, isLoading: false });
  }, []);

  return { ...authState, login, logout };
};