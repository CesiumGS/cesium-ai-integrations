import { z } from "zod";
import {
  ColorSchema,
  PositionSampleSchema,
  JulianDateSchema,
  PolylineMaterialSchema,
  ModelPresetSchema,
  LoopModeSchema,
  InterpolationAlgorithmSchema,
  ClockSchema,
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
    interpolationAlgorithm: InterpolationAlgorithmSchema
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
    loopMode: LoopModeSchema
      .optional()
      .default("none")
      .describe("Animation loop behavior"),
  })
  .describe("Complete animation configuration");

/**
 * Animation state tracking
 */
export const AnimationStateSchema = z
  .object({
    animationId: z.string().describe("Animation ID"),
    name: z.string().optional().describe("Animation name"),
    isAnimating: z.boolean().describe("Whether animation is currently playing"),
    currentTime: z.string().describe("Current animation time (ISO 8601)"),
    startTime: z.string().describe("Animation start time (ISO 8601)"),
    stopTime: z.string().describe("Animation stop time (ISO 8601)"),
    progress: z.number().min(0).max(1).describe("Animation progress (0-1)"),
    elapsedSeconds: z.number().min(0).describe("Seconds elapsed since start"),
    remainingSeconds: z.number().min(0).describe("Seconds remaining until stop"),
    clockMultiplier: z.number().describe("Current clock speed multiplier"),
    loopMode: LoopModeSchema.describe("Loop behavior"),
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
    animationIds: z.array(z.string()).optional().describe("Animation IDs to export (all if omitted)"),
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
 * Animation control input
 */
export const AnimationControlInputSchema = z.object({
  animationId: z.string().describe("Animation ID to control"),
  action: z
    .enum(["play", "pause"])
    .describe("Action to perform: 'play' to start/resume, 'pause' to pause"),
});

/**
 * Animation remove input
 */
export const AnimationRemoveInputSchema = z.object({
  animationId: z.string().describe("Animation ID to remove"),
});

/**
 * Animation list active input
 */
export const AnimationListActiveInputSchema = z.object({});

/**
 * Animation track entity input
 */
export const AnimationTrackEntityInputSchema = z.object({
  animationId: z.string().describe("Animation ID to track"),
  range: z.number().optional().default(1000).describe("Camera distance in meters"),
  pitch: z.number().optional().default(-45).describe("Camera pitch in degrees"),
  heading: z.number().optional().default(0).describe("Camera heading offset in degrees"),
});

/**
 * Animation untrack camera input
 */
export const AnimationUntrackCameraInputSchema = z.object({});

/**
 * Animation camera tracking input (unified track/untrack)
 */
export const AnimationCameraTrackingInputSchema = z.object({
  track: z.boolean().describe("true to track entity, false to stop tracking"),
  animationId: z.string().describe("Animation ID to track or untrack"),
  range: z.number().optional().describe("Distance from entity in meters (default: 1000)"),
  pitch: z.number().optional().describe("Camera pitch angle in degrees (default: -45)"),
  heading: z.number().optional().describe("Camera heading angle in degrees (default: 0)"),
});

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
 * Clock control input (unified)
 */
export const ClockControlInputSchema = z.object({
  action: z
    .enum(["configure", "setTime", "setMultiplier"])
    .describe(
      "Action to perform: 'configure' for full clock setup, 'setTime' to change current time, 'setMultiplier' to change time rate",
    ),
  clock: ClockSchema
    .optional()
    .describe("Full clock configuration (required for 'configure' action)"),
  currentTime: JulianDateSchema
    .optional()
    .describe("Current time to set (required for 'setTime' action)"),
  multiplier: z
    .number()
    .optional()
    .describe(
      "Time rate multiplier (required for 'setMultiplier' action, e.g., 1000 for 1000x real time)",
    ),
});

/**
 * Timeline zoom to range input
 */
export const TimelineZoomToRangeInputSchema = z.object({
  startTime: JulianDateSchema.describe("Range start time"),
  stopTime: JulianDateSchema.describe("Range stop time"),
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
export type ModelConfig = z.infer<typeof ModelConfigSchema>;
export type AnimationConfig = z.infer<typeof AnimationConfigSchema>;
export type AnimationState = z.infer<typeof AnimationStateSchema>;
export type CameraTrackingConfig = z.infer<typeof CameraTrackingConfigSchema>;
export type ClockControl = z.infer<typeof ClockControlSchema>;
export type PathUpdateConfig = z.infer<typeof PathUpdateConfigSchema>;
export type CZMLExportOptions = z.infer<typeof CZMLExportOptionsSchema>;
export type AnimationPlayInput = z.infer<typeof AnimationPlayInputSchema>;
export type AnimationPauseInput = z.infer<typeof AnimationPauseInputSchema>;
export type AnimationControlInput = z.infer<typeof AnimationControlInputSchema>;
export type AnimationRemoveInput = z.infer<typeof AnimationRemoveInputSchema>;
export type AnimationListActiveInput = z.infer<typeof AnimationListActiveInputSchema>;
export type AnimationTrackEntityInput = z.infer<typeof AnimationTrackEntityInputSchema>;
export type AnimationUntrackCameraInput = z.infer<typeof AnimationUntrackCameraInputSchema>;
export type AnimationCameraTrackingInput = z.infer<typeof AnimationCameraTrackingInputSchema>;
export type ClockConfigureInput = z.infer<typeof ClockConfigureInputSchema>;
export type ClockSetTimeInput = z.infer<typeof ClockSetTimeInputSchema>;
export type ClockSetMultiplierInput = z.infer<typeof ClockSetMultiplierInputSchema>;
export type ClockControlInput = z.infer<typeof ClockControlInputSchema>;
export type TimelineZoomToRangeInput = z.infer<typeof TimelineZoomToRangeInputSchema>;
export type GlobeSetLightingInput = z.infer<typeof GlobeSetLightingInputSchema>;

/**
 * Animation update speed input (legacy - for compatibility)
 */
export const AnimationUpdateSpeedInputSchema = z.object({
  animationId: z.string().optional().describe("Animation ID (if omitted, affects all animations)"),
  multiplier: z.number().describe("Speed multiplier"),
});
export type AnimationUpdateSpeedInput = z.infer<typeof AnimationUpdateSpeedInputSchema>;

/**
 * Route animation config (legacy - for compatibility)
 */
export const RouteAnimationConfigSchema = z.object({
  route: z.any().describe("Route data from geolocation_route"),
  modelPreset: z.string().optional().describe("Model preset to use"),
  speedMultiplier: z.number().optional().describe("Speed multiplier"),
  showPath: z.boolean().optional().describe("Show path visualization"),
  name: z.string().optional().describe("Animation name"),
});
export type RouteAnimationConfig = z.infer<typeof RouteAnimationConfigSchema>;
