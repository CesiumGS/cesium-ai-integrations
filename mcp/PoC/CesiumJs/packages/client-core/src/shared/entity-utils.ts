/**
 * Shared Entity Utilities
 * Helper functions for entity creation and management
 */

import type { Position } from "../types/mcp.js";
import { parseColor, positionToCartesian3 } from "./cesium-utils.js";

type CesiumViewer = any; // Type from @cesium/engine or cesium
type CesiumEntity = any; // Type from @cesium/engine or cesium
type CesiumColor = any; // Type from @cesium/engine or cesium

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
    color?: unknown;
    outlineColor?: unknown;
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
      color: parseColor(options.color, Cesium.Color.YELLOW),
      outlineColor: parseColor(options.outlineColor, Cesium.Color.BLACK),
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
    fillColor?: unknown;
    outlineColor?: unknown;
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
 * Add a polyline entity to the viewer
 */
export function addPolylineEntity(
  viewer: CesiumViewer,
  positions: Position[],
  options: {
    id?: string;
    name?: string;
    description?: string;
    width?: number;
    color?: unknown;
    clampToGround?: boolean;
  } = {},
): CesiumEntity {
  const cartesianPositions = positions.map((p) => positionToCartesian3(p));

  return viewer.entities.add({
    id: options.id || `polyline_${Date.now()}`,
    name: options.name || "Polyline",
    description: options.description,
    polyline: {
      show: true,
      positions: cartesianPositions,
      width: options.width || 5,
      material: parseColor(options.color, Cesium.Color.RED),
      clampToGround:
        options.clampToGround !== undefined ? options.clampToGround : false,
      followSurface: true,
      granularity: Cesium.Math.RADIANS_PER_DEGREE,
    },
  });
}

/**
 * Create a label graphics object
 * Useful for adding labels to existing entities
 */
export function createLabelGraphics(
  text: string,
  options: {
    font?: string;
    fillColor?: unknown;
    outlineColor?: unknown;
    outlineWidth?: number;
    pixelOffset?: { x: number; y: number };
    verticalOrigin?: unknown;
    disableDepthTestDistance?: number;
  } = {},
): unknown {
  return new Cesium.LabelGraphics({
    text: text,
    font: options.font || "14px sans-serif",
    fillColor:
      parseColor(options.fillColor, Cesium.Color.WHITE) ?? Cesium.Color.WHITE,
    outlineColor:
      parseColor(options.outlineColor, Cesium.Color.BLACK) ??
      Cesium.Color.BLACK,
    outlineWidth: options.outlineWidth || 2,
    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    verticalOrigin: options.verticalOrigin || Cesium.VerticalOrigin.BOTTOM,
    pixelOffset: options.pixelOffset
      ? new Cesium.Cartesian2(options.pixelOffset.x, options.pixelOffset.y)
      : new Cesium.Cartesian2(0, -20),
    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    disableDepthTestDistance: options.disableDepthTestDistance,
  });
}

/**
 * Add a polygon entity to the viewer
 */
export function addPolygonEntity(
  viewer: CesiumViewer,
  positions: Position[],
  options: {
    id?: string;
    name?: string;
    description?: string;
    height?: number;
    extrudedHeight?: number;
    fillColor?: unknown;
    outlineColor?: unknown;
    outline?: boolean;
  } = {},
): CesiumEntity {
  const cartesianPositions = positions.map((p) => positionToCartesian3(p));

  return viewer.entities.add({
    id: options.id || `polygon_${Date.now()}`,
    name: options.name || "Polygon",
    description: options.description,
    polygon: {
      hierarchy: cartesianPositions,
      material: parseColor(options.fillColor, Cesium.Color.BLUE.withAlpha(0.5)),
      outline: options.outline !== undefined ? options.outline : true,
      outlineColor: parseColor(options.outlineColor, Cesium.Color.BLACK),
      height: options.height || 0,
      extrudedHeight: options.extrudedHeight,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    },
  });
}

/**
 * Add an animated model entity with optional path visualization
 */
export function addAnimatedModelEntity(
  viewer: CesiumViewer,
  positionProperty: unknown,
  modelUri: string,
  options: {
    id?: string;
    name?: string;
    description?: string;
    minimumPixelSize?: number;
    scale?: number;
    showPath?: boolean;
    pathConfig?: {
      leadTime?: number;
      trailTime?: number;
      width?: number;
      color?: unknown;
      glowPower?: number;
    };
  } = {},
): CesiumEntity {
  console.log("[EntityUtils] Adding animated model entity:", {
    modelUri,
    id: options.id,
    minimumPixelSize: options.minimumPixelSize || 64,
    scale: options.scale || 1.0,
    showPath: options.showPath,
  });

  const entityConfig: Record<string, unknown> = {
    id: options.id || `animated_model_${Date.now()}`,
    name: options.name || "Animated Model",
    description: options.description,
    position: positionProperty,
    orientation: new Cesium.VelocityOrientationProperty(positionProperty),
    model: {
      uri: modelUri,
      minimumPixelSize: options.minimumPixelSize || 64,
      scale: options.scale || 1.0,
      show: true,
    },
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({
        start: viewer.clock.startTime,
        stop: viewer.clock.stopTime,
      }),
    ]),
  };

  // Add path visualization if requested
  if (options.showPath) {
    const pathConfig = options.pathConfig || {};
    entityConfig.path = {
      show: true,
      leadTime: pathConfig.leadTime || 0,
      trailTime: pathConfig.trailTime || 100,
      width: pathConfig.width || 3,
      resolution: 1,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: pathConfig.glowPower || 0.1,
        color:
          parseColor(pathConfig.color, Cesium.Color.LIME) ?? Cesium.Color.LIME,
      }),
    };
  }

  const entity = viewer.entities.add(entityConfig);

  console.log("[EntityUtils] Entity added successfully:", {
    id: entity.id,
    hasModel: !!entity.model,
    hasPosition: !!entity.position,
    hasOrientation: !!entity.orientation,
  });

  return entity;
}

/**
 * Remove entity by ID
 */
export function removeEntityById(
  viewer: CesiumViewer,
  entityId: string,
): boolean {
  const entity = viewer.entities.getById(entityId);
  if (entity) {
    viewer.entities.remove(entity);
    return true;
  }
  return false;
}

/**
 * Remove multiple entities by ID array
 */
export function removeEntitiesByIds(
  viewer: CesiumViewer,
  entityIds: string[],
): number {
  let removedCount = 0;
  entityIds.forEach((id) => {
    if (removeEntityById(viewer, id)) {
      removedCount++;
    }
  });
  return removedCount;
}

/**
 * Clear all entities from viewer
 */
export function clearAllEntities(viewer: CesiumViewer): number {
  const count = viewer.entities.values.length;
  viewer.entities.removeAll();
  return count;
}

/**
 * Get all entities with their basic info
 */
export function getAllEntitiesInfo(viewer: CesiumViewer): Array<{
  id: string;
  name: string;
  type: string;
  position?: Position;
}> {
  const entities: Array<{
    id: string;
    name: string;
    type: string;
    position?: Position;
  }> = [];
  const entityCollection = viewer.entities.values;

  for (let i = 0; i < entityCollection.length; i++) {
    const entity = entityCollection[i];
    const entityInfo: {
      id: string;
      name: string;
      type: string;
      position?: Position;
    } = {
      id: entity.id,
      name: entity.name || "Unnamed",
      type: getEntityType(entity),
    };

    // Add position if available
    if (entity.position) {
      try {
        const cartographic = Cesium.Cartographic.fromCartesian(
          entity.position.getValue(Cesium.JulianDate.now()),
        );
        entityInfo.position = {
          longitude: Cesium.Math.toDegrees(cartographic.longitude),
          latitude: Cesium.Math.toDegrees(cartographic.latitude),
          height: cartographic.height,
        };
      } catch {
        // Position not available or invalid
      }
    }

    entities.push(entityInfo);
  }

  return entities;
}

/**
 * Get entity type helper
 */
function getEntityType(entity: CesiumEntity): string {
  if (entity.point) {
    return "point";
  }
  if (entity.label) {
    return "label";
  }
  if (entity.polygon) {
    return "polygon";
  }
  if (entity.polyline) {
    return "polyline";
  }
  if (entity.billboard) {
    return "billboard";
  }
  if (entity.model) {
    return "model";
  }
  if (entity.ellipse) {
    return "ellipse";
  }
  if (entity.rectangle) {
    return "rectangle";
  }
  if (entity.wall) {
    return "wall";
  }
  if (entity.cylinder) {
    return "cylinder";
  }
  if (entity.box) {
    return "box";
  }
  if (entity.corridor) {
    return "corridor";
  }
  return "unknown";
}
