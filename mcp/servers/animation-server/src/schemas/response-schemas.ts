import { z } from "zod";
import { AnimationStateSchema } from "./tool-schemas.js";
import { ClockSchema } from "./core-schemas.js";

/**
 * Standard statistics included in all responses
 */
export const ResponseStatsSchema = z.object({
  responseTime: z.number().describe("Operation time in milliseconds"),
  totalAnimations: z.number().optional().describe("Total number of animations"),
  activeAnimations: z
    .number()
    .optional()
    .describe("Number of active animations"),
  entityCount: z.number().optional().describe("Number of entities"),
  documentSize: z.number().optional().describe("Document size in bytes"),
});

/**
 * Animation creation response
 */
export const AnimationCreateResponseSchema = z
  .object({
    success: z.boolean().describe("Operation success status"),
    message: z.string().describe("Human-readable result message"),
    animationId: z.string().describe("Generated animation ID"),
    startTime: z.string().describe("Animation start time (ISO 8601)"),
    stopTime: z.string().describe("Animation stop time (ISO 8601)"),
    modelPreset: z.string().optional().describe("Model preset used"),
    stats: ResponseStatsSchema.optional(),
  })
  .describe("Animation creation response");

/**
 * Animation state query response
 */
export const AnimationStateResponseSchema = z
  .object({
    success: z.boolean().describe("Query success status"),
    message: z.string().describe("Result message"),
    animationState: AnimationStateSchema.optional(),
    stats: z.object({
      responseTime: z.number(),
    }),
  })
  .describe("Animation state query response");

/**
 * Simplified animation info for listing
 */
export const AnimationInfoSchema = z
  .object({
    animationId: z.string().describe("Animation ID"),
    name: z.string().optional().describe("Animation name"),
    isAnimating: z.boolean().describe("Whether animation is currently playing"),
    startTime: z.string().describe("Animation start time (ISO 8601)"),
    stopTime: z.string().describe("Animation stop time (ISO 8601)"),
    clockMultiplier: z.number().describe("Current clock speed multiplier"),
  })
  .describe("Simplified animation info for listing");

/**
 * Animation list response (full state with clock)
 */
export const AnimationListResponseSchema = z
  .object({
    success: z.boolean().describe("Query success status"),
    message: z.string().describe("Result message"),
    animations: z.array(AnimationStateSchema),
    clockState: ClockSchema,
    stats: z.object({
      totalAnimations: z.number(),
      activeAnimations: z.number(),
      responseTime: z.number(),
    }),
  })
  .describe("Animation list response");

/**
 * Animation list active response (simplified)
 */
export const AnimationListActiveResponseSchema = z
  .object({
    success: z.boolean().describe("Query success status"),
    message: z.string().describe("Result message"),
    animations: z.array(AnimationInfoSchema),
    stats: z.object({
      totalAnimations: z.number(),
      responseTime: z.number(),
    }),
  })
  .describe("Simplified animation list response");

/**
 * Camera tracking response
 */
export const CameraTrackingResponseSchema = z
  .object({
    success: z.boolean().describe("Operation success status"),
    message: z.string().describe("Result message"),
    isTracking: z.boolean().describe("Whether tracking is active"),
    trackedAnimationId: z
      .string()
      .optional()
      .describe("ID of tracked animation"),
    stats: z.object({
      responseTime: z.number(),
    }),
  })
  .describe("Camera tracking response");

/**
 * CZML export response
 */
export const CZMLExportResponseSchema = z
  .object({
    success: z.boolean().describe("Export success status"),
    message: z.string().describe("Result message"),
    czml: z.string().describe("CZML JSON document"),
    stats: z.object({
      entityCount: z.number(),
      documentSize: z.number(),
      responseTime: z.number(),
    }),
  })
  .describe("CZML export response");

/**
 * Generic animation operation response
 */
export const GenericAnimationResponseSchema = z
  .object({
    success: z.boolean().describe("Operation success status"),
    message: z.string().describe("Result message"),
    animationId: z.string().optional().describe("Affected animation ID"),
    stats: z.object({
      responseTime: z.number(),
    }),
  })
  .describe("Generic animation operation response");

/**
 * Clock operation response
 */
export const ClockResponseSchema = z
  .object({
    success: z.boolean().describe("Operation success status"),
    message: z.string().describe("Result message"),
    clockState: ClockSchema.optional().describe("Current clock state"),
    stats: z.object({
      responseTime: z.number(),
    }),
  })
  .describe("Clock operation response");

// Export inferred types
export type ResponseStats = z.infer<typeof ResponseStatsSchema>;
export type AnimationCreateResponse = z.infer<
  typeof AnimationCreateResponseSchema
>;
export type AnimationStateResponse = z.infer<
  typeof AnimationStateResponseSchema
>;
export type AnimationInfo = z.infer<typeof AnimationInfoSchema>;
export type AnimationListResponse = z.infer<typeof AnimationListResponseSchema>;
export type AnimationListActiveResponse = z.infer<
  typeof AnimationListActiveResponseSchema
>;
export type CameraTrackingResponse = z.infer<
  typeof CameraTrackingResponseSchema
>;
export type CZMLExportResponse = z.infer<typeof CZMLExportResponseSchema>;
export type GenericAnimationResponse = z.infer<
  typeof GenericAnimationResponseSchema
>;
export type ClockResponse = z.infer<typeof ClockResponseSchema>;
