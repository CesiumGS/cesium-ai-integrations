/**
 * Centralized schema exports for the camera server
 *
 * This module re-exports all schemas from their respective files:
 * - core-schemas.ts: Fundamental Cesium data types
 * - tool-schemas.ts: Tool-specific input/output schemas
 * - response-schemas.ts: Common response patterns
 */

// Core Cesium schemas
export {
  CesiumPositionSchema,
  CesiumOrientationSchema,
  EasingFunctionSchema,
  type CesiumPosition,
  type CesiumOrientation,
  type EasingFunction,
} from "./core-schemas.js";

// Tool-specific schemas
export {
  CameraControllerOptionsSchema,
  CameraFlyToInputSchema,
  CameraLookAtTransformInputSchema,
  CameraSetViewInputSchema,
  OrbitOptionsSchema,
  type CameraControllerOptions,
  type CameraFlyToInput,
  type CameraLookAtTransformInput,
  type CameraSetViewInput,
  type OrbitOptions,
} from "./tool-schemas.js";

// Response schemas
export {
  StatsSchema,
  ExtendedStatsSchema,
  ViewRectangleSchema,
  CameraOperationResponseSchema,
  CameraFlyToResponseSchema,
  CameraSetViewResponseSchema,
  CameraOrbitResponseSchema,
  CameraGetPositionResponseSchema,
  CameraLookAtTransformResponseSchema,
  CameraControllerOptionsResponseSchema,
  type Stats,
  type ExtendedStats,
  type ViewRectangle,
  type CameraOperationResponse,
  type CameraFlyToResponse,
  type CameraSetViewResponse,
  type CameraOrbitResponse,
  type CameraGetPositionResponse,
  type CameraLookAtTransformResponse,
  type CameraControllerOptionsResponse,
} from "./response-schemas.js";
