/**
 * TypeScript declarations for CesiumJS global objects
 * Since we're loading Cesium via CDN, we need to declare the global Cesium namespace
 */

import type CesiumApp from '../cesium-app';

declare global {
  // Using any for Cesium because the CDN version includes classes not in @cesium/engine
  const Cesium: any;
  
  interface Window {
    CONFIG?: AppConfig;
    cesiumApp?: () => CesiumApp | null;
    getApplicationStatus?: () => ApplicationStatus;
    Cesium: any;
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
