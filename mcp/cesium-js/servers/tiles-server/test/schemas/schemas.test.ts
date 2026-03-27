import { describe, it, expect } from "vitest";
import {
  TilesetSourceTypeSchema,
  TilesetSummarySchema,
  TilesetAddInputSchema,
  TilesetRemoveInputSchema,
  TilesetListInputSchema,
} from "../../src/schemas/index";

describe("Tiles Schemas", () => {
  describe("TilesetSourceTypeSchema", () => {
    it("should accept valid source types", () => {
      for (const type of ["ion", "url"]) {
        expect(() => TilesetSourceTypeSchema.parse(type)).not.toThrow();
      }
    });

    it("should reject invalid source types", () => {
      expect(() => TilesetSourceTypeSchema.parse("wms")).toThrow();
      expect(() => TilesetSourceTypeSchema.parse("")).toThrow();
      expect(() => TilesetSourceTypeSchema.parse("imodel")).toThrow();
      expect(() => TilesetSourceTypeSchema.parse("reality")).toThrow();
    });
  });

  describe("TilesetSummarySchema", () => {
    it("should accept a minimal tileset summary", () => {
      const result = TilesetSummarySchema.parse({
        tilesetId: "ts-1",
        sourceType: "ion",
        show: true,
      });
      expect(result.tilesetId).toBe("ts-1");
      expect(result.show).toBe(true);
    });
  });

  describe("TilesetAddInputSchema", () => {
    it("should accept ion type with assetId", () => {
      const result = TilesetAddInputSchema.parse({
        type: "ion",
        assetId: 96188,
        name: "Cesium OSM Buildings",
      });
      expect(result.type).toBe("ion");
      expect(result.assetId).toBe(96188);
    });

    it("should accept url type with url", () => {
      const result = TilesetAddInputSchema.parse({
        type: "url",
        url: "https://example.com/tileset/tileset.json",
      });
      expect(result.url).toBe("https://example.com/tileset/tileset.json");
    });

    it("should accept optional show and name fields", () => {
      const result = TilesetAddInputSchema.parse({
        type: "ion",
        assetId: 1,
        show: false,
        name: "Hidden Tileset",
      });
      expect(result.show).toBe(false);
      expect(result.name).toBe("Hidden Tileset");
    });

    it("should allow all source-specific fields to be omitted (validation in handler)", () => {
      const result = TilesetAddInputSchema.parse({ type: "ion" });
      expect(result.assetId).toBeUndefined();
    });

    it("should reject missing type", () => {
      expect(() => TilesetAddInputSchema.parse({ assetId: 1 })).toThrow();
    });

    it("should reject invalid type", () => {
      expect(() =>
        TilesetAddInputSchema.parse({ type: "wms", assetId: 1 }),
      ).toThrow();
    });
  });

  describe("TilesetRemoveInputSchema", () => {
    it("should accept removal by tilesetId", () => {
      const result = TilesetRemoveInputSchema.parse({ tilesetId: "ts-1" });
      expect(result.tilesetId).toBe("ts-1");
    });

    it("should accept removal by name", () => {
      const result = TilesetRemoveInputSchema.parse({ name: "My Tileset" });
      expect(result.name).toBe("My Tileset");
    });

    it("should accept removeAll", () => {
      const result = TilesetRemoveInputSchema.parse({ removeAll: true });
      expect(result.removeAll).toBe(true);
    });

    it("should accept empty object (validation is in tool handler)", () => {
      const result = TilesetRemoveInputSchema.parse({});
      expect(result.tilesetId).toBeUndefined();
      expect(result.name).toBeUndefined();
      expect(result.removeAll).toBeUndefined();
    });
  });

  describe("TilesetListInputSchema", () => {
    it("should accept empty object", () => {
      const result = TilesetListInputSchema.parse({});
      expect(result.includeDetails).toBeUndefined();
    });

    it("should accept includeDetails", () => {
      const result = TilesetListInputSchema.parse({ includeDetails: true });
      expect(result.includeDetails).toBe(true);
    });
  });
});
