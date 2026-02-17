import { z } from "zod";
import {
  PositionSchema,
  ColorSchema,
  MaterialSchema,
  PolylineMaterialSchema,
  ModelAnimationSchema,
} from "./core-schemas.js";

/**
 * Graphics schemas for different entity types
 * These define the visual properties of entities
 */

/**
 * Point graphics configuration
 */
export const PointGraphicsSchema = z
  .object({
    show: z.boolean().optional().default(true),
    pixelSize: z.number().min(1).optional().default(5),
    color: ColorSchema.optional(),
    outlineColor: ColorSchema.optional(),
    outlineWidth: z.number().min(0).optional().default(0),
    scaleByDistance: z
      .object({
        near: z.number(),
        nearValue: z.number(),
        far: z.number(),
        farValue: z.number(),
      })
      .optional(),
    heightReference: z
      .enum(["NONE", "CLAMP_TO_GROUND", "RELATIVE_TO_GROUND"])
      .optional(),
  })
  .describe("Point graphics configuration");

/**
 * Billboard graphics configuration
 */
export const BillboardGraphicsSchema = z
  .object({
    show: z.boolean().optional().default(true),
    image: z.string().describe("URL to image file"),
    width: z.number().min(1).optional(),
    height: z.number().min(1).optional(),
    scale: z.number().min(0).optional().default(1),
    color: ColorSchema.optional(),
    rotation: z.number().optional().describe("Rotation in radians"),
    alignedAxis: z
      .object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      })
      .optional(),
    horizontalOrigin: z.enum(["LEFT", "CENTER", "RIGHT"]).optional(),
    verticalOrigin: z.enum(["TOP", "CENTER", "BOTTOM"]).optional(),
    pixelOffset: z
      .object({
        x: z.number(),
        y: z.number(),
      })
      .optional(),
    scaleByDistance: z
      .object({
        near: z.number(),
        nearValue: z.number(),
        far: z.number(),
        farValue: z.number(),
      })
      .optional(),
    heightReference: z
      .enum(["NONE", "CLAMP_TO_GROUND", "RELATIVE_TO_GROUND"])
      .optional(),
  })
  .describe("Billboard graphics configuration");

/**
 * Label graphics configuration
 */
export const LabelGraphicsSchema = z
  .object({
    show: z.boolean().optional().default(true),
    text: z.string(),
    font: z.string().optional().default("14pt monospace"),
    style: z
      .enum(["FILL", "OUTLINE", "FILL_AND_OUTLINE"])
      .optional()
      .default("FILL"),
    fillColor: ColorSchema.optional(),
    outlineColor: ColorSchema.optional(),
    outlineWidth: z.number().min(0).optional().default(1),
    scale: z.number().min(0).optional().default(1),
    horizontalOrigin: z.enum(["LEFT", "CENTER", "RIGHT"]).optional(),
    verticalOrigin: z.enum(["TOP", "CENTER", "BOTTOM"]).optional(),
    pixelOffset: z
      .object({
        x: z.number(),
        y: z.number(),
      })
      .optional(),
    scaleByDistance: z
      .object({
        near: z.number(),
        nearValue: z.number(),
        far: z.number(),
        farValue: z.number(),
      })
      .optional(),
    heightReference: z
      .enum(["NONE", "CLAMP_TO_GROUND", "RELATIVE_TO_GROUND"])
      .optional(),
  })
  .describe("Label graphics configuration");

/**
 * 3D model graphics configuration
 */
export const ModelGraphicsSchema = z
  .object({
    show: z.boolean().optional().default(true),
    uri: z.string().describe("URI to glTF model file"),
    scale: z.number().min(0).optional().default(1),
    minimumPixelSize: z.number().min(0).optional().default(0),
    maximumScale: z.number().min(0).optional(),
    incrementallyLoadTextures: z.boolean().optional().default(true),
    runAnimations: z.boolean().optional().default(true),
    clampAnimations: z.boolean().optional().default(true),
    color: ColorSchema.optional(),
    colorBlendMode: z.enum(["HIGHLIGHT", "REPLACE", "MIX"]).optional(),
    colorBlendAmount: z.number().min(0).max(1).optional().default(0.5),
    heightReference: z
      .enum(["NONE", "CLAMP_TO_GROUND", "RELATIVE_TO_GROUND"])
      .optional(),
    animations: z
      .array(ModelAnimationSchema)
      .optional()
      .describe("Model animation configurations"),
    nodeTransformations: z
      .record(
        z.string(),
        z.object({
          translation: z
            .object({ x: z.number(), y: z.number(), z: z.number() })
            .optional(),
          rotation: z
            .object({
              x: z.number(),
              y: z.number(),
              z: z.number(),
              w: z.number(),
            })
            .optional(),
          scale: z
            .object({ x: z.number(), y: z.number(), z: z.number() })
            .optional(),
        }),
      )
      .optional()
      .describe("Node transformations for animation"),
  })
  .describe("3D model graphics configuration");

/**
 * Polygon graphics configuration
 */
export const PolygonGraphicsSchema = z
  .object({
    show: z.boolean().optional().default(true),
    hierarchy: z
      .array(PositionSchema)
      .describe("Array of positions defining polygon boundary"),
    height: z.number().optional().describe("Height above ellipsoid in meters"),
    extrudedHeight: z
      .number()
      .optional()
      .describe("Height of extrusion in meters"),
    fill: z.boolean().optional().default(true),
    material: MaterialSchema.optional(),
    outline: z.boolean().optional().default(false),
    outlineColor: ColorSchema.optional(),
    outlineWidth: z.number().min(0).optional().default(1),
    stRotation: z.number().optional().describe("Texture coordinate rotation"),
    granularity: z.number().min(0).optional(),
    perPositionHeight: z.boolean().optional().default(false),
  })
  .describe("Polygon graphics configuration");

/**
 * Polyline graphics configuration
 */
export const PolylineGraphicsSchema = z
  .object({
    show: z.boolean().optional().default(true),
    positions: z
      .array(PositionSchema)
      .describe("Array of positions defining polyline path"),
    width: z.number().min(1).optional().default(1),
    material: PolylineMaterialSchema.optional(),
    clampToGround: z.boolean().optional().default(false),
    granularity: z.number().min(0).optional(),
    followSurface: z.boolean().optional().default(true),
    arcType: z
      .enum(["GEODESIC", "RHUMB", "NONE"])
      .optional()
      .default("GEODESIC"),
  })
  .describe("Polyline graphics configuration");

/**
 * Rectangle graphics configuration
 */
export const RectangleGraphicsSchema = z
  .object({
    show: z.boolean().optional().default(true),
    coordinates: z.object({
      west: z.number().describe("Western longitude in degrees"),
      south: z.number().describe("Southern latitude in degrees"),
      east: z.number().describe("Eastern longitude in degrees"),
      north: z.number().describe("Northern latitude in degrees"),
    }),
    height: z.number().optional().describe("Height above ellipsoid in meters"),
    extrudedHeight: z
      .number()
      .optional()
      .describe("Height of extrusion in meters"),
    fill: z.boolean().optional().default(true),
    material: MaterialSchema.optional(),
    outline: z.boolean().optional().default(false),
    outlineColor: ColorSchema.optional(),
    outlineWidth: z.number().min(0).optional().default(1),
    rotation: z.number().optional().describe("Rotation angle in radians"),
    stRotation: z.number().optional().describe("Texture coordinate rotation"),
    granularity: z.number().min(0).optional(),
  })
  .describe("Rectangle graphics configuration");

/**
 * Ellipse graphics configuration
 */
export const EllipseGraphicsSchema = z
  .object({
    show: z.boolean().optional().default(true),
    semiMajorAxis: z.number().min(0).describe("Semi-major axis in meters"),
    semiMinorAxis: z.number().min(0).describe("Semi-minor axis in meters"),
    height: z.number().optional().describe("Height above ellipsoid in meters"),
    extrudedHeight: z
      .number()
      .optional()
      .describe("Height of extrusion in meters"),
    fill: z.boolean().optional().default(true),
    material: MaterialSchema.optional(),
    outline: z.boolean().optional().default(false),
    outlineColor: ColorSchema.optional(),
    outlineWidth: z.number().min(0).optional().default(1),
    rotation: z.number().optional().describe("Rotation angle in radians"),
    stRotation: z.number().optional().describe("Texture coordinate rotation"),
    granularity: z.number().min(0).optional(),
  })
  .describe("Ellipse/circle graphics configuration");

/**
 * Box graphics configuration
 */
export const BoxGraphicsSchema = z
  .object({
    show: z.boolean().optional().default(true),
    dimensions: z
      .object({
        x: z.number().min(0),
        y: z.number().min(0),
        z: z.number().min(0),
      })
      .describe("Box dimensions in meters"),
    fill: z.boolean().optional().default(true),
    material: MaterialSchema.optional(),
    outline: z.boolean().optional().default(false),
    outlineColor: ColorSchema.optional(),
    outlineWidth: z.number().min(0).optional().default(1),
  })
  .describe("Box graphics configuration");

/**
 * Cylinder graphics configuration
 */
export const CylinderGraphicsSchema = z
  .object({
    show: z.boolean().optional().default(true),
    length: z.number().min(0).describe("Length of cylinder in meters"),
    topRadius: z.number().min(0).describe("Top radius in meters"),
    bottomRadius: z.number().min(0).describe("Bottom radius in meters"),
    fill: z.boolean().optional().default(true),
    material: MaterialSchema.optional(),
    outline: z.boolean().optional().default(false),
    outlineColor: ColorSchema.optional(),
    outlineWidth: z.number().min(0).optional().default(1),
    numberOfVerticalLines: z.number().min(0).optional().default(16),
    slices: z.number().min(3).optional().default(128),
  })
  .describe("Cylinder/cone graphics configuration");

/**
 * Ellipsoid graphics configuration
 */
export const EllipsoidGraphicsSchema = z
  .object({
    show: z.boolean().optional().default(true),
    radii: z
      .object({
        x: z.number().min(0),
        y: z.number().min(0),
        z: z.number().min(0),
      })
      .describe("Ellipsoid radii in meters"),
    fill: z.boolean().optional().default(true),
    material: MaterialSchema.optional(),
    outline: z.boolean().optional().default(false),
    outlineColor: ColorSchema.optional(),
    outlineWidth: z.number().min(0).optional().default(1),
    stackPartitions: z.number().min(1).optional().default(64),
    slicePartitions: z.number().min(0).optional().default(64),
  })
  .describe("Ellipsoid/sphere graphics configuration");

/**
 * Wall graphics configuration
 */
export const WallGraphicsSchema = z
  .object({
    show: z.boolean().optional().default(true),
    positions: z
      .array(PositionSchema)
      .describe("Array of positions defining wall path"),
    minimumHeights: z
      .array(z.number())
      .optional()
      .describe("Array of minimum heights"),
    maximumHeights: z
      .array(z.number())
      .optional()
      .describe("Array of maximum heights"),
    fill: z.boolean().optional().default(true),
    material: MaterialSchema.optional(),
    outline: z.boolean().optional().default(false),
    outlineColor: ColorSchema.optional(),
    outlineWidth: z.number().min(0).optional().default(1),
    granularity: z.number().min(0).optional(),
  })
  .describe("Wall graphics configuration");

/**
 * Corridor graphics configuration
 */
export const CorridorGraphicsSchema = z
  .object({
    show: z.boolean().optional().default(true),
    positions: z
      .array(PositionSchema)
      .describe("Array of positions defining corridor centerline"),
    width: z.number().min(0).describe("Corridor width in meters"),
    height: z.number().optional().describe("Height above ellipsoid in meters"),
    extrudedHeight: z
      .number()
      .optional()
      .describe("Height of extrusion in meters"),
    fill: z.boolean().optional().default(true),
    material: MaterialSchema.optional(),
    outline: z.boolean().optional().default(false),
    outlineColor: ColorSchema.optional(),
    outlineWidth: z.number().min(0).optional().default(1),
    cornerType: z
      .enum(["ROUNDED", "MITERED", "BEVELED"])
      .optional()
      .default("ROUNDED"),
    granularity: z.number().min(0).optional(),
  })
  .describe("Corridor graphics configuration");

// Type exports
export type PointGraphics = z.infer<typeof PointGraphicsSchema>;
export type BillboardGraphics = z.infer<typeof BillboardGraphicsSchema>;
export type LabelGraphics = z.infer<typeof LabelGraphicsSchema>;
export type ModelGraphics = z.infer<typeof ModelGraphicsSchema>;
export type PolygonGraphics = z.infer<typeof PolygonGraphicsSchema>;
export type PolylineGraphics = z.infer<typeof PolylineGraphicsSchema>;
export type RectangleGraphics = z.infer<typeof RectangleGraphicsSchema>;
export type EllipseGraphics = z.infer<typeof EllipseGraphicsSchema>;
export type BoxGraphics = z.infer<typeof BoxGraphicsSchema>;
export type CylinderGraphics = z.infer<typeof CylinderGraphicsSchema>;
export type EllipsoidGraphics = z.infer<typeof EllipsoidGraphicsSchema>;
export type WallGraphics = z.infer<typeof WallGraphicsSchema>;
export type CorridorGraphics = z.infer<typeof CorridorGraphicsSchema>;
