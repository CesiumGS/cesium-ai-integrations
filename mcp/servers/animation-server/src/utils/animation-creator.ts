import { ICommunicationServer, executeWithTiming } from "@cesium-mcp/shared";
import { LONG_TIMEOUT_MS } from "./constants.js";
import type { CreateAnimationConfig, CreateAnimationResult } from "./types.js";

/**
 * Shared logic for creating animations from position samples
 * Used by both animation-create-custom-path and animation-create-from-route
 */
export async function createAnimation(
  communicationServer: ICommunicationServer,
  config: CreateAnimationConfig,
): Promise<CreateAnimationResult> {
  const {
    positionSamples,
    startTime,
    stopTime,
    interpolationAlgorithm = "LAGRANGE",
    modelPreset = "cesium_man",
    modelUri,
    modelScale,
    showPath = true,
    loopMode = "none",
    clampToGround = false,
    speedMultiplier = 1.0,
    autoPlay = true,
    trackCamera = false,
    name,
  } = config;

  // Validate position samples
  if (!positionSamples || positionSamples.length < 2) {
    return {
      success: false,
      error: `Insufficient position samples: got ${positionSamples?.length || 0}, need at least 2`,
      responseTime: 0,
    };
  }

  // Generate unique animation ID (used as both animation and entity ID)
  const animationId = `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Determine animation time range
  const animStartTime = startTime || positionSamples[0].time;
  const animStopTime =
    stopTime || positionSamples[positionSamples.length - 1].time;

  // Build command for client (no server state needed - client is source of truth)
  const command = {
    type: "animation_create",
    animationId,
    name,
    positionSamples,
    startTime: animStartTime,
    stopTime: animStopTime,
    interpolationAlgorithm,
    modelPreset,
    modelUri,
    modelScale,
    showPath,
    loopMode,
    clampToGround,
    autoPlay,
    speedMultiplier,
    trackCamera,
  };

  // Send command through communication server
  const { result, responseTime } = await executeWithTiming(
    communicationServer,
    command,
    LONG_TIMEOUT_MS,
  );

  if (result.success) {
    return {
      success: true,
      animationId,
      startTime: animStartTime,
      stopTime: animStopTime,
      modelPreset,
      message: `Animation created with ${positionSamples.length} position samples`,
      responseTime,
    };
  }

  return {
    success: false,
    error: result.error || "Unknown error from client",
    responseTime,
  };
}
