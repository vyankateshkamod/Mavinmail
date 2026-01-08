import { useState, useEffect } from 'react';
import ChatScreen from './components/ChatScreen';
import PathsScreen from './components/PathsScreen';
import SidebarNav from './components/SidebarNav';
import ExploreScreen from './components/ExploreScreen';
import SettingScreen from './components/SettingScreen';
import LoginScreen from './components/LoginScreen';
import ProfileScreen from './components/ProfileScreen';
import SupportScreen from './components/SupportScreen';
import { useAuth } from './hooks/useAuth';

import HistoryScreen from './components/HistoryScreen';
import { useChatHistory } from './hooks/useChatHistory';

export type Screen = 'Chat' | 'Paths' | 'History' | 'Settings' | 'Login' | 'Profile' | 'Support';

function App() {
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

  useEffect(() => {
    const protectedScreens: Screen[] = ['Profile', 'Settings'];
    if (!token && protectedScreens.includes(currentScreen)) {
      setCurrentScreen('Login');
    }
  }, [currentScreen, token]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#14161F]">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full">

      {/* -------- LEFT MAIN CONTENT -------- */}
      <main className="flex-1 relative overflow-hidden">

        {/* ⭐ ALWAYS MOUNTED — just hide or show */}
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
          <PathsScreen />
        </div>

        <div
          style={{
            display: currentScreen === 'History' ? 'block' : 'none',
            height: '100%',
          }}
        >
          <HistoryScreen
            conversations={conversations}
            onSelectConversation={(id) => {
              setActiveConversationId(id);
              setCurrentScreen('Chat');
            }}
            onDeleteConversation={deleteConversation}
            onClearAll={clearHistory}
          />
        </div>

        {/* Login is also mounted always — we hide it until needed */}
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
          <ProfileScreen onLogout={logout} />
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
  );
}

export default App;
