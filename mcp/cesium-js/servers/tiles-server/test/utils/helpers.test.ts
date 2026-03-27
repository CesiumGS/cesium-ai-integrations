import { describe, it, expect } from "vitest";
import {
  validateSourceTypeParams,
  formatTilesetError,
  getTilesetCountMessage,
  getRemovalCountMessage,
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

      expect(result.formatted).toContain("Failed to add 3D tileset");
      expect(result.formatted).toContain("Test error");
    });

    it("should format remove operation errors", () => {
      const error = new Error("Asset not found");
      const result = formatTilesetError(error, {
        operation: "remove",
        identifier: "ts-123",
      });

      expect(result.formatted).toContain("Failed to remove 3D tileset");
      expect(result.formatted).toContain("ts-123");
      expect(result.formatted).toContain("Asset not found");
    });

    it("should format list operation errors", () => {
      const error = new Error("Connection timeout");
      const result = formatTilesetError(error, {
        operation: "list",
      });

      expect(result.formatted).toContain("Failed to list 3D tilesets");
      expect(result.formatted).toContain("Connection timeout");
    });

    it("should handle non-Error objects", () => {
      const result = formatTilesetError("string error", {
        operation: "add",
      });

      expect(result.formatted).toContain("Failed to add 3D tileset");
      // formatErrorMessage converts unknown types to "Unknown error"
      expect(result.formatted).toBeDefined();
    });

    it("should handle null errors", () => {
      const result = formatTilesetError(null, {
        operation: "add",
      });

      expect(result.formatted).toContain("Failed to add 3D tileset");
    });

    it("should include identifier in remove error message", () => {
      const error = new Error("Test");
      const result = formatTilesetError(error, {
        operation: "remove",
        identifier: "MyTileset",
      });

      expect(result.formatted).toContain("'MyTileset'");
    });

    it("should handle remove error without identifier", () => {
      const error = new Error("Test");
      const result = formatTilesetError(error, {
        operation: "remove",
      });

      expect(result.formatted).toContain("Failed to remove 3D tileset");
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

  describe("getRemovalCountMessage", () => {
    it("should use singular form for 1 removal", () => {
      expect(getRemovalCountMessage(1)).toBe("Removed 1 tileset");
    });

    it("should use plural form for multiple removals", () => {
      expect(getRemovalCountMessage(2)).toBe("Removed 2 tilesets");
      expect(getRemovalCountMessage(10)).toBe("Removed 10 tilesets");
    });

    it("should handle 0 removals", () => {
      expect(getRemovalCountMessage(0)).toBe("Removed 0 tilesets");
    });

    it("should handle undefined as 0", () => {
      expect(getRemovalCountMessage(undefined)).toBe("Removed 0 tilesets");
    });

    it("should work with large numbers", () => {
      expect(getRemovalCountMessage(1000)).toBe("Removed 1000 tilesets");
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
        errorMessage = result.formatted;
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
      expect(errorResult.formatted).toContain("Failed to list 3D tilesets");
    });
  });
});
