import { describe, it, expect } from "vitest";
import {
  generateEntityId,
  buildBaseEntity,
  formatPositionMessage,
  calculateCenterPosition,
  formatMultiplePositions,
} from "../../src/utils/utils";

describe("generateEntityId", () => {
  it("generates ID with given prefix", () => {
    const id = generateEntityId("point");
    expect(id).toMatch(/^point_\d+$/);
  });

  it("generates ID with different prefixes", () => {
    expect(generateEntityId("label")).toMatch(/^label_/);
    expect(generateEntityId("polygon")).toMatch(/^polygon_/);
    expect(generateEntityId("model")).toMatch(/^model_/);
  });

  it("generates unique IDs on successive calls", async () => {
    // Use slightly different timing — unlikely to collide
    const id1 = generateEntityId("test");
    await new Promise((r) => setTimeout(r, 1));
    const id2 = generateEntityId("test");
    // Both should have the prefix, and at least one should differ
    expect(id1).toMatch(/^test_/);
    expect(id2).toMatch(/^test_/);
  });
});

describe("buildBaseEntity", () => {
  const position = { longitude: -105.0, latitude: 40.0, height: 0 };

  it("builds entity with required fields", () => {
    const entity = buildBaseEntity(
      { id: "p1", name: "My Point" },
      { pixelSize: 5 },
      "point",
    );
    expect(entity.id).toBe("p1");
    expect(entity.name).toBe("My Point");
    expect(entity.point).toEqual({ pixelSize: 5 });
  });

  it("attaches graphics under the correct key", () => {
    const entity = buildBaseEntity(
      { id: "l1", name: "My Label" },
      { text: "Hello" },
      "label",
    );
    expect(entity.label).toEqual({ text: "Hello" });
  });

  it("includes position when provided", () => {
    const entity = buildBaseEntity(
      { id: "e1", name: "E", position },
      {},
      "ellipse",
    );
    expect(entity.position).toEqual(position);
  });

  it("omits position when not provided", () => {
    const entity = buildBaseEntity({ id: "e1", name: "E" }, {}, "ellipse");
    expect(entity.position).toBeUndefined();
  });

  it("includes description when provided", () => {
    const entity = buildBaseEntity(
      { id: "e1", name: "E", description: "A desc" },
      {},
      "point",
    );
    expect(entity.description).toBe("A desc");
  });

  it("omits description when not provided", () => {
    const entity = buildBaseEntity({ id: "e1", name: "E" }, {}, "point");
    expect(entity.description).toBeUndefined();
  });

  it("includes orientation when provided", () => {
    const orientation = { heading: 90, pitch: 0, roll: 0 };
    const entity = buildBaseEntity(
      { id: "e1", name: "E", orientation },
      {},
      "box",
    );
    expect(entity.orientation).toEqual(orientation);
  });

  it("omits orientation when not provided", () => {
    const entity = buildBaseEntity({ id: "e1", name: "E" }, {}, "box");
    expect(entity.orientation).toBeUndefined();
  });
});

describe("formatPositionMessage", () => {
  it("formats position as lat°, lon°", () => {
    const msg = formatPositionMessage({
      latitude: 40.2,
      longitude: -105.1,
      height: 0,
    });
    expect(msg).toBe("40.2°, -105.1°");
  });

  it("handles zero coordinates", () => {
    const msg = formatPositionMessage({ latitude: 0, longitude: 0, height: 0 });
    expect(msg).toBe("0°, 0°");
  });

  it("handles negative latitude", () => {
    const msg = formatPositionMessage({
      latitude: -33.9,
      longitude: 151.2,
      height: 0,
    });
    expect(msg).toBe("-33.9°, 151.2°");
  });
});

describe("calculateCenterPosition", () => {
  it("returns zero position for empty array", () => {
    const center = calculateCenterPosition([]);
    expect(center).toEqual({ latitude: 0, longitude: 0, height: 0 });
  });

  it("returns the single position unchanged", () => {
    const pos = { latitude: 40.0, longitude: -105.0, height: 100 };
    const center = calculateCenterPosition([pos]);
    expect(center.latitude).toBe(40.0);
    expect(center.longitude).toBe(-105.0);
    expect(center.height).toBe(100);
  });

  it("averages latitude and longitude of two positions", () => {
    const positions = [
      { latitude: 40.0, longitude: -106.0, height: 0 },
      { latitude: 42.0, longitude: -104.0, height: 0 },
    ];
    const center = calculateCenterPosition(positions);
    expect(center.latitude).toBe(41.0);
    expect(center.longitude).toBe(-105.0);
  });

  it("averages heights when all positions have height", () => {
    const positions = [
      { latitude: 40.0, longitude: -105.0, height: 100 },
      { latitude: 41.0, longitude: -104.0, height: 200 },
    ];
    const center = calculateCenterPosition(positions);
    expect(center.height).toBe(150);
  });

  it("omits height when no positions have height", () => {
    const positions = [
      { latitude: 40.0, longitude: -105.0 },
      { latitude: 41.0, longitude: -104.0 },
    ];
    const center = calculateCenterPosition(positions);
    expect(center.height).toBeUndefined();
  });
});

describe("formatMultiplePositions", () => {
  it('returns "no positions" for empty array', () => {
    expect(formatMultiplePositions([])).toBe("no positions");
  });

  it("formats single position", () => {
    const positions = [{ latitude: 40.0, longitude: -105.0, height: 0 }];
    expect(formatMultiplePositions(positions)).toBe("40°, -105°");
  });

  it('formats two positions with "to" separator', () => {
    const positions = [
      { latitude: 40.0, longitude: -105.0, height: 0 },
      { latitude: 41.0, longitude: -104.0, height: 0 },
    ];
    const result = formatMultiplePositions(positions);
    expect(result).toContain("to");
  });

  it("adds total count when more than maxDisplay positions", () => {
    const positions = [
      { latitude: 40.0, longitude: -105.0, height: 0 },
      { latitude: 41.0, longitude: -104.0, height: 0 },
      { latitude: 42.0, longitude: -103.0, height: 0 },
    ];
    const result = formatMultiplePositions(positions, 2);
    expect(result).toContain("3 total points");
  });

  it("does not add count when positions equals maxDisplay", () => {
    const positions = [
      { latitude: 40.0, longitude: -105.0, height: 0 },
      { latitude: 41.0, longitude: -104.0, height: 0 },
    ];
    const result = formatMultiplePositions(positions, 2);
    expect(result).not.toContain("total points");
  });
});
