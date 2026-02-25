/**
 * Communication server constants
 */

/** Default timeout for command execution in milliseconds (10 seconds) */
export const DEFAULT_COMMAND_TIMEOUT_MS = 10000;

/** Heartbeat interval for keeping connections alive in milliseconds (30 seconds) */
export const HEARTBEAT_INTERVAL_MS = 30000;

/** Port offset for MCP transport server relative to communication server port */
export const MCP_PORT_OFFSET = 1000;

/** Default timeout for graceful shutdown in milliseconds (5 seconds) */
export const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 5000;

/** Timeout buffer for command execution in milliseconds (2 seconds) */
export const TIMEOUT_BUFFER_MS = 2000;

/**
 * Default server configuration values
 */
export const ServerDefaults = {
  COMMAND_TIMEOUT_MS: DEFAULT_COMMAND_TIMEOUT_MS,
  HEARTBEAT_INTERVAL_MS: HEARTBEAT_INTERVAL_MS,
  PORT_OFFSET: MCP_PORT_OFFSET,
  SHUTDOWN_TIMEOUT_MS: GRACEFUL_SHUTDOWN_TIMEOUT_MS,
  MAX_RETRIES: 10,
  CORS_ORIGIN: "*",
} as const;

/**
 * Response emoji types for formatting tool results
 */
/* eslint-disable no-unused-vars */
export enum ResponseEmoji {
  Success = "success",
  Error = "error",
  Point = "point",
  Billboard = "billboard",
  Label = "label",
  Model = "model",
  Polygon = "polygon",
  Polyline = "polyline",
  Box = "box",
  Corridor = "corridor",
  Cylinder = "cylinder",
  Ellipse = "ellipse",
  Rectangle = "rectangle",
  Wall = "wall",
  List = "list",
  Remove = "remove",
  Position = "position",
  Orbit = "orbit",
  Stop = "stop",
  Settings = "settings",
  Animation = "animation",
  Play = "play",
  Pause = "pause",
  Track = "track",
  Info = "info",
  Speed = "speed",
}
/* eslint-enable no-unused-vars */

export const RESPONSE_EMOJIS = {
  [ResponseEmoji.Success]: "✅",
  [ResponseEmoji.Error]: "❌",
  [ResponseEmoji.Point]: "📍",
  [ResponseEmoji.Billboard]: "🖼️",
  [ResponseEmoji.Label]: "🏷️",
  [ResponseEmoji.Model]: "🎭",
  [ResponseEmoji.Polygon]: "▲",
  [ResponseEmoji.Polyline]: "📏",
  [ResponseEmoji.Box]: "📦",
  [ResponseEmoji.Corridor]: "🛣️",
  [ResponseEmoji.Cylinder]: "🏛️",
  [ResponseEmoji.Ellipse]: "⭕",
  [ResponseEmoji.Rectangle]: "▭",
  [ResponseEmoji.Wall]: "🧱",
  [ResponseEmoji.List]: "📋",
  [ResponseEmoji.Remove]: "🗑️",
  [ResponseEmoji.Position]: "📍",
  [ResponseEmoji.Orbit]: "🔄",
  [ResponseEmoji.Stop]: "⏹️",
  [ResponseEmoji.Settings]: "⚙️",
  [ResponseEmoji.Animation]: "🎬",
  [ResponseEmoji.Play]: "▶️",
  [ResponseEmoji.Pause]: "⏸️",
  [ResponseEmoji.Track]: "🎯",
  [ResponseEmoji.Info]: "ℹ️",
  [ResponseEmoji.Speed]: "⚡",
} as const;
