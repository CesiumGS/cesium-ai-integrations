import { z } from "zod";
import {
  PositionSchema,
  ColorSchema,
  PositionSampleSchema,
  JulianDateSchema,
  PolylineMaterialSchema,
} from "./core-schemas.js";

/**
 * Path graphics for visualizing animation trail
 */
export const PathGraphicsSchema = z
  .object({
    show: z.boolean().optional().default(true).describe("Whether to show the path"),
    leadTime: z.number().min(0).optional().describe("Seconds ahead to show path"),
    trailTime: z.number().min(0).optional().describe("Seconds behind to show path"),
    width: z.number().min(1).optional().default(3).describe("Path line width in pixels"),
    material: PolylineMaterialSchema.optional().describe("Path line material"),
    resolution: z
      .number()
      .min(1)
      .optional()
      .default(60)
      .describe("Sample resolution in seconds"),
  })
  .describe("Path visualization configuration");

/**
 * Model preset types with default URIs
 */
export const ModelPresetSchema = z
  .enum(["cesium_man", "car", "bike", "airplane", "custom"])
  .describe("Predefined model types");

/**
 * Model configuration with preset or custom URI
 */
export const ModelConfigSchema = z
  .object({
    preset: ModelPresetSchema.optional().describe("Use predefined model"),
    uri: z.string().optional().describe("Custom model URI (overrides preset)"),
    scale: z.number().min(0).optional().default(1).describe("Model scale"),
    minimumPixelSize: z
      .number()
      .min(0)
      .optional()
      .default(64)
      .describe("Minimum pixel size for model"),
    heightOffset: z
      .number()
      .optional()
      .default(0)
      .describe("Height offset above ground in meters"),
  })
  .describe("Model configuration for animated entity");

/**
 * Animation configuration for creating animated entities
 */
export const AnimationConfigSchema = z
  .object({
    entityId: z.string().optional().describe("Entity ID (auto-generated if not provided)"),
    name: z.string().optional().describe("Human-readable name"),
    positionSamples: z
      .array(PositionSampleSchema)
      .min(2)
      .describe("Array of position samples with timing"),
    startTime: z
      .string()
      .optional()
      .describe("Animation start time (ISO 8601, defaults to first sample time)"),
    stopTime: z
      .string()
      .optional()
      .describe("Animation stop time (ISO 8601, defaults to last sample time)"),
    interpolationAlgorithm: z
      .enum(["LINEAR", "LAGRANGE", "HERMITE"])
      .optional()
      .default("LAGRANGE")
      .describe("Position interpolation method"),
    autoOrient: z
      .boolean()
      .optional()
      .default(true)
      .describe("Automatically face direction of travel"),
    showPath: z
      .boolean()
      .optional()
      .default(true)
      .describe("Show path trail visualization"),
    pathConfig: PathGraphicsSchema.optional().describe("Path visualization settings"),
    model: ModelConfigSchema.optional().describe("3D model configuration"),
    clampToGround: z.boolean().optional().default(false).describe("Clamp entity to terrain"),
    loopMode: z
      .enum(["none", "loop", "pingpong"])
      .optional()
      .default("none")
      .describe("Animation loop behavior"),
  })
  .describe("Complete animation configuration");

/**
 * Simplified route-based animation configuration
 * Accepts route structure from geolocation_route tool
 */
export const RouteAnimationConfigSchema = z
  .object({
    entityId: z.string().optional().describe("Entity ID (auto-generated if not provided)"),
    name: z.string().optional().describe("Human-readable name"),
    // Support flexible route formats - unified schema accepts all route formats
    route: z
      .object({
        summary: z.string().optional().describe("Route summary"),
        distance: z.number().optional().describe("Total distance in meters"),
        duration: z.number().optional().describe("Estimated duration in seconds"),
        polyline: z
          .union([
            z.string().describe("Encoded polyline geometry"),
            z
              .array(
                z.union([
                  PositionSchema,
                  z
                    .tuple([z.number(), z.number(), z.number().optional()])
                    .describe("[longitude, latitude, height]"),
                ]),
              )
              .describe("Array of decoded coordinates"),
          ])
          .optional()
          .describe("Route geometry - encoded string or decoded coordinates"),
        legs: z
          .array(
            z.object({
              distance: z.number().optional(),
              duration: z.number().optional(),
              startLocation: PositionSchema.optional(),
              endLocation: PositionSchema.optional(),
              steps: z
                .array(
                  z.object({
                    instruction: z.string().optional().describe("Turn-by-turn instruction"),
                    distance: z.number().optional().describe("Step distance in meters"),
                    duration: z.number().optional().describe("Step duration in seconds"),
                    startLocation: PositionSchema.optional(),
                    endLocation: PositionSchema.optional(),
                  }),
                )
                .optional(),
            }),
          )
          .optional(),
        startLocation: PositionSchema.optional().describe("Starting point (for simple routes)"),
        endLocation: PositionSchema.optional().describe("Ending point (for simple routes)"),
        waypoints: z.array(PositionSchema).optional().describe("Intermediate waypoints"),
        travelMode: z.enum(["walking", "driving", "cycling", "transit"]).optional(),
      })
      .describe("Route from geolocation_route tool - supports polyline array, legs, or simple start/end"),
    speedMultiplier: z
      .number()
      .min(0.1)
      .max(100)
      .optional()
      .default(10)
      .describe("Speed multiplier for playback"),
    modelPreset: z
      .enum(["cesium_man", "car", "bike", "airplane", "auto"])
      .optional()
      .default("auto")
      .describe("Model preset (auto selects based on travel mode)"),
    showPath: z.boolean().optional().default(true).describe("Show animated path trail"),
  })
  .describe("Configuration for creating animation from geolocation route");

/**
 * Animation state tracking
 */
export const AnimationStateSchema = z
  .object({
    entityId: z.string().describe("Animated entity ID"),
    name: z.string().optional().describe("Entity name"),
    isAnimating: z.boolean().describe("Whether animation is currently playing"),
    currentTime: z.string().describe("Current animation time (ISO 8601)"),
    startTime: z.string().describe("Animation start time (ISO 8601)"),
    stopTime: z.string().describe("Animation stop time (ISO 8601)"),
    progress: z.number().min(0).max(1).describe("Animation progress (0-1)"),
    elapsedSeconds: z.number().min(0).describe("Seconds elapsed since start"),
    remainingSeconds: z.number().min(0).describe("Seconds remaining until stop"),
    clockMultiplier: z.number().describe("Current clock speed multiplier"),
    loopMode: z.enum(["none", "loop", "pingpong"]).describe("Loop behavior"),
    hasModel: z.boolean().describe("Whether entity has 3D model"),
    hasPath: z.boolean().describe("Whether entity has path visualization"),
  })
  .describe("Current animation state");

/**
 * Camera tracking configuration
 */
export const CameraTrackingConfigSchema = z
  .object({
    animationId: z.string().describe("Animation ID to track"),
    range: z.number().optional().default(1000).describe("Camera distance in meters"),
    pitch: z.number().optional().default(-45).describe("Camera pitch in degrees"),
    heading: z.number().optional().default(0).describe("Camera heading offset in degrees"),
  })
  .describe("Camera tracking configuration");

/**
 * Clock control schema
 */
export const ClockControlSchema = z
  .object({
    shouldAnimate: z.boolean().optional().describe("Start/stop animation"),
    multiplier: z.number().optional().describe("Speed multiplier"),
    currentTime: JulianDateSchema.optional().describe("Jump to specific time"),
    clockRange: z
      .enum(["UNBOUNDED", "CLAMPED", "LOOP_STOP"])
      .optional()
      .describe("Clock boundary behavior"),
  })
  .describe("Clock control parameters");

/**
 * Path update configuration
 */
export const PathUpdateConfigSchema = z
  .object({
    animationId: z.string().describe("Animation ID"),
    leadTime: z.number().optional().describe("Seconds of path ahead"),
    trailTime: z.number().optional().describe("Seconds of path behind"),
    width: z.number().optional().describe("Path width in pixels"),
    color: ColorSchema.optional().describe("Path color"),
  })
  .describe("Path visualization update");

/**
 * CZML export options
 */
export const CZMLExportOptionsSchema = z
  .object({
    entityIds: z.array(z.string()).optional().describe("Entity IDs to export (all if omitted)"),
    includeClock: z
      .boolean()
      .optional()
      .default(true)
      .describe("Include clock configuration"),
    includeStyles: z
      .boolean()
      .optional()
      .default(true)
      .describe("Include path/model styles"),
    compressed: z.boolean().optional().default(false).describe("Minimize CZML output"),
  })
  .describe("CZML export options");

/**
 * Animation play input
 */
export const AnimationPlayInputSchema = z.object({
  animationId: z.string().describe("Animation ID to play"),
});

/**
 * Animation pause input
 */
export const AnimationPauseInputSchema = z.object({
  animationId: z.string().describe("Animation ID to pause"),
});

/**
 * Animation remove input
 */
export const AnimationRemoveInputSchema = z.object({
  animationId: z.string().describe("Animation ID to remove"),
  entityId: z.string().optional().describe("Entity ID (derived from animation if not provided)"),
});

/**
 * Animation update speed input
 */
export const AnimationUpdateSpeedInputSchema = z.object({
  animationId: z.string().optional().describe("Specific animation ID (optional)"),
  multiplier: z.number().min(0.1).max(100).describe("Speed multiplier (1 = real-time)"),
});

/**
 * Animation list active input
 */
export const AnimationListActiveInputSchema = z.object({});

/**
 * Animation track entity input
 */
export const AnimationTrackEntityInputSchema = z.object({
  entityId: z.string().describe("Entity ID to track"),
  range: z.number().optional().default(1000).describe("Camera distance in meters"),
  pitch: z.number().optional().default(-45).describe("Camera pitch in degrees"),
  heading: z.number().optional().default(0).describe("Camera heading offset in degrees"),
});

/**
 * Animation untrack camera input
 */
export const AnimationUntrackCameraInputSchema = z.object({});

/**
 * Clock configure input
 */
export const ClockConfigureInputSchema = z.object({
  startTime: z.string().optional().describe("Clock start time (ISO 8601)"),
  stopTime: z.string().optional().describe("Clock stop time (ISO 8601)"),
  currentTime: z.string().optional().describe("Current time (ISO 8601)"),
  multiplier: z.number().optional().describe("Speed multiplier"),
  shouldAnimate: z.boolean().optional().describe("Whether clock should animate"),
  clockRange: z
    .enum(["UNBOUNDED", "CLAMPED", "LOOP_STOP"])
    .optional()
    .describe("Clock boundary behavior"),
});

/**
 * Clock set time input
 */
export const ClockSetTimeInputSchema = z.object({
  currentTime: z.string().describe("Time to set (ISO 8601)"),
});

/**
 * Clock set multiplier input
 */
export const ClockSetMultiplierInputSchema = z.object({
  multiplier: z.number().min(0.1).max(100).describe("Speed multiplier"),
});

/**
 * Timeline zoom to range input
 */
export const TimelineZoomToRangeInputSchema = z.object({
  startTime: z.string().describe("Range start time (ISO 8601)"),
  stopTime: z.string().describe("Range stop time (ISO 8601)"),
});

/**
 * Globe set lighting input
 */
export const GlobeSetLightingInputSchema = z.object({
  enableLighting: z.boolean().describe("Enable globe lighting"),
  enableDynamicAtmosphere: z.boolean().optional().default(true).describe("Enable dynamic atmosphere lighting"),
  enableSunLighting: z.boolean().optional().default(true).describe("Enable sun lighting"),
});

// Export inferred types
export type PathGraphics = z.infer<typeof PathGraphicsSchema>;
export type ModelPreset = z.infer<typeof ModelPresetSchema>;
export type ModelConfig = z.infer<typeof ModelConfigSchema>;
export type AnimationConfig = z.infer<typeof AnimationConfigSchema>;
export type RouteAnimationConfig = z.infer<typeof RouteAnimationConfigSchema>;
export type AnimationState = z.infer<typeof AnimationStateSchema>;
export type CameraTrackingConfig = z.infer<typeof CameraTrackingConfigSchema>;
export type ClockControl = z.infer<typeof ClockControlSchema>;
export type PathUpdateConfig = z.infer<typeof PathUpdateConfigSchema>;
export type CZMLExportOptions = z.infer<typeof CZMLExportOptionsSchema>;
export type AnimationPlayInput = z.infer<typeof AnimationPlayInputSchema>;
export type AnimationPauseInput = z.infer<typeof AnimationPauseInputSchema>;
export type AnimationRemoveInput = z.infer<typeof AnimationRemoveInputSchema>;
export type AnimationUpdateSpeedInput = z.infer<typeof AnimationUpdateSpeedInputSchema>;
export type AnimationListActiveInput = z.infer<typeof AnimationListActiveInputSchema>;
export type AnimationTrackEntityInput = z.infer<typeof AnimationTrackEntityInputSchema>;
export type AnimationUntrackCameraInput = z.infer<typeof AnimationUntrackCameraInputSchema>;
export type ClockConfigureInput = z.infer<typeof ClockConfigureInputSchema>;
export type ClockSetTimeInput = z.infer<typeof ClockSetTimeInputSchema>;
export type ClockSetMultiplierInput = z.infer<typeof ClockSetMultiplierInputSchema>;
export type TimelineZoomToRangeInput = z.infer<typeof TimelineZoomToRangeInputSchema>;
export type GlobeSetLightingInput = z.infer<typeof GlobeSetLightingInputSchema>;
