/**
 * Entity Utility Functions
 * Helper functions for creating and managing Cesium entities
 */

import type { CesiumViewer } from "../types/cesium-types.js";
import type { Position } from "../types/mcp.js";
import { positionToCartesian3 } from "./cesium-utils.js";
import type {
  Color,
  Entity,
  HeightReference,
  LabelGraphics,
  MaterialProperty,
  LabelStyle,
  VerticalOrigin,
  HorizontalOrigin,
  Cartesian2,
  PinBuilder,
} from "cesium";

// Type aliases for Cesium types
type CesiumColor = Color;
type CesiumHeightReference = HeightReference;
type CesiumLabelStyle = LabelStyle;
type CesiumVerticalOrigin = VerticalOrigin;
type CesiumHorizontalOrigin = HorizontalOrigin;
type CesiumCartesian2 = Cartesian2;
type CesiumPinBuilder = PinBuilder;

/**
 * Options for creating a point entity
 */
export interface PointEntityOptions {
  id?: string;
  name?: string;
  pixelSize?: number;
  color?: string | CesiumColor;
  outlineColor?: string | CesiumColor;
  outlineWidth?: number;
  heightReference?: CesiumHeightReference;
  clampToGround?: boolean;
  label?: LabelGraphics.ConstructorOptions;
}

/**
 * Options for creating a billboard pin entity
 */
export interface BillboardPinOptions {
  id?: string;
  name?: string;
  color?: string | CesiumColor;
  text?: string;
  size?: number;
  clampToGround?: boolean;
  label?: LabelGraphics.ConstructorOptions;
  scale?: number;
  verticalOrigin?: CesiumVerticalOrigin;
}

/**
 * Options for creating a polyline entity
 */
export interface PolylineEntityOptions {
  id?: string;
  name?: string;
  width?: number;
  color?: string | CesiumColor;
  clampToGround?: boolean;
  material?: MaterialProperty;
}

/**
 * Options for creating label graphics
 */
export interface LabelGraphicsOptions {
  font?: string;
  fillColor?: string | CesiumColor;
  outlineColor?: string | CesiumColor;
  outlineWidth?: number;
  style?: CesiumLabelStyle;
  verticalOrigin?: CesiumVerticalOrigin;
  horizontalOrigin?: CesiumHorizontalOrigin;
  pixelOffset?: CesiumCartesian2;
  heightReference?: CesiumHeightReference;
  disableDepthTestDistance?: number;
}

/**
 * Parse a color string or return the color object as-is
 */
export function parseColor(color: string | CesiumColor): CesiumColor {
  if (typeof color === "string") {
    const colorName = color.toUpperCase();
    // Check if it's a Cesium.Color constant
    const cesiumColorObj = Cesium.Color as unknown as Record<string, unknown>;
    if (colorName in cesiumColorObj) {
      return cesiumColorObj[colorName] as CesiumColor;
    }
    // Try parsing as CSS color
    try {
      return Cesium.Color.fromCssColorString(color);
    } catch {
      return Cesium.Color.WHITE;
    }
  }
  return color;
}

/**
 * Add a point entity to the viewer
 */
export function addPointEntity(
  viewer: CesiumViewer,
  position: Position,
  options: PointEntityOptions = {},
): Entity {
  const {
    id = `point_${Date.now()}`,
    name = "Point",
    pixelSize = 10,
    color = "yellow",
    outlineColor = "white",
    outlineWidth = 2,
    clampToGround = true,
    label,
  } = options;

  const entity = viewer.entities.add({
    id,
    name,
    position: positionToCartesian3(position),
    point: {
      pixelSize,
      color: parseColor(color),
      outlineColor: parseColor(outlineColor),
      outlineWidth,
      heightReference: clampToGround
        ? Cesium.HeightReference.CLAMP_TO_GROUND
        : Cesium.HeightReference.NONE,
    },
    ...(label ? { label } : {}),
  });

  return entity;
}

// Singleton PinBuilder instance
let pinBuilder: CesiumPinBuilder | null = null;

/**
 * Get or create a PinBuilder instance
 */
function getPinBuilder(): CesiumPinBuilder {
  if (!pinBuilder) {
    pinBuilder = new Cesium.PinBuilder();
  }
  return pinBuilder;
}

/**
 * Add a billboard pin entity to the viewer
 */
export function addBillboardPinEntity(
  viewer: CesiumViewer,
  position: Position,
  options: BillboardPinOptions = {},
): Entity {
  const {
    id = `pin_${Date.now()}`,
    name = "Pin",
    color = "red",
    text,
    size = 48,
    clampToGround = true,
    label,
    scale = 1.0,
    verticalOrigin = Cesium.VerticalOrigin.BOTTOM,
  } = options;

  const builder = getPinBuilder();
  const pinColor = parseColor(color);

  // Create pin image - use text if provided, otherwise color-only pin
  const pinImage = text
    ? builder.fromText(text, pinColor, size)
    : builder.fromColor(pinColor, size);

  const entity = viewer.entities.add({
    id,
    name,
    position: positionToCartesian3(position),
    billboard: {
      image: pinImage,
      verticalOrigin,
      scale,
      heightReference: clampToGround
        ? Cesium.HeightReference.CLAMP_TO_GROUND
        : Cesium.HeightReference.NONE,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    ...(label ? { label } : {}),
  });

  return entity;
}

/**
 * Add a polyline entity to the viewer
 */
export function addPolylineEntity(
  viewer: CesiumViewer,
  positions: Position[],
  options: PolylineEntityOptions = {},
): Entity {
  const {
    id = `polyline_${Date.now()}`,
    name = "Polyline",
    width = 3,
    color = "blue",
    clampToGround = true,
    material,
  } = options;

  const cartesianPositions = positions.map((pos) => positionToCartesian3(pos));

  const entity = viewer.entities.add({
    id,
    name,
    polyline: {
      positions: cartesianPositions,
      width,
      material: material || parseColor(color),
      clampToGround,
      ...(clampToGround && {
        classificationType: Cesium.ClassificationType.BOTH,
      }),
    },
  });

  return entity;
}

/**
 * Create label graphics configuration
 */
export function createLabelGraphics(
  text: string,
  options: LabelGraphicsOptions = {},
): Record<string, unknown> {
  const {
    font = "14px sans-serif",
    fillColor = "white",
    outlineColor = "black",
    outlineWidth = 2,
    style = Cesium.LabelStyle.FILL_AND_OUTLINE,
    verticalOrigin = Cesium.VerticalOrigin.BOTTOM,
    horizontalOrigin,
    pixelOffset = new Cesium.Cartesian2(0, -15),
    heightReference = Cesium.HeightReference.CLAMP_TO_GROUND,
    disableDepthTestDistance = Number.POSITIVE_INFINITY,
  } = options;

  return {
    text,
    font,
    fillColor: parseColor(fillColor),
    outlineColor: parseColor(outlineColor),
    outlineWidth,
    style,
    verticalOrigin,
    ...(horizontalOrigin ? { horizontalOrigin } : {}),
    pixelOffset,
    heightReference,
    disableDepthTestDistance,
  };
}

/**
 * Remove entities by their IDs
 * @returns Number of entities removed
 */
export function removeEntitiesByIds(
  viewer: CesiumViewer,
  entityIds: string[],
): number {
  let removedCount = 0;

  for (const id of entityIds) {
    const entity = viewer.entities.getById(id);
    if (entity) {
      viewer.entities.remove(entity);
      removedCount++;
    }
  }

  return removedCount;
}

/**
 * Remove all entities from the viewer
 * @returns Number of entities removed
 */
export function removeAllEntities(viewer: Record<string, unknown>): number {
  const count = (viewer.entities as { values: unknown[] }).values.length;
  (viewer.entities as { removeAll: () => void }).removeAll();
  return count;
}

/**
 * Get entity by ID
 */
export function getEntityById(
  viewer: Record<string, unknown>,
  id: string,
): Record<string, unknown> | undefined {
  return (
    viewer.entities as {
      getById: (id: string) => Record<string, unknown> | undefined;
    }
  ).getById(id);
}

/**
 * Check if entity exists
 */
export function entityExists(viewer: CesiumViewer, id: string): boolean {
  return viewer.entities.getById(id) !== undefined;
}
