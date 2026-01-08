

import { useState, useEffect } from 'react';
import { syncEmails, updateModelPreference, syncModelPreference } from '../services/api.js';


function SettingScreen() {

  const [syncStatus, setSyncStatus] = useState('');
  const [selectedModel, setSelectedModel] = useState(import.meta.env.VITE_DEFAULT_AI_MODEL || 'google/gemini-2.0-flash-exp:free');

  // Load saved model on mount
  useEffect(() => {
    // 1. First load from local storage for instant UI
    chrome.storage.local.get(['selectedModel'], (result) => {
      if (result.selectedModel) {
        setSelectedModel(result.selectedModel);
      }
    });

    // 2. Then sync from backend to ensure latest cross-device setting
    syncModelPreference().then(() => {
      chrome.storage.local.get(['selectedModel'], (result) => {
        if (result.selectedModel) {
          setSelectedModel(result.selectedModel);
        }
      });
    });
  }, []);

  const handleModelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);

    // 1. Save locally immediately
    chrome.storage.local.set({ selectedModel: newModel }, () => {
      console.log('Model saved locally:', newModel);
    });

    // 2. Sync to backend
    try {
      await updateModelPreference(newModel);
      console.log('Model synced to backend:', newModel);
    } catch (error) {
      console.error('Failed to sync model to backend:', error);
      setSyncStatus('Failed to sync model preference.');
    }
  };

  const handleSync = async () => {
    setSyncStatus('Syncing... this may take a moment.');
    try {
      const result = await syncEmails();
      setSyncStatus(result.message);
    } catch (err: any) {
      setSyncStatus(err.message);
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#121212] text-white p-6">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <div className="w-full max-w-sm space-y-6">
        {/* Model Selection */}
        <div className="bg-[#1E1E1E] p-4 rounded-lg border border-gray-800">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            AI Model
          </label>
          <select
            value={selectedModel}
            onChange={handleModelChange}
            className="w-full bg-[#2C2C2C] text-white border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#31B8C6]"
          >
            <option value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash (Free)</option>
            <option value="google/gemini-2.0-flash-thinking-exp:free">Gemini 2.0 Flash Thinking (Free)</option>
            <option value="meta-llama/llama-3.2-3b-instruct:free">Llama 3.2 3B (Free)</option>
            <option value="microsoft/phi-3-mini-128k-instruct:free">Phi-3 Mini (Free)</option>
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Select the AI model used for summaries and chat.
          </p>
        </div>

        {/* Sync Button */}
        <div className="bg-[#1E1E1E] p-4 rounded-lg border border-gray-800 text-center">
          <h2 className="text-sm font-medium text-gray-400 mb-4">Data Sync</h2>
          <button
            onClick={handleSync}
            className="w-full border-2 border-[#31B8C6] text-[#31B8C6] px-4 py-2 rounded-md font-medium transition-all duration-300 hover:bg-[#31B8C6] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Sync Latest 5 Emails
          </button>
          {syncStatus && <p className="mt-3 text-sm text-gray-300 animate-pulse">{syncStatus}</p>}
        </div>
      </div>
    </div>
  );
}

export default SettingScreen;
