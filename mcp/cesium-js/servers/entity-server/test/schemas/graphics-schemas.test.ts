import { describe, it, expect } from "vitest";
import {
  PointGraphicsSchema,
  BillboardGraphicsSchema,
  LabelGraphicsSchema,
  ModelGraphicsSchema,
  PolygonGraphicsSchema,
  PolylineGraphicsSchema,
  EllipseGraphicsSchema,
  RectangleGraphicsSchema,
  BoxGraphicsSchema,
  CylinderGraphicsSchema,
  WallGraphicsSchema,
  CorridorGraphicsSchema,
} from "../../src/schemas/graphics-schemas";

const position = { longitude: 0, latitude: 0 };
const color = { red: 1, green: 0, blue: 0 };

// ---------------------------------------------------------------------------
// PointGraphicsSchema
// ---------------------------------------------------------------------------
describe("PointGraphicsSchema", () => {
  it("should accept empty object (all optional)", () => {
    expect(PointGraphicsSchema.safeParse({}).success).toBe(true);
  });

  it("should accept full point config", () => {
    expect(
      PointGraphicsSchema.safeParse({
        show: true,
        pixelSize: 10,
        color,
        outlineColor: { red: 0, green: 0, blue: 0 },
        outlineWidth: 2,
        heightReference: "CLAMP_TO_GROUND",
      }).success,
    ).toBe(true);
  });

  it("should default pixelSize to 5", () => {
    const result = PointGraphicsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pixelSize).toBe(5);
    }
  });

  it("should reject pixelSize below 1", () => {
    expect(PointGraphicsSchema.safeParse({ pixelSize: 0 }).success).toBe(false);
  });

  it("should reject invalid heightReference", () => {
    expect(
      PointGraphicsSchema.safeParse({ heightReference: "FLOAT" }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// BillboardGraphicsSchema
// ---------------------------------------------------------------------------
describe("BillboardGraphicsSchema", () => {
  it("should accept valid http image URL", () => {
    expect(
      BillboardGraphicsSchema.safeParse({
        image: "https://example.com/icon.png",
      }).success,
    ).toBe(true);
  });

  it("should accept data URI", () => {
    expect(
      BillboardGraphicsSchema.safeParse({
        image: "data:image/png;base64,abc123",
      }).success,
    ).toBe(true);
  });

  it("should accept full billboard config", () => {
    expect(
      BillboardGraphicsSchema.safeParse({
        show: true,
        image: "https://example.com/icon.png",
        width: 32,
        height: 32,
        scale: 1.5,
        color,
        horizontalOrigin: "CENTER",
        verticalOrigin: "BOTTOM",
        heightReference: "CLAMP_TO_GROUND",
      }).success,
    ).toBe(true);
  });

  it("should reject empty image URL", () => {
    expect(BillboardGraphicsSchema.safeParse({ image: "" }).success).toBe(
      false,
    );
  });

  it("should reject invalid URL format", () => {
    expect(
      BillboardGraphicsSchema.safeParse({ image: "not-a-valid-url" }).success,
    ).toBe(false);
  });

  it("should reject missing image", () => {
    expect(BillboardGraphicsSchema.safeParse({}).success).toBe(false);
  });

  it("should reject invalid horizontalOrigin", () => {
    expect(
      BillboardGraphicsSchema.safeParse({
        image: "https://example.com/icon.png",
        horizontalOrigin: "INVALID",
      }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// LabelGraphicsSchema
// ---------------------------------------------------------------------------
describe("LabelGraphicsSchema", () => {
  it("should accept minimal label with text", () => {
    expect(LabelGraphicsSchema.safeParse({ text: "Hello World" }).success).toBe(
      true,
    );
  });

  it("should accept full label config", () => {
    expect(
      LabelGraphicsSchema.safeParse({
        show: true,
        text: "Label Text",
        font: "16pt sans-serif",
        style: "FILL_AND_OUTLINE",
        fillColor: color,
        outlineColor: { red: 0, green: 0, blue: 0 },
        outlineWidth: 2,
        scale: 1.5,
        horizontalOrigin: "LEFT",
        verticalOrigin: "TOP",
        heightReference: "NONE",
      }).success,
    ).toBe(true);
  });

  it("should default style to FILL", () => {
    const result = LabelGraphicsSchema.safeParse({ text: "Test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.style).toBe("FILL");
    }
  });

  it("should reject missing text", () => {
    expect(LabelGraphicsSchema.safeParse({}).success).toBe(false);
  });

  it("should reject invalid style", () => {
    expect(
      LabelGraphicsSchema.safeParse({ text: "Test", style: "INVALID" }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ModelGraphicsSchema
// ---------------------------------------------------------------------------
describe("ModelGraphicsSchema", () => {
  it("should accept valid GLTF URL", () => {
    expect(
      ModelGraphicsSchema.safeParse({ uri: "https://example.com/model.glb" })
        .success,
    ).toBe(true);
  });

  it("should accept GLTF path", () => {
    expect(
      ModelGraphicsSchema.safeParse({ uri: "./models/cesium_man.glb" }).success,
    ).toBe(true);
  });

  it("should accept full model config", () => {
    expect(
      ModelGraphicsSchema.safeParse({
        show: true,
        uri: "https://example.com/model.gltf",
        scale: 2.0,
        minimumPixelSize: 64,
        runAnimations: true,
        colorBlendMode: "HIGHLIGHT",
        colorBlendAmount: 0.5,
        heightReference: "CLAMP_TO_GROUND",
      }).success,
    ).toBe(true);
  });

  it("should reject URI without .glb/.gltf extension", () => {
    expect(
      ModelGraphicsSchema.safeParse({ uri: "https://example.com/model.obj" })
        .success,
    ).toBe(false);
  });

  it("should reject empty URI", () => {
    expect(ModelGraphicsSchema.safeParse({ uri: "" }).success).toBe(false);
  });

  it("should reject negative scale", () => {
    expect(
      ModelGraphicsSchema.safeParse({
        uri: "https://example.com/model.glb",
        scale: -1,
      }).success,
    ).toBe(false);
  });

  it("should reject invalid colorBlendMode", () => {
    expect(
      ModelGraphicsSchema.safeParse({
        uri: "https://example.com/model.glb",
        colorBlendMode: "INVALID",
      }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PolygonGraphicsSchema
// ---------------------------------------------------------------------------
describe("PolygonGraphicsSchema", () => {
  const hierarchy = [
    position,
    { longitude: 10, latitude: 0 },
    { longitude: 10, latitude: 10 },
  ];

  it("should accept minimal polygon with hierarchy", () => {
    expect(PolygonGraphicsSchema.safeParse({ hierarchy }).success).toBe(true);
  });

  it("should accept full polygon config", () => {
    expect(
      PolygonGraphicsSchema.safeParse({
        hierarchy,
        height: 0,
        extrudedHeight: 100,
        fill: true,
        material: { type: "color", color },
        outline: true,
        outlineColor: { red: 0, green: 0, blue: 0 },
        outlineWidth: 1,
        perPositionHeight: false,
      }).success,
    ).toBe(true);
  });

  it("should reject missing hierarchy", () => {
    expect(PolygonGraphicsSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PolylineGraphicsSchema
// ---------------------------------------------------------------------------
describe("PolylineGraphicsSchema", () => {
  const positions = [position, { longitude: 10, latitude: 10 }];

  it("should accept minimal polyline with positions", () => {
    expect(PolylineGraphicsSchema.safeParse({ positions }).success).toBe(true);
  });

  it("should accept full polyline config", () => {
    expect(
      PolylineGraphicsSchema.safeParse({
        positions,
        width: 3,
        material: { type: "color", color },
        clampToGround: true,
        arcType: "GEODESIC",
      }).success,
    ).toBe(true);
  });

  it("should default arcType to GEODESIC", () => {
    const result = PolylineGraphicsSchema.safeParse({ positions });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.arcType).toBe("GEODESIC");
    }
  });

  it("should reject width below 1", () => {
    expect(
      PolylineGraphicsSchema.safeParse({ positions, width: 0 }).success,
    ).toBe(false);
  });

  it("should reject invalid arcType", () => {
    expect(
      PolylineGraphicsSchema.safeParse({ positions, arcType: "CURVED" })
        .success,
    ).toBe(false);
  });

  it("should reject missing positions", () => {
    expect(PolylineGraphicsSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// EllipseGraphicsSchema
// ---------------------------------------------------------------------------
describe("EllipseGraphicsSchema", () => {
  it("should accept minimal ellipse with axes", () => {
    expect(
      EllipseGraphicsSchema.safeParse({
        semiMajorAxis: 1000,
        semiMinorAxis: 500,
      }).success,
    ).toBe(true);
  });

  it("should reject negative semiMajorAxis", () => {
    expect(
      EllipseGraphicsSchema.safeParse({
        semiMajorAxis: -100,
        semiMinorAxis: 500,
      }).success,
    ).toBe(false);
  });

  it("should reject missing semiMajorAxis", () => {
    expect(
      EllipseGraphicsSchema.safeParse({ semiMinorAxis: 500 }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// RectangleGraphicsSchema
// ---------------------------------------------------------------------------
describe("RectangleGraphicsSchema", () => {
  const coordinates = { west: -100, south: 30, east: -90, north: 40 };

  it("should accept valid rectangle", () => {
    expect(RectangleGraphicsSchema.safeParse({ coordinates }).success).toBe(
      true,
    );
  });

  it("should accept full rectangle config", () => {
    expect(
      RectangleGraphicsSchema.safeParse({
        coordinates,
        height: 0,
        extrudedHeight: 1000,
        fill: true,
        outline: true,
      }).success,
    ).toBe(true);
  });

  it("should reject missing coordinates", () => {
    expect(RectangleGraphicsSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// BoxGraphicsSchema
// ---------------------------------------------------------------------------
describe("BoxGraphicsSchema", () => {
  it("should accept valid box with dimensions", () => {
    expect(
      BoxGraphicsSchema.safeParse({ dimensions: { x: 100, y: 100, z: 50 } })
        .success,
    ).toBe(true);
  });

  it("should reject negative dimension", () => {
    expect(
      BoxGraphicsSchema.safeParse({ dimensions: { x: -1, y: 100, z: 50 } })
        .success,
    ).toBe(false);
  });

  it("should reject missing dimensions", () => {
    expect(BoxGraphicsSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CylinderGraphicsSchema
// ---------------------------------------------------------------------------
describe("CylinderGraphicsSchema", () => {
  it("should accept valid cylinder", () => {
    expect(
      CylinderGraphicsSchema.safeParse({
        length: 100,
        topRadius: 50,
        bottomRadius: 50,
      }).success,
    ).toBe(true);
  });

  it("should accept cone (topRadius=0)", () => {
    expect(
      CylinderGraphicsSchema.safeParse({
        length: 100,
        topRadius: 0,
        bottomRadius: 50,
      }).success,
    ).toBe(true);
  });

  it("should reject negative length", () => {
    expect(
      CylinderGraphicsSchema.safeParse({
        length: -1,
        topRadius: 50,
        bottomRadius: 50,
      }).success,
    ).toBe(false);
  });

  it("should reject slices below 3", () => {
    expect(
      CylinderGraphicsSchema.safeParse({
        length: 100,
        topRadius: 50,
        bottomRadius: 50,
        slices: 2,
      }).success,
    ).toBe(false);
  });

  it("should reject missing required fields", () => {
    expect(CylinderGraphicsSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// WallGraphicsSchema
// ---------------------------------------------------------------------------
describe("WallGraphicsSchema", () => {
  const positions = [position, { longitude: 10, latitude: 0 }];

  it("should accept minimal wall with positions", () => {
    expect(WallGraphicsSchema.safeParse({ positions }).success).toBe(true);
  });

  it("should accept wall with optional heights", () => {
    expect(
      WallGraphicsSchema.safeParse({
        positions,
        minimumHeights: [0, 0],
        maximumHeights: [100, 100],
      }).success,
    ).toBe(true);
  });

  it("should reject missing positions", () => {
    expect(WallGraphicsSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CorridorGraphicsSchema
// ---------------------------------------------------------------------------
describe("CorridorGraphicsSchema", () => {
  const positions = [position, { longitude: 10, latitude: 0 }];

  it("should accept minimal corridor", () => {
    expect(
      CorridorGraphicsSchema.safeParse({ positions, width: 100 }).success,
    ).toBe(true);
  });

  it("should default cornerType to ROUNDED", () => {
    const result = CorridorGraphicsSchema.safeParse({ positions, width: 100 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cornerType).toBe("ROUNDED");
    }
  });

  it("should accept all cornerType values", () => {
    for (const cornerType of ["ROUNDED", "MITERED", "BEVELED"] as const) {
      expect(
        CorridorGraphicsSchema.safeParse({ positions, width: 100, cornerType })
          .success,
      ).toBe(true);
    }
  });

  it("should reject negative width", () => {
    expect(
      CorridorGraphicsSchema.safeParse({ positions, width: -1 }).success,
    ).toBe(false);
  });

  it("should reject invalid cornerType", () => {
    expect(
      CorridorGraphicsSchema.safeParse({
        positions,
        width: 100,
        cornerType: "SHARP",
      }).success,
    ).toBe(false);
  });

  it("should reject missing positions", () => {
    expect(CorridorGraphicsSchema.safeParse({ width: 100 }).success).toBe(
      false,
    );
  });
});
