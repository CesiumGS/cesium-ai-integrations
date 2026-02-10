/**
 * @cesium-mcp/client-core
 * Main entry point for the shared Cesium MCP client library
 */

// Core application
export { CesiumApp } from './cesium-app.js';
export type { CesiumAppConfig, ApplicationStatus } from './cesium-app.js';

// Communication managers
export { BaseCommunicationManager } from './communications/base-communication.js';
export { default as SSECommunicationManager } from './communications/sse-communication.js';
export { default as WebSocketCommunicationManager } from './communications/websocket-communication.js';

// Domain managers
export { default as CesiumCameraController } from './managers/camera-controller.js';

// Utilities
export * from './shared/camera-utils.js';
export * from './shared/cesium-utils.js';
export * from './shared/validation-utils.js';

// Types
export type { ManagerInterface, ServerConfig, MCPCommand } from './types/mcp.js';
export type { CommunicationManager } from './types/communication-manager.js';

// Note: Cesium is expected to be loaded globally (from CDN or bundled)
// Clients should load Cesium before initializing CesiumApp
