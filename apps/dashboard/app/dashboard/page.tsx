// import GmailConnect from './GmailConnect';

// export default function DashboardPage() {
//   return (
//     <div className="min-h-screen bg-gray-100 flex flex-col items-center pt-10">
//       <h1 className="text-4xl font-bold mb-8">Welcome to your Dashboard</h1>
//       <GmailConnect />
//     </div>
//   );
// }

'use client'; // Required for onClick handlers and hooks like useRouter

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import withAuth from '@/app/components/withAuth'; // Import our new HOC
import GmailConnect from './GmailConnect';

function DashboardPage() {

  const router = useRouter();

  // We will add the logout logic in the next step.
  const handleLogout = () => {
    // 1. Remove the token from local storage
    localStorage.removeItem('token');

    // 2. Redirect the user to the login page
    console.log('User logged out. Redirecting to /login...');
    // router.push('/auth/login');
    router.push('/');

  };

  // Model Selection State
  const [selectedModel, setSelectedModel] = useState<string>(process.env.NEXT_PUBLIC_DEFAULT_AI_MODEL || 'google/gemini-2.0-flash-exp:free');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // 1. Try to get from backend first
    import('@/app/services/api').then(async ({ getModelPreference }) => {
      const backendModel = await getModelPreference();
      if (backendModel) {
        setSelectedModel(backendModel);
        localStorage.setItem('selectedModel', backendModel); // Keep local sync too
      } else {
        // Fallback to local storage if backend fails or returns nothing
        const localModel = localStorage.getItem('selectedModel');
        if (localModel) setSelectedModel(localModel);
      }
    });
  }, []);

  const handleModelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);

    // 1. Update local storage immediately for UI responsiveness
    localStorage.setItem('selectedModel', newModel);

    // 2. Sync with backend
    try {
      const { updateModelPreference } = await import('@/app/services/api');
      await updateModelPreference(newModel);
      console.log('Model synced to backend:', newModel);
    } catch (error) {
      console.error('Failed to sync model to backend:', error);
      // Optional: Show a toast/notification
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

          <div className="flex items-center gap-4">
            {/* Model Selector */}
            {isClient && (
              <div className="flex items-center gap-2">
                <label htmlFor="model-select" className="text-sm font-medium text-gray-700">AI Model:</label>
                <select
                  id="model-select"
                  value={selectedModel}
                  onChange={handleModelChange}
                  className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash (Free)</option>
                  <option value="google/gemini-2.0-flash-thinking-exp:free">Gemini 2.0 Flash Thinking (Free)</option>
                  <option value="meta-llama/llama-3.2-3b-instruct:free">Llama 3.2 3B (Free)</option>
                  <option value="microsoft/phi-3-mini-128k-instruct:free">Phi-3 Mini (Free)</option>
                </select>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="px-4 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <GmailConnect />
        </div>
      </main>
    </div>
  );
}

// --- THIS IS THE CRITICAL CHANGE ---
// We export the protected version of our component.
export default withAuth(DashboardPage);