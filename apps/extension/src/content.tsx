// content.tsx
// Inject button into Gmail
const buttonStyles = `
  #assistant-trigger-btn {
    position: fixed; bottom: 70px; left: 25px; z-index: 2147483646;
    cursor: pointer; border-radius: 6px; font-weight: 600;
    background: #181818; color: white; padding: 10px 16px;
    border: 1px solid #444; font-family: Inter, sans-serif;
  }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = buttonStyles;
document.head.appendChild(styleSheet);

const triggerButton = document.createElement("button");
triggerButton.id = "assistant-trigger-btn";
triggerButton.innerText = "Ask Assistant";
document.body.appendChild(triggerButton);

// ✅ When clicked → tell background to open the side panel
triggerButton.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "openSidePanel" });
});


console.log("Meeco AI content script loaded");

// ---------------------------
// Inject SLIDE-IN PANEL
// ---------------------------
const panel = document.createElement("iframe");
panel.src = chrome.runtime.getURL("panel.html");
panel.style.position = "fixed";
panel.style.top = "0";
panel.style.right = "-420px";
panel.style.width = "420px";
panel.style.height = "100vh";
panel.style.border = "none";
panel.style.zIndex = "9999999";
panel.style.transition = "right 0.3s ease";
document.body.appendChild(panel);

// ---------------------------
// Inject RIGHT-SIDE NOTCH (like Grammarly)
// ---------------------------
const notch = document.createElement("div");
notch.style.position = "fixed";
notch.style.top = "40%";
notch.style.right = "0";
notch.style.cursor = "pointer";
notch.style.zIndex = "99999999";

notch.innerHTML = `
  <div style="
    background:white;
    border-radius: 8px 0 0 8px;
    padding: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  ">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none">
      <path d="M18.4895 22.669L12.8177 19.563C12.5094 19.3927 
      12.1337 19.3927 11.8254 19.563L6.15358 22.669C5.24057 
      23.168 4.24536 22.1552 4.77085 21.2628L11.435 9.97192C11.8313 
      9.29964 12.8089 9.29964 13.2052 9.97192L19.8693 21.2628C20.3948 
      22.1552 19.4025 23.168 18.4866 22.669H18.4895ZM12.3216 
      7.71728C14.127 7.71728 15.589 6.25822 15.589 4.45862C15.589 
      2.65901 14.127 1.19995 12.3216 1.19995C10.5161 1.19995 9.05409 
      2.65901 9.05409 4.45862C9.05409 6.25822 10.5161 7.71728 12.3216 
      7.71728Z" fill="black"/>
    </svg>
  </div>
`;
document.body.appendChild(notch);

// ---------------------------
// Open/Close Handler
// ---------------------------
notch.addEventListener("click", () => {
  if (panel.style.right === "0px") {
    panel.style.right = "-420px";
  } else {
    panel.style.right = "0px";
  }
});

