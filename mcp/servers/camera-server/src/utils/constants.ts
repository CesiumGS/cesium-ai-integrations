/**
 * Camera tool constants and default values
 */

export const DEFAULT_ORIENTATION = {
  heading: 0,
  pitch: -15,
  roll: 0,
} as const;

export const DEFAULT_LOOK_AT_OFFSET = {
  heading: 0,
  pitch: -90,
  range: 1000,
} as const;

export const DEFAULT_ORBIT_SPEED = 0.005;

export const TIMEOUT_BUFFER_MS = 2000;

export enum ResponseEmoji {
  Success = "success",
  Error = "error",
  Position = "position",
  Orbit = "orbit",
  Stop = "stop",
  Settings = "settings",
}

export const RESPONSE_EMOJIS = {
  [ResponseEmoji.Success]: "✅",
  [ResponseEmoji.Error]: "❌",
  [ResponseEmoji.Position]: "📍",
  [ResponseEmoji.Orbit]: "🔄",
  [ResponseEmoji.Stop]: "⏹️",
  [ResponseEmoji.Settings]: "⚙️",
} as const;
