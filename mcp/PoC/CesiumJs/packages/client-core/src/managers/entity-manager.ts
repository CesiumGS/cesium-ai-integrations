/**
 * Cesium Entity Manager Module
 * Handles all entity creation, management, and removal operations
 */

import type {
  MCPCommandResult,
  CommandHandler,
  ManagerInterface,
  PointOptions,
  LabelOptions,
  PolygonOptions,
  PolylineOptions,
  BillboardOptions,
  ModelOptions,
  Position,
} from "../types/mcp.js";

import { parseColor } from "../shared/cesium-utils.js";
import { addPointEntity, addLabelEntity } from "../shared/entity-utils.js";

type CesiumViewer = any; // Type from @cesium/engine or cesium
type CesiumEntity = any; // Type from @cesium/engine or cesium

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
  ): Promise<MCPCommandResult> {
    return new Promise((resolve) => {
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

        resolve({
          success: true,
          entityId: entity.id,
          type: "point",
          message: `Point entity '${entity.name}' created at ${longitude.toFixed(4)}, ${latitude.toFixed(4)}`,
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
   * Add a text label entity
   */
  async addLabel(
    longitude: number,
    latitude: number,
    height: number = 0,
    text: string,
    options: LabelOptions = {},
  ): Promise<MCPCommandResult> {
    return new Promise((resolve) => {
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

        resolve({
          success: true,
          entityId: entity.id,
          type: "label",
          message: `Label entity '${entity.name}' created with text '${text}'`,
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
   * Add a polygon entity
   */
  async addPolygon(
    coordinates: Position[],
    options: PolygonOptions = {},
  ): Promise<MCPCommandResult> {
    return new Promise((resolve) => {
      try {
        const positions = coordinates.map((coord) =>
          Cesium.Cartesian3.fromDegrees(
            coord.longitude,
            coord.latitude,
            coord.height || 0,
          ),
        );

        // Handle material - can be MCP format or legacy format
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

        const entity = this.viewer.entities.add({
          id: options.id || `polygon_${Date.now()}`,
          name: options.name || "Polygon",
          polygon: {
            hierarchy: positions,
            material: material,
            outline: options.outline !== undefined ? options.outline : true,
            outlineColor:
              parseColor(options.outlineColor) || Cesium.Color.BLACK,
            height: options.height || 0,
            extrudedHeight: options.extrudedHeight,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
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
  ): Promise<MCPCommandResult> {
    return new Promise((resolve) => {
      try {
        const positions = coordinates.map((coord) =>
          Cesium.Cartesian3.fromDegrees(
            coord.longitude,
            coord.latitude,
            coord.height || 100, // Default height of 100m to ensure visibility
          ),
        );

        let material = Cesium.Color.RED; // Change default to red for better visibility
        if (
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

        const entity = this.viewer.entities.add({
          id: options.id || `polyline_${Date.now()}`,
          name: options.name || "Polyline",
          polyline: {
            show: true, // Explicitly show the polyline
            positions: positions,
            width: options.width || 5, // Increase default width for better visibility
            material: material,
            clampToGround:
              options.clampToGround !== undefined
                ? options.clampToGround
                : false, // Don't clamp by default
            followSurface: true, // Follow the Earth's surface
            granularity: Cesium.Math.RADIANS_PER_DEGREE, // Add granularity for smoother curves
          },
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
  ): Promise<MCPCommandResult> {
    return new Promise((resolve) => {
      try {
        const entity = this.viewer.entities.add({
          id: options.id || `billboard_${Date.now()}`,
          name: options.name || "Billboard",
          position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
          billboard: {
            image: imageUrl,
            width: options.width || 64,
            height: options.height || 64,
            pixelOffset: new Cesium.Cartesian2(0, -32),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            scale: options.scale || 1.0,
          },
        });

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
  ): Promise<MCPCommandResult> {
    return new Promise((resolve) => {
      try {
        const position = Cesium.Cartesian3.fromDegrees(
          longitude,
          latitude,
          height,
        );

        const entityConfig: {
          id: string;
          name: string;
          description?: string;
          position: any;
          model: any;
          orientation?: any;
        } = {
          id: options.id || `model_${Date.now()}`,
          name: options.name || "3D Model",
          description: options.description,
          position: position,
          model: {
            uri: modelUri,
            scale: options.scale || 1,
            minimumPixelSize: options.minimumPixelSize || 128,
            maximumScale: options.maximumScale || 20000,
            runAnimations: options.runAnimations !== false,
            show: options.show !== false,
          },
        };

        // Add orientation if specified
        if (options.orientation) {
          entityConfig.orientation =
            Cesium.Transforms.headingPitchRollQuaternion(
              position,
              new Cesium.HeadingPitchRoll(
                options.orientation.heading || 0,
                options.orientation.pitch || 0,
                options.orientation.roll || 0,
              ),
            );
        }

        const entity = this.viewer.entities.add(entityConfig);

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
   * Remove an entity by ID
   */
  async removeEntity(entityId: string): Promise<MCPCommandResult> {
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
  async removeEntitiesByName(namePattern: string): Promise<MCPCommandResult> {
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
  async listEntities(): Promise<MCPCommandResult> {
    return new Promise((resolve) => {
      try {
        const entities = [];
        const entityCollection = this.viewer.entities.values;

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
            type: this.getEntityType(entity),
          };

          // Add position if available
          if (entity.position) {
            const cartographic = Cesium.Cartographic.fromCartesian(
              entity.position.getValue(Cesium.JulianDate.now()),
            );
            entityInfo.position = {
              longitude: Cesium.Math.toDegrees(cartographic.longitude),
              latitude: Cesium.Math.toDegrees(cartographic.latitude),
              height: cartographic.height,
            };
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
   * Clear all entities from the scene
   */
  async clearAll(): Promise<MCPCommandResult> {
    return await this.clearAllEntities();
  }

  /**
   * Clear all entities from the scene
   */
  async clearAllEntities(): Promise<MCPCommandResult> {
    return new Promise((resolve) => {
      try {
        const count = this.viewer.entities.values.length;
        this.viewer.entities.removeAll();

        resolve({
          success: true,
          removedCount: count,
          message: `Cleared all ${count} entities from the scene`,
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
   * Helper function to determine entity type
   */
  getEntityType(entity: CesiumEntity): string {
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

  /**
   * Handle generic entity_add command by detecting entity type
   */
  async handleEntityAdd(
    command: Record<string, unknown>,
  ): Promise<MCPCommandResult> {
    const entity = (command.entity as Record<string, unknown>) || command;

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
      }
    }

    switch (entityType) {
      case "point":
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
      case "label":
        return await this.addLabel(
          entity.position.longitude,
          entity.position.latitude,
          entity.position.height || 0,
          entity.label?.text || entity.text,
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
      case "polygon":
        return await this.addPolygon(
          entity.polygon?.hierarchy || entity.positions || entity.coordinates,
          {
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
          },
        );
      case "polyline":
        return await this.addPolyline(
          entity.polyline?.positions || entity.coordinates,
          {
            id: entity.id,
            name: entity.name,
            description: entity.description,
            width: entity.polyline?.width,
            material: entity.polyline?.material,
            clampToGround: entity.polyline?.clampToGround,
          },
        );
      case "billboard":
        return await this.addBillboard(
          entity.position.longitude,
          entity.position.latitude,
          entity.position.height || 0,
          entity.billboard?.image || entity.imageUrl,
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
      case "model":
        return await this.addModel(
          entity.position.longitude,
          entity.position.latitude,
          entity.position.height || 0,
          entity.model?.uri,
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
    this.handlers.set("entity_add", async (cmd) => this.handleEntityAdd(cmd));

    this.handlers.set("entity_add_point", async (cmd) => {
      const position = cmd.position as Position;
      return await this.addPoint(
        position.longitude,
        position.latitude,
        position.height || 0,
        {
          id: cmd.id as string | undefined,
          name: cmd.name as string | undefined,
          description: cmd.description as string | undefined,
          pixelSize: cmd.pixelSize as number | undefined,
          color: cmd.color,
          outlineColor: cmd.outlineColor,
          outlineWidth: cmd.outlineWidth as number | undefined,
        },
      );
    });

    this.handlers.set("entity_add_label", async (cmd) => {
      const position = cmd.position as Position;
      return await this.addLabel(
        position.longitude,
        position.latitude,
        position.height || 0,
        cmd.text as string,
        {
          id: cmd.id as string | undefined,
          name: cmd.name as string | undefined,
          description: cmd.description as string | undefined,
          font: cmd.font as string | undefined,
          fillColor: cmd.fillColor,
          outlineColor: cmd.outlineColor,
          outlineWidth: cmd.outlineWidth as number | undefined,
          style: cmd.style as string | undefined,
          scale: cmd.scale as number | undefined,
          pixelOffset: cmd.pixelOffset as { x: number; y: number } | undefined,
        },
      );
    });

    this.handlers.set("entity_add_polygon", async (cmd) => {
      return await this.addPolygon(cmd.hierarchy as Position[], cmd);
    });

    this.handlers.set("entity_add_polyline", async (cmd) => {
      return await this.addPolyline(cmd.positions as Position[], cmd);
    });

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

    this.handlers.set("entity_list_all", async () => {
      return await this.listEntities();
    });

    this.handlers.set("entity_list", async () => {
      return await this.listEntities();
    });

    this.handlers.set("entity_clear_all", async () => {
      return await this.clearAll();
    });

    return this.handlers;
  }
}

export default CesiumEntityManager;
