import { z } from "zod";

/**
 * Core Cesium entity schemas
 * These represent fundamental types used across multiple entity tools
 */

/**
 * Geographic position (WGS84)
 */
export const PositionSchema = z.object({
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .describe("Longitude in degrees (-180 to 180)"),
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .describe("Latitude in degrees (-90 to 90)"),
  height: z.number().optional().describe("Height above ellipsoid in meters"),
});

/**
 * RGBA color with normalized values
 */
export const ColorSchema = z
  .object({
    red: z.number().min(0).max(1).describe("Red component (0-1)"),
    green: z.number().min(0).max(1).describe("Green component (0-1)"),
    blue: z.number().min(0).max(1).describe("Blue component (0-1)"),
    alpha: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .default(1)
      .describe("Alpha transparency (0-1)"),
  })
  .describe("RGBA color values (0-1)");

/**
 * Julian date for precise time representation
 */
export const JulianDateSchema = z
  .object({
    dayNumber: z.number().describe("Julian day number"),
    secondsOfDay: z.number().describe("Seconds into the day"),
  })
  .describe("Julian date for precise time representation");

/**
 * Time interval definition
 */
export const TimeIntervalSchema = z
  .object({
    start: JulianDateSchema,
    stop: JulianDateSchema,
    isStartIncluded: z.boolean().optional().default(true),
    isStopIncluded: z.boolean().optional().default(true),
  })
  .describe("Time interval definition");

/**
 * Position sample at a specific time
 */
export const PositionSampleSchema = z
  .object({
    time: JulianDateSchema,
    position: PositionSchema,
  })
  .describe("Position sample at a specific time");

/**
 * Time-sampled position property
 */
export const SampledPositionPropertySchema = z
  .object({
    type: z.literal("sampled"),
    samples: z.array(PositionSampleSchema),
    interpolationDegree: z.number().optional().default(1),
    interpolationAlgorithm: z
      .enum(["LINEAR", "LAGRANGE", "HERMITE"])
      .optional()
      .default("LINEAR"),
  })
  .describe("Time-sampled position property");

/**
 * Callback-based property
 */
export const CallbackPropertySchema = z
  .object({
    type: z.literal("callback"),
    functionName: z.string().describe("Name of the callback function"),
    isConstant: z.boolean().optional().default(false),
  })
  .describe("Callback-based property");

/**
 * Velocity-based orientation property
 */
export const VelocityOrientationPropertySchema = z
  .object({
    type: z.literal("velocityOrientation"),
    positionProperty: z.string().describe("Reference to position property"),
    ellipsoid: z.string().optional().describe("Reference ellipsoid"),
  })
  .describe("Velocity-based orientation property");

/**
 * Static or animated position
 */
export const AnimatedPositionSchema = z
  .union([PositionSchema, SampledPositionPropertySchema])
  .describe("Position that can be static or animated");

/**
 * Clock configuration for animation timing
 */
export const ClockSchema = z
  .object({
    startTime: JulianDateSchema,
    stopTime: JulianDateSchema,
    currentTime: JulianDateSchema,
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

/**
 * Model animation configuration
 */
export const ModelAnimationSchema = z
  .object({
    loop: z
      .enum(["NONE", "REPEAT", "MIRRORED_REPEAT"])
      .optional()
      .default("NONE"),
    reverse: z.boolean().optional().default(false),
    multiplier: z.number().optional().default(1),
    animationTime: z
      .object({
        type: z.literal("callback"),
        functionName: z.string(),
      })
      .optional()
      .describe("Custom animation time function"),
  })
  .describe("Model animation configuration");

/**
 * Material definition for entity appearance
 */
export const MaterialSchema = z
  .union([
    z.object({
      type: z.literal("color"),
      color: ColorSchema,
    }),
    z.object({
      type: z.literal("image"),
      image: z.string().describe("URL to image file"),
    }),
    z.object({
      type: z.literal("checkerboard"),
      evenColor: ColorSchema,
      oddColor: ColorSchema,
      repeat: z.object({
        x: z.number(),
        y: z.number(),
      }),
    }),
    z.object({
      type: z.literal("stripe"),
      evenColor: ColorSchema,
      oddColor: ColorSchema,
      repeat: z.number(),
    }),
    z.object({
      type: z.literal("grid"),
      color: ColorSchema,
      cellAlpha: z.number().min(0).max(1),
      lineCount: z.object({
        x: z.number(),
        y: z.number(),
      }),
      lineThickness: z.object({
        x: z.number(),
        y: z.number(),
      }),
    }),
  ])
  .describe("Material definition for entity appearance");

/**
 * Polyline-specific material definition
 */
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

// Type exports for TypeScript
export type Position = z.infer<typeof PositionSchema>;
export type Color = z.infer<typeof ColorSchema>;
export type JulianDate = z.infer<typeof JulianDateSchema>;
export type TimeInterval = z.infer<typeof TimeIntervalSchema>;
export type PositionSample = z.infer<typeof PositionSampleSchema>;
export type SampledPositionProperty = z.infer<
  typeof SampledPositionPropertySchema
>;
export type AnimatedPosition = z.infer<typeof AnimatedPositionSchema>;
export type Clock = z.infer<typeof ClockSchema>;
export type ModelAnimation = z.infer<typeof ModelAnimationSchema>;
export type Material = z.infer<typeof MaterialSchema>;
export type PolylineMaterial = z.infer<typeof PolylineMaterialSchema>;
