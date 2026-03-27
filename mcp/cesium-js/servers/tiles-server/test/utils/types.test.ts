import { describe, it, expect } from "vitest";
import type {
  BaseResult,
  TilesetAddResult,
  TilesetRemoveResult,
  TilesetListResult,
  TilesResult,
} from "../../src/utils/types";

describe("Tiles Server Type Definitions", () => {
  describe("BaseResult interface", () => {
    it("should accept minimal result", () => {
      const result: BaseResult = { success: true };
      expect(result.success).toBe(true);
    });

    it("should accept result with error", () => {
      const result: BaseResult = { success: false, error: "Test error" };
      expect(result.error).toBe("Test error");
    });

    it("should allow additional properties via index signature", () => {
      const result: BaseResult = {
        success: false,
        error: "Failed",
        customKey: "custom value",
      };
      expect((result as Record<string, unknown>).customKey).toBe(
        "custom value",
      );
    });
  });

  describe("TilesetAddResult interface", () => {
    it("should extend BaseResult with add-specific fields", () => {
      const result: TilesetAddResult = {
        success: true,
        tilesetId: "ts-1",
        name: "My Tileset",
        sourceType: "ion",
        totalTilesets: 1,
      };

      expect(result.success).toBe(true);
      expect(result.tilesetId).toBe("ts-1");
      expect(result.name).toBe("My Tileset");
      expect(result.sourceType).toBe("ion");
      expect(result.totalTilesets).toBe(1);
    });

    it("should allow partial fields", () => {
      const result: TilesetAddResult = {
        success: true,
        tilesetId: "ts-2",
      };

      expect(result.tilesetId).toBe("ts-2");
      expect(result.name).toBeUndefined();
    });

    it("should allow error case", () => {
      const result: TilesetAddResult = {
        success: false,
        error: "Invalid asset ID",
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid asset ID");
    });

    it("should allow extra properties", () => {
      const result: TilesetAddResult = {
        success: true,
        customData: { key: "value" },
      };

      expect((result as Record<string, unknown>).customData).toEqual({
        key: "value",
      });
    });
  });

  describe("TilesetRemoveResult interface", () => {
    it("should have remove-specific fields", () => {
      const result: TilesetRemoveResult = {
        success: true,
        removedTilesetId: "ts-1",
        removedName: "My Tileset",
        removedCount: 1,
      };

      expect(result.removedTilesetId).toBe("ts-1");
      expect(result.removedName).toBe("My Tileset");
      expect(result.removedCount).toBe(1);
    });

    it("should support removeAll scenario", () => {
      const result: TilesetRemoveResult = {
        success: true,
        removedCount: 5,
      };

      expect(result.removedCount).toBe(5);
      expect(result.removedTilesetId).toBeUndefined();
    });

    it("should allow error case", () => {
      const result: TilesetRemoveResult = {
        success: false,
        error: "Tileset not found",
        removedCount: 0,
      };

      expect(result.success).toBe(false);
      expect(result.removedCount).toBe(0);
    });
  });

  describe("TilesetListResult interface", () => {
    it("should have list-specific fields", () => {
      const result: TilesetListResult = {
        success: true,
        tilesets: [
          {
            tilesetId: "ts-1",
            sourceType: "ion",
            show: true,
            assetId: 96188,
          },
        ],
        totalCount: 1,
      };

      expect(result.tilesets).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.tilesets?.[0].tilesetId).toBe("ts-1");
    });

    it("should support empty tileset list", () => {
      const result: TilesetListResult = {
        success: true,
        tilesets: [],
        totalCount: 0,
      };

      expect(result.tilesets).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("should allow error case with empty list", () => {
      const result: TilesetListResult = {
        success: false,
        error: "Scene not available",
        tilesets: [],
        totalCount: 0,
      };

      expect(result.success).toBe(false);
      expect(result.tilesets).toHaveLength(0);
    });
  });

  describe("TilesResult union type", () => {
    it("should accept TilesetAddResult", () => {
      const result: TilesResult = {
        success: true,
        tilesetId: "ts-1",
      };

      const addResult = result as TilesetAddResult;
      expect(addResult.tilesetId).toBe("ts-1");
    });

    it("should accept TilesetRemoveResult", () => {
      const result: TilesResult = {
        success: true,
        removedCount: 1,
      };

      const removeResult = result as TilesetRemoveResult;
      expect(removeResult.removedCount).toBe(1);
    });

    it("should accept TilesetListResult", () => {
      const result: TilesResult = {
        success: true,
        tilesets: [],
        totalCount: 0,
      };

      const listResult = result as TilesetListResult;
      expect(listResult.tilesets).toHaveLength(0);
    });

    it("should discriminate by checking properties", () => {
      const addResult: TilesResult = { success: true, tilesetId: "ts-1" };
      const removeResult: TilesResult = { success: true, removedCount: 1 };
      const listResult: TilesResult = {
        success: true,
        tilesets: [],
        totalCount: 0,
      };

      // Type guards based on properties
      expect("tilesetId" in addResult).toBe(true);
      expect("removedCount" in removeResult).toBe(true);
      expect("totalCount" in listResult).toBe(true);
    });
  });
});
