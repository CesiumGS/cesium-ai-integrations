/**
 * Shared Entity Utilities
 * Helper functions for entity creation and management
 */

import type { Position, ColorRGBA } from "../types/mcp.js";
import { parseColor, positionToCartesian3 } from "./cesium-utils.js";
import type { CesiumViewer, CesiumEntity } from "../types/cesium-types.js";

/**
 * Add a point entity to the viewer
 */
export function addPointEntity(
  viewer: CesiumViewer,
  position: Position,
  options: {
    id?: string;
    name?: string;
    description?: string;
    pixelSize?: number;
    color?: ColorRGBA | string;
    outlineColor?: ColorRGBA | string;
    outlineWidth?: number;
  } = {},
): CesiumEntity {
  return viewer.entities.add({
    id: options.id || `point_${Date.now()}`,
    name: options.name || "Point",
    description: options.description,
    position: positionToCartesian3(position),
    point: {
      pixelSize: options.pixelSize || 10,
      color:
        parseColor(options.color, Cesium.Color.YELLOW) ?? Cesium.Color.YELLOW,
      outlineColor:
        parseColor(options.outlineColor, Cesium.Color.BLACK) ??
        Cesium.Color.BLACK,
      outlineWidth: options.outlineWidth || 2,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    },
  });
}

/**
 * Add a label entity to the viewer
 */
export function addLabelEntity(
  viewer: CesiumViewer,
  position: Position,
  text: string,
  options: {
    id?: string;
    name?: string;
    description?: string;
    font?: string;
    fillColor?: ColorRGBA | string;
    outlineColor?: ColorRGBA | string;
    outlineWidth?: number;
    pixelOffset?: { x: number; y: number };
  } = {},
): CesiumEntity {
  return viewer.entities.add({
    id: options.id || `label_${Date.now()}`,
    name: options.name || "Label",
    description: options.description,
    position: positionToCartesian3(position),
    label: {
      text: text,
      font: options.font || "14pt sans-serif",
      fillColor:
        parseColor(options.fillColor, Cesium.Color.WHITE) ?? Cesium.Color.WHITE,
      outlineColor:
        parseColor(options.outlineColor, Cesium.Color.BLACK) ??
        Cesium.Color.BLACK,
      outlineWidth: options.outlineWidth || 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: options.pixelOffset
        ? new Cesium.Cartesian2(options.pixelOffset.x, options.pixelOffset.y)
        : new Cesium.Cartesian2(0, -50),
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    },
  });
}

/**
 * Add a polygon entity to the viewer
 */
export function addPolygonEntity(
  viewer: CesiumViewer,
  coordinates: Position[],
  options: {
    id?: string;
    name?: string;
    description?: string;
    material?: { color?: ColorRGBA | string } | string;
    fillColor?: ColorRGBA | string;
    fillOpacity?: number;
    outline?: boolean;
    outlineColor?: ColorRGBA | string;
    height?: number;
    extrudedHeight?: number;
  } = {},
): CesiumEntity {
  const positions = coordinates.map((coord) =>
    Cesium.Cartesian3.fromDegrees(
      coord.longitude,
      coord.latitude,
      coord.height || 0,
    ),
  );

  let material = Cesium.Color.BLUE.withAlpha(0.5); // default
  if (
    typeof options.material === "object" &&
    options.material &&
    "color" in options.material
  ) {
    material = parseColor(options.material.color) || material;
  } else if (options.fillColor) {
    const parsedColor = parseColor(options.fillColor);
    material = parsedColor || material;
    if (parsedColor && options.fillOpacity !== undefined) {
      material = parsedColor.withAlpha(options.fillOpacity);
    }
  }

  return viewer.entities.add({
    id: options.id || `polygon_${Date.now()}`,
    name: options.name || "Polygon",
    description: options.description,
    polygon: {
      hierarchy: positions,
      material: material,
      outline: options.outline !== undefined ? options.outline : true,
      outlineColor: parseColor(options.outlineColor) || Cesium.Color.BLACK,
      height: options.height || 0,
      extrudedHeight: options.extrudedHeight,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    },
  });
}

/**
 * Add a polyline entity to the viewer
 */
export function addPolylineEntity(
  viewer: CesiumViewer,
  coordinates: Position[],
  options: {
    id?: string;
    name?: string;
    description?: string;
    width?: number;
    material?: { color?: ColorRGBA | string } | string;
    color?: ColorRGBA | string;
    clampToGround?: boolean;
  } = {},
): CesiumEntity {
  const positions = coordinates.map((coord) =>
    Cesium.Cartesian3.fromDegrees(
      coord.longitude,
      coord.latitude,
      coord.height || 100, // Default height of 100m to ensure visibility
    ),
  );

  let material = Cesium.Color.RED; // Change default to red for better visibility
  if (typeof options.material === "string") {
    // String material: "red", "blue", etc.
    material = parseColor(options.material) || material;
  } else if (
    typeof options.material === "object" &&
    options.material &&
    "color" in options.material
  ) {
    // MCP format: { material: { color: { red, green, blue, alpha } } }
    material = parseColor(options.material.color) || material;
  } else if (options.color) {
    // Legacy format: { color: "red" } or { color: { red, green, blue, alpha } }
    material = parseColor(options.color) || material;
  }

  return viewer.entities.add({
    id: options.id || `polyline_${Date.now()}`,
    name: options.name || "Polyline",
    description: options.description,
    polyline: {
      show: true, // Explicitly show the polyline
      positions: positions,
      width: options.width || 5, // Increase default width for better visibility
      material: material,
      clampToGround:
        options.clampToGround !== undefined ? options.clampToGround : false, // Don't clamp by default
      granularity: Cesium.Math.RADIANS_PER_DEGREE, // Add granularity for smoother curves
    },
  });
}

/**
 * Add a billboard entity (image marker) to the viewer
 */
export function addBillboardEntity(
  viewer: CesiumViewer,
  position: Position,
  imageUrl: string,
  options: {
    id?: string;
    name?: string;
    description?: string;
    width?: number;
    height?: number;
    scale?: number;
    color?: ColorRGBA | string;
  } = {},
): CesiumEntity {
  return viewer.entities.add({
    id: options.id || `billboard_${Date.now()}`,
    name: options.name || "Billboard",
    description: options.description,
    position: positionToCartesian3(position),
    billboard: {
      image: imageUrl,
      width: options.width || 64,
      height: options.height || 64,
      pixelOffset: new Cesium.Cartesian2(0, -32),
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      scale: options.scale || 1.0,
    },
  });
}

/**
 * Add a 3D model entity to the viewer
 */
export function addModelEntity(
  viewer: CesiumViewer,
  position: Position,
  modelUri: string,
  options: {
    id?: string;
    name?: string;
    description?: string;
    orientation?: {
      heading?: number;
      pitch?: number;
      roll?: number;
    };
    scale?: number;
    minimumPixelSize?: number;
    maximumScale?: number;
    runAnimations?: boolean;
    show?: boolean;
  } = {},
): CesiumEntity {
  const cesiumPosition = positionToCartesian3(position);

  const entityConfig = {
    id: options.id || `model_${Date.now()}`,
    name: options.name || "3D Model",
    description: options.description,
    position: cesiumPosition,
    orientation: options.orientation
      ? Cesium.Transforms.headingPitchRollQuaternion(
          cesiumPosition,
          new Cesium.HeadingPitchRoll(
            options.orientation.heading || 0,
            options.orientation.pitch || 0,
            options.orientation.roll || 0,
          ),
        )
      : undefined,
    model: {
      uri: modelUri,
      scale: options.scale || 1,
      minimumPixelSize: options.minimumPixelSize || 128,
      maximumScale: options.maximumScale || 20000,
      runAnimations: options.runAnimations !== false,
      show: options.show !== false,
    },
  };

  return viewer.entities.add(entityConfig);
}

/**
 * Add an ellipse entity to the viewer
 */
export function addEllipseEntity(
  viewer: CesiumViewer,
  position: Position,
  semiMajorAxis: number,
  semiMinorAxis: number,
  options: {
    id?: string;
    name?: string;
    description?: string;
    height?: number;
    extrudedHeight?: number;
    material?: { color?: ColorRGBA | string } | string;
    fillColor?: ColorRGBA | string;
    fillOpacity?: number;
    outline?: boolean;
    outlineColor?: ColorRGBA | string;
    rotation?: number;
  } = {},
): CesiumEntity {
  let material = Cesium.Color.BLUE.withAlpha(0.5);
  if (typeof options.material === "string") {
    material = parseColor(options.material) || material;
  } else if (
    typeof options.material === "object" &&
    options.material &&
    "color" in options.material
  ) {
    material = parseColor(options.material.color) || material;
  } else if (options.fillColor) {
    const parsedColor = parseColor(options.fillColor);
    material = parsedColor || material;
    if (parsedColor && options.fillOpacity !== undefined) {
      material = parsedColor.withAlpha(options.fillOpacity);
    }
  }

  return viewer.entities.add({
    id: options.id || `ellipse_${Date.now()}`,
    name: options.name || "Ellipse",
    description: options.description,
    position: positionToCartesian3(position),
    ellipse: {
      semiMajorAxis,
      semiMinorAxis,
      material,
      outline: options.outline !== undefined ? options.outline : true,
      outlineColor: parseColor(options.outlineColor) || Cesium.Color.BLACK,
      height: options.height,
      extrudedHeight: options.extrudedHeight,
      rotation: options.rotation,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    },
  });
}

/**
 * Add a rectangle entity to the viewer
 */
export function addRectangleEntity(
  viewer: CesiumViewer,
  coordinates: { west: number; south: number; east: number; north: number },
  options: {
    id?: string;
    name?: string;
    description?: string;
    height?: number;
    extrudedHeight?: number;
    material?: { color?: ColorRGBA | string } | string;
    fillColor?: ColorRGBA | string;
    fillOpacity?: number;
    outline?: boolean;
    outlineColor?: ColorRGBA | string;
    rotation?: number;
  } = {},
): CesiumEntity {
  let material = Cesium.Color.BLUE.withAlpha(0.5);
  if (typeof options.material === "string") {
    material = parseColor(options.material) || material;
  } else if (
    typeof options.material === "object" &&
    options.material &&
    "color" in options.material
  ) {
    material = parseColor(options.material.color) || material;
  } else if (options.fillColor) {
    const parsedColor = parseColor(options.fillColor);
    material = parsedColor || material;
    if (parsedColor && options.fillOpacity !== undefined) {
      material = parsedColor.withAlpha(options.fillOpacity);
    }
  }

  return viewer.entities.add({
    id: options.id || `rectangle_${Date.now()}`,
    name: options.name || "Rectangle",
    description: options.description,
    rectangle: {
      coordinates: Cesium.Rectangle.fromDegrees(
        coordinates.west,
        coordinates.south,
        coordinates.east,
        coordinates.north,
      ),
      material,
      outline: options.outline !== undefined ? options.outline : true,
      outlineColor: parseColor(options.outlineColor) || Cesium.Color.BLACK,
      height: options.height,
      extrudedHeight: options.extrudedHeight,
      rotation: options.rotation,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    },
  });
}

/**
 * Add a wall entity to the viewer
 */
export function addWallEntity(
  viewer: CesiumViewer,
  positions: Position[],
  options: {
    id?: string;
    name?: string;
    description?: string;
    minimumHeights?: number[];
    maximumHeights?: number[];
    material?: { color?: ColorRGBA | string } | string;
    fillColor?: ColorRGBA | string;
    outline?: boolean;
    outlineColor?: ColorRGBA | string;
  } = {},
): CesiumEntity {
  const cartesianPositions = positions.map((pos) => positionToCartesian3(pos));

  let material = Cesium.Color.BLUE.withAlpha(0.7);
  if (typeof options.material === "string") {
    material = parseColor(options.material) || material;
  } else if (
    typeof options.material === "object" &&
    options.material &&
    "color" in options.material
  ) {
    material = parseColor(options.material.color) || material;
  } else if (options.fillColor) {
    material = parseColor(options.fillColor) || material;
  }

  return viewer.entities.add({
    id: options.id || `wall_${Date.now()}`,
    name: options.name || "Wall",
    description: options.description,
    wall: {
      positions: cartesianPositions,
      minimumHeights: options.minimumHeights,
      maximumHeights: options.maximumHeights,
      material,
      outline: options.outline !== undefined ? options.outline : true,
      outlineColor: parseColor(options.outlineColor) || Cesium.Color.BLACK,
    },
  });
}

/**
 * Add a cylinder entity to the viewer
 */
export function addCylinderEntity(
  viewer: CesiumViewer,
  position: Position,
  length: number,
  topRadius: number,
  bottomRadius: number,
  options: {
    id?: string;
    name?: string;
    description?: string;
    material?: { color?: ColorRGBA | string } | string;
    fillColor?: ColorRGBA | string;
    outline?: boolean;
    outlineColor?: ColorRGBA | string;
    orientation?: {
      heading?: number;
      pitch?: number;
      roll?: number;
    };
  } = {},
): CesiumEntity {
  const cesiumPosition = positionToCartesian3(position);

  let material = Cesium.Color.BLUE.withAlpha(0.7);
  if (typeof options.material === "string") {
    material = parseColor(options.material) || material;
  } else if (
    typeof options.material === "object" &&
    options.material &&
    "color" in options.material
  ) {
    material = parseColor(options.material.color) || material;
  } else if (options.fillColor) {
    material = parseColor(options.fillColor) || material;
  }

  const entityConfig = {
    id: options.id || `cylinder_${Date.now()}`,
    name: options.name || "Cylinder",
    description: options.description,
    position: cesiumPosition,
    orientation: options.orientation
      ? Cesium.Transforms.headingPitchRollQuaternion(
          cesiumPosition,
          new Cesium.HeadingPitchRoll(
            options.orientation.heading || 0,
            options.orientation.pitch || 0,
            options.orientation.roll || 0,
          ),
        )
      : undefined,
    cylinder: {
      length,
      topRadius,
      bottomRadius,
      material,
      outline: options.outline !== undefined ? options.outline : true,
      outlineColor: parseColor(options.outlineColor) || Cesium.Color.BLACK,
    },
  };

  return viewer.entities.add(entityConfig);
}

/**
 * Add a box entity to the viewer
 */
export function addBoxEntity(
  viewer: CesiumViewer,
  position: Position,
  dimensions: { x: number; y: number; z: number },
  options: {
    id?: string;
    name?: string;
    description?: string;
    material?: { color?: ColorRGBA | string } | string;
    fillColor?: ColorRGBA | string;
    outline?: boolean;
    outlineColor?: ColorRGBA | string;
    orientation?: {
      heading?: number;
      pitch?: number;
      roll?: number;
    };
  } = {},
): CesiumEntity {
  const cesiumPosition = positionToCartesian3(position);

  let material = Cesium.Color.BLUE.withAlpha(0.7);
  if (typeof options.material === "string") {
    material = parseColor(options.material) || material;
  } else if (
    typeof options.material === "object" &&
    options.material &&
    "color" in options.material
  ) {
    material = parseColor(options.material.color) || material;
  } else if (options.fillColor) {
    material = parseColor(options.fillColor) || material;
  }

  const entityConfig = {
    id: options.id || `box_${Date.now()}`,
    name: options.name || "Box",
    description: options.description,
    position: cesiumPosition,
    orientation: options.orientation
      ? Cesium.Transforms.headingPitchRollQuaternion(
          cesiumPosition,
          new Cesium.HeadingPitchRoll(
            options.orientation.heading || 0,
            options.orientation.pitch || 0,
            options.orientation.roll || 0,
          ),
        )
      : undefined,
    box: {
      dimensions: new Cesium.Cartesian3(
        dimensions.x,
        dimensions.y,
        dimensions.z,
      ),
      material,
      outline: options.outline !== undefined ? options.outline : true,
      outlineColor: parseColor(options.outlineColor) || Cesium.Color.BLACK,
    },
  };

  return viewer.entities.add(entityConfig);
}

/**
 * Add a corridor entity to the viewer
 */
export function addCorridorEntity(
  viewer: CesiumViewer,
  positions: Position[],
  width: number,
  options: {
    id?: string;
    name?: string;
    description?: string;
    height?: number;
    extrudedHeight?: number;
    material?: { color?: ColorRGBA | string } | string;
    fillColor?: ColorRGBA | string;
    fillOpacity?: number;
    outline?: boolean;
    outlineColor?: ColorRGBA | string;
    cornerType?: "ROUNDED" | "MITERED" | "BEVELED";
  } = {},
): CesiumEntity {
  const cartesianPositions = positions.map((pos) => positionToCartesian3(pos));

  let material = Cesium.Color.BLUE.withAlpha(0.5);
  if (typeof options.material === "string") {
    material = parseColor(options.material) || material;
  } else if (
    typeof options.material === "object" &&
    options.material &&
    "color" in options.material
  ) {
    material = parseColor(options.material.color) || material;
  } else if (options.fillColor) {
    const parsedColor = parseColor(options.fillColor);
    material = parsedColor || material;
    if (parsedColor && options.fillOpacity !== undefined) {
      material = parsedColor.withAlpha(options.fillOpacity);
    }
  }

  let cornerType = Cesium.CornerType.ROUNDED;
  if (options.cornerType === "MITERED") {
    cornerType = Cesium.CornerType.MITERED;
  } else if (options.cornerType === "BEVELED") {
    cornerType = Cesium.CornerType.BEVELED;
  }

  return viewer.entities.add({
    id: options.id || `corridor_${Date.now()}`,
    name: options.name || "Corridor",
    description: options.description,
    corridor: {
      positions: cartesianPositions,
      width,
      material,
      outline: options.outline !== undefined ? options.outline : true,
      outlineColor: parseColor(options.outlineColor) || Cesium.Color.BLACK,
      height: options.height,
      extrudedHeight: options.extrudedHeight,
      cornerType,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    },
  });
}
