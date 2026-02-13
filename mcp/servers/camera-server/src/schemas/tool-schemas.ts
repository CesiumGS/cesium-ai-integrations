import { z } from "zod";
import {
  CesiumPositionSchema,
  CesiumOrientationSchema,
  EasingFunctionSchema,
} from "./core-schemas.js";

/**
 * Tool-specific input and output schemas
 * These are schemas specific to individual camera tools
 */

export const CameraControllerOptionsSchema = z.object({
  enableCollisionDetection: z
    .boolean()
    .optional()
    .describe("Allow camera to go underground (default: true)"),
  minimumZoomDistance: z
    .number()
    .min(0)
    .optional()
    .describe("Minimum distance camera can zoom to surface"),
  maximumZoomDistance: z
    .number()
    .min(0)
    .optional()
    .describe("Maximum distance camera can zoom from surface"),
  enableTilt: z.boolean().optional().describe("Allow camera tilting"),
  enableRotate: z.boolean().optional().describe("Allow camera rotation"),
  enableTranslate: z.boolean().optional().describe("Allow camera translation"),
  enableZoom: z.boolean().optional().describe("Allow camera zooming"),
  enableLook: z.boolean().optional().describe("Allow free look around"),
});

export const OrbitOptionsSchema = z.object({
  speed: z
    .number()
    .optional()
    .describe("Orbit speed in radians per second (default: 0.005)"),
  direction: z
    .enum(["clockwise", "counterclockwise"])
    .optional()
    .describe("Orbit direction (default: counterclockwise)"),
});

/**
 * Combined input schema for camera_fly_to tool
 * Merges position, orientation, and flight options
 */
export const CameraFlyToInputSchema = z.object({
  destination: CesiumPositionSchema,
  orientation: CesiumOrientationSchema.optional(),
  duration: z
    .number()
    .min(0)
    .optional()
    .describe("Animation duration in seconds (default: 3)"),
  easingFunction: EasingFunctionSchema,
  maximumHeight: z
    .number()
    .min(0)
    .optional()
    .describe("Maximum height during flight in meters"),
  pitchAdjustHeight: z
    .number()
    .min(0)
    .optional()
    .describe("Height above ground to adjust pitch"),
  flyOverLongitude: z
    .number()
    .optional()
    .describe("Longitude to fly over during flight"),
  flyOverLongitudeWeight: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Weight of flyOverLongitude (0-1)"),
});

/**
 * Input schema for camera_look_at_transform tool
 */
export const CameraLookAtTransformInputSchema = z.object({
  target: CesiumPositionSchema.describe("Target position to look at"),
  offset: z
    .object({
      heading: z.number().describe("Heading in radians"),
      pitch: z.number().describe("Pitch in radians"),
      range: z.number().min(0).describe("Distance from target in meters"),
    })
    .optional()
    .describe(
      "Camera offset from target (default: heading=0, pitch=-90°, range=1000m)",
    ),
});

/**
 * Input schema for camera_set_view tool
 */
export const CameraSetViewInputSchema = z.object({
  destination: CesiumPositionSchema,
  orientation: CesiumOrientationSchema.optional(),
});

// Type exports for TypeScript
export type CameraControllerOptions = z.infer<
  typeof CameraControllerOptionsSchema
>;
export type OrbitOptions = z.infer<typeof OrbitOptionsSchema>;
export type CameraFlyToInput = z.infer<typeof CameraFlyToInputSchema>;
export type CameraLookAtTransformInput = z.infer<
  typeof CameraLookAtTransformInputSchema
>;
export type CameraSetViewInput = z.infer<typeof CameraSetViewInputSchema>;
