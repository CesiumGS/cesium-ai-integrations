import { describe, it, expect } from "vitest";
import {
  AddPointEntityInputSchema,
  AddBillboardEntityInputSchema,
  AddLabelEntityInputSchema,
  AddModelEntityInputSchema,
  AddPolygonEntityInputSchema,
  AddPolylineEntityInputSchema,
  AddEllipseEntityInputSchema,
  AddRectangleEntityInputSchema,
  AddBoxEntityInputSchema,
  AddCylinderEntityInputSchema,
  AddWallEntityInputSchema,
  AddCorridorEntityInputSchema,
  ListEntitiesInputSchema,
  RemoveEntityInputSchema,
} from "../../src/schemas/tool-schemas";

const position = { longitude: -105, latitude: 40, height: 0 };
const color = { red: 1, green: 0, blue: 0 };

// ---------------------------------------------------------------------------
// AddPointEntityInputSchema
// ---------------------------------------------------------------------------
describe("AddPointEntityInputSchema", () => {
  it("should accept minimal input with position only", () => {
    expect(AddPointEntityInputSchema.safeParse({ position }).success).toBe(
      true,
    );
  });

  it("should accept full input with point config and metadata", () => {
    expect(
      AddPointEntityInputSchema.safeParse({
        position,
        point: { pixelSize: 10, color, show: true },
        name: "My Point",
        description: "<p>Description</p>",
        id: "point-001",
      }).success,
    ).toBe(true);
  });

  it("should reject missing position", () => {
    expect(AddPointEntityInputSchema.safeParse({}).success).toBe(false);
  });

  it("should reject invalid longitude", () => {
    expect(
      AddPointEntityInputSchema.safeParse({
        position: { longitude: 200, latitude: 0 },
      }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AddBillboardEntityInputSchema
// ---------------------------------------------------------------------------
describe("AddBillboardEntityInputSchema", () => {
  const billboard = { image: "https://example.com/icon.png" };

  it("should accept position and billboard", () => {
    expect(
      AddBillboardEntityInputSchema.safeParse({ position, billboard }).success,
    ).toBe(true);
  });

  it("should reject missing billboard", () => {
    expect(AddBillboardEntityInputSchema.safeParse({ position }).success).toBe(
      false,
    );
  });

  it("should reject invalid billboard image", () => {
    expect(
      AddBillboardEntityInputSchema.safeParse({
        position,
        billboard: { image: "" },
      }).success,
    ).toBe(false);
  });

  it("should reject missing position", () => {
    expect(AddBillboardEntityInputSchema.safeParse({ billboard }).success).toBe(
      false,
    );
  });
});

// ---------------------------------------------------------------------------
// AddLabelEntityInputSchema
// ---------------------------------------------------------------------------
describe("AddLabelEntityInputSchema", () => {
  const label = { text: "Hello World" };

  it("should accept position and label", () => {
    expect(
      AddLabelEntityInputSchema.safeParse({ position, label }).success,
    ).toBe(true);
  });

  it("should reject missing label", () => {
    expect(AddLabelEntityInputSchema.safeParse({ position }).success).toBe(
      false,
    );
  });

  it("should reject missing position", () => {
    expect(AddLabelEntityInputSchema.safeParse({ label }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AddModelEntityInputSchema
// ---------------------------------------------------------------------------
describe("AddModelEntityInputSchema", () => {
  const model = { uri: "https://example.com/model.glb" };

  it("should accept position and model", () => {
    expect(
      AddModelEntityInputSchema.safeParse({ position, model }).success,
    ).toBe(true);
  });

  it("should accept with orientation", () => {
    expect(
      AddModelEntityInputSchema.safeParse({
        position,
        model,
        orientation: { heading: 0, pitch: 0, roll: 0 },
      }).success,
    ).toBe(true);
  });

  it("should reject missing model", () => {
    expect(AddModelEntityInputSchema.safeParse({ position }).success).toBe(
      false,
    );
  });

  it("should reject model with invalid URI", () => {
    expect(
      AddModelEntityInputSchema.safeParse({
        position,
        model: { uri: "model.obj" },
      }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AddPolygonEntityInputSchema
// ---------------------------------------------------------------------------
describe("AddPolygonEntityInputSchema", () => {
  const hierarchy = [
    position,
    { longitude: -100, latitude: 40 },
    { longitude: -100, latitude: 35 },
  ];

  it("should accept polygon with hierarchy", () => {
    expect(
      AddPolygonEntityInputSchema.safeParse({ polygon: { hierarchy } }).success,
    ).toBe(true);
  });

  it("should reject missing polygon", () => {
    expect(AddPolygonEntityInputSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AddPolylineEntityInputSchema
// ---------------------------------------------------------------------------
describe("AddPolylineEntityInputSchema", () => {
  const positions = [position, { longitude: -100, latitude: 40 }];

  it("should accept polyline with positions", () => {
    expect(
      AddPolylineEntityInputSchema.safeParse({ polyline: { positions } })
        .success,
    ).toBe(true);
  });

  it("should reject missing polyline", () => {
    expect(AddPolylineEntityInputSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AddEllipseEntityInputSchema
// ---------------------------------------------------------------------------
describe("AddEllipseEntityInputSchema", () => {
  it("should accept position and ellipse", () => {
    expect(
      AddEllipseEntityInputSchema.safeParse({
        position,
        ellipse: { semiMajorAxis: 1000, semiMinorAxis: 500 },
      }).success,
    ).toBe(true);
  });

  it("should reject missing position", () => {
    expect(
      AddEllipseEntityInputSchema.safeParse({
        ellipse: { semiMajorAxis: 1000, semiMinorAxis: 500 },
      }).success,
    ).toBe(false);
  });

  it("should reject missing ellipse", () => {
    expect(AddEllipseEntityInputSchema.safeParse({ position }).success).toBe(
      false,
    );
  });
});

// ---------------------------------------------------------------------------
// AddRectangleEntityInputSchema
// ---------------------------------------------------------------------------
describe("AddRectangleEntityInputSchema", () => {
  it("should accept valid rectangle", () => {
    expect(
      AddRectangleEntityInputSchema.safeParse({
        rectangle: {
          coordinates: { west: -100, south: 30, east: -90, north: 40 },
        },
      }).success,
    ).toBe(true);
  });

  it("should reject missing rectangle", () => {
    expect(AddRectangleEntityInputSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AddBoxEntityInputSchema
// ---------------------------------------------------------------------------
describe("AddBoxEntityInputSchema", () => {
  it("should accept position and box", () => {
    expect(
      AddBoxEntityInputSchema.safeParse({
        position,
        box: { dimensions: { x: 100, y: 100, z: 50 } },
      }).success,
    ).toBe(true);
  });

  it("should accept box with orientation", () => {
    expect(
      AddBoxEntityInputSchema.safeParse({
        position,
        box: { dimensions: { x: 100, y: 100, z: 50 } },
        orientation: { heading: 0, pitch: 0, roll: 0 },
      }).success,
    ).toBe(true);
  });

  it("should reject missing position", () => {
    expect(
      AddBoxEntityInputSchema.safeParse({
        box: { dimensions: { x: 100, y: 100, z: 50 } },
      }).success,
    ).toBe(false);
  });

  it("should reject missing box", () => {
    expect(AddBoxEntityInputSchema.safeParse({ position }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AddCylinderEntityInputSchema
// ---------------------------------------------------------------------------
describe("AddCylinderEntityInputSchema", () => {
  it("should accept position and cylinder", () => {
    expect(
      AddCylinderEntityInputSchema.safeParse({
        position,
        cylinder: { length: 100, topRadius: 50, bottomRadius: 50 },
      }).success,
    ).toBe(true);
  });

  it("should reject missing required cylinder fields", () => {
    expect(
      AddCylinderEntityInputSchema.safeParse({ position, cylinder: {} })
        .success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AddWallEntityInputSchema
// ---------------------------------------------------------------------------
describe("AddWallEntityInputSchema", () => {
  const positions = [position, { longitude: -100, latitude: 40 }];

  it("should accept wall with positions", () => {
    expect(
      AddWallEntityInputSchema.safeParse({ wall: { positions } }).success,
    ).toBe(true);
  });

  it("should reject missing wall", () => {
    expect(AddWallEntityInputSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AddCorridorEntityInputSchema
// ---------------------------------------------------------------------------
describe("AddCorridorEntityInputSchema", () => {
  const positions = [position, { longitude: -100, latitude: 40 }];

  it("should accept corridor with positions and width", () => {
    expect(
      AddCorridorEntityInputSchema.safeParse({
        corridor: { positions, width: 500 },
      }).success,
    ).toBe(true);
  });

  it("should reject missing corridor", () => {
    expect(AddCorridorEntityInputSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ListEntitiesInputSchema
// ---------------------------------------------------------------------------
describe("ListEntitiesInputSchema", () => {
  it("should accept empty object (all optional)", () => {
    expect(ListEntitiesInputSchema.safeParse({}).success).toBe(true);
  });

  it("should accept with includeDetails", () => {
    expect(
      ListEntitiesInputSchema.safeParse({ includeDetails: true }).success,
    ).toBe(true);
  });

  it("should accept all valid filterByType values", () => {
    for (const type of [
      "point",
      "label",
      "polygon",
      "polyline",
      "model",
      "billboard",
      "ellipse",
      "rectangle",
      "wall",
      "cylinder",
      "box",
      "corridor",
    ] as const) {
      expect(
        ListEntitiesInputSchema.safeParse({ filterByType: type }).success,
      ).toBe(true);
    }
  });

  it("should reject invalid filterByType", () => {
    expect(
      ListEntitiesInputSchema.safeParse({ filterByType: "sphere" }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// RemoveEntityInputSchema
// ---------------------------------------------------------------------------
describe("RemoveEntityInputSchema", () => {
  it("should accept entityId", () => {
    expect(
      RemoveEntityInputSchema.safeParse({ entityId: "entity-001" }).success,
    ).toBe(true);
  });

  it("should accept namePattern", () => {
    expect(
      RemoveEntityInputSchema.safeParse({ namePattern: "Point.*" }).success,
    ).toBe(true);
  });

  it("should accept empty object (both fields optional)", () => {
    expect(RemoveEntityInputSchema.safeParse({}).success).toBe(true);
  });

  it("should accept removeAll flag", () => {
    expect(
      RemoveEntityInputSchema.safeParse({
        namePattern: "Point.*",
        removeAll: true,
      }).success,
    ).toBe(true);
  });

  it("should default confirmRemoval to true", () => {
    const result = RemoveEntityInputSchema.safeParse({
      entityId: "entity-001",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.confirmRemoval).toBe(true);
    }
  });
});
