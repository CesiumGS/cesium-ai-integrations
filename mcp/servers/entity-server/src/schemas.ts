import { z } from "zod";

// Base schemas for entity properties
export const PositionSchema = z.object({
  longitude: z.number().describe("Longitude in degrees"),
  latitude: z.number().describe("Latitude in degrees"),
  height: z.number().optional().describe("Height above ellipsoid in meters"),
});

export const ColorSchema = z
  .object({
    red: z.number().min(0).max(1),
    green: z.number().min(0).max(1),
    blue: z.number().min(0).max(1),
    alpha: z.number().min(0).max(1).optional().default(1),
  })
  .describe("RGBA color values (0-1)");

// Animation and time-based schemas
export const JulianDateSchema = z
  .object({
    dayNumber: z.number().describe("Julian day number"),
    secondsOfDay: z.number().describe("Seconds into the day"),
  })
  .describe("Julian date for precise time representation");

export const TimeIntervalSchema = z
  .object({
    start: JulianDateSchema,
    stop: JulianDateSchema,
    isStartIncluded: z.boolean().optional().default(true),
    isStopIncluded: z.boolean().optional().default(true),
  })
  .describe("Time interval definition");

export const PositionSampleSchema = z
  .object({
    time: JulianDateSchema,
    position: PositionSchema,
  })
  .describe("Position sample at a specific time");

export const SampledPositionPropertySchema = z
  .object({
    type: z.literal("sampled"),
    samples: z.array(PositionSampleSchema),
    interpolationDegree: z.number().optional().default(1),
    interpolationAlgorithm: z
      .enum(["LINEAR", "LAGRANGE", "HERMITE"])
      .optional()
      .default("LINEAR"),
  })
  .describe("Time-sampled position property");

export const CallbackPropertySchema = z
  .object({
    type: z.literal("callback"),
    functionName: z.string().describe("Name of the callback function"),
    isConstant: z.boolean().optional().default(false),
  })
  .describe("Callback-based property");

export const VelocityOrientationPropertySchema = z
  .object({
    type: z.literal("velocityOrientation"),
    positionProperty: z.string().describe("Reference to position property"),
    ellipsoid: z.string().optional().describe("Reference ellipsoid"),
  })
  .describe("Velocity-based orientation property");

export const AnimatedPositionSchema = z
  .union([PositionSchema, SampledPositionPropertySchema])
  .describe("Position that can be static or animated");

export const ClockSchema = z
  .object({
    startTime: JulianDateSchema,
    stopTime: JulianDateSchema,
    currentTime: JulianDateSchema,
    clockRange: z
      .enum(["UNBOUNDED", "CLAMPED", "LOOP_STOP"])
      .describe("Clock behavior at boundaries"),
    clockStep: z
      .enum(["TICK_DEPENDENT", "SYSTEM_CLOCK_MULTIPLIER", "SYSTEM_CLOCK"])
      .optional()
      .default("SYSTEM_CLOCK_MULTIPLIER"),
    multiplier: z
      .number()
      .optional()
      .default(1)
      .describe("Time rate multiplier"),
    shouldAnimate: z.boolean().optional().default(true),
  })
  .describe("Clock configuration for animation timing");

export const ModelAnimationSchema = z
  .object({
    loop: z
      .enum(["NONE", "REPEAT", "MIRRORED_REPEAT"])
      .optional()
      .default("NONE"),
    reverse: z.boolean().optional().default(false),
    multiplier: z.number().optional().default(1),
    animationTime: z
      .object({
        type: z.literal("callback"),
        functionName: z.string(),
      })
      .optional()
      .describe("Custom animation time function"),
  })
  .describe("Model animation configuration");

export const MaterialSchema = z
  .union([
    z.object({
      type: z.literal("color"),
      color: ColorSchema,
    }),
    z.object({
      type: z.literal("image"),
      image: z.string().describe("URL to image file"),
    }),
    z.object({
      type: z.literal("checkerboard"),
      evenColor: ColorSchema,
      oddColor: ColorSchema,
      repeat: z.object({
        x: z.number(),
        y: z.number(),
      }),
    }),
    z.object({
      type: z.literal("stripe"),
      evenColor: ColorSchema,
      oddColor: ColorSchema,
      repeat: z.number(),
    }),
    z.object({
      type: z.literal("grid"),
      color: ColorSchema,
      cellAlpha: z.number().min(0).max(1),
      lineCount: z.object({
        x: z.number(),
        y: z.number(),
      }),
      lineThickness: z.object({
        x: z.number(),
        y: z.number(),
      }),
    }),
  ])
  .describe("Material definition for entity appearance");

export const PolylineMaterialSchema = z
  .union([
    z.object({
      type: z.literal("color"),
      color: ColorSchema,
    }),
    z.object({
      type: z.literal("outline"),
      color: ColorSchema,
      outlineWidth: z.number().min(0),
      outlineColor: ColorSchema,
    }),
    z.object({
      type: z.literal("glow"),
      color: ColorSchema,
      glowPower: z.number().min(0).max(1),
    }),
  ])
  .describe("Polyline-specific material definition");

// Entity-specific schemas
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
    // Animation-specific properties
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

// Entity creation schema
export const EntitySchema = z
  .object({
    id: z.string().optional().describe("Unique identifier for the entity"),
    name: z.string().optional().describe("Human-readable name"),
    description: z
      .string()
      .optional()
      .describe("HTML description shown in InfoBox"),
    position: z
      .union([PositionSchema, SampledPositionPropertySchema])
      .optional()
      .describe("Entity position (static or animated)"),
    orientation: z
      .union([
        z.object({
          heading: z.number().describe("Heading in radians"),
          pitch: z.number().describe("Pitch in radians"),
          roll: z.number().describe("Roll in radians"),
        }),
        VelocityOrientationPropertySchema,
      ])
      .optional()
      .describe("Entity orientation (static or velocity-based)"),

    // Animation properties
    availability: TimeIntervalSchema.optional().describe(
      "Time interval when entity is available",
    ),
    viewFrom: z
      .object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      })
      .optional()
      .describe("Viewing offset for camera tracking"),

    // Graphics objects
    point: PointGraphicsSchema.optional(),
    billboard: BillboardGraphicsSchema.optional(),
    label: LabelGraphicsSchema.optional(),
    model: ModelGraphicsSchema.optional(),
    polygon: PolygonGraphicsSchema.optional(),
    polyline: PolylineGraphicsSchema.optional(),
    rectangle: RectangleGraphicsSchema.optional(),
    ellipse: EllipseGraphicsSchema.optional(),
    box: BoxGraphicsSchema.optional(),
    cylinder: CylinderGraphicsSchema.optional(),
    ellipsoid: EllipsoidGraphicsSchema.optional(),
    wall: WallGraphicsSchema.optional(),
    corridor: CorridorGraphicsSchema.optional(),
  })
  .describe(
    "Complete entity definition with graphics objects and animation support",
  );

// Response schemas
export const EntityResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  entityId: z.string(),
  entityName: z.string().optional(),
  position: PositionSchema.optional(),
  stats: z.object({
    totalEntities: z.number(),
    responseTime: z.number(),
  }),
});

export const EntityListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  entities: z.array(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      type: z.string(),
      position: PositionSchema.optional(),
    }),
  ),
  stats: z.object({
    totalEntities: z.number(),
    responseTime: z.number(),
  }),
});

export const ClockResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  clockState: ClockSchema.optional(),
  stats: z.object({
    responseTime: z.number(),
  }),
});

export const AnimationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  entityId: z.string().optional(),
  propertyName: z.string().optional(),
  animationId: z.string().optional(),
  stats: z.object({
    responseTime: z.number(),
  }),
});

export const CameraResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  cameraState: z
    .object({
      position: PositionSchema.optional(),
      heading: z.number().optional(),
      pitch: z.number().optional(),
      roll: z.number().optional(),
      trackedEntityId: z.string().optional(),
    })
    .optional(),
  stats: z.object({
    responseTime: z.number(),
  }),
});
