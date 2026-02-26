/**
 * Cesium Entity Manager Module
 * Handles all entity creation, management, and removal operations
 */

import type {
  CommandHandler,
  ManagerInterface,
  PointOptions,
  LabelOptions,
  PolygonOptions,
  PolylineOptions,
  BillboardOptions,
  ModelOptions,
  EllipseOptions,
  RectangleOptions,
  WallOptions,
  CylinderOptions,
  BoxOptions,
  CorridorOptions,
  Position,
  EntityInputData,
  EntityAddResult,
  EntityRemoveResult,
  EntityRemoveBatchResult,
  EntityListResult,
  EntityInfo,
} from "../types/mcp.js";

import { cartesian3ToPosition, getEntityType } from "../shared/cesium-utils.js";
import {
  addPointEntity,
  addLabelEntity,
  addPolygonEntity,
  addPolylineEntity,
  addBillboardEntity,
  addModelEntity,
  addEllipseEntity,
  addRectangleEntity,
  addWallEntity,
  addCylinderEntity,
  addBoxEntity,
  addCorridorEntity,
} from "../shared/entity-utils.js";
import { CesiumViewer } from "../types/cesium-types.js";

class CesiumEntityManager implements ManagerInterface {
  viewer: CesiumViewer;
  prefix: string;
  handlers: Map<string, CommandHandler>;

  constructor(viewer: CesiumViewer) {
    this.viewer = viewer;
    this.prefix = "entity";
    this.handlers = new Map<string, CommandHandler>();
  }

  /**
   * Setup and initialize the manager
   */
  setUp(): void {
    // Initialization logic if needed
  }

  /**
   * Add a point entity at the specified location
   */
  async addPoint(
    longitude: number,
    latitude: number,
    height: number = 0,
    options: PointOptions = {},
  ): Promise<EntityAddResult> {
    try {
      const entity = addPointEntity(
        this.viewer,
        { longitude, latitude, height },
        {
          id: options.id,
          name: options.name || "Point",
          pixelSize: options.pixelSize || 10,
          color: options.color || "yellow",
          outlineColor: options.outlineColor || "black",
          outlineWidth: options.outlineWidth || 2,
        },
      );

      return {
        success: true,
        entityId: entity.id,
        type: "point",
        message: `Point entity '${entity.name}' created at ${longitude.toFixed(4)}, ${latitude.toFixed(4)}`,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Add a text label entity
   */
  async addLabel(
    longitude: number,
    latitude: number,
    height: number = 0,
    text: string,
    options: LabelOptions = {},
  ): Promise<EntityAddResult> {
    try {
      const entity = addLabelEntity(
        this.viewer,
        { longitude, latitude, height },
        text,
        {
          id: options.id,
          name: options.name || "Label",
          font: options.font || "14pt sans-serif",
          fillColor: options.fillColor || "white",
          outlineColor: options.outlineColor || "black",
          outlineWidth: options.outlineWidth || 2,
        },
      );

      return {
        success: true,
        entityId: entity.id,
        type: "label",
        message: `Label entity '${entity.name}' created with text '${text}'`,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Add a polygon entity
   */
  async addPolygon(
    coordinates: Position[],
    options: PolygonOptions = {},
  ): Promise<EntityAddResult> {
    return new Promise((resolve) => {
      try {
        const entity = addPolygonEntity(this.viewer, coordinates, {
          id: options.id,
          name: options.name || "Polygon",
          description: options.description,
          material: options.material,
          fillColor: options.fillColor,
          fillOpacity: options.fillOpacity,
          outline: options.outline,
          outlineColor: options.outlineColor,
          height: options.height,
          extrudedHeight: options.extrudedHeight,
        });

        resolve({
          success: true,
          entityId: entity.id,
          type: "polygon",
          message: `Polygon entity '${entity.name}' created with ${coordinates.length} vertices`,
        });
      } catch (error: unknown) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  /**
   * Add a polyline entity
   */
  async addPolyline(
    coordinates: Position[],
    options: PolylineOptions = {},
  ): Promise<EntityAddResult> {
    return new Promise((resolve) => {
      try {
        const entity = addPolylineEntity(this.viewer, coordinates, {
          id: options.id,
          name: options.name || "Polyline",
          description: options.description,
          width: options.width,
          material: options.material,
          color: options.color,
          clampToGround: options.clampToGround,
        });

        resolve({
          success: true,
          entityId: entity.id,
          type: "polyline",
          message: `Polyline entity '${entity.name}' created with ${coordinates.length} points`,
        });
      } catch (error: unknown) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  /**
   * Add a billboard entity (image marker)
   */
  async addBillboard(
    longitude: number,
    latitude: number,
    height: number = 0,
    imageUrl: string,
    options: BillboardOptions = {},
  ): Promise<EntityAddResult> {
    return new Promise((resolve) => {
      try {
        const entity = addBillboardEntity(
          this.viewer,
          { longitude, latitude, height },
          imageUrl,
          {
            id: options.id,
            name: options.name || "Billboard",
            description: options.description,
            width: options.width,
            height: options.height,
            scale: options.scale,
            color: options.color,
          },
        );

        resolve({
          success: true,
          entityId: entity.id,
          type: "billboard",
          message: `Billboard entity '${entity.name}' created at ${longitude.toFixed(4)}, ${latitude.toFixed(4)}`,
        });
      } catch (error: unknown) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  /**
   * Add a 3D model entity
   */
  async addModel(
    longitude: number,
    latitude: number,
    height: number = 0,
    modelUri: string,
    options: ModelOptions = {},
  ): Promise<EntityAddResult> {
    return new Promise((resolve) => {
      try {
        const entity = addModelEntity(
          this.viewer,
          { longitude, latitude, height },
          modelUri,
          {
            id: options.id,
            name: options.name || "3D Model",
            description: options.description,
            orientation: options.orientation,
            scale: options.scale,
            minimumPixelSize: options.minimumPixelSize,
            maximumScale: options.maximumScale,
            runAnimations: options.runAnimations,
            show: options.show,
          },
        );

        resolve({
          success: true,
          entityId: entity.id,
          type: "model",
          message: `3D Model entity '${entity.name}' created at ${longitude.toFixed(4)}, ${latitude.toFixed(4)}`,
        });
      } catch (error: unknown) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  /**
   * Add an ellipse entity
   */
  async addEllipse(
    longitude: number,
    latitude: number,
    height: number = 0,
    semiMajorAxis: number,
    semiMinorAxis: number,
    options: EllipseOptions = {},
  ): Promise<EntityAddResult> {
    return new Promise((resolve) => {
      try {
        const entity = addEllipseEntity(
          this.viewer,
          { longitude, latitude, height },
          semiMajorAxis,
          semiMinorAxis,
          {
            id: options.id,
            name: options.name || "Ellipse",
            description: options.description,
            material: options.material,
            fillColor: options.fillColor,
            fillOpacity: options.fillOpacity,
            outline: options.outline,
            outlineColor: options.outlineColor,
            height: options.height,
            extrudedHeight: options.extrudedHeight,
            rotation: options.rotation,
          },
        );

        resolve({
          success: true,
          entityId: entity.id,
          type: "ellipse",
          message: `Ellipse entity '${entity.name}' created at ${longitude.toFixed(4)}, ${latitude.toFixed(4)}`,
        });
      } catch (error: unknown) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  /**
   * Add a rectangle entity
   */
  async addRectangle(
    coordinates: { west: number; south: number; east: number; north: number },
    options: RectangleOptions = {},
  ): Promise<EntityAddResult> {
    return new Promise((resolve) => {
      try {
        const entity = addRectangleEntity(this.viewer, coordinates, {
          id: options.id,
          name: options.name || "Rectangle",
          description: options.description,
          material: options.material,
          fillColor: options.fillColor,
          fillOpacity: options.fillOpacity,
          outline: options.outline,
          outlineColor: options.outlineColor,
          height: options.height,
          extrudedHeight: options.extrudedHeight,
          rotation: options.rotation,
        });

        resolve({
          success: true,
          entityId: entity.id,
          type: "rectangle",
          message: `Rectangle entity '${entity.name}' created`,
        });
      } catch (error: unknown) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  /**
   * Add a wall entity
   */
  async addWall(
    positions: Position[],
    options: WallOptions = {},
  ): Promise<EntityAddResult> {
    return new Promise((resolve) => {
      try {
        const entity = addWallEntity(this.viewer, positions, {
          id: options.id,
          name: options.name || "Wall",
          description: options.description,
          minimumHeights: options.minimumHeights,
          maximumHeights: options.maximumHeights,
          material: options.material,
          fillColor: options.fillColor,
          outline: options.outline,
          outlineColor: options.outlineColor,
        });

        resolve({
          success: true,
          entityId: entity.id,
          type: "wall",
          message: `Wall entity '${entity.name}' created with ${positions.length} positions`,
        });
      } catch (error: unknown) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  /**
   * Add a cylinder entity
   */
  async addCylinder(
    longitude: number,
    latitude: number,
    height: number = 0,
    length: number,
    topRadius: number,
    bottomRadius: number,
    options: CylinderOptions = {},
  ): Promise<EntityAddResult> {
    return new Promise((resolve) => {
      try {
        const entity = addCylinderEntity(
          this.viewer,
          { longitude, latitude, height },
          length,
          topRadius,
          bottomRadius,
          {
            id: options.id,
            name: options.name || "Cylinder",
            description: options.description,
            material: options.material,
            fillColor: options.fillColor,
            outline: options.outline,
            outlineColor: options.outlineColor,
            orientation: options.orientation,
          },
        );

        resolve({
          success: true,
          entityId: entity.id,
          type: "cylinder",
          message: `Cylinder entity '${entity.name}' created at ${longitude.toFixed(4)}, ${latitude.toFixed(4)}`,
        });
      } catch (error: unknown) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  /**
   * Add a box entity
   */
  async addBox(
    longitude: number,
    latitude: number,
    height: number = 0,
    dimensions: { x: number; y: number; z: number },
    options: BoxOptions = {},
  ): Promise<EntityAddResult> {
    return new Promise((resolve) => {
      try {
        const entity = addBoxEntity(
          this.viewer,
          { longitude, latitude, height },
          dimensions,
          {
            id: options.id,
            name: options.name || "Box",
            description: options.description,
            material: options.material,
            fillColor: options.fillColor,
            outline: options.outline,
            outlineColor: options.outlineColor,
            orientation: options.orientation,
          },
        );

        resolve({
          success: true,
          entityId: entity.id,
          type: "box",
          message: `Box entity '${entity.name}' created at ${longitude.toFixed(4)}, ${latitude.toFixed(4)}`,
        });
      } catch (error: unknown) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  /**
   * Add a corridor entity
   */
  async addCorridor(
    positions: Position[],
    width: number,
    options: CorridorOptions = {},
  ): Promise<EntityAddResult> {
    return new Promise((resolve) => {
      try {
        const entity = addCorridorEntity(this.viewer, positions, width, {
          id: options.id,
          name: options.name || "Corridor",
          description: options.description,
          material: options.material,
          fillColor: options.fillColor,
          fillOpacity: options.fillOpacity,
          outline: options.outline,
          outlineColor: options.outlineColor,
          height: options.height,
          extrudedHeight: options.extrudedHeight,
          cornerType: options.cornerType,
        });

        resolve({
          success: true,
          entityId: entity.id,
          type: "corridor",
          message: `Corridor entity '${entity.name}' created with ${positions.length} positions`,
        });
      } catch (error: unknown) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  /**
   * Remove an entity by ID
   */
  async removeEntity(entityId: string): Promise<EntityRemoveResult> {
    return new Promise((resolve) => {
      try {
        const entity = this.viewer.entities.getById(entityId);
        if (entity) {
          this.viewer.entities.remove(entity);
          resolve({
            success: true,
            entityId: entityId,
            message: `Entity '${entityId}' removed successfully`,
          });
        } else {
          resolve({
            success: false,
            error: `Entity with ID '${entityId}' not found`,
          });
        }
      } catch (error: unknown) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  /**
   * Remove entities by name pattern
   */
  async removeEntitiesByName(
    namePattern: string,
  ): Promise<EntityRemoveBatchResult> {
    return new Promise((resolve) => {
      try {
        const entities = this.viewer.entities.values;
        const removedEntities = [];

        for (let i = entities.length - 1; i >= 0; i--) {
          const entity = entities[i];
          if (entity.name && entity.name.includes(namePattern)) {
            this.viewer.entities.remove(entity);
            removedEntities.push(entity.id);
          }
        }

        resolve({
          success: true,
          removedCount: removedEntities.length,
          removedIds: removedEntities,
          message: `Removed ${removedEntities.length} entities matching '${namePattern}'`,
        });
      } catch (error: unknown) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  /**
   * List all entities with detailed information
   */
  async listEntities(): Promise<EntityListResult> {
    return new Promise((resolve) => {
      try {
        const entities = [];
        const entityCollection = this.viewer.entities.values;

        for (let i = 0; i < entityCollection.length; i++) {
          const entity = entityCollection[i];
          const entityInfo: EntityInfo = {
            id: entity.id,
            name: entity.name || "Unnamed",
            type: getEntityType(entity),
          };

          // Add position if available
          if (entity.position) {
            const positionValue = entity.position.getValue(
              Cesium.JulianDate.now(),
            );
            if (positionValue) {
              entityInfo.position = cartesian3ToPosition(positionValue);
            }
          }

          entities.push(entityInfo);
        }

        resolve({
          success: true,
          entities: entities,
          totalCount: entities.length,
          message: `Found ${entities.length} entities`,
        });
      } catch (error: unknown) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : String(error),
          entities: [],
        });
      }
    });
  }

  /**
   * Handle generic entity_add command by detecting entity type
   */
  async handleEntityAdd(
    command: Record<string, unknown>,
  ): Promise<EntityAddResult> {
    const entity =
      (command.entity as EntityInputData) || (command as EntityInputData);

    let entityType = command.entityType;
    if (!entityType) {
      if (entity.point) {
        entityType = "point";
      } else if (entity.label) {
        entityType = "label";
      } else if (entity.polygon) {
        entityType = "polygon";
      } else if (entity.polyline) {
        entityType = "polyline";
      } else if (entity.billboard) {
        entityType = "billboard";
      } else if (entity.model) {
        entityType = "model";
      } else if (entity.box) {
        entityType = "box";
      } else if (entity.corridor) {
        entityType = "corridor";
      } else if (entity.cylinder) {
        entityType = "cylinder";
      } else if (entity.ellipse) {
        entityType = "ellipse";
      } else if (entity.rectangle) {
        entityType = "rectangle";
      } else if (entity.wall) {
        entityType = "wall";
      }
    }

    switch (entityType) {
      case "point":
        if (!entity.position) {
          return {
            success: false,
            error: "Position is required for point entity",
          };
        }
        return await this.addPoint(
          entity.position.longitude,
          entity.position.latitude,
          entity.position.height || 0,
          {
            id: entity.id,
            name: entity.name,
            description: entity.description,
            pixelSize: entity.point?.pixelSize,
            color: entity.point?.color,
            outlineColor: entity.point?.outlineColor,
            outlineWidth: entity.point?.outlineWidth,
          },
        );
      case "label": {
        if (!entity.position) {
          return {
            success: false,
            error: "Position is required for label entity",
          };
        }
        const labelText = entity.label?.text || entity.text;
        if (!labelText) {
          return { success: false, error: "Text is required for label entity" };
        }
        return await this.addLabel(
          entity.position.longitude,
          entity.position.latitude,
          entity.position.height || 0,
          labelText,
          {
            id: entity.id,
            name: entity.name,
            description: entity.description,
            font: entity.label?.font,
            fillColor: entity.label?.fillColor,
            outlineColor: entity.label?.outlineColor,
            outlineWidth: entity.label?.outlineWidth,
            style: entity.label?.style,
            scale: entity.label?.scale,
            pixelOffset: entity.label?.pixelOffset,
          },
        );
      }
      case "polygon": {
        const coordinates =
          entity.polygon?.hierarchy || entity.positions || entity.coordinates;
        if (!coordinates) {
          return {
            success: false,
            error: "Coordinates are required for polygon entity",
          };
        }
        return await this.addPolygon(coordinates, {
          id: entity.id,
          name: entity.name,
          description: entity.description,
          height: entity.height || entity.polygon?.height,
          extrudedHeight:
            entity.extrudedHeight || entity.polygon?.extrudedHeight,
          material: entity.material || entity.polygon?.material,
          outline:
            entity.outline !== undefined
              ? entity.outline
              : entity.polygon?.outline,
          outlineColor: entity.outlineColor || entity.polygon?.outlineColor,
        });
      }
      case "polyline": {
        const coordinates = entity.polyline?.positions || entity.coordinates;
        if (!coordinates) {
          return {
            success: false,
            error: "Coordinates are required for polyline entity",
          };
        }
        return await this.addPolyline(coordinates, {
          id: entity.id,
          name: entity.name,
          description: entity.description,
          width: entity.polyline?.width,
          material: entity.polyline?.material,
          clampToGround: entity.polyline?.clampToGround,
        });
      }
      case "billboard": {
        if (!entity.position) {
          return {
            success: false,
            error: "Position is required for billboard entity",
          };
        }
        const imageUrl = entity.billboard?.image || entity.imageUrl;
        if (!imageUrl) {
          return {
            success: false,
            error: "Image URL is required for billboard entity",
          };
        }
        return await this.addBillboard(
          entity.position.longitude,
          entity.position.latitude,
          entity.position.height || 0,
          imageUrl,
          {
            id: entity.id,
            name: entity.name,
            description: entity.description,
            width: entity.billboard?.width,
            height: entity.billboard?.height,
            scale: entity.billboard?.scale,
            color: entity.billboard?.color,
          },
        );
      }
      case "model": {
        if (!entity.position) {
          return {
            success: false,
            error: "Position is required for model entity",
          };
        }
        const modelUri = entity.model?.uri;
        if (!modelUri) {
          return {
            success: false,
            error: "Model URI is required for model entity",
          };
        }
        return await this.addModel(
          entity.position.longitude,
          entity.position.latitude,
          entity.position.height || 0,
          modelUri,
          {
            id: entity.id,
            name: entity.name,
            description: entity.description,
            orientation: entity.orientation,
            scale: entity.model?.scale,
            minimumPixelSize: entity.model?.minimumPixelSize,
            maximumScale: entity.model?.maximumScale,
          },
        );
      }
      case "box": {
        if (!entity.position) {
          return {
            success: false,
            error: "Position is required for box entity",
          };
        }
        const dimensions = entity.box?.dimensions;
        if (!dimensions) {
          return {
            success: false,
            error: "Dimensions are required for box entity",
          };
        }
        return await this.addBox(
          entity.position.longitude,
          entity.position.latitude,
          entity.position.height || 0,
          dimensions,
          {
            id: entity.id,
            name: entity.name,
            description: entity.description,
            material: entity.box?.material,
            fillColor: entity.box?.fillColor,
            outline: entity.box?.outline,
            outlineColor: entity.box?.outlineColor,
            orientation: entity.orientation,
          },
        );
      }
      case "corridor": {
        const positions = entity.corridor?.positions;
        const width = entity.corridor?.width;
        if (!positions || !width) {
          return {
            success: false,
            error: "Positions and width are required for corridor entity",
          };
        }
        return await this.addCorridor(positions, width, {
          id: entity.id,
          name: entity.name,
          description: entity.description,
          material: entity.corridor?.material,
          fillColor: entity.corridor?.fillColor,
          outline: entity.corridor?.outline,
          outlineColor: entity.corridor?.outlineColor,
          cornerType: entity.corridor?.cornerType,
          height: entity.corridor?.height,
          extrudedHeight: entity.corridor?.extrudedHeight,
        });
      }
      case "cylinder": {
        if (!entity.position) {
          return {
            success: false,
            error: "Position is required for cylinder entity",
          };
        }
        const length = entity.cylinder?.length;
        const topRadius = entity.cylinder?.topRadius;
        const bottomRadius = entity.cylinder?.bottomRadius;
        if (
          length === undefined ||
          topRadius === undefined ||
          bottomRadius === undefined
        ) {
          return {
            success: false,
            error:
              "Length, topRadius, and bottomRadius are required for cylinder entity",
          };
        }
        return await this.addCylinder(
          entity.position.longitude,
          entity.position.latitude,
          entity.position.height || 0,
          length,
          topRadius,
          bottomRadius,
          {
            id: entity.id,
            name: entity.name,
            description: entity.description,
            material: entity.cylinder?.material,
            fillColor: entity.cylinder?.fillColor,
            outline: entity.cylinder?.outline,
            outlineColor: entity.cylinder?.outlineColor,
            orientation: entity.orientation,
          },
        );
      }
      case "ellipse": {
        if (!entity.position) {
          return {
            success: false,
            error: "Position is required for ellipse entity",
          };
        }
        const semiMajorAxis = entity.ellipse?.semiMajorAxis;
        const semiMinorAxis = entity.ellipse?.semiMinorAxis;
        if (semiMajorAxis === undefined || semiMinorAxis === undefined) {
          return {
            success: false,
            error:
              "semiMajorAxis and semiMinorAxis are required for ellipse entity",
          };
        }
        return await this.addEllipse(
          entity.position.longitude,
          entity.position.latitude,
          entity.position.height || 0,
          semiMajorAxis,
          semiMinorAxis,
          {
            id: entity.id,
            name: entity.name,
            description: entity.description,
            material: entity.ellipse?.material,
            fillColor: entity.ellipse?.fillColor,
            fillOpacity: entity.ellipse?.fillOpacity,
            outline: entity.ellipse?.outline,
            outlineColor: entity.ellipse?.outlineColor,
            height: entity.ellipse?.height,
            extrudedHeight: entity.ellipse?.extrudedHeight,
            rotation: entity.ellipse?.rotation,
          },
        );
      }
      case "rectangle": {
        const coordinates = entity.rectangle?.coordinates;
        if (!coordinates) {
          return {
            success: false,
            error: "Coordinates are required for rectangle entity",
          };
        }
        return await this.addRectangle(coordinates, {
          id: entity.id,
          name: entity.name,
          description: entity.description,
          material: entity.rectangle?.material,
          fillColor: entity.rectangle?.fillColor,
          fillOpacity: entity.rectangle?.fillOpacity,
          outline: entity.rectangle?.outline,
          outlineColor: entity.rectangle?.outlineColor,
          height: entity.rectangle?.height,
          extrudedHeight: entity.rectangle?.extrudedHeight,
          rotation: entity.rectangle?.rotation,
        });
      }
      case "wall": {
        const positions = entity.wall?.positions;
        if (!positions) {
          return {
            success: false,
            error: "Positions are required for wall entity",
          };
        }
        return await this.addWall(positions, {
          id: entity.id,
          name: entity.name,
          description: entity.description,
          minimumHeights: entity.wall?.minimumHeights,
          maximumHeights: entity.wall?.maximumHeights,
          material: entity.wall?.material,
          fillColor: entity.wall?.fillColor,
          outline: entity.wall?.outline,
          outlineColor: entity.wall?.outlineColor,
        });
      }
      default:
        return {
          success: false,
          error: `Unknown entity type: ${entityType}`,
        };
    }
  }

  /**
   * Shutdown and cleanup
   */
  shutdown(): void {
    // Cleanup if needed
  }

  /**
   * Get command handlers for this manager
   */
  getCommandHandlers(): Map<string, CommandHandler> {
    // entity_add: Generic add command that detects entity type from structure
    this.handlers.set("entity_add", async (cmd) => this.handleEntityAdd(cmd));

    // entity_remove: Remove entity by ID or name pattern
    this.handlers.set("entity_remove", async (cmd) => {
      if (cmd.entityId) {
        return await this.removeEntity(cmd.entityId as string);
      }
      if (cmd.namePattern) {
        return await this.removeEntitiesByName(cmd.namePattern as string);
      }
      return {
        success: false,
        error:
          "Either entityId or namePattern must be provided for entity removal",
      };
    });

    // entity_list: List all entities with optional filtering
    this.handlers.set("entity_list", async () => {
      return await this.listEntities();
    });

    return this.handlers;
  }
}

export default CesiumEntityManager;
