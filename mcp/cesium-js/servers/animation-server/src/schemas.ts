import { z } from "zod";

// Note: Common schemas re-defined locally to avoid cross-package TypeScript compilation issues

// Re-define commonly used schemas for animation
export const PositionSchema = z.object({
  longitude: z.number().describe("Longitude in degrees"),
  latitude: z.number().describe("Latitude in degrees"),
  height: z.number().optional().describe("Height above ellipsoid in meters"),
});

export const ColorSchema = z
  .object({
    red: z.number().min(0).max(1),
    green: z.number().min(0).max(1),
    blue: z.number().min(0).max(1),
    alpha: z.number().min(0).max(1).optional().default(1),
  })
  .describe("RGBA color values (0-1)");

export const JulianDateSchema = z
  .object({
    dayNumber: z.number().describe("Julian day number"),
    secondsOfDay: z.number().describe("Seconds into the day"),
  })
  .describe("Julian date for precise time representation");

export const TimeIntervalSchema = z
  .object({
    start: JulianDateSchema,
    stop: JulianDateSchema,
    isStartIncluded: z.boolean().optional().default(true),
    isStopIncluded: z.boolean().optional().default(true),
  })
  .describe("Time interval definition");

export const PositionSampleSchema = z
  .object({
    time: z.string().describe("ISO 8601 timestamp"),
    longitude: z.number().describe("Longitude in degrees"),
    latitude: z.number().describe("Latitude in degrees"),
    height: z
      .number()
      .optional()
      .default(0)
      .describe("Height in meters above WGS84 ellipsoid"),
  })
  .describe("Position sample at a specific time");

export const ClockSchema = z
  .object({
    startTime: z.string().describe("Clock start time (ISO 8601)"),
    stopTime: z.string().describe("Clock stop time (ISO 8601)"),
    currentTime: z.string().describe("Clock current time (ISO 8601)"),
    clockRange: z
      .enum(["UNBOUNDED", "CLAMPED", "LOOP_STOP"])
      .describe("Clock behavior at boundaries"),
    clockStep: z
      .enum(["TICK_DEPENDENT", "SYSTEM_CLOCK_MULTIPLIER", "SYSTEM_CLOCK"])
      .optional()
      .default("SYSTEM_CLOCK_MULTIPLIER"),
    multiplier: z
      .number()
      .optional()
      .default(1)
      .describe("Time rate multiplier"),
    shouldAnimate: z.boolean().optional().default(true),
  })
  .describe("Clock configuration for animation timing");

export const PolylineMaterialSchema = z
  .union([
    z.object({
      type: z.literal("color"),
      color: ColorSchema,
    }),
    z.object({
      type: z.literal("outline"),
      color: ColorSchema,
      outlineWidth: z.number().min(0),
      outlineColor: ColorSchema,
    }),
    z.object({
      type: z.literal("glow"),
      color: ColorSchema,
      glowPower: z.number().min(0).max(1),
    }),
  ])
  .describe("Polyline-specific material definition");

// Animation-specific schemas

/**
 * Path graphics for visualizing animation trail
 */
export const PathGraphicsSchema = z
  .object({
    show: z
      .boolean()
      .optional()
      .default(true)
      .describe("Whether to show the path"),
    leadTime: z
      .number()
      .min(0)
      .optional()
      .describe("Seconds ahead to show path"),
    trailTime: z
      .number()
      .min(0)
      .optional()
      .describe("Seconds behind to show path"),
    width: z
      .number()
      .min(1)
      .optional()
      .default(3)
      .describe("Path line width in pixels"),
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
 * Model preset types with default URIs from CesiumGS repository
 * Available presets: cesium_man, cesium_air, ground_vehicle, cesium_drone, custom
 */
export const ModelPresetSchema = z
  .enum([
    "cesium_man",
    "cesium_air",
    "ground_vehicle",
    "cesium_drone",
    "custom",
  ])
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
    name: z.string().optional().describe("Human-readable name"),
    positionSamples: z
      .array(PositionSampleSchema)
      .min(2)
      .describe("Array of position samples with timing"),
    startTime: z
      .string()
      .optional()
      .describe(
        "Animation start time (ISO 8601, defaults to first sample time)",
      ),
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
    pathConfig: PathGraphicsSchema.optional().describe(
      "Path visualization settings",
    ),
    model: ModelConfigSchema.optional().describe("3D model configuration"),
    clampToGround: z
      .boolean()
      .optional()
      .default(false)
      .describe("Clamp entity to terrain"),
    loopMode: z
      .enum(["none", "loop", "pingpong"])
      .optional()
      .default("none")
      .describe("Animation loop behavior: none, loop, or pingpong"),
  })
  .describe("Complete animation configuration");

/**
 * Simplified route-based animation configuration
 * Accepts route structure from geolocation_route tool
 */
export const RouteAnimationConfigSchema = z
  .object({
    name: z.string().optional().describe("Human-readable name"),
    // Support flexible route formats - unified schema accepts all route formats
    route: z
      .object({
        summary: z.string().optional().describe("Route summary"),
        distance: z.number().optional().describe("Total distance in meters"),
        duration: z
          .number()
          .optional()
          .describe("Estimated duration in seconds"),
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
                    instruction: z
                      .string()
                      .optional()
                      .describe("Turn-by-turn instruction"),
                    distance: z
                      .number()
                      .optional()
                      .describe("Step distance in meters"),
                    duration: z
                      .number()
                      .optional()
                      .describe("Step duration in seconds"),
                    startLocation: PositionSchema.optional(),
                    endLocation: PositionSchema.optional(),
                  }),
                )
                .optional(),
            }),
          )
          .optional(),
        startLocation: PositionSchema.optional().describe(
          "Starting point (for simple routes)",
        ),
        endLocation: PositionSchema.optional().describe(
          "Ending point (for simple routes)",
        ),
        waypoints: z
          .array(PositionSchema)
          .optional()
          .describe("Intermediate waypoints"),
        travelMode: z
          .enum([
            "walking",
            "driving",
            "cycling",
            "bicycling",
            "transit",
            "flying",
          ])
          .optional()
          .describe(
            "Travel mode: walking, driving, cycling, bicycling, transit, or flying",
          ),
      })
      .describe(
        "Route from geolocation_route tool - supports polyline array, legs, or simple start/end",
      ),
    speedMultiplier: z
      .number()
      .min(0.1)
      .max(100)
      .optional()
      .default(10)
      .describe("Speed multiplier for playback"),
    modelPreset: z
      .enum([
        "cesium_man",
        "cesium_air",
        "ground_vehicle",
        "cesium_drone",
        "auto",
      ])
      .optional()
      .default("auto")
      .describe(
        "Model preset (auto selects based on travel mode): cesium_man, cesium_air, ground_vehicle, cesium_drone, or auto",
      ),
    modelUri: z
      .string()
      .optional()
      .describe("Custom model URI (overrides preset)"),
    showPath: z
      .boolean()
      .optional()
      .default(true)
      .describe("Show animated path trail"),
  })
  .describe("Configuration for creating animation from geolocation route");

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
    remainingSeconds: z
      .number()
      .min(0)
      .describe("Seconds remaining until stop"),
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
    range: z
      .number()
      .optional()
      .default(1000)
      .describe("Camera distance in meters"),
    pitch: z
      .number()
      .optional()
      .default(-45)
      .describe("Camera pitch in degrees"),
    heading: z
      .number()
      .optional()
      .default(0)
      .describe("Camera heading offset in degrees"),
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
    animationIds: z
      .array(z.string())
      .optional()
      .describe("Animation IDs to export (all if omitted)"),
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
    compressed: z
      .boolean()
      .optional()
      .default(false)
      .describe("Minimize CZML output"),
  })
  .describe("CZML export options");

// Response schemas

export const AnimationCreateResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    animationId: z.string().describe("Generated animation ID"),
    startTime: z.string().describe("Animation start time"),
    stopTime: z.string().describe("Animation stop time"),
    modelPreset: z.string().optional().describe("Model preset used"),
  })
  .describe("Animation creation response");

export const AnimationStateResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    animationState: AnimationStateSchema.optional(),
    stats: z.object({
      responseTime: z.number(),
    }),
  })
  .describe("Animation state query response");

export const AnimationListResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    animations: z.array(AnimationStateSchema),
    clockState: ClockSchema,
    stats: z.object({
      totalAnimations: z.number(),
      activeAnimations: z.number(),
      responseTime: z.number(),
    }),
  })
  .describe("Animation list response");

export const CameraTrackingResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    isTracking: z.boolean(),
    trackedAnimationId: z.string().optional(),
    stats: z.object({
      responseTime: z.number(),
    }),
  })
  .describe("Camera tracking response");

export const CZMLExportResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    czml: z.string().describe("CZML JSON document"),
    stats: z.object({
      entityCount: z.number(),
      documentSize: z.number(),
      responseTime: z.number(),
    }),
  })
  .describe("CZML export response");

export const GenericAnimationResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    animationId: z.string().optional(),
    stats: z.object({
      responseTime: z.number(),
    }),
  })
  .describe("Generic animation operation response");

// Type exports
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
