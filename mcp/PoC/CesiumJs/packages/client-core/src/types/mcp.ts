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

// Material type for entities
export interface MaterialColor {
  color?: ColorRGBA | string;
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
  material?: MaterialColor | string;
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
  material?: MaterialColor | string;
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

export interface EllipseOptions {
  id?: string;
  name?: string;
  description?: string;
  semiMajorAxis?: number;
  semiMinorAxis?: number;
  height?: number;
  extrudedHeight?: number;
  material?: MaterialColor | string;
  fillColor?: ColorRGBA | string;
  fillOpacity?: number;
  outline?: boolean;
  outlineColor?: ColorRGBA | string;
  rotation?: number;
}

export interface RectangleOptions {
  id?: string;
  name?: string;
  description?: string;
  west?: number;
  south?: number;
  east?: number;
  north?: number;
  height?: number;
  extrudedHeight?: number;
  material?: MaterialColor | string;
  fillColor?: ColorRGBA | string;
  fillOpacity?: number;
  outline?: boolean;
  outlineColor?: ColorRGBA | string;
  rotation?: number;
}

export interface WallOptions {
  id?: string;
  name?: string;
  description?: string;
  positions?: Position[];
  minimumHeights?: number[];
  maximumHeights?: number[];
  material?: MaterialColor | string;
  fillColor?: ColorRGBA | string;
  outline?: boolean;
  outlineColor?: ColorRGBA | string;
}

export interface CylinderOptions {
  id?: string;
  name?: string;
  description?: string;
  length?: number;
  topRadius?: number;
  bottomRadius?: number;
  material?: MaterialColor | string;
  fillColor?: ColorRGBA | string;
  outline?: boolean;
  outlineColor?: ColorRGBA | string;
  orientation?: {
    heading?: number;
    pitch?: number;
    roll?: number;
  };
}

export interface BoxOptions {
  id?: string;
  name?: string;
  description?: string;
  dimensions?: {
    x: number;
    y: number;
    z: number;
  };
  material?: MaterialColor | string;
  fillColor?: ColorRGBA | string;
  outline?: boolean;
  outlineColor?: ColorRGBA | string;
  orientation?: {
    heading?: number;
    pitch?: number;
    roll?: number;
  };
}

export interface CorridorOptions {
  id?: string;
  name?: string;
  description?: string;
  positions?: Position[];
  width?: number;
  height?: number;
  extrudedHeight?: number;
  material?: MaterialColor | string;
  fillColor?: ColorRGBA | string;
  fillOpacity?: number;
  outline?: boolean;
  outlineColor?: ColorRGBA | string;
  cornerType?: "ROUNDED" | "MITERED" | "BEVELED";
}

// Entity input data types for generic entity creation
export interface EntityInputData {
  id?: string;
  name?: string;
  description?: string;
  entityType?: string;
  position?: Position;
  point?: {
    pixelSize?: number;
    color?: ColorRGBA | string;
    outlineColor?: ColorRGBA | string;
    outlineWidth?: number;
  };
  label?: {
    text?: string;
    font?: string;
    fillColor?: ColorRGBA | string;
    outlineColor?: ColorRGBA | string;
    outlineWidth?: number;
    style?: string;
    scale?: number;
    pixelOffset?: { x: number; y: number };
  };
  text?: string; // Alternative for label text
  polygon?: {
    hierarchy?: Position[];
    height?: number;
    extrudedHeight?: number;
    material?: MaterialColor | string;
    outline?: boolean;
    outlineColor?: ColorRGBA | string;
  };
  polyline?: {
    positions?: Position[];
    width?: number;
    material?: MaterialColor | string;
    clampToGround?: boolean;
  };
  billboard?: {
    image?: string;
    width?: number;
    height?: number;
    scale?: number;
    color?: ColorRGBA | string;
  };
  model?: {
    uri?: string;
    scale?: number;
    minimumPixelSize?: number;
    maximumScale?: number;
  };
  box?: {
    dimensions?: { x: number; y: number; z: number };
    material?: MaterialColor | string;
    fillColor?: ColorRGBA | string;
    outline?: boolean;
    outlineColor?: ColorRGBA | string;
  };
  corridor?: {
    positions?: Position[];
    width?: number;
    material?: MaterialColor | string;
    fillColor?: ColorRGBA | string;
    outline?: boolean;
    outlineColor?: ColorRGBA | string;
    cornerType?: "ROUNDED" | "MITERED" | "BEVELED";
    height?: number;
    extrudedHeight?: number;
  };
  cylinder?: {
    length?: number;
    topRadius?: number;
    bottomRadius?: number;
    material?: MaterialColor | string;
    fillColor?: ColorRGBA | string;
    outline?: boolean;
    outlineColor?: ColorRGBA | string;
  };
  ellipse?: {
    semiMajorAxis?: number;
    semiMinorAxis?: number;
    material?: MaterialColor | string;
    fillColor?: ColorRGBA | string;
    fillOpacity?: number;
    outline?: boolean;
    outlineColor?: ColorRGBA | string;
    height?: number;
    extrudedHeight?: number;
    rotation?: number;
  };
  rectangle?: {
    coordinates?: {
      west: number;
      south: number;
      east: number;
      north: number;
    };
    material?: MaterialColor | string;
    fillColor?: ColorRGBA | string;
    fillOpacity?: number;
    outline?: boolean;
    outlineColor?: ColorRGBA | string;
    height?: number;
    extrudedHeight?: number;
    rotation?: number;
  };
  wall?: {
    positions?: Position[];
    minimumHeights?: number[];
    maximumHeights?: number[];
    material?: MaterialColor | string;
    fillColor?: ColorRGBA | string;
    outline?: boolean;
    outlineColor?: ColorRGBA | string;
  };
  // Legacy/alternative property names
  positions?: Position[];
  coordinates?: Position[];
  imageUrl?: string;
  height?: number;
  extrudedHeight?: number;
  material?: MaterialColor | string;
  outline?: boolean;
  outlineColor?: ColorRGBA | string;
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
