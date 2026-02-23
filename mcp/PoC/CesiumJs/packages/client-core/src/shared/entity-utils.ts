/**
 * Shared Entity Utilities
 * Helper functions for entity manipulation
 */
import type {
  CesiumViewer,
  CesiumEntity,
  CesiumEntityOptions,
  CesiumPositionProperty,
} from "../types/cesium-types.js";

/**
 * Remove entity by ID from viewer
 */
export function removeEntityById(
  viewer: CesiumViewer,
  entityId: string,
): boolean {
  const entity = viewer.entities.getById(entityId);
  if (entity) {
    return viewer.entities.remove(entity);
  }
  return false;
}

/**
 * Create an animated model entity with position and path visualization
 */
export function addAnimatedModelEntity(
  viewer: CesiumViewer,
  positionProperty: CesiumPositionProperty,
  modelUri: string,
  options: {
    id?: string;
    showPath?: boolean;
    minimumPixelSize?: number;
    scale?: number;
  } = {},
): CesiumEntity {
  const entityConfig: CesiumEntityOptions = {
    position: positionProperty,
    model: new Cesium.ModelGraphics({
      uri: modelUri,
      minimumPixelSize: options.minimumPixelSize || 128,
      scale: options.scale || 1.0,
    }),
    orientation: new Cesium.VelocityOrientationProperty(positionProperty),
  };

  // Add optional ID
  if (options.id) {
    entityConfig.id = options.id;
  }

  // Add path visualization if requested
  if (options.showPath) {
    entityConfig.path = new Cesium.PathGraphics({
      show: true,
      leadTime: 0,
      trailTime: 60,
      width: 10,
      resolution: 1,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.1,
        color: Cesium.Color.LIME,
      }),
    });
  }

  return viewer.entities.add(entityConfig);
}
