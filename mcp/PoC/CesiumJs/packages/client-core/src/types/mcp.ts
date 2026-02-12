/**
 * MCP Communication Types
 */

import type {
  CesiumClockRange,
  CesiumClockStep,
  CesiumLabelStyle,
  CesiumQuaternion,
} from "./cesium-types.js";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

export interface MCPCommand {
  id?: string;
  type: string;
  [key: string]: unknown;
}

export interface MCPCommandResult {
  success: boolean;
  message?: string | null;
  error?: string | null;
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
  prefix?: string;
  prefixes?: string[];
  setUp(): void | Promise<void>;
  shutdown(): void | Promise<void>;
  getCommandHandlers(): Map<string, CommandHandler>;
}

// Camera types - These are naturally JsonValue-compatible
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

// Entity types
export interface EntityOptions {
  id?: string;
  name?: string;
  description?: string;
}

export interface PointOptions extends EntityOptions {
  pixelSize?: number;
  color?: string | ColorRGBA;
  outlineColor?: string | ColorRGBA;
  outlineWidth?: number;
}

export interface LabelOptions extends EntityOptions {
  font?: string;
  fillColor?: string | ColorRGBA;
  outlineColor?: string | ColorRGBA;
  outlineWidth?: number;
  style?: CesiumLabelStyle | string;
  scale?: number;
  pixelOffset?: { x: number; y: number };
}

export interface PolygonOptions extends EntityOptions {
  height?: number;
  extrudedHeight?: number;
  material?: { color?: string | ColorRGBA } | string | ColorRGBA;
  fillColor?: string | ColorRGBA;
  fillOpacity?: number;
  outline?: boolean;
  outlineColor?: string | ColorRGBA;
}

export interface PolylineOptions extends EntityOptions {
  width?: number;
  material?: { color?: string | ColorRGBA } | string | ColorRGBA;
  color?: string | ColorRGBA;
  clampToGround?: boolean;
}

export interface BillboardOptions extends EntityOptions {
  width?: number;
  height?: number;
  scale?: number;
  color?: string | ColorRGBA;
}

export interface ModelOptions extends EntityOptions {
  orientation?: CesiumQuaternion;
  scale?: number;
  minimumPixelSize?: number;
  maximumScale?: number;
  runAnimations?: boolean;
  show?: boolean;
}

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

// Clock types
export interface ClockConfig {
  startTime?: string | JulianDate;
  stopTime?: string | JulianDate;
  currentTime?: string | JulianDate;
  multiplier?: number;
  clockRange?: CesiumClockRange;
  clockStep?: CesiumClockStep;
  shouldAnimate?: boolean;
}

export interface JulianDate {
  dayNumber?: number;
  secondsOfDay?: number;
}

// Globe types
export interface GlobeLightingOptions {
  enableLighting: boolean;
  enableDynamicAtmosphere?: boolean;
  enableSunLighting?: boolean;
}

// Server configuration types
export type Protocol = "sse" | "websocket";

export interface ServerConfig {
  name: string;
  port: number;
  capabilities: string[];
  protocol?: Protocol;
}
