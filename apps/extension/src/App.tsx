"use client"

import { useState, useEffect } from 'react';
import ChatScreen from './components/ChatScreen';
import TasksScreen from './components/TasksScreen';
import SidebarNav from './components/SidebarNav';
import ExploreScreen from './components/ExploreScreen';
import SettingScreen from './components/SettingScreen';
import LoginScreen from './components/LoginScreen';
import ProfileScreen from './components/ProfileScreen';
import SupportScreen from './components/SupportScreen';
import OnboardingScreen from './components/OnboardingScreen';
import { useAuth } from './hooks/useAuth';
import { useSyncManager } from './hooks/useSyncManager';

import { useChatHistory } from './hooks/useChatHistory';
import { useZoom } from './hooks/useZoom';
import { useTheme } from './hooks/useTheme';
import { getPublicSystemStatus } from './services/api';
import SystemBanner from './components/SystemBanner';

import HistoryScreen from './components/HistoryScreen';

export type Screen = 'Chat' | 'Paths' | 'History' | 'Settings' | 'Login' | 'Profile' | 'Support';

function App() {
  useTheme();
  useZoom();
  const [currentScreen, setCurrentScreen] = useState<Screen>('Chat');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const {
    conversations,
    createConversation,
    addMessageToConversation,
    deleteConversation,
    clearHistory,
    getConversation
  } = useChatHistory();

  const { token, isLoading, login, logout } = useAuth();

  // --- Email Sync Manager ---
  const {
    isSyncing,
    syncStatus,
    lastResult,
    syncError,
    triggerManualSync,
    refreshSyncStatus,
  } = useSyncManager(!!token);

  // --- NEW: System Status Management ---
  const [systemStatus, setSystemStatus] = useState<any>(null);

  useEffect(() => {
    if (token && currentScreen === 'Login') {
      setCurrentScreen('Chat');
    }
  }, [currentScreen, token]);

  // Fetch status on mount and poll
  useEffect(() => {
    const fetchStatus = async () => {
      const data = await getPublicSystemStatus();
      setSystemStatus(data);
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-[#14161F]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#22d3ee]"></div>
      </div>
    );
  }

  // --- NEW: If not logged in, show ONLY the OnboardingScreen ---
  if (!token) {
    return (
      <div className="flex flex-col h-screen w-full bg-white dark:bg-[#14161F]">
        {/* Pass status to SystemBanner if it accepts props, otherwise it fetches internally (we will update it to accept props) */}
        <SystemBanner status={systemStatus} hideMaintenance={true} />
        <div className="flex-1 overflow-auto">
          <OnboardingScreen
            login={login}
            isMaintenanceMode={systemStatus?.maintenanceMode || false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-white dark:bg-[#14161F] overflow-hidden">
      <SystemBanner status={systemStatus} />

      {/* Sync status toast — shows during initial sync */}
      {isSyncing && syncStatus && !syncStatus.initialSyncDone && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-[#121212]/90 border border-[#22d3ee]/30 text-[#22d3ee] px-4 py-2 rounded-full text-xs font-medium backdrop-blur-md flex items-center gap-2 animate-pulse shadow-lg">
          <div className="w-3 h-3 border-2 border-[#22d3ee] border-t-transparent rounded-full animate-spin" />
          Syncing your emails...
        </div>
      )}

      <div className="flex flex-col h-full w-full">
        <div className="flex flex-1 w-full overflow-hidden">
          {/* -------- LEFT MAIN CONTENT -------- */}
          <main className="flex-1 relative overflow-hidden">

            <div
              style={{
                display: currentScreen === 'Chat' ? 'block' : 'none',
                height: '100%',
              }}
            >
              <ChatScreen
                isLoggedIn={!!token}
                onLoginClick={() => setCurrentScreen('Login')}
                activeConversationId={activeConversationId}
                onConversationChange={setActiveConversationId}
                onCreateConversation={createConversation}
                onAddMessage={addMessageToConversation}
                getConversation={getConversation}
              />
            </div>

            <div
              style={{
                display: currentScreen === 'Paths' ? 'block' : 'none',
                height: '100%',
              }}
            >
              <TasksScreen />
            </div>

            <div
              style={{
                display: currentScreen === 'History' ? 'block' : 'none',
                height: '100%',
              }}
            >
              <HistoryScreen
                conversations={conversations}
                onSelectConversation={(id: string) => {
                  setActiveConversationId(id);
                  setCurrentScreen('Chat');
                }}
                onDeleteConversation={deleteConversation}
                onClearAll={clearHistory}
              />
            </div>

            <div
              style={{
                display: currentScreen === 'Login' ? 'block' : 'none',
                height: '100%',
              }}
            >
              <LoginScreen
                login={login}
                onLoginSuccess={() => setCurrentScreen('Chat')}
                onCancel={() => setCurrentScreen('Chat')}
              />
            </div>

            <div
              style={{
                display: currentScreen === 'Profile' ? 'block' : 'none',
                height: '100%',
              }}
            >
            <ProfileScreen
              onLogout={logout}
              isSyncing={isSyncing}
              syncStatus={syncStatus}
              lastSyncResult={lastResult}
              syncError={syncError}
              onTriggerSync={triggerManualSync}
              onRefreshStatus={refreshSyncStatus}
            />
            </div>

            <div
              style={{
                display: currentScreen === 'Settings' ? 'block' : 'none',
                height: '100%',
              }}
            >
              <SettingScreen />
            </div>

            <div
              style={{
                display: currentScreen === 'Support' ? 'block' : 'none',
                height: '100%',
              }}
            >
              <SupportScreen />
            </div>

          </main>

          {/* -------- RIGHT SIDEBAR -------- */}
          {token && (
            <SidebarNav
              currentScreen={currentScreen}
              onScreenChange={setCurrentScreen}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
