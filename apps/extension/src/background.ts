// background.ts
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(err => console.error(err));

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
function handleSummarize(emailText: string) {
  chrome.storage.local.get(['token', 'selectedModel'], (result) => {
    if (!result.token) return; // Silent fail or send error

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${result.token}`,
    };
    if (result.selectedModel) headers['x-model-id'] = result.selectedModel as string;

    fetch('http://localhost:5001/api/ai/summarize', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ text: emailText }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        chrome.runtime.sendMessage({ type: 'SUMMARY_RESULT', payload: data.summary });
      })
      .catch(err => {
        chrome.runtime.sendMessage({ type: 'SUMMARY_ERROR', payload: err.message });
      });
  });
}

function handleDraftReply(emailText: string, prompt: string) {
  chrome.storage.local.get(['token', 'selectedModel'], (result) => {
    if (!result.token) {
      chrome.runtime.sendMessage({ type: 'DRAFT_ERROR', payload: 'Not authenticated.' });
      return;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${result.token}`,
    };
    if (result.selectedModel) headers['x-model-id'] = result.selectedModel as string;

    fetch('http://localhost:5001/api/ai/draft-reply', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ emailContent: emailText, userPrompt: prompt }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        chrome.runtime.sendMessage({ type: 'DRAFT_RESULT', payload: data.reply });
      })
      .catch(err => {
        chrome.runtime.sendMessage({ type: 'DRAFT_ERROR', payload: err.message });
      });
  });
}

function handleDailyDigest(date: any, sendResponse: (response: any) => void) {
  chrome.storage.local.get(['token', 'selectedModel'], (result) => {
    if (!result.token) {
      sendResponse({ error: 'Authentication token not found.' });
      return;
    }

    let url = 'http://localhost:5001/api/gmail/daily-digest';
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



