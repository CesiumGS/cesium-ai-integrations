/**
 * Shared Constants
 * Application-wide constant values
 */

// Camera defaults
export const DEFAULT_ORBIT_SPEED = 0.005;
export const DEFAULT_CAMERA_PITCH = -15;
export const DEFAULT_CAMERA_HEADING = 0;
export const DEFAULT_CAMERA_ROLL = 0;
export const DEFAULT_CAMERA_HEIGHT = 400;
export const DEFAULT_FLY_DURATION = 3;

// Default initial camera position (Vilnius, Lithuania)
export const DEFAULT_CAMERA_POSITION = {
  longitude: 25.2797,
  latitude: 54.6872,
  height: 400,
};

// Default server configuration
export const DEFAULT_SERVER_CONFIG = {
  name: "Default Server",
  port: 3002,
};

// Connection settings
export const DEFAULT_RECONNECT_DELAY = 5000;
export const MAX_RECONNECT_ATTEMPTS = 10;
