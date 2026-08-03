// content.tsx
// Inject Mavin Side Widget into Pages (Shadow DOM Version)

// ---------------------------
// CONFIGURATION
// ---------------------------
const WIDGET_WIDTH = 50;
const TRIGGER_ZONE = 20;
const HIDE_ZONE = 150;
const WIDGET_HOST_ID = "mavin-side-widget-host";

// ---------------------------
// SHADOW DOM SETUP
// ---------------------------
function createWidgetInShadowDOM() {
  if (document.getElementById(WIDGET_HOST_ID)) return null;

  // 1. Create Host Element
  const host = document.createElement("div");
  host.id = WIDGET_HOST_ID;
  host.style.position = "fixed";
  host.style.top = "0";
  host.style.left = "0";
  host.style.border = "none";
  host.style.zIndex = "2147483647"; // Max Z-Index
  host.style.pointerEvents = "none";
  // Inject into documentElement (<html>) to avoid Body transforms affecting position
  document.documentElement.appendChild(host);

  // 2. Attach Shadow Root
  const shadow = host.attachShadow({ mode: "open" });

  // 3. Inject Styles INSIDE Shadow DOM
  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
      font-family: sans-serif;
      font-size: 16px; /* Force base font size */
      line-height: 1;
      text-size-adjust: none; /* Prevent mobile text inflation */
    }
    #widget-container {
      position: fixed;
      top: 50%;
      right: -${WIDGET_WIDTH + 10}px;
      transform: translateY(-50%);
      width: ${WIDGET_WIDTH}px;
      height: 30px;
      background-color: #181818;
      border-top-left-radius: 12px;
      border-bottom-left-radius: 12px;
      box-shadow: -4px 0 12px rgba(0,0,0,0.15);
      cursor: pointer;
      transition: right 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      pointer-events: auto;
      box-sizing: border-box;
      z-index: 2147483647;
    }

    #widget-container:hover {
      right: 0px !important;
    }

    #widget-container img {
      width: 18px !important;
      height: 18px !important;
      min-width: 18px;
      min-height: 18px;
      max-width: 18px;
      max-height: 20px;
      object-fit: contain;
      pointer-events: none;
      display: block;
      margin: 0;
      padding: 0;
      border: none;
    }
  `;
  shadow.appendChild(style);

  // 4. Create Widget Elements
  const widgetContainer = document.createElement("div");
  widgetContainer.id = "widget-container";

  const logo = document.createElement("img");
  logo.src = chrome.runtime.getURL("mavinlogo.png");
  logo.alt = "Mavin AI";

  widgetContainer.appendChild(logo);
  shadow.appendChild(widgetContainer);

  // 5. Add Event Listeners
  widgetContainer.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "openSidePanel" });
    hideWidget(true);
  });

  return widgetContainer; // Return the inner container for animation control
}

const widgetEl = createWidgetInShadowDOM();

const widgetParams = {
  isHiddenForcefully: false,
  isVisible: false
};

// ---------------------------
// MOUSE TRACKING & VISIBILITY
// ---------------------------
function showWidget() {
  if (widgetParams.isHiddenForcefully) return;
  if (widgetEl && !widgetParams.isVisible) {
    widgetEl.style.right = "0px";
    widgetParams.isVisible = true;
  }
}

function hideWidget(force = false) {
  if (widgetEl && (widgetParams.isVisible || force)) {
    widgetEl.style.right = `-${WIDGET_WIDTH + 10}px`;
    widgetParams.isVisible = false;
    if (force) {
      widgetParams.isHiddenForcefully = true;
    }
  }
}

// Global mouse listener needs to be on document (outside shadow DOM)
document.addEventListener("mousemove", (e) => {
  const { clientX } = e;
  const windowWidth = window.innerWidth;

  if (widgetParams.isHiddenForcefully && clientX < windowWidth - 300) {
    widgetParams.isHiddenForcefully = false;
  }

  const distFromRight = windowWidth - clientX;

  if (distFromRight < 50) {
    showWidget();
  } else if (distFromRight > HIDE_ZONE) {
    hideWidget();
  }
});

console.log("Mavin AI Widget: Shadow DOM loaded.");

// Flash on load
setTimeout(() => {
  showWidget();
  setTimeout(() => hideWidget(), 2000);
}, 1000);
