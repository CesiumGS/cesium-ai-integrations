import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  ICommunicationServer,
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
  ResponseEmoji,
} from "@cesium-mcp/shared";
import {
  AnimationConfigSchema,
  AnimationCreateResponseSchema,
} from "../schemas/index.js";
import { animations, AnimationState } from "../utils/shared-state.js";
import {
  LONG_TIMEOUT_MS,
} from "../utils/constants.js";

/**
 * Register animation_create_custom_path tool
 */
export function registerAnimationCreateCustomPath(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    'animation_create_custom_path',
    {
      title: 'Create Custom Animation Path',
      description: 'Create a custom animated entity with manually specified position samples. Useful for creating complex animations, circular paths, or figure-eight patterns.',
      inputSchema: AnimationConfigSchema.extend({
        autoPlay: z.boolean().optional().describe('Automatically start animation after creation')
      }).shape,
      outputSchema: AnimationCreateResponseSchema.shape
    },
    async (args) => {
      try {
        const validatedArgs = AnimationConfigSchema.parse(args);
        
        const animationId = `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const entityId = `animated_entity_${animationId}`;
        
        const animStartTime = validatedArgs.startTime || validatedArgs.positionSamples[0].time;
        const animStopTime = validatedArgs.stopTime || validatedArgs.positionSamples[validatedArgs.positionSamples.length - 1].time;
        
        const animState: AnimationState = {
          id: animationId,
          entityId,
          startTime: animStartTime,
          stopTime: animStopTime,
          currentSpeed: 1.0,
          isPlaying: (args as any).autoPlay !== false,
          loopMode: validatedArgs.loopMode || 'none',
          createdAt: new Date()
        };
        animations.set(animationId, animState);
        
        // Send command through communication server
        const command = {
          type: 'animation_create_custom_path',
          animationId,
          entityId,
          positionSamples: validatedArgs.positionSamples,
          startTime: animStartTime,
          stopTime: animStopTime,
          interpolationAlgorithm: validatedArgs.interpolationAlgorithm || 'LAGRANGE',
          modelPreset: validatedArgs.model?.preset || 'cesium_man',
          modelUri: validatedArgs.model?.uri,
          modelScale: validatedArgs.model?.scale,
          showPath: validatedArgs.showPath !== false,
          loopMode: validatedArgs.loopMode || 'none',
          clampToGround: validatedArgs.clampToGround || false,
          autoPlay: (args as any).autoPlay !== false
        };
        
        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
          LONG_TIMEOUT_MS,
        );
        
        if (result.success) {
          const output = {
            success: true,
            animationId,
            entityId,
            startTime: animStartTime,
            stopTime: animStopTime,
            modelPreset: validatedArgs.model?.preset || 'cesium_man',
            message: `Custom animation created with ${validatedArgs.positionSamples.length} position samples`,
            stats: {
              totalAnimations: animations.size,
              responseTime
            }
          };
          
          return buildSuccessResponse(
            ResponseEmoji.Animation,
            responseTime,
            output,
          );
        }
        
        throw new Error(result.error || 'Unknown error from client');
      } catch (error) {
        return buildErrorResponse(
          0,
          {
            success: false,
            message: `Failed to create custom animation: ${formatErrorMessage(error)}`,
            stats: { responseTime: 0 },
          } as any,
        );
      }
    }
  );
}
