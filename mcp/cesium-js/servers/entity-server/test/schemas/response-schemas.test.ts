import { describe, it, expect } from "vitest";
import {
  StatsSchema,
  EntityResponseSchema,
  EntitySummarySchema,
  EntityListResponseSchema,
  RemoveEntityResponseSchema,
} from "../../src/schemas/response-schemas";

const position = { longitude: -105, latitude: 40, height: 0 };

// ---------------------------------------------------------------------------
// StatsSchema
// ---------------------------------------------------------------------------
describe("StatsSchema", () => {
  it("should accept required responseTime", () => {
    expect(StatsSchema.safeParse({ responseTime: 42 }).success).toBe(true);
  });

  it("should accept with optional totalEntities", () => {
    expect(
      StatsSchema.safeParse({ responseTime: 10, totalEntities: 5 }).success,
    ).toBe(true);
  });

  it("should reject missing responseTime", () => {
    expect(StatsSchema.safeParse({}).success).toBe(false);
  });

  it("should reject non-numeric responseTime", () => {
    expect(StatsSchema.safeParse({ responseTime: "fast" }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// EntityResponseSchema
// ---------------------------------------------------------------------------
describe("EntityResponseSchema", () => {
  const stats = { responseTime: 10 };

  it("should accept minimal valid response", () => {
    expect(
      EntityResponseSchema.safeParse({ success: true, message: "OK", stats })
        .success,
    ).toBe(true);
  });

  it("should accept full response with optional fields", () => {
    expect(
      EntityResponseSchema.safeParse({
        success: true,
        message: "Entity added",
        entityId: "point_001",
        entityName: "My Point",
        position,
        stats: { responseTime: 15, totalEntities: 3 },
      }).success,
    ).toBe(true);
  });

  it("should accept success=false for error responses", () => {
    expect(
      EntityResponseSchema.safeParse({
        success: false,
        message: "Failed",
        stats,
      }).success,
    ).toBe(true);
  });

  it("should reject missing success", () => {
    expect(
      EntityResponseSchema.safeParse({ message: "OK", stats }).success,
    ).toBe(false);
  });

  it("should reject missing message", () => {
    expect(
      EntityResponseSchema.safeParse({ success: true, stats }).success,
    ).toBe(false);
  });

  it("should reject missing stats", () => {
    expect(
      EntityResponseSchema.safeParse({ success: true, message: "OK" }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// EntitySummarySchema
// ---------------------------------------------------------------------------
describe("EntitySummarySchema", () => {
  it("should accept minimal required fields", () => {
    expect(
      EntitySummarySchema.safeParse({ id: "e1", type: "point" }).success,
    ).toBe(true);
  });

  it("should accept with optional name and position", () => {
    expect(
      EntitySummarySchema.safeParse({
        id: "e1",
        name: "My Entity",
        type: "billboard",
        position,
      }).success,
    ).toBe(true);
  });

  it("should reject missing id", () => {
    expect(EntitySummarySchema.safeParse({ type: "point" }).success).toBe(
      false,
    );
  });

  it("should reject missing type", () => {
    expect(EntitySummarySchema.safeParse({ id: "e1" }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// EntityListResponseSchema
// ---------------------------------------------------------------------------
describe("EntityListResponseSchema", () => {
  const stats = { responseTime: 5 };
  const entities = [{ id: "e1", type: "point" }];

  it("should accept minimal list response", () => {
    expect(
      EntityListResponseSchema.safeParse({
        success: true,
        message: "Found 1 entity",
        entities,
        totalCount: 1,
        filteredCount: 1,
        stats,
      }).success,
    ).toBe(true);
  });

  it("should accept empty entity list", () => {
    expect(
      EntityListResponseSchema.safeParse({
        success: true,
        message: "Found 0 entities",
        entities: [],
        totalCount: 0,
        filteredCount: 0,
        stats,
      }).success,
    ).toBe(true);
  });

  it("should reject missing entities array", () => {
    expect(
      EntityListResponseSchema.safeParse({
        success: true,
        message: "OK",
        totalCount: 0,
        filteredCount: 0,
        stats,
      }).success,
    ).toBe(false);
  });

  it("should reject missing totalCount", () => {
    expect(
      EntityListResponseSchema.safeParse({
        success: true,
        message: "OK",
        entities: [],
        filteredCount: 0,
        stats,
      }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// RemoveEntityResponseSchema
// ---------------------------------------------------------------------------
describe("RemoveEntityResponseSchema", () => {
  const stats = { responseTime: 8 };

  it("should accept minimal remove response", () => {
    expect(
      RemoveEntityResponseSchema.safeParse({
        success: true,
        message: "Removed",
        stats,
      }).success,
    ).toBe(true);
  });

  it("should accept response with optional removed entity info", () => {
    expect(
      RemoveEntityResponseSchema.safeParse({
        success: true,
        message: "Removed",
        removedEntityId: "e1",
        removedEntityName: "My Entity",
        removedCount: 1,
        stats,
      }).success,
    ).toBe(true);
  });

  it("should reject missing success", () => {
    expect(
      RemoveEntityResponseSchema.safeParse({ message: "OK", stats }).success,
    ).toBe(false);
  });

  it("should reject missing stats", () => {
    expect(
      RemoveEntityResponseSchema.safeParse({
        success: true,
        message: "Removed",
      }).success,
    ).toBe(false);
  });
});
