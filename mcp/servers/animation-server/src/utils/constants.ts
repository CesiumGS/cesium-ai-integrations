/**
 * Animation tool constants and default values
 */

/**
 * Default timeout for operations (ms)
 */
export const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Timeout for long operations (ms)
 */
export const LONG_TIMEOUT_MS = 15000;

/**
 * Default animation settings
 */
export const DEFAULT_SPEED_MULTIPLIER = 10;
export const DEFAULT_PATH_WIDTH = 3;
export const DEFAULT_PATH_RESOLUTION = 60;
export const DEFAULT_MODEL_SCALE = 1;
export const DEFAULT_MODEL_PIXEL_SIZE = 64;
export const DEFAULT_CAMERA_TRACKING_RANGE = 1000;
export const DEFAULT_CAMERA_TRACKING_PITCH = -45;
export const DEFAULT_CAMERA_TRACKING_HEADING = 0;

/**
 * Maximum size for position sample arrays to prevent memory issues
 */
export const MAX_POSITION_SAMPLES = 500;

/**
 * Map travel modes to model presets
 */
export const TRAVEL_MODE_TO_MODEL: Record<string, string> = {
  walking: "cesium_man",
  driving: "car",
  cycling: "bike",
  bicycling: "bike",
  flying: "airplane",
} as const;

