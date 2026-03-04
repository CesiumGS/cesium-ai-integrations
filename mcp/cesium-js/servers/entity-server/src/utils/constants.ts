/**
 * Entity server constants and default values
 */

export const DEFAULT_POINT_SIZE = 10;
export const DEFAULT_POINT_COLOR = {
  red: 1,
  green: 1,
  blue: 0,
  alpha: 1,
} as const;

export const DEFAULT_POINT_OUTLINE_COLOR = {
  red: 0,
  green: 0,
  blue: 0,
  alpha: 1,
} as const;

export const DEFAULT_POINT_OUTLINE_WIDTH = 2;

export const DEFAULT_BILLBOARD_SCALE = 1;

export const DEFAULT_LABEL_FONT = "14pt monospace";
export const DEFAULT_LABEL_SCALE = 1;
export const DEFAULT_LABEL_OUTLINE_WIDTH = 1;

export const DEFAULT_MODEL_SCALE = 1;
export const DEFAULT_MODEL_MINIMUM_PIXEL_SIZE = 0;

export const DEFAULT_POLYGON_FILL = true;
export const DEFAULT_POLYGON_OUTLINE = false;
export const DEFAULT_POLYGON_OUTLINE_WIDTH = 1;

export const DEFAULT_POLYLINE_WIDTH = 1;
export const DEFAULT_POLYLINE_ARC_TYPE = "GEODESIC";
