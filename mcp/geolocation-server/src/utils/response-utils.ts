/**
 * Response emoji types for formatting tool results
 */
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
  Speed = "speed",
  Track = "track",
  Info = "info",
  Search = "search",
  Route = "route",
  Location = "location",
}

const RESPONSE_EMOJIS = {
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
  [ResponseEmoji.Speed]: "⚡",
  [ResponseEmoji.Track]: "🎥",
  [ResponseEmoji.Info]: "ℹ️",
  [ResponseEmoji.Search]: "🔍",
  [ResponseEmoji.Route]: "🛣️",
  [ResponseEmoji.Location]: "📍",
} as const;

/**
 * Formats error messages consistently
 */
export function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function buildResponse<T extends { message: string }>(
  emoji: string,
  responseTime: number,
  structuredContent: T,
  isError: boolean,
) {
  return {
    content: [
      {
        type: "text" as const,
        text: `${emoji} ${structuredContent.message} (${responseTime}ms)`,
      },
    ],
    structuredContent,
    isError,
  };
}

/**
 * Builds a success response structure with emoji mapping
 */
export function buildSuccessResponse<T extends { message: string }>(
  emoji: ResponseEmoji,
  responseTime: number,
  structuredContent: T,
) {
  return buildResponse(
    RESPONSE_EMOJIS[emoji],
    responseTime,
    structuredContent,
    false,
  );
}

/**
 * Builds an error response structure with emoji mapping
 */
export function buildErrorResponse<T extends { message: string }>(
  responseTime: number,
  structuredContent: T,
) {
  return buildResponse(
    RESPONSE_EMOJIS[ResponseEmoji.Error],
    responseTime,
    structuredContent,
    true,
  );
}
