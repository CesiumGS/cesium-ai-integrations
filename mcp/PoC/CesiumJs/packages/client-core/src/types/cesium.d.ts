/**
 * TypeScript declarations for CesiumJS global objects
 * Since we're loading Cesium via CDN, we need to declare the global Cesium namespace
 */

import type CesiumApp from "../cesium-app";

type CesiumGlobal = typeof import("cesium");

declare global {
  const Cesium: CesiumGlobal;

  interface Window {
    CONFIG?: AppConfig;
    cesiumApp?: () => CesiumApp | null;
    getApplicationStatus?: () => ApplicationStatus;
    Cesium: CesiumGlobal;
  }

  const CONFIG: AppConfig | undefined;
}

export interface AppConfig {
  CESIUM_ACCESS_TOKEN: string;
  MCP_BASE_URL?: string;
  MCP_SERVERS: ServerConfig[];
}

export interface ServerConfig {
  name: string;
  port: number;
  capabilities: string[];
}

export interface ApplicationStatus {
  isInitialized: boolean;
  viewer?: boolean;
  mcpCommunication?: {
    servers: ServerStatus[];
    totalServers: number;
    connectedServers: number;
  };
}

export interface ServerStatus {
  name: string;
  port: number;
  capabilities: string[];
  isConnected: boolean;
  readyState: number | string;
}

export {};
