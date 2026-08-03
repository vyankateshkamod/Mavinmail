import React, { useState } from "react";

const Widget: React.FC = () => {
  const [open, setOpen] = useState(false);

  const togglePanel = () => {
    setOpen(!open);

    // ✅ Trigger Chrome Side Panel API (Chrome 114+)
    if (!open) {
      chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
    }
  };

  return (
    <div
      onClick={togglePanel}
      className="fixed bottom-5 left-5 flex items-center gap-2 bg-black text-purple-300 font-medium rounded-full px-3 py-2 cursor-pointer shadow-lg z-50 transition-transform hover:scale-105"
    >
      <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-800">
        <img src="icon.png" alt="avatar" className="w-full h-full object-cover" />
      </div>
      <span className="text-sm">Open Chat</span>
    </div>
  );
};

export default Widget;
