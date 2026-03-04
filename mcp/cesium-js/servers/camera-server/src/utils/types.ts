import { CommandResult } from "@cesium-mcp/shared";

/**
 * JSON-serializable value type for structured content
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Type for structured content in responses
 */
export type StructuredContent = Record<string, JsonValue>;

/**
 * Camera position in geographic coordinates
 */
export interface CameraPosition {
  longitude: number;
  latitude: number;
  height: number;
}

/**
 * Camera orientation angles
 */
export interface CameraOrientation {
  heading: number;
  pitch: number;
  roll: number;
}

/**
 * View rectangle bounds
 */
export interface ViewRectangle {
  west: number;
  south: number;
  east: number;
  north: number;
}

/**
 * Result type for camera position queries
 */
export interface CameraPositionResult extends CommandResult {
  position?: CameraPosition;
  orientation?: CameraOrientation;
  viewRectangle?: ViewRectangle;
  altitude?: number;
}

/**
 * Result type for camera fly-to operations
 */
export interface CameraFlyToResult extends CommandResult {
  position?: CameraPosition;
  orientation?: CameraOrientation;
  actualDuration?: number;
  cancelled?: boolean;
}

/**
 * Result type for camera view operations
 */
export interface CameraViewResult extends CommandResult {
  position?: CameraPosition;
  orientation?: CameraOrientation;
}

/**
 * Result type for camera orbit operations
 */
export interface CameraOrbitResult extends CommandResult {
  orbitActive?: boolean;
  speed?: number;
}

/**
 * Result type for camera target operations
 */
export interface CameraTargetResult extends CommandResult {
  target?: CameraPosition;
  offset?: CameraOrientation | Record<string, number>;
}

/**
 * Result type for camera controller configuration
 */
export interface CameraControllerResult extends CommandResult {
  options?: Record<string, unknown>;
}

/**
 * Typed settings returned by camera_set_controller_options
 */
export interface CameraControllerOptionsSettings {
  enableCollisionDetection?: boolean | null;
  minimumZoomDistance?: number | null;
  maximumZoomDistance?: number | null;
  enableTilt?: boolean | null;
  enableRotate?: boolean | null;
  enableTranslate?: boolean | null;
  enableZoom?: boolean | null;
  enableLook?: boolean | null;
}

/**
 * Result type for camera controller options operations
 */
export interface CameraControllerOptionsResult extends CommandResult {
  settings?: CameraControllerOptionsSettings | null;
}
