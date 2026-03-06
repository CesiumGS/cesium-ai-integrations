import { CesiumApp, type CesiumAppConfig } from "@cesium-mcp/client-core";

// Constants
const STATUS_UPDATE_INTERVAL = 2000; // milliseconds

type McpServerStatus = {
  isConnected: boolean;
  name: string;
  port: number;
};

type AppGlobals = Window & {
  cesiumApp?: () => CesiumApp | null;
  getApplicationStatus?: () => { isInitialized: boolean };
};

let cesiumApp: CesiumApp | null = null;
let statusUpdateInterval: number | null = null;

// Build configuration from environment variables
const config: CesiumAppConfig = {
  cesiumAccessToken:
    process.env.CESIUM_ACCESS_TOKEN || "your_access_token_here",
  mcpProtocol: (process.env.MCP_PROTOCOL || "websocket") as "sse" | "websocket",
  mcpServers: [
    {
      name: "Camera Server",
      port: parseInt(process.env.MCP_CAMERA_PORT || "3002"),
    },
    {
      name: "Entity Server",
      port: parseInt(process.env.MCP_ENTITY_PORT || "3003"),
    },
    {
      name: "Animation Server",
      port: parseInt(process.env.MCP_ANIMATION_PORT || "3004"),
    },
    {
      name: "Geolocation Server",
      port: parseInt(process.env.MCP_GEOLOCATION_PORT || "3005"),
    },
  ],
};

/**
 * Initialize the Cesium application
 */
async function initializeApplication(): Promise<void> {
  try {
    cesiumApp = new CesiumApp("cesiumContainer", config);
    await cesiumApp.initialize();
    initializeUI();
    startStatusUpdates();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    showError("Failed to initialize the 3D viewer", message);
  }
}

/**
 * Get protocol icon based on protocol type
 */
function getProtocolIcon(protocol: string): string {
  return protocol === "websocket" ? "🔌 WS" : "📡 SSE";
}

/**
 * Initialize UI event handlers
 */
function initializeUI(): void {
  const toggleBtn = document.getElementById("toggleStatus");
  const statusContent = document.getElementById("statusContent");
  const statusPanel = document.getElementById("statusPanel");

  if (toggleBtn && statusContent && statusPanel) {
    toggleBtn.addEventListener("click", () => {
      const isCollapsed = statusContent.style.display === "none";
      statusContent.style.display = isCollapsed ? "block" : "none";
      toggleBtn.textContent = isCollapsed ? "−" : "+";
      statusPanel.classList.toggle("collapsed", !isCollapsed);
    });
  }

  const closeError = document.getElementById("closeError");
  const retryBtn = document.getElementById("retryBtn");

  if (closeError) {
    closeError.addEventListener("click", hideError);
  }
  if (retryBtn) {
    retryBtn.addEventListener("click", () => {
      hideError();
      location.reload();
    });
  }
}

/**
 * Show error panel with message
 */
function showError(title: string, message: string): void {
  const errorPanel = document.getElementById("errorPanel");
  const errorContent = document.getElementById("errorContent");

  if (errorPanel && errorContent) {
    errorContent.innerHTML = `
      <p><strong>${title}</strong></p>
      <p class="error-message">${message}</p>
      <p class="error-hint">Check the browser console for more details.</p>
    `;
    errorPanel.classList.remove("hidden");
  }
}

/**
 * Hide error panel
 */
function hideError(): void {
  const errorPanel = document.getElementById("errorPanel");
  if (errorPanel) {
    errorPanel.classList.add("hidden");
  }
}

/**
 * Update status display
 */
function updateStatus(): void {
  if (!cesiumApp) {
    return;
  }

  const status = cesiumApp.getStatus();
  const mcpServerStatus = document.getElementById("mcpServerStatus");

  if (mcpServerStatus && status.mcpCommunication?.servers) {
    const servers = status.mcpCommunication.servers as McpServerStatus[];
    const protocol = config.mcpProtocol || "websocket";
    const protocolIcon = getProtocolIcon(protocol);

    mcpServerStatus.innerHTML = servers
      .map(
        (server) => `
      <div class="server-item ${server.isConnected ? "connected" : "disconnected"}">
        <span class="status-icon">${server.isConnected ? "🟢" : "🔴"}</span>
        <span class="server-name">${server.name}</span>
        <span class="server-port">:${server.port}</span>
        <span class="server-protocol">${protocolIcon}</span>
      </div>
    `,
      )
      .join("");
  }
}

/**
 * Start periodic status updates
 */
function startStatusUpdates(): void {
  updateStatus();
  statusUpdateInterval = window.setInterval(
    updateStatus,
    STATUS_UPDATE_INTERVAL,
  );
}

/**
 * Stop periodic status updates
 */
function stopStatusUpdates(): void {
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
    statusUpdateInterval = null;
  }
}

/**
 * Shutdown the application
 */
async function shutdownApplication(): Promise<void> {
  stopStatusUpdates();
  if (cesiumApp) {
    await cesiumApp.shutdown();
    cesiumApp = null;
  }
}

/**
 * Get current application status
 */
function getApplicationStatus() {
  return cesiumApp ? cesiumApp.getStatus() : { isInitialized: false };
}

// Expose globals for debugging
const appGlobals = window as AppGlobals;
appGlobals.cesiumApp = () => cesiumApp;
appGlobals.getApplicationStatus = getApplicationStatus;

// Initialize on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApplication);
} else {
  initializeApplication();
}

// Cleanup on unload
window.addEventListener("beforeunload", shutdownApplication);
