import { z } from "zod";

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
  height: z
    .number()
    .optional()
    .describe("Height above ellipsoid in meters"),
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

/**
 * Clock configuration for animation timing
 */
export const ClockSchema = z
  .object({
    startTime: JulianDateSchema.describe("Clock start time"),
    stopTime: JulianDateSchema.describe("Clock stop time"),
    currentTime: JulianDateSchema.describe("Clock current time"),
    clockRange: z
      .enum(["UNBOUNDED", "CLAMPED", "LOOP_STOP"])
      .describe("Clock behavior at boundaries"),
    clockStep: z
      .enum(["TICK_DEPENDENT", "SYSTEM_CLOCK_MULTIPLIER", "SYSTEM_CLOCK"])
      .optional()
      .default("SYSTEM_CLOCK_MULTIPLIER"),
    multiplier: z.number().optional().default(1).describe("Time rate multiplier"),
    shouldAnimate: z.boolean().optional().default(true),
  })
  .describe("Clock configuration for animation timing");

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

// Export inferred types
export type Position = z.infer<typeof PositionSchema>;
export type Color = z.infer<typeof ColorSchema>;
export type JulianDate = z.infer<typeof JulianDateSchema>;
export type TimeInterval = z.infer<typeof TimeIntervalSchema>;
export type PositionSample = z.infer<typeof PositionSampleSchema>;
export type Clock = z.infer<typeof ClockSchema>;
export type PolylineMaterial = z.infer<typeof PolylineMaterialSchema>;
