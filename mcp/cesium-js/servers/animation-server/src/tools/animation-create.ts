import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ICommunicationServer,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
} from "@cesium-mcp/shared";
import { AnimationCreateResponseSchema } from "../schemas/index.js";
import { UnifiedAnimationInputSchema } from "../schemas/unified-animation-schema.js";
import { createAnimation } from "../utils/animation-creator.js";
import { resolveModelUri } from "../utils/model-registry.js";
import { ModelPresetType } from "../utils/types.js";

/**
 * Register animation_create tool
 * Creates animated entities with custom position samples
 */
export function registerAnimationCreate(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "animation_create",
    {
      title: "Create Animation",
      description:
        "Create an animated entity with custom position samples. Provide positionSamples array with timing and coordinates.",
      inputSchema: UnifiedAnimationInputSchema.shape,
      outputSchema: AnimationCreateResponseSchema.shape,
    },
    async (args) => {
      try {
        const validatedArgs = UnifiedAnimationInputSchema.parse(args);

        if (!validatedArgs.positionSamples) {
          throw new Error("Must provide positionSamples array");
        }

        const positionSamples = validatedArgs.positionSamples;

        // Determine model preset
        const modelPreset: ModelPresetType =
          validatedArgs.modelPreset && validatedArgs.modelPreset !== "custom"
            ? (validatedArgs.modelPreset as ModelPresetType)
            : "cesium_man";

        let resolvedModelUri: string;
        try {
          resolvedModelUri = resolveModelUri(
            modelPreset,
            validatedArgs.modelUri,
          );
        } catch (error) {
          throw new Error(
            `Failed to resolve model URI: ${formatErrorMessage(error)}`,
          );
        }

        // Create animation
        const result = await createAnimation(communicationServer, {
          positionSamples,
          startTime: validatedArgs.startTime,
          stopTime: validatedArgs.stopTime,
          interpolationAlgorithm:
            validatedArgs.interpolationAlgorithm || "LAGRANGE",
          modelPreset,
          modelUri: resolvedModelUri,
          modelScale: validatedArgs.modelScale,
          showPath: validatedArgs.showPath !== false,
          loopMode: validatedArgs.loopMode || "none",
          clampToGround: validatedArgs.clampToGround || false,
          speedMultiplier: validatedArgs.speedMultiplier || 10.0,
          autoPlay: validatedArgs.autoPlay !== false,
          trackCamera: validatedArgs.trackCamera || false,
          name: validatedArgs.name,
        });

        if (result.success) {
          const output = {
            success: true,
            animationId: result.animationId!,
            startTime: result.startTime!,
            stopTime: result.stopTime!,
            modelPreset: result.modelPreset!,
            message: `Animation created with ${positionSamples.length} position samples (${result.modelPreset} model)`,
            stats: {
              responseTime: result.responseTime,
            },
          };

          return buildSuccessResponse(
            ResponseEmoji.Animation,
            result.responseTime,
            output,
          );
        }

        throw new Error(result.error || "Unknown error from client");
      } catch (error) {
        return buildErrorResponse(0, {
          success: false,
          message: `Failed to create animation: ${formatErrorMessage(error)}`,
          animationId: "",
          startTime: "",
          stopTime: "",
          stats: { responseTime: 0 },
        });
      }
    },
  );
}
