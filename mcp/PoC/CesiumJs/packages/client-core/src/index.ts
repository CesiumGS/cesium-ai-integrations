/**
 * @cesium-mcp/client-core
 * Main entry point for the shared Cesium MCP client library
 */

// Core application
export { CesiumApp } from "./cesium-app.js";
export type { CesiumAppConfig, ApplicationStatus } from "./cesium-app.js";

// Communication managers
export { BaseCommunicationManager } from "./communications/base-communication.js";
export { default as SSECommunicationManager } from "./communications/sse-communication.js";
export { default as WebSocketCommunicationManager } from "./communications/websocket-communication.js";

// Domain managers
export { default as CesiumCameraController } from "./managers/camera-manager.js";

// Utilities - Camera
export {
  flyToPosition,
  setCameraView,
  getCameraPosition,
  lookAtPosition,
  getCameraViewRectangle,
} from "./shared/camera-utils.js";

// Utilities - Cesium
export {
  toRadians,
  toDegrees,
  createCartesian3,
  positionToCartesian3,
  positionsToCartesian3Array,
  cartesian3ToPosition,
  parseColor,
  parseJulianDate,
  formatJulianDate,
  createOrientation,
  createHeadingPitchRange,
  parseEasingFunction,
} from "./shared/cesium-utils.js";

// Utilities - Entity
export {
  addPointEntity,
  addLabelEntity,
  addPolylineEntity,
  addPolygonEntity,
} from "./shared/entity-utils.js";

// Utilities - Validation
export {
  validateLongitude,
  validateLatitude,
  validateHeight,
  validatePosition,
  validatePositions,
} from "./shared/validation-utils.js";
export type { ValidationResult } from "./shared/validation-utils.js";

// Utilities - Error handling
export { getErrorMessage } from "./shared/error-utils.js";

// Utilities - Constants
export {
  DEFAULT_ORBIT_SPEED,
  DEFAULT_CAMERA_PITCH,
  DEFAULT_CAMERA_HEADING,
  DEFAULT_CAMERA_ROLL,
  DEFAULT_CAMERA_HEIGHT,
  DEFAULT_CAMERA_POSITION,
  DEFAULT_FLY_DURATION,
  DEFAULT_SERVER_CONFIG,
  DEFAULT_RECONNECT_DELAY,
  MAX_RECONNECT_ATTEMPTS,
} from "./shared/constants.js";

// Types - MCP
export type {
  ManagerInterface,
  ServerConfig,
  MCPCommand,
  MCPCommandResult,
  CommandHandler,
  SSEMessage,
  Protocol,
} from "./types/mcp.js";

// Types - Camera
export type {
  CameraOrientation,
  CameraPosition,
  ViewRectangle,
  CameraFlyToResult,
  CameraViewResult,
  CameraPositionResult,
  CameraOrbitResult,
  CameraTargetResult,
  CameraControllerSettings,
  CameraControllerResult,
  CameraFlyToOptions,
  CameraLookAtOffset,
  CameraControllerOptions,
} from "./types/mcp.js";

// Types - Common
export type { Position, ColorRGBA, JulianDate } from "./types/mcp.js";

// Types - Communication
export type { CommunicationManager } from "./types/communication-manager.js";

// Note: Cesium is expected to be loaded globally (from CDN or bundled)
// Clients should load Cesium before initializing CesiumApp
