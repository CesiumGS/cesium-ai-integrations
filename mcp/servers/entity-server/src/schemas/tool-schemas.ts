import { z } from "zod";
import { PositionSchema } from "./core-schemas.js";
import {
  PointGraphicsSchema,
  BillboardGraphicsSchema,
  LabelGraphicsSchema,
  ModelGraphicsSchema,
  PolygonGraphicsSchema,
  PolylineGraphicsSchema,
} from "./graphics-schemas.js";

/**
 * Tool input schemas for entity operations
 */

/**
 * Add point entity input
 */
export const AddPointEntityInputSchema = z.object({
  position: PositionSchema.describe("Location of the point entity"),
  point: PointGraphicsSchema.optional().describe("Point appearance properties"),
  name: z.string().optional().describe("Display name for the entity"),
  description: z.string().optional().describe("HTML description for InfoBox"),
  id: z
    .string()
    .optional()
    .describe("Unique identifier (auto-generated if omitted)"),
});

/**
 * Add billboard entity input
 */
export const AddBillboardEntityInputSchema = z.object({
  position: PositionSchema.describe("Location of the billboard entity"),
  billboard: BillboardGraphicsSchema.describe(
    "Billboard appearance properties",
  ),
  name: z.string().optional().describe("Display name for the entity"),
  description: z.string().optional().describe("HTML description for InfoBox"),
  id: z
    .string()
    .optional()
    .describe("Unique identifier (auto-generated if omitted)"),
});

/**
 * Add label entity input
 */
export const AddLabelEntityInputSchema = z.object({
  position: PositionSchema.describe("Location of the label entity"),
  label: LabelGraphicsSchema.describe("Label appearance properties"),
  name: z.string().optional().describe("Display name for the entity"),
  description: z.string().optional().describe("HTML description for InfoBox"),
  id: z
    .string()
    .optional()
    .describe("Unique identifier (auto-generated if omitted)"),
});

/**
 * Add model entity input
 */
export const AddModelEntityInputSchema = z.object({
  position: PositionSchema.describe("Location of the 3D model"),
  model: ModelGraphicsSchema.describe("Model appearance properties"),
  orientation: z
    .object({
      heading: z.number().describe("Heading in radians"),
      pitch: z.number().describe("Pitch in radians"),
      roll: z.number().describe("Roll in radians"),
    })
    .optional()
    .describe("Model orientation"),
  name: z.string().optional().describe("Display name for the entity"),
  description: z.string().optional().describe("HTML description for InfoBox"),
  id: z
    .string()
    .optional()
    .describe("Unique identifier (auto-generated if omitted)"),
});

/**
 * Add polygon entity input
 */
export const AddPolygonEntityInputSchema = z.object({
  polygon: PolygonGraphicsSchema.describe("Polygon appearance properties"),
  name: z.string().optional().describe("Display name for the entity"),
  description: z.string().optional().describe("HTML description for InfoBox"),
  id: z
    .string()
    .optional()
    .describe("Unique identifier (auto-generated if omitted)"),
});

/**
 * Add polyline entity input
 */
export const AddPolylineEntityInputSchema = z.object({
  polyline: PolylineGraphicsSchema.describe("Polyline appearance properties"),
  name: z.string().optional().describe("Display name for the entity"),
  description: z.string().optional().describe("HTML description for InfoBox"),
  id: z
    .string()
    .optional()
    .describe("Unique identifier (auto-generated if omitted)"),
});

/**
 * List entities input
 */
export const ListEntitiesInputSchema = z.object({
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
});

/**
 * Remove entity input
 */
export const RemoveEntityInputSchema = z.object({
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
});

// Type exports
export type AddPointEntityInput = z.infer<typeof AddPointEntityInputSchema>;
export type AddBillboardEntityInput = z.infer<
  typeof AddBillboardEntityInputSchema
>;
export type AddLabelEntityInput = z.infer<typeof AddLabelEntityInputSchema>;
export type AddModelEntityInput = z.infer<typeof AddModelEntityInputSchema>;
export type AddPolygonEntityInput = z.infer<typeof AddPolygonEntityInputSchema>;
export type AddPolylineEntityInput = z.infer<
  typeof AddPolylineEntityInputSchema
>;
export type ListEntitiesInput = z.infer<typeof ListEntitiesInputSchema>;
export type RemoveEntityInput = z.infer<typeof RemoveEntityInputSchema>;
