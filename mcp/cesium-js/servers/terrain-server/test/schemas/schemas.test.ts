import { describe, it, expect } from "vitest";
import {
  TerrainSourceTypeSchema,
  TerrainSummarySchema,
  TerrainSetInputSchema,
  TerrainGetInputSchema,
  TerrainRemoveInputSchema,
} from "../../src/schemas/index";

describe("Terrain Schemas", () => {
  describe("TerrainSourceTypeSchema", () => {
    it("should accept valid source types", () => {
      const validTypes = ["ion", "url", "ellipsoid"];
      for (const type of validTypes) {
        expect(() => TerrainSourceTypeSchema.parse(type)).not.toThrow();
      }
    });

    it("should reject invalid source types", () => {
      expect(() => TerrainSourceTypeSchema.parse("invalid")).toThrow();
      expect(() => TerrainSourceTypeSchema.parse("arcgis")).toThrow();
    });
  });

  describe("TerrainSummarySchema", () => {
    it("should accept valid terrain summary", () => {
      const result = TerrainSummarySchema.parse({
        sourceType: "ion",
        name: "Cesium World Terrain",
        assetId: 1,
        hasVertexNormals: true,
        hasWaterMask: false,
        hasMetadata: true,
      });
      expect(result.sourceType).toBe("ion");
      expect(result.name).toBe("Cesium World Terrain");
      expect(result.assetId).toBe(1);
    });

    it("should accept minimal terrain summary", () => {
      const result = TerrainSummarySchema.parse({
        sourceType: "ellipsoid",
      });
      expect(result.sourceType).toBe("ellipsoid");
      expect(result.name).toBeUndefined();
    });
  });

  describe("TerrainSetInputSchema", () => {
    it("should accept ion terrain with assetId", () => {
      const result = TerrainSetInputSchema.parse({
        type: "ion",
        assetId: 1,
      });
      expect(result.type).toBe("ion");
      expect(result.assetId).toBe(1);
    });

    it("should accept url terrain with url", () => {
      const result = TerrainSetInputSchema.parse({
        type: "url",
        url: "https://example.com/terrain",
      });
      expect(result.type).toBe("url");
      expect(result.url).toBe("https://example.com/terrain");
    });

    it("should accept ellipsoid terrain with no extra params", () => {
      const result = TerrainSetInputSchema.parse({
        type: "ellipsoid",
      });
      expect(result.type).toBe("ellipsoid");
    });

    it("should accept full input with all options", () => {
      const result = TerrainSetInputSchema.parse({
        type: "ion",
        assetId: 1,
        name: "Cesium World Terrain",
        requestVertexNormals: true,
        requestWaterMask: true,
        requestMetadata: true,
      });
      expect(result.name).toBe("Cesium World Terrain");
      expect(result.requestVertexNormals).toBe(true);
      expect(result.requestWaterMask).toBe(true);
    });

    it("should reject invalid source type", () => {
      expect(() => TerrainSetInputSchema.parse({ type: "invalid" })).toThrow();
    });
  });

  describe("TerrainGetInputSchema", () => {
    it("should accept empty input", () => {
      const result = TerrainGetInputSchema.parse({});
      expect(result).toEqual({});
    });
  });

  describe("TerrainRemoveInputSchema", () => {
    it("should accept empty input", () => {
      const result = TerrainRemoveInputSchema.parse({});
      expect(result).toEqual({});
    });
  });
});
