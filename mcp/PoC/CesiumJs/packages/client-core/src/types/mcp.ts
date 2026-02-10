/**
 * MCP Communication Types
 */

export interface MCPCommand {
  id?: string;
  type: string;
  [key: string]: any;
}

export interface MCPCommandResult {
  success: boolean;
  message?: string;
  error?: string;
  [key: string]: any;
}

export interface SSEMessage {
  type: 'connected' | 'command' | 'heartbeat';
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
  style?: any;
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
  orientation?: any;
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
  clockRange?: any;
  clockStep?: any;
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
export type Protocol = 'sse' | 'websocket';

export interface ServerConfig {
  name: string;
  port: number;
  capabilities: string[];
  protocol?: Protocol;
}
