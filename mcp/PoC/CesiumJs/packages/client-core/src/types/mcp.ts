/**
 * MCP Communication Types
 */

export interface MCPCommand {
  id?: string;
  type: string;
  [key: string]: unknown;
}

export interface MCPCommandResult {
  success: boolean;
  message?: string | null;
  error?: string | null;
  [key: string]: unknown; // Allow additional properties
}

export interface SSEMessage {
  type: "connected" | "command" | "heartbeat";
  command?: MCPCommand;
  message?: string;
}

export interface CommandHandler {
  (command: MCPCommand): Promise<MCPCommandResult> | MCPCommandResult;
}

export interface ManagerInterface {
  setUp(): void | Promise<void>;
  shutdown(): void | Promise<void>;
  getCommandHandlers(): Map<string, CommandHandler>;
}

// Camera types
export interface CameraOrientation {
  heading?: number;
  pitch?: number;
  roll?: number;
}

export interface CameraPosition {
  longitude: number;
  latitude: number;
  height: number;
}

export interface ViewRectangle {
  west: number;
  south: number;
  east: number;
  north: number;
}

// Specific result types for camera operations
export interface CameraFlyToResult extends MCPCommandResult {
  position?: CameraPosition;
  orientation?: CameraOrientation;
  actualDuration?: number;
  cancelled?: boolean;
}

export interface CameraViewResult extends MCPCommandResult {
  position?: CameraPosition;
  orientation?: CameraOrientation;
}

export interface CameraPositionResult extends MCPCommandResult {
  position?: CameraPosition;
  orientation?: CameraOrientation;
  viewRectangle?: ViewRectangle | null;
  altitude?: number;
}

export interface CameraOrbitResult extends MCPCommandResult {
  orbitActive?: boolean;
  speed?: number;
}

export interface CameraTargetResult extends MCPCommandResult {
  target?: CameraPosition;
  offset?: CameraOrientation | Record<string, number>;
}

export interface CameraControllerSettings {
  enableCollisionDetection?: boolean;
  minimumZoomDistance?: number;
  maximumZoomDistance?: number;
  enableTilt?: boolean;
  enableRotate?: boolean;
  enableTranslate?: boolean;
  enableZoom?: boolean;
  enableLook?: boolean;
}

export interface CameraControllerResult extends MCPCommandResult {
  settings?: CameraControllerSettings;
}

export interface CameraFlyToOptions {
  easingFunction?: string;
  maximumHeight?: number;
  pitchAdjustHeight?: number;
  flyOverLongitude?: number;
  flyOverLongitudeWeight?: number;
  complete?: () => void;
  cancel?: () => void;
}

// Common types
export interface ColorRGBA {
  red: number;
  green: number;
  blue: number;
  alpha?: number;
}

export interface Position {
  longitude: number;
  latitude: number;
  height?: number;
}

export interface JulianDate {
  dayNumber?: number;
  secondsOfDay?: number;
}

// Camera controller types
export interface CameraLookAtOffset {
  heading?: number;
  pitch?: number;
  range?: number;
}

export interface CameraControllerOptions {
  enableCollisionDetection?: boolean;
  minimumZoomDistance?: number;
  maximumZoomDistance?: number;
  enableTilt?: boolean;
  enableRotate?: boolean;
  enableTranslate?: boolean;
  enableZoom?: boolean;
  enableLook?: boolean;
}

// Clock configuration types
export interface ClockConfig {
  startTime: string | JulianDate;
  stopTime: string | JulianDate;
  currentTime: string | JulianDate;
  clockRange: string;
  clockStep?: string;
  multiplier?: number;
  shouldAnimate?: boolean;
}

// Server configuration types
export type Protocol = "sse" | "websocket";

export interface ServerConfig {
  name: string;
  port: number;
  protocol?: Protocol;
}

// Animation types
export interface PositionSample extends Position {
  time: string | JulianDate;
}

export interface AnimationState {
  entityId: string;
  startTime: string | JulianDate;
  stopTime: string | JulianDate;
  modelPreset: string;
  entity: any; // Cesium.Entity is not typed in this module
}
