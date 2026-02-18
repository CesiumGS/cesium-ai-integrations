import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ICommunicationServer } from "@cesium-mcp/shared";
import {
  PositionSchema,
  PointGraphicsSchema,
  BillboardGraphicsSchema,
  LabelGraphicsSchema,
  ModelGraphicsSchema,
  PolygonGraphicsSchema,
  PolylineGraphicsSchema,
  EntityResponseSchema,
  EntityListResponseSchema,
} from "../schemas.js";

interface EntitySummary {
  id: string;
  name?: string;
  type: string;
  position?: {
    latitude?: number;
    longitude?: number;
    height?: number;
  };
}

export function registerEntityTools(
  server: McpServer,
  communicationServer: ICommunicationServer | undefined,
): void {
  if (!communicationServer) {
    throw new Error(
      "Entity tools require a communication server for browser visualization",
    );
  }

  // Tool: Add Point Entity
  server.registerTool(
    "entity_add_point",
    {
      title: "Add Point Entity",
      description:
        "Create a point entity at a specific location with customizable appearance",
      inputSchema: {
        position: PositionSchema,
        point: PointGraphicsSchema.optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        id: z.string().optional(),
      },
      outputSchema: EntityResponseSchema.shape,
    },
    async ({ position, point, name, description, id }) => {
      const startTime = Date.now();

      try {
        const entity = {
          id: id || `point_${Date.now()}`,
          name: name || "Point",
          description,
          position,
          point: point || {
            pixelSize: 10,
            color: { red: 1, green: 1, blue: 0, alpha: 1 }, // Yellow
            outlineColor: { red: 0, green: 0, blue: 0, alpha: 1 }, // Black
            outlineWidth: 2,
          },
        };

        const command = {
          type: "entity_add",
          entity,
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTime;

        if (result.success) {
          const output = {
            success: true,
            message: `Point entity "${entity.name}" added at ${position.latitude}°, ${position.longitude}°`,
            entityId: entity.id,
            entityName: entity.name,
            position,
            stats: {
              totalEntities: result.totalEntities || 0,
              responseTime,
            },
          };

          return {
            content: [
              {
                type: "text",
                text: `📍 ${output.message} (${responseTime}ms)`,
              },
            ],
            structuredContent: output,
          };
        }
        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorOutput = {
          success: false,
          message: `Failed to add point entity: ${error instanceof Error ? error.message : "Unknown error"}`,
          entityId: id || "",
          position,
          stats: {
            totalEntities: 0,
            responseTime,
          },
        };

        return {
          content: [
            {
              type: "text",
              text: `❌ ${errorOutput.message} (${responseTime}ms)`,
            },
          ],
          structuredContent: errorOutput,
          isError: true,
        };
      }
    },
  );

  // Tool: Add Billboard Entity
  server.registerTool(
    "entity_add_billboard",
    {
      title: "Add Billboard Entity",
      description:
        "Create a billboard (image marker) entity at a specific location",
      inputSchema: {
        position: PositionSchema,
        billboard: BillboardGraphicsSchema,
        name: z.string().optional(),
        description: z.string().optional(),
        id: z.string().optional(),
      },
      outputSchema: EntityResponseSchema.shape,
    },
    async ({ position, billboard, name, description, id }) => {
      const startTime = Date.now();

      try {
        const entity = {
          id: id || `billboard_${Date.now()}`,
          name: name || "Billboard",
          description,
          position,
          billboard,
        };

        const command = {
          type: "entity_add",
          entity,
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTime;

        if (result.success) {
          const output = {
            success: true,
            message: `Billboard entity "${entity.name}" added at ${position.latitude}°, ${position.longitude}°`,
            entityId: entity.id,
            entityName: entity.name,
            position,
            stats: {
              totalEntities: result.totalEntities || 0,
              responseTime,
            },
          };

          return {
            content: [
              {
                type: "text",
                text: `🖼️ ${output.message} (${responseTime}ms)`,
              },
            ],
            structuredContent: output,
          };
        }
        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorOutput = {
          success: false,
          message: `Failed to add billboard entity: ${error instanceof Error ? error.message : "Unknown error"}`,
          entityId: id || "",
          position,
          stats: {
            totalEntities: 0,
            responseTime,
          },
        };

        return {
          content: [
            {
              type: "text",
              text: `❌ ${errorOutput.message} (${responseTime}ms)`,
            },
          ],
          structuredContent: errorOutput,
          isError: true,
        };
      }
    },
  );

  // Tool: Add Label Entity
  server.registerTool(
    "entity_add_label",
    {
      title: "Add Label Entity",
      description: "Create a text label entity at a specific location",
      inputSchema: {
        position: PositionSchema,
        label: LabelGraphicsSchema,
        name: z.string().optional(),
        description: z.string().optional(),
        id: z.string().optional(),
      },
      outputSchema: EntityResponseSchema.shape,
    },
    async ({ position, label, name, description, id }) => {
      const startTime = Date.now();

      try {
        const entity = {
          id: id || `label_${Date.now()}`,
          name: name || "Label",
          description,
          position,
          label,
        };

        const command = {
          type: "entity_add",
          entity,
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTime;

        if (result.success) {
          const output = {
            success: true,
            message: `Label entity "${entity.name}" with text "${label.text}" added at ${position.latitude}°, ${position.longitude}°`,
            entityId: entity.id,
            entityName: entity.name,
            position,
            stats: {
              totalEntities: result.totalEntities || 0,
              responseTime,
            },
          };

          return {
            content: [
              {
                type: "text",
                text: `🏷️ ${output.message} (${responseTime}ms)`,
              },
            ],
            structuredContent: output,
          };
        }
        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorOutput = {
          success: false,
          message: `Failed to add label entity: ${error instanceof Error ? error.message : "Unknown error"}`,
          entityId: id || "",
          position,
          stats: {
            totalEntities: 0,
            responseTime,
          },
        };

        return {
          content: [
            {
              type: "text",
              text: `❌ ${errorOutput.message} (${responseTime}ms)`,
            },
          ],
          structuredContent: errorOutput,
          isError: true,
        };
      }
    },
  );

  // Tool: Add 3D Model Entity
  server.registerTool(
    "entity_add_model",
    {
      title: "Add 3D Model Entity",
      description:
        "Create a 3D model entity (glTF) at a specific location with orientation",
      inputSchema: {
        position: PositionSchema,
        model: ModelGraphicsSchema,
        orientation: z
          .object({
            heading: z.number().describe("Heading in radians"),
            pitch: z.number().describe("Pitch in radians"),
            roll: z.number().describe("Roll in radians"),
          })
          .optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        id: z.string().optional(),
      },
      outputSchema: EntityResponseSchema.shape,
    },
    async ({ position, model, orientation, name, description, id }) => {
      const startTime = Date.now();

      try {
        const entity = {
          id: id || `model_${Date.now()}`,
          name: name || "3D Model",
          description,
          position,
          orientation,
          model,
        };

        const command = {
          type: "entity_add",
          entity,
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTime;

        if (result.success) {
          const output = {
            success: true,
            message: `3D Model entity "${entity.name}" added at ${position.latitude}°, ${position.longitude}°`,
            entityId: entity.id,
            entityName: entity.name,
            position,
            stats: {
              totalEntities: result.totalEntities || 0,
              responseTime,
            },
          };

          return {
            content: [
              {
                type: "text",
                text: `🎭 ${output.message} (${responseTime}ms)`,
              },
            ],
            structuredContent: output,
          };
        }
        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorOutput = {
          success: false,
          message: `Failed to add 3D model entity: ${error instanceof Error ? error.message : "Unknown error"}`,
          entityId: id || "",
          position,
          stats: {
            totalEntities: 0,
            responseTime,
          },
        };

        return {
          content: [
            {
              type: "text",
              text: `❌ ${errorOutput.message} (${responseTime}ms)`,
            },
          ],
          structuredContent: errorOutput,
          isError: true,
        };
      }
    },
  );

  // Tool: Add Polygon Entity
  server.registerTool(
    "entity_add_polygon",
    {
      title: "Add Polygon Entity",
      description: "Create a polygon entity from an array of positions",
      inputSchema: {
        polygon: PolygonGraphicsSchema,
        name: z.string().optional(),
        description: z.string().optional(),
        id: z.string().optional(),
      },
      outputSchema: EntityResponseSchema.shape,
    },
    async ({ polygon, name, description, id }) => {
      const startTime = Date.now();

      try {
        const entity = {
          id: id || `polygon_${Date.now()}`,
          name: name || "Polygon",
          description,
          polygon,
        };

        const command = {
          type: "entity_add",
          entity,
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTime;

        if (result.success) {
          const centerLat =
            polygon.hierarchy.reduce((sum, pos) => sum + pos.latitude, 0) /
            polygon.hierarchy.length;
          const centerLon =
            polygon.hierarchy.reduce((sum, pos) => sum + pos.longitude, 0) /
            polygon.hierarchy.length;

          const output = {
            success: true,
            message: `Polygon entity "${entity.name}" with ${polygon.hierarchy.length} vertices added (center: ${centerLat.toFixed(4)}°, ${centerLon.toFixed(4)}°)`,
            entityId: entity.id,
            entityName: entity.name,
            position: {
              latitude: centerLat,
              longitude: centerLon,
              height: polygon.height,
            },
            stats: {
              totalEntities: result.totalEntities || 0,
              responseTime,
            },
          };

          return {
            content: [
              {
                type: "text",
                text: `▲ ${output.message} (${responseTime}ms)`,
              },
            ],
            structuredContent: output,
          };
        }
        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorOutput = {
          success: false,
          message: `Failed to add polygon entity: ${error instanceof Error ? error.message : "Unknown error"}`,
          entityId: id || "",
          stats: {
            totalEntities: 0,
            responseTime,
          },
        };

        return {
          content: [
            {
              type: "text",
              text: `❌ ${errorOutput.message} (${responseTime}ms)`,
            },
          ],
          structuredContent: errorOutput,
          isError: true,
        };
      }
    },
  );

  // Tool: Add Polyline Entity
  server.registerTool(
    "entity_add_polyline",
    {
      title: "Add Polyline Entity",
      description: "Create a polyline entity connecting multiple positions",
      inputSchema: {
        polyline: PolylineGraphicsSchema,
        name: z.string().optional(),
        description: z.string().optional(),
        id: z.string().optional(),
      },
      outputSchema: EntityResponseSchema.shape,
    },
    async ({ polyline, name, description, id }) => {
      const startTime = Date.now();

      try {
        const entity = {
          id: id || `polyline_${Date.now()}`,
          name: name || "Polyline",
          description,
          polyline,
        };

        const command = {
          type: "entity_add",
          entity,
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTime;

        if (result.success) {
          const startPos = polyline.positions[0];
          const endPos = polyline.positions[polyline.positions.length - 1];

          const output = {
            success: true,
            message: `Polyline entity "${entity.name}" with ${polyline.positions.length} points added from ${startPos.latitude.toFixed(4)}°, ${startPos.longitude.toFixed(4)}° to ${endPos.latitude.toFixed(4)}°, ${endPos.longitude.toFixed(4)}°`,
            entityId: entity.id,
            entityName: entity.name,
            position: startPos,
            stats: {
              totalEntities: result.totalEntities || 0,
              responseTime,
            },
          };

          return {
            content: [
              {
                type: "text",
                text: `📏 ${output.message} (${responseTime}ms)`,
              },
            ],
            structuredContent: output,
          };
        }
        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorOutput = {
          success: false,
          message: `Failed to add polyline entity: ${error instanceof Error ? error.message : "Unknown error"}`,
          entityId: id || "",
          stats: {
            totalEntities: 0,
            responseTime,
          },
        };

        return {
          content: [
            {
              type: "text",
              text: `❌ ${errorOutput.message} (${responseTime}ms)`,
            },
          ],
          structuredContent: errorOutput,
          isError: true,
        };
      }
    },
  );

  // Tool: List All Entities
  server.registerTool(
    "entity_list",
    {
      title: "List All Entities",
      description:
        "Get a list of all entities currently in the scene with their IDs, names, and types",
      inputSchema: {
        includeDetails: z
          .boolean()
          .optional()
          .describe(
            "Include detailed entity information (position, properties, etc.)",
          ),
        filterByType: z
          .enum(["point", "label", "polygon", "polyline", "model", "billboard"])
          .optional()
          .describe("Filter entities by specific type"),
      },
      outputSchema: EntityListResponseSchema.shape,
    },
    async ({ includeDetails = false, filterByType }) => {
      const startTime = Date.now();

      try {
        const command = {
          type: "entity_list",
          includeDetails,
          filterByType,
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTime;

        if (result.success) {
          const entities = (result.entities as EntitySummary[]) || [];
          const filteredCount = filterByType
            ? entities.filter((e: EntitySummary) => e.type === filterByType)
                .length
            : entities.length;

          const output = {
            success: true,
            message: `Found ${filteredCount} entit${filteredCount === 1 ? "y" : "ies"}${filterByType ? ` of type '${filterByType}'` : ""} in the scene`,
            entities,
            totalCount: entities.length,
            filteredCount: filterByType ? filteredCount : entities.length,
            stats: {
              totalEntities: entities.length,
              responseTime,
            },
          };

          // Create summary text
          let summaryText = `📋 ${output.message} (${responseTime}ms)\n`;
          if (entities.length > 0) {
            summaryText += "\nEntities:\n";

            entities.forEach((entity: EntitySummary, index: number) => {
              summaryText += `${index + 1}. ${entity.name || entity.id} (${entity.type})`;
              if (entity.position && includeDetails) {
                summaryText += ` at ${entity.position.latitude?.toFixed(4)}°, ${entity.position.longitude?.toFixed(4)}°`;
              }
              summaryText += "\n";
            });
          }

          return {
            content: [
              {
                type: "text",
                text: summaryText,
              },
            ],
            structuredContent: output,
          };
        }
        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorOutput = {
          success: false,
          message: `Failed to list entities: ${error instanceof Error ? error.message : "Unknown error"}`,
          entities: [],
          totalCount: 0,
          filteredCount: 0,
          stats: {
            totalEntities: 0,
            responseTime,
          },
        };

        return {
          content: [
            {
              type: "text",
              text: `❌ ${errorOutput.message} (${responseTime}ms)`,
            },
          ],
          structuredContent: errorOutput,
          isError: true,
        };
      }
    },
  );

  // Tool: Remove Entity
  server.registerTool(
    "entity_remove",
    {
      title: "Remove Entity",
      description: "Remove an entity from the scene by ID or name",
      inputSchema: {
        entityId: z
          .string()
          .optional()
          .describe("The unique ID of the entity to remove"),
        namePattern: z
          .string()
          .optional()
          .describe("Pattern to match entity names (if no ID provided)"),
        removeAll: z
          .boolean()
          .optional()
          .describe("Remove all entities matching the criteria"),
        confirmRemoval: z
          .boolean()
          .default(true)
          .describe("Require confirmation before removing (safety check)"),
      },
      outputSchema: z
        .object({
          success: z.boolean(),
          message: z.string(),
          removedEntityId: z.string().optional(),
          removedEntityName: z.string().optional(),
          removedCount: z.number().optional(),
          stats: z.object({
            responseTime: z.number(),
          }),
        })
        .describe("Result of entity removal operation").shape,
    },
    async ({
      entityId,
      namePattern,
      removeAll = false,
      confirmRemoval = true,
    }) => {
      const startTime = Date.now();

      try {
        // Validation
        if (!entityId && !namePattern) {
          throw new Error("Either entityId or namePattern must be provided");
        }

        const command = {
          type: "entity_remove",
          entityId,
          namePattern,
          removeAll,
          confirmRemoval,
        };

        const result = await communicationServer.executeCommand(command);
        const responseTime = Date.now() - startTime;

        if (result.success) {
          const removedCount = result.removedCount || 1;
          const identifier = entityId || namePattern;

          const output = {
            success: true,
            message: removeAll
              ? `Removed ${removedCount} entit${removedCount === 1 ? "y" : "ies"} matching '${identifier}'`
              : `Entity '${identifier}' removed successfully`,
            removedEntityId: result.removedEntityId || entityId,
            removedEntityName: result.removedEntityName || namePattern,
            removedCount,
            stats: {
              responseTime,
            },
          };

          return {
            content: [
              {
                type: "text",
                text: `🗑️ ${output.message} (${responseTime}ms)`,
              },
            ],
            structuredContent: output,
          };
        }
        throw new Error(result.error || "Unknown error from Cesium");
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const identifier = entityId || namePattern || "unknown";
        const errorOutput = {
          success: false,
          message: `Failed to remove entity '${identifier}': ${error instanceof Error ? error.message : "Unknown error"}`,
          removedEntityId: entityId,
          removedEntityName: namePattern,
          removedCount: 0,
          stats: {
            responseTime,
          },
        };

        return {
          content: [
            {
              type: "text",
              text: `❌ ${errorOutput.message} (${responseTime}ms)`,
            },
          ],
          structuredContent: errorOutput,
          isError: true,
        };
      }
    },
  );
}
