import { z } from "zod";
import { 
  PositionSampleSchema,
  ModelPresetSchema,
  LoopModeSchema,
  InterpolationAlgorithmSchema
} from "./core-schemas.js";

/**
 * Animation input schema
 * Creates animated entities with custom position samples
 */
export const UnifiedAnimationInputSchema = z
  .object({
    // Entity identification

    name: z.string().optional().describe("Human-readable name for the animation"),
    
    // Position samples (required)
    positionSamples: z
      .array(PositionSampleSchema)
      .min(2)
      .describe("Array of position samples with timing and coordinates"),
    
    // Animation timing
    startTime: z
      .string()
      .optional()
      .describe("Animation start time (ISO 8601, defaults to first sample time)"),
    stopTime: z
      .string()
      .optional()
      .describe("Animation stop time (ISO 8601, defaults to last sample time)"),
    
    // Interpolation and visualization
    interpolationAlgorithm: InterpolationAlgorithmSchema
      .optional()
      .default("LAGRANGE")
      .describe("Position interpolation method"),
    showPath: z
      .boolean()
      .optional()
      .default(true)
      .describe("Show animated path trail"),
    
    // Model configuration
    modelPreset: ModelPresetSchema
      .optional()
      .describe("Model preset for 3D entity"),
    modelUri: z.string().optional().describe("Custom model URI (overrides preset)"),
    modelScale: z.number().min(0).optional().default(1).describe("Model scale"),
    
    // Animation behavior
    loopMode: LoopModeSchema
      .optional()
      .default("none")
      .describe("Animation loop behavior"),
    clampToGround: z
      .boolean()
      .optional()
      .default(false)
      .describe("Clamp entity to terrain"),
    speedMultiplier: z
      .number()
      .min(0.1)
      .max(100)
      .optional()
      .default(10)
      .describe("Speed multiplier for playback"),
    
    // Playback controls
    autoPlay: z
      .boolean()
      .optional()
      .default(true)
      .describe("Automatically start animation after creation"),
    trackCamera: z
      .boolean()
      .optional()
      .default(true)
      .describe("Automatically track entity with camera"),
  })
  .describe("Animation creation with position samples");
