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
  [key: string]: unknown; // Allow additional properties like entityId, entities, etc.
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

// Entity Graphics Options
export interface PointOptions {
  id?: string;
  name?: string;
  description?: string;
  pixelSize?: number;
  color?: ColorRGBA | string;
  outlineColor?: ColorRGBA | string;
  outlineWidth?: number;
}

export interface LabelOptions {
  id?: string;
  name?: string;
  description?: string;
  font?: string;
  fillColor?: ColorRGBA | string;
  outlineColor?: ColorRGBA | string;
  outlineWidth?: number;
  style?: string;
  scale?: number;
  pixelOffset?: { x: number; y: number };
}

export interface PolygonOptions {
  id?: string;
  name?: string;
  description?: string;
  height?: number;
  extrudedHeight?: number;
  material?: unknown;
  fillColor?: ColorRGBA | string;
  fillOpacity?: number;
  outline?: boolean;
  outlineColor?: ColorRGBA | string;
}

export interface PolylineOptions {
  id?: string;
  name?: string;
  description?: string;
  width?: number;
  color?: ColorRGBA | string;
  material?: unknown;
  clampToGround?: boolean;
}

export interface BillboardOptions {
  id?: string;
  name?: string;
  description?: string;
  width?: number;
  height?: number;
  scale?: number;
  color?: ColorRGBA | string;
}

export interface ModelOptions {
  id?: string;
  name?: string;
  description?: string;
  scale?: number;
  minimumPixelSize?: number;
  maximumScale?: number;
  runAnimations?: boolean;
  show?: boolean;
  orientation?: {
    heading?: number;
    pitch?: number;
    roll?: number;
  };
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

// Server configuration types
export type Protocol = "sse" | "websocket";

export interface ServerConfig {
  name: string;
  port: number;
  protocol?: Protocol;
}
