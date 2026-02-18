/**
 * Cesium Application Core
 * Browser-based Cesium application setup and configuration
 *
 * Note: Cesium is expected to be available globally (from CDN)
 */

import type { CesiumViewer } from "./types/cesium-types.js";
import CesiumCameraController from "./managers/camera-manager.js";
import CesiumEntityManager from "./managers/entity-manager.js";
import { BaseCommunicationManager } from "./communications/base-communication.js";
import SSECommunicationManager from "./communications/sse-communication.js";
import WebSocketCommunicationManager from "./communications/websocket-communication.js";
import type { ManagerInterface, ServerConfig } from "./types/mcp.js";
import { getErrorMessage } from "./shared/error-utils.js";

export interface CesiumAppConfig {
  cesiumAccessToken: string;
  mcpServers: ServerConfig[];
  mcpProtocol?: "sse" | "websocket";
}

export interface ApplicationStatus {
  isInitialized: boolean;
  viewer: boolean;
  mcpCommunication: ReturnType<
    BaseCommunicationManager["getConnectionStatus"]
  > | null;
}

export class CesiumApp {
  viewer: CesiumViewer | null;
  mcpCommunication: BaseCommunicationManager | null;
  config: CesiumAppConfig;
  isInitialized: boolean;
  managers: ManagerInterface[];
  private containerId: string;

  constructor(containerId: string, config: CesiumAppConfig) {
    this.containerId = containerId;
    this.config = config;
    this.viewer = null;
    this.mcpCommunication = null;
    this.isInitialized = false;
    this.managers = [];

    // Set Cesium access token
    Cesium.Ion.defaultAccessToken = config.cesiumAccessToken;
  }

  async initialize(): Promise<void> {
    await this.initializeViewer();
    this.initializeControllers();
    await this.initializeMCPCommunication();
    this.isInitialized = true;
  }

  async initializeViewer(): Promise<void> {
    try {
      // Validate Cesium is available
      if (typeof Cesium === "undefined") {
        throw new Error(
          "Cesium library is not loaded. Ensure Cesium is available globally.",
        );
      }

      // Validate container exists
      const container = document.getElementById(this.containerId);
      if (!container) {
        throw new Error(
          `Container element with id '${this.containerId}' not found.`,
        );
      }

      // Initialize viewer with Cesium Ion World Terrain
      this.viewer = new Cesium.Viewer(this.containerId, {
        terrain: Cesium.Terrain.fromWorldTerrain(),
        baseLayerPicker: false,
        shouldAnimate: true,
      });

      if (this.viewer) {
        this.enableGlobeLighting();
      }
    } catch (error) {
      console.error("Failed to initialize Cesium Viewer:", error);
      throw error;
    }
  }

  private enableGlobeLighting(): void {
    if (this.viewer?.scene?.globe) {
      this.viewer.scene.globe.enableLighting = true;
      this.viewer.scene.globe.dynamicAtmosphereLighting = true;
      this.viewer.scene.globe.dynamicAtmosphereLightingFromSun = true;
    }
  }

  initializeControllers(): void {
    if (!this.viewer) {
      return;
    }

    this.managers = [
      new CesiumCameraController(this.viewer),
      new CesiumEntityManager(this.viewer),
    ];
  }

  async initializeMCPCommunication(): Promise<void> {
    const protocol = this.config.mcpProtocol || "websocket";

    // Directly instantiate the appropriate communication manager
    this.mcpCommunication =
      protocol === "websocket"
        ? new WebSocketCommunicationManager(
            this.managers,
            this.config.mcpServers,
          )
        : new SSECommunicationManager(this.managers, this.config.mcpServers);

    await this.mcpCommunication.connect();
  }

  getStatus(): ApplicationStatus {
    return {
      isInitialized: this.isInitialized,
      viewer: !!this.viewer,
      mcpCommunication: this.mcpCommunication
        ? this.mcpCommunication.getConnectionStatus()
        : null,
    };
  }

  async shutdown(): Promise<void> {
    try {
      // Disconnect MCP communication
      if (this.mcpCommunication) {
        try {
          this.mcpCommunication.disconnect();
        } catch (error: unknown) {
          console.error(
            "Error disconnecting MCP communication:",
            getErrorMessage(error),
          );
        }
        this.mcpCommunication = null;
      }

      // Shutdown all managers
      this.managers.forEach((manager) => {
        try {
          manager.shutdown();
        } catch (error: unknown) {
          console.error("Error shutting down manager:", getErrorMessage(error));
        }
      });
      this.managers = [];

      // Destroy viewer and its resources
      if (this.viewer && !this.viewer.isDestroyed()) {
        try {
          this.viewer.destroy();
        } catch (error: unknown) {
          console.error("Error destroying viewer:", getErrorMessage(error));
        }
        this.viewer = null;
      }

      this.isInitialized = false;
    } catch (error: unknown) {
      console.error(
        "Error during application shutdown:",
        getErrorMessage(error),
      );
      throw error;
    }
  }
}
