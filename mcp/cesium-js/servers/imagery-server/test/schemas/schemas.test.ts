import { describe, it, expect } from "vitest";
import {
  ImageryAddInputSchema,
  ImageryRemoveInputSchema,
  ImageryListInputSchema,
  ImageryProviderTypeSchema,
  ImageryRectangleSchema,
} from "../../src/schemas/index";

describe("Imagery Schemas", () => {
  describe("ImageryProviderTypeSchema", () => {
    it("should accept valid provider types", () => {
      const validTypes = [
        "UrlTemplateImageryProvider",
        "WebMapServiceImageryProvider",
        "WebMapTileServiceImageryProvider",
        "ArcGisMapServerImageryProvider",
        "BingMapsImageryProvider",
        "TileMapServiceImageryProvider",
        "OpenStreetMapImageryProvider",
        "IonImageryProvider",
        "SingleTileImageryProvider",
        "GoogleEarthEnterpriseImageryProvider",
      ];

      for (const type of validTypes) {
        expect(() => ImageryProviderTypeSchema.parse(type)).not.toThrow();
      }
    });

    it("should reject invalid provider types", () => {
      expect(() =>
        ImageryProviderTypeSchema.parse("InvalidProvider"),
      ).toThrow();
    });
  });

  describe("ImageryRectangleSchema", () => {
    it("should accept valid rectangle", () => {
      const result = ImageryRectangleSchema.parse({
        west: -180,
        south: -90,
        east: 180,
        north: 90,
      });
      expect(result.west).toBe(-180);
      expect(result.north).toBe(90);
    });

    it("should reject out-of-range longitude", () => {
      expect(() =>
        ImageryRectangleSchema.parse({
          west: -181,
          south: 0,
          east: 0,
          north: 0,
        }),
      ).toThrow();
    });

    it("should reject out-of-range latitude", () => {
      expect(() =>
        ImageryRectangleSchema.parse({
          west: 0,
          south: -91,
          east: 0,
          north: 0,
        }),
      ).toThrow();
    });
  });

  describe("ImageryAddInputSchema", () => {
    it("should accept minimal valid input", () => {
      const input = {
        type: "UrlTemplateImageryProvider",
        url: "https://example.com/tiles/{z}/{x}/{y}.png",
      };
      const result = ImageryAddInputSchema.parse(input);
      expect(result.type).toBe("UrlTemplateImageryProvider");
      expect(result.url).toBe("https://example.com/tiles/{z}/{x}/{y}.png");
    });

    it("should accept full WMS input", () => {
      const input = {
        type: "WebMapServiceImageryProvider",
        url: "https://example.com/wms",
        name: "WMS Layer",
        layers: "terrain",
        style: "default",
        format: "image/png",
        alpha: 0.8,
        show: true,
        minimumLevel: 0,
        maximumLevel: 18,
        rectangle: { west: -10, south: 40, east: 10, north: 55 },
      };
      const result = ImageryAddInputSchema.parse(input);
      expect(result.layers).toBe("terrain");
      expect(result.alpha).toBe(0.8);
    });

    it("should accept WMTS input with tileMatrixSetID", () => {
      const input = {
        type: "WebMapTileServiceImageryProvider",
        url: "https://example.com/wmts",
        tileMatrixSetID: "GoogleMapsCompatible",
      };
      const result = ImageryAddInputSchema.parse(input);
      expect(result.tileMatrixSetID).toBe("GoogleMapsCompatible");
    });

    it("should reject alpha out of range", () => {
      expect(() =>
        ImageryAddInputSchema.parse({
          type: "UrlTemplateImageryProvider",
          url: "https://example.com",
          alpha: 1.5,
        }),
      ).toThrow();
    });

    it("should reject negative alpha", () => {
      expect(() =>
        ImageryAddInputSchema.parse({
          type: "UrlTemplateImageryProvider",
          url: "https://example.com",
          alpha: -0.1,
        }),
      ).toThrow();
    });

    it("should reject maximumLevel out of range", () => {
      expect(() =>
        ImageryAddInputSchema.parse({
          type: "UrlTemplateImageryProvider",
          url: "https://example.com",
          maximumLevel: 31,
        }),
      ).toThrow();
    });

    it("should accept missing url (optional for IonImageryProvider)", () => {
      const result = ImageryAddInputSchema.parse({
        type: "UrlTemplateImageryProvider",
      });
      expect(result.url).toBeUndefined();
    });

    it("should reject missing type", () => {
      expect(() =>
        ImageryAddInputSchema.parse({
          url: "https://example.com",
        }),
      ).toThrow();
    });
  });

  describe("ImageryRemoveInputSchema", () => {
    it("should accept removal by index", () => {
      const result = ImageryRemoveInputSchema.parse({ index: 1 });
      expect(result.index).toBe(1);
    });

    it("should accept removal by name", () => {
      const result = ImageryRemoveInputSchema.parse({ name: "Satellite" });
      expect(result.name).toBe("Satellite");
    });

    it("should accept removeAll", () => {
      const result = ImageryRemoveInputSchema.parse({ removeAll: true });
      expect(result.removeAll).toBe(true);
    });

    it("should accept empty object (validation is in tool handler)", () => {
      const result = ImageryRemoveInputSchema.parse({});
      expect(result.index).toBeUndefined();
      expect(result.name).toBeUndefined();
    });

    it("should reject negative index", () => {
      expect(() => ImageryRemoveInputSchema.parse({ index: -1 })).toThrow();
    });
  });

  describe("ImageryListInputSchema", () => {
    it("should accept empty object", () => {
      const result = ImageryListInputSchema.parse({});
      expect(result.includeDetails).toBeUndefined();
    });

    it("should accept includeDetails", () => {
      const result = ImageryListInputSchema.parse({ includeDetails: true });
      expect(result.includeDetails).toBe(true);
    });
  });
});
