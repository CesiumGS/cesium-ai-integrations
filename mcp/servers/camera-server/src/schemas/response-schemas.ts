import { z } from "zod";
import {
  CesiumPositionSchema,
  CesiumOrientationSchema,
} from "./core-schemas.js";

/**
 * Common response schemas and patterns
 * These schemas define standard response structures used across tools
 */

export const StatsSchema = z.object({
  responseTime: z.number().describe("Response time in milliseconds"),
});

export const ExtendedStatsSchema = StatsSchema.extend({
  actualDuration: z
    .number()
    .optional()
    .describe("Actual animation duration in seconds"),
});

export const ViewRectangleSchema = z
  .object({
    west: z.number(),
    south: z.number(),
    east: z.number(),
    north: z.number(),
  })
  .optional()
  .describe("Visible geographic bounds");

/**
 * Standard response schema for camera operations
 * Includes success status, message, and performance stats
 */
export const CameraOperationResponseSchema = z.object({
  success: z.boolean().describe("Whether the operation succeeded"),
  message: z.string().describe("Human-readable status message"),
  stats: StatsSchema,
});

/**
 * Response schema for animated camera fly operations
 * Extends movement response with actualDuration tracking
 */
export const CameraFlyToResponseSchema = z.object({
  success: z.boolean().describe("Whether the operation succeeded"),
  message: z.string().describe("Human-readable status message"),
  finalPosition: CesiumPositionSchema,
  finalOrientation: CesiumOrientationSchema,
  stats: ExtendedStatsSchema,
});

/**
 * Response schema for instant camera view changes
 * Uses 'position' and 'orientation' (not 'final...')
 */
export const CameraSetViewResponseSchema = z.object({
  success: z.boolean().describe("Whether the operation succeeded"),
  message: z.string().describe("Human-readable status message"),
  position: CesiumPositionSchema,
  orientation: CesiumOrientationSchema,
  stats: StatsSchema,
});

/**
 * Response schema for orbit operations
 */
export const CameraOrbitResponseSchema = CameraOperationResponseSchema.extend({
  orbitActive: z.boolean().describe("Whether orbit is currently active"),
  speed: z.number().optional().describe("Orbit speed in radians per second"),
  direction: z.string().optional().describe("Orbit direction"),
});

/**
 * Response schema for camera position query (get_position tool)
 */
export const CameraGetPositionResponseSchema = z.object({
  position: CesiumPositionSchema,
  orientation: CesiumOrientationSchema,
  viewRectangle: ViewRectangleSchema,
  altitude: z.number().describe("Camera altitude above sea level"),
  timestamp: z.string(),
  stats: StatsSchema,
});

/**
 * Response schema for look-at-transform operations
 */
export const CameraLookAtTransformResponseSchema =
  CameraOperationResponseSchema.extend({
    target: CesiumPositionSchema,
    offset: z.object({
      heading: z.number().describe("Heading in radians"),
      pitch: z.number().describe("Pitch in radians"),
      range: z.number().min(0).describe("Distance from target in meters"),
    }),
  });

/**
 * Response schema for controller options operations
 */
export const CameraControllerOptionsResponseSchema =
  CameraOperationResponseSchema.extend({
    settings: z.object({
      enableCollisionDetection: z.boolean(),
      minimumZoomDistance: z.number().optional(),
      maximumZoomDistance: z.number().optional(),
      enableTilt: z.boolean(),
      enableRotate: z.boolean(),
      enableTranslate: z.boolean(),
      enableZoom: z.boolean(),
      enableLook: z.boolean(),
    }),
  });

// Type exports for TypeScript
export type Stats = z.infer<typeof StatsSchema>;
export type ExtendedStats = z.infer<typeof ExtendedStatsSchema>;
export type ViewRectangle = z.infer<typeof ViewRectangleSchema>;
export type CameraOperationResponse = z.infer<
  typeof CameraOperationResponseSchema
>;
export type CameraFlyToResponse = z.infer<typeof CameraFlyToResponseSchema>;
export type CameraSetViewResponse = z.infer<typeof CameraSetViewResponseSchema>;
export type CameraOrbitResponse = z.infer<typeof CameraOrbitResponseSchema>;
export type CameraGetPositionResponse = z.infer<
  typeof CameraGetPositionResponseSchema
>;
export type CameraLookAtTransformResponse = z.infer<
  typeof CameraLookAtTransformResponseSchema
>;
export type CameraControllerOptionsResponse = z.infer<
  typeof CameraControllerOptionsResponseSchema
>;
