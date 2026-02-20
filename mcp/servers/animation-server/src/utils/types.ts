/**
 * Type definitions for animation server utilities
 */

/**
 * Base structured content interface
 */
export interface StructuredContent {
  success: boolean;
  message: string;
  [key: string]: unknown;
}

/**
 * Position sample with time and coordinates
 */
export interface PositionSample {
  time: string;
  longitude: number;
  latitude: number;
  height: number;
}

/**
 * Model configuration for animated entity
 */
export interface ModelConfig {
  preset?: ModelPresetType;
  uri?: string;
  scale?: number;
}

/**
 * Configuration for creating an animation
 */
export interface CreateAnimationConfig {
  positionSamples: PositionSample[];
  startTime?: string;
  stopTime?: string;
  interpolationAlgorithm?: 'LINEAR' | 'LAGRANGE' | 'HERMITE';
  modelPreset?: ModelPresetType;
  modelUri?: string;
  modelScale?: number;
  showPath?: boolean;
  loopMode?: LoopModeType;
  clampToGround?: boolean;
  speedMultiplier?: number;
  autoPlay?: boolean;
  trackCamera?: boolean;
  name?: string;
}

/**
 * Result from creating an animation
 */
export interface CreateAnimationResult {
  success: boolean;
  animationId?: string;
  startTime?: string;
  stopTime?: string;
  modelPreset?: ModelPresetType;
  message?: string;
  error?: string;
  responseTime: number;
}

/**
 * Available model presets
 * Base presets: cesium_man, cesium_air, ground_vehicle, cesium_drone, custom
 */
export type ModelPresetType = 'cesium_man' | 'cesium_air' | 'ground_vehicle' | 'cesium_drone' | 'custom';

/**
 * Animation loop behavior modes
 * NOTE: Keep in sync with LoopModeSchema in core-schemas.ts
 */
export type LoopModeType = 'none' | 'loop' | 'pingpong';

/**
 * Model configuration entry
 */
export interface ModelEntry {
  uri: string;
  description: string;
  recommendedFor?: string[];
}

/**
 * Configuration for parsing route data to position samples
 */
export interface RouteParserConfig {
  speedMultiplier?: number;
}

/**
 * Result from parsing route data
 */
export interface RouteParserResult {
  positionSamples: PositionSample[];
  modelPreset?: ModelPresetType;
  travelMode?: string;
}

/**
 * Animation state tracker
 * NOTE: In this architecture, the server is stateless and the client manages all state.
 */
export interface AnimationState {
  animationId: string;
  name?: string;
  startTime: string;
  stopTime: string;
  currentSpeed: number;
  isPlaying: boolean;
  loopMode: LoopModeType;
  createdAt: Date;
}
