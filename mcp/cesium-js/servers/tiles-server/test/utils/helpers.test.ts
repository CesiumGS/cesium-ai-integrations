import { describe, it, expect } from "vitest";
import {
  validateSourceTypeParams,
  formatTilesetError,
  getTilesetCountMessage,
} from "../../src/utils/helpers";

describe("Tiles Server Helpers", () => {
  describe("validateSourceTypeParams", () => {
    describe("ion source type", () => {
      it("should pass when assetId is provided", () => {
        expect(() =>
          validateSourceTypeParams("ion", { assetId: 96188 }),
        ).not.toThrow();
      });

      it("should throw when assetId is undefined", () => {
        expect(() =>
          validateSourceTypeParams("ion", { assetId: undefined }),
        ).toThrow("assetId is required when type is 'ion'");
      });
    });

    describe("url source type", () => {
      it("should pass when url is provided", () => {
        expect(() =>
          validateSourceTypeParams("url", {
            url: "https://example.com/tileset.json",
          }),
        ).not.toThrow();
      });

      it("should throw when url is undefined", () => {
        expect(() =>
          validateSourceTypeParams("url", { url: undefined }),
        ).toThrow("url is required when type is 'url'");
      });

      it("should throw when url is empty string", () => {
        expect(() => validateSourceTypeParams("url", { url: "" })).toThrow(
          "url is required when type is 'url'",
        );
      });
    });

    it("should allow extra parameters that are not checked", () => {
      expect(() =>
        validateSourceTypeParams("ion", {
          assetId: 1,
          url: "ignored",
        }),
      ).not.toThrow();
    });
  });

  describe("formatTilesetError", () => {
    it("should format add operation errors", () => {
      const error = new Error("Test error");
      const result = formatTilesetError(error, {
        operation: "add",
        identifier: "TestTileset",
      });

      expect(result).toContain("Failed to add 3D tileset");
      expect(result).toContain("Test error");
    });

    it("should format remove operation errors", () => {
      const error = new Error("Asset not found");
      const result = formatTilesetError(error, {
        operation: "remove",
        identifier: "ts-123",
      });

      expect(result).toContain("Failed to remove 3D tileset");
      expect(result).toContain("ts-123");
      expect(result).toContain("Asset not found");
    });

    it("should format list operation errors", () => {
      const error = new Error("Connection timeout");
      const result = formatTilesetError(error, {
        operation: "list",
      });

      expect(result).toContain("Failed to list 3D tilesets");
      expect(result).toContain("Connection timeout");
    });

    it("should handle non-Error objects", () => {
      const result = formatTilesetError("string error", {
        operation: "add",
      });

      expect(result).toContain("Failed to add 3D tileset");
      // formatErrorMessage converts unknown types to "Unknown error"
      expect(result).toBeDefined();
    });

    it("should handle null errors", () => {
      const result = formatTilesetError(null, {
        operation: "add",
      });

      expect(result).toContain("Failed to add 3D tileset");
    });

    it("should include identifier in remove error message", () => {
      const error = new Error("Test");
      const result = formatTilesetError(error, {
        operation: "remove",
        identifier: "MyTileset",
      });

      expect(result).toContain("'MyTileset'");
    });

    it("should handle remove error without identifier", () => {
      const error = new Error("Test");
      const result = formatTilesetError(error, {
        operation: "remove",
      });

      expect(result).toContain("Failed to remove 3D tileset");
    });
  });

  describe("getTilesetCountMessage", () => {
    it("should use singular form for 0 tilesets", () => {
      expect(getTilesetCountMessage(0)).toBe("Found 0 tilesets");
    });

    it("should use singular form for 1 tileset", () => {
      expect(getTilesetCountMessage(1)).toBe("Found 1 tileset");
    });

    it("should use plural form for multiple tilesets", () => {
      expect(getTilesetCountMessage(2)).toBe("Found 2 tilesets");
      expect(getTilesetCountMessage(10)).toBe("Found 10 tilesets");
      expect(getTilesetCountMessage(100)).toBe("Found 100 tilesets");
    });

    it("should accept custom prefix", () => {
      expect(getTilesetCountMessage(1, "Loaded")).toBe("Loaded 1 tileset");
      expect(getTilesetCountMessage(3, "Loaded")).toBe("Loaded 3 tilesets");
      expect(getTilesetCountMessage(0, "Total")).toBe("Total 0 tilesets");
    });

    it("should use default prefix when not provided", () => {
      expect(getTilesetCountMessage(5)).toContain("Found");
    });
  });

  describe("integration scenarios", () => {
    it("should validate parameters and format errors together", () => {
      const invalidParams = { url: undefined };
      let errorThrown = false;
      let errorMessage = "";

      try {
        validateSourceTypeParams("url", invalidParams);
      } catch (error) {
        errorThrown = true;
        const result = formatTilesetError(error, {
          operation: "add",
          identifier: "test",
        });
        errorMessage = result;
      }

      expect(errorThrown).toBe(true);
      expect(errorMessage).toContain("Failed to add 3D tileset");
      expect(errorMessage).toContain("url is required");
    });

    it("should handle complete workflow for tileset list", () => {
      const count = 3;
      const message = getTilesetCountMessage(count);
      expect(message).toBe("Found 3 tilesets");

      // Simulate error during list
      const error = new Error("Scene unavailable");
      const errorResult = formatTilesetError(error, {
        operation: "list",
      });
      expect(errorResult).toContain("Failed to list 3D tilesets");
    });
  });
});
