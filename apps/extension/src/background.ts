import {
  draftReplyWithLocalModel,
  getLocalModelAccessError,
  isLocalModel,
  summarizeWithLocalModel,
} from './services/localLlm.js';
import { trackUsageEvent, syncNewEmails as apiSyncNewEmails, syncEmails as apiSyncEmails, getSyncStatus } from './services/api.js';

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(err => console.error(err));

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/$/, '');

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.action === "openSidePanel" && sender.tab?.id) {
    chrome.sidePanel.open({ tabId: sender.tab.id });
  }
});

//-------------------------------------------------------------------------

// Content extraction function to be injected
function extractEmailContent() {
  console.log("Meeco AI: Extracting email content...");
  const selectors = [".a3s.aiO", ".gs .ii.gt", 'div[role="listitem"] .a3s'];
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      console.log(`Meeco AI: Found content with ${selector}`);
      return (el as HTMLElement).innerText;
    }
  }
  console.log("Meeco AI: No content found.");
  return null;
}

// Listens for the trigger message from the side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SUMMARIZE_CURRENT_EMAIL') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id) {
        // Send loading state
        chrome.runtime.sendMessage({ type: 'SUMMARY_LOADING' });

        chrome.scripting.executeScript(
          {
            target: { tabId: activeTab.id },
            func: extractEmailContent,
          },
          (results) => {
            if (chrome.runtime.lastError || !results || !results[0]) {
              console.error("Script injection failed:", chrome.runtime.lastError);
              chrome.runtime.sendMessage({ type: 'SUMMARY_ERROR', payload: 'Failed to access tab.' });
              return;
            }

            const emailText = results[0].result;
            if (!emailText) {
              chrome.runtime.sendMessage({ type: 'SUMMARY_ERROR', payload: 'Could not detect an open email.' });
              return;
            }

            // Proceed with API call
            handleSummarize(emailText);
          }
        );
      } else {
        sendResponse({ error: 'No active tab found.' });
      }
    });
    return true;
  }

  if (message.type === 'DRAFT_REPLY_REQUEST') {
    const prompt = message.prompt;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id) {
        // Send loading state (ChatScreen handles this too, but good to be consistent)
        // chrome.runtime.sendMessage({ type: 'SUMMARY_LOADING' }); // Optional

        chrome.scripting.executeScript(
          {
            target: { tabId: activeTab.id },
            func: extractEmailContent,
          },
          (results) => {
            if (chrome.runtime.lastError || !results || !results[0]) {
              console.error("Draft script injection failed:", chrome.runtime.lastError);
              chrome.runtime.sendMessage({ type: 'DRAFT_ERROR', payload: 'Failed to access tab.' });
              return;
            }

            const emailText = results[0].result;
            if (!emailText) {
              chrome.runtime.sendMessage({ type: 'DRAFT_ERROR', payload: 'Could not detect an email thread to reply to.' });
              return;
            }

            // Proceed with API call
            handleDraftReply(emailText, prompt);
          }
        );
      } else {
        sendResponse({ error: 'No active tab found.' });
      }
    });
    return true;
  }

  if (message.type === 'GET_DAILY_DIGEST') {
    handleDailyDigest(message.date, sendResponse);
    return true;
  }
});


// Helper functions to keep listener clean
async function handleSummarize(emailText: string) {
  try {
    const result = await chrome.storage.local.get(['token', 'selectedModel']);
    const token = typeof result.token === 'string' ? result.token : null;
    const selectedModel = typeof result.selectedModel === 'string' ? result.selectedModel : null;

    if (!token) {
      chrome.runtime.sendMessage({ type: 'SUMMARY_ERROR', payload: 'Not authenticated.' });
      return;
    }

    if (isLocalModel(selectedModel)) {
      const accessError = getLocalModelAccessError(token, selectedModel);
      if (accessError) {
        chrome.runtime.sendMessage({ type: 'SUMMARY_ERROR', payload: accessError });
        return;
      }

      const summary = await summarizeWithLocalModel(emailText, selectedModel);
      await trackUsageEvent('summarize', { model: selectedModel, local: true });
      chrome.runtime.sendMessage({ type: 'SUMMARY_RESULT', payload: summary });
      return;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    if (selectedModel) headers['x-model-id'] = selectedModel;

    const response = await fetch(`${API_URL}/ai/summarize`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: emailText }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    chrome.runtime.sendMessage({ type: 'SUMMARY_RESULT', payload: data.summary });
  } catch (error: any) {
    chrome.runtime.sendMessage({ type: 'SUMMARY_ERROR', payload: error.message || 'Failed to summarize email.' });
  }
}

async function handleDraftReply(emailText: string, prompt: string) {
  try {
    const result = await chrome.storage.local.get(['token', 'selectedModel']);
    const token = typeof result.token === 'string' ? result.token : null;
    const selectedModel = typeof result.selectedModel === 'string' ? result.selectedModel : null;

    if (!token) {
      chrome.runtime.sendMessage({ type: 'DRAFT_ERROR', payload: 'Not authenticated.' });
      return;
    }

    if (isLocalModel(selectedModel)) {
      const accessError = getLocalModelAccessError(token, selectedModel);
      if (accessError) {
        chrome.runtime.sendMessage({ type: 'DRAFT_ERROR', payload: accessError });
        return;
      }

      const reply = await draftReplyWithLocalModel(emailText, prompt, selectedModel);
      await trackUsageEvent('draft', { model: selectedModel, local: true });
      chrome.runtime.sendMessage({ type: 'DRAFT_RESULT', payload: reply });
      return;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    if (selectedModel) headers['x-model-id'] = selectedModel;

    const response = await fetch(`${API_URL}/ai/draft-reply`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ emailContent: emailText, userPrompt: prompt }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    chrome.runtime.sendMessage({ type: 'DRAFT_RESULT', payload: data.reply });
  } catch (error: any) {
    chrome.runtime.sendMessage({ type: 'DRAFT_ERROR', payload: error.message || 'Failed to generate draft reply.' });
  }
}

function handleDailyDigest(date: any, sendResponse: (response: any) => void) {
  chrome.storage.local.get(['token', 'selectedModel'], (result) => {
    if (!result.token) {
      sendResponse({ error: 'Authentication token not found.' });
      return;
    }

    let url = `${API_URL}/gmail/daily-digest`;
    if (date) {
      const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
      url += `?date=${dateStr}`;
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${result.token}`,
    };
    if (result.selectedModel) headers['x-model-id'] = result.selectedModel as string;

    fetch(url, { method: 'GET', headers: headers })
      .then(response => response.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        sendResponse({ summary: data.summary, date: date || new Date().toISOString().split('T')[0] });
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });
  });
}

// ============================================================================
// BACKGROUND EMAIL SYNC — Alarm-based polling for new emails
// ============================================================================

const SYNC_ALARM_NAME = 'mavinmail-sync';
const SYNC_INTERVAL_MINUTES = 2;

// Flag to prevent overlapping sync calls
let isSyncRunning = false;

/**
 * Start the recurring sync alarm.
 * Called when user logs in (token detected).
 */
function startSyncAlarm() {
  chrome.alarms.create(SYNC_ALARM_NAME, {
    delayInMinutes: 0.1, // First tick almost immediately (6 seconds)
    periodInMinutes: SYNC_INTERVAL_MINUTES,
  });
  console.log(`[Sync] ✅ Background sync alarm started (every ${SYNC_INTERVAL_MINUTES} min)`);
}

/**
 * Stop the recurring sync alarm.
 * Called when user logs out.
 */
function stopSyncAlarm() {
  chrome.alarms.clear(SYNC_ALARM_NAME);
  console.log('[Sync] ⏹️ Background sync alarm stopped');
}

/**
 * Handle alarm tick — perform incremental sync.
 */
async function handleSyncAlarm() {
  if (isSyncRunning) {
    console.log('[Sync] Skipping — sync already in progress');
    return;
  }

  // Check if user is still logged in
  const result = await chrome.storage.local.get(['token']);
  if (!result.token) {
    stopSyncAlarm();
    return;
  }

  isSyncRunning = true;

  try {
    // Check if initial sync needs to happen first
    const status = await getSyncStatus();

    if (status.isConnected && !status.initialSyncDone) {
      console.log('[Sync] 🚀 Running initial sync (20 emails)...');
      // Notify the UI that initial sync is starting
      chrome.runtime.sendMessage({ type: 'SYNC_STATUS', status: 'initial_sync_start' }).catch(() => {});

      const initialResult = await apiSyncEmails({ count: 20 });
      console.log(`[Sync] ✅ Initial sync complete: ${initialResult.synced} emails embedded, ${initialResult.skipped} skipped`);

      chrome.runtime.sendMessage({
        type: 'SYNC_STATUS',
        status: 'initial_sync_complete',
        data: initialResult,
      }).catch(() => {});
    } else if (status.isConnected) {
      // Regular incremental sync
      const syncResult = await apiSyncNewEmails();

      if (syncResult.synced > 0) {
        console.log(`[Sync] 📧 Incremental sync: ${syncResult.synced} new emails embedded`);
        chrome.runtime.sendMessage({
          type: 'SYNC_STATUS',
          status: 'new_emails_synced',
          data: syncResult,
        }).catch(() => {});
      }
    }
  } catch (error: any) {
    console.error('[Sync] Background sync error:', error?.message || error);
  } finally {
    isSyncRunning = false;
  }
}

// Listen for alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SYNC_ALARM_NAME) {
    handleSyncAlarm();
  }
});

// Watch for token changes (login/logout) to start/stop sync
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.token) {
    if (changes.token.newValue) {
      // User logged in — start sync
      console.log('[Sync] Token detected, starting background sync...');
      startSyncAlarm();
    } else {
      // User logged out — stop sync
      console.log('[Sync] Token removed, stopping background sync...');
      stopSyncAlarm();
    }
  }
});

// On service worker startup, check if already logged in
chrome.storage.local.get(['token'], (result) => {
  if (result.token) {
    console.log('[Sync] Service worker started with existing token — resuming background sync');
    startSyncAlarm();
  }
});
