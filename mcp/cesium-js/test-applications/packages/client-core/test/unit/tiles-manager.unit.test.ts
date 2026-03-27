/**
 * Unit Tests for Tiles Manager
 * Tests all command handler functions for tileset creation, removal, and listing
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CesiumViewer } from "../../src/types/cesium-types";
import type { MCPCommand } from "../../src/types/mcp";

// ---- Mock Cesium Module (before any imports that use it) ----

vi.mock("cesium", () => {
  class MockCesium3DTileset {
    show: boolean = true;
    isDestroyed: boolean = false;

    static async fromUrl(url: string): Promise<MockCesium3DTileset> {
      // Validate URL
      if (!url || url.trim() === "") {
        throw new Error("Cannot load tileset: missing required URL");
      }
      const tileset = new MockCesium3DTileset();
      return tileset;
    }

    static async fromIonAssetId(assetId: number): Promise<MockCesium3DTileset> {
      if (
        assetId === null ||
        assetId === undefined ||
        !Number.isFinite(assetId)
      ) {
        throw new Error("Invalid Ion asset ID");
      }
      const tileset = new MockCesium3DTileset();
      return tileset;
    }
  }

  return {
    Cesium3DTileset: MockCesium3DTileset,
  };
});

// Import after mock is set up
import CesiumTilesManager from "../../src/managers/tiles-manager";

// ---- Test Suite ----

describe("Tiles Manager Unit Tests", () => {
  let tilesManager: CesiumTilesManager;
  let mockViewer: CesiumViewer;
  let mockPrimitives: {
    add: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let commandHandlers: Map<string, (cmd: MCPCommand) => unknown>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrimitives = {
      add: vi.fn((tileset: unknown) => tileset),
      remove: vi.fn(() => true),
    };

    mockViewer = {
      scene: {
        primitives: mockPrimitives,
      },
    } as unknown as CesiumViewer;

    tilesManager = new CesiumTilesManager(mockViewer);
    commandHandlers = tilesManager.getCommandHandlers() as Map<
      string,
      (cmd: MCPCommand) => unknown
    >;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Handler Registration Tests
  // ───────────────────────────────────────────────────────────────────────────

  describe("Command handler registration", () => {
    it("should register all required tileset command handlers", () => {
      const required = ["tileset_add", "tileset_remove", "tileset_list"];
      for (const name of required) {
        expect(commandHandlers.has(name)).toBe(true);
        expect(typeof commandHandlers.get(name)).toBe("function");
      }
    });

    it("should have exactly 3 handlers", () => {
      expect(commandHandlers.size).toBe(3);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // tileset_add Tests
  // ───────────────────────────────────────────────────────────────────────────

  describe("tileset_add command", () => {
    const addHandler = () =>
      commandHandlers.get("tileset_add") as (
        cmd: MCPCommand,
      ) => Promise<unknown>;

    describe("ion source type", () => {
      it("should add an ion tileset successfully", async () => {
        const result = (await addHandler()({
          type: "tileset_add",
          sourceType: "ion",
          assetId: 96188,
          name: "Cesium OSM Buildings",
        })) as Record<string, unknown>;

        expect(result.success).toBe(true);
        expect(result.tilesetId).toBeDefined();
        expect(result.name).toBe("Cesium OSM Buildings");
        expect(result.sourceType).toBe("ion");
        expect(result.totalTilesets).toBe(1);
        expect(mockPrimitives.add).toHaveBeenCalledTimes(1);
      });

      it("should generate sequential tileset IDs", async () => {
        const result1 = (await addHandler()({
          type: "tileset_add",
          sourceType: "ion",
          assetId: 1,
        })) as Record<string, unknown>;

        const result2 = (await addHandler()({
          type: "tileset_add",
          sourceType: "ion",
          assetId: 2,
        })) as Record<string, unknown>;

        expect(result1.tilesetId).toBe("ts-1");
        expect(result2.tilesetId).toBe("ts-2");
      });

      it("should handle tileset visibility setting", async () => {
        const result = (await addHandler()({
          type: "tileset_add",
          sourceType: "ion",
          assetId: 1,
          show: false,
        })) as Record<string, unknown>;

        expect(result.success).toBe(true);
      });

      it("should use sourceType as default name", async () => {
        const result = (await addHandler()({
          type: "tileset_add",
          sourceType: "ion",
          assetId: 1,
        })) as Record<string, unknown>;

        expect(result.name).toBe("ion");
      });
    });

    describe("url source type", () => {
      it("should add a url-based tileset successfully", async () => {
        const result = (await addHandler()({
          type: "tileset_add",
          sourceType: "url",
          url: "https://example.com/tileset/tileset.json",
          name: "Custom Tileset",
        })) as Record<string, unknown>;

        expect(result.success).toBe(true);
        expect(result.sourceType).toBe("url");
        expect(result.name).toBe("Custom Tileset");
      });

      it("should handle URLs with query parameters", async () => {
        const url = "https://example.com/tileset.json?token=abc&v=2";
        const result = (await addHandler()({
          type: "tileset_add",
          sourceType: "url",
          url,
          name: "URL with params",
        })) as Record<string, unknown>;

        expect(result.success).toBe(true);
      });
    });

    describe("error cases", () => {
      it("should fail when url source type has no url", async () => {
        const result = (await addHandler()({
          type: "tileset_add",
          sourceType: "url",
        })) as Record<string, unknown>;

        expect(result.success).toBe(false);
        expect(result.error).toContain("Cannot load tileset");
      });

      it("should fail when ion source type has no assetId", async () => {
        const result = (await addHandler()({
          type: "tileset_add",
          sourceType: "ion",
        })) as Record<string, unknown>;

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe("concurrent add operations", () => {
      it("should handle multiple concurrent adds", async () => {
        const promises = [
          addHandler()({
            type: "tileset_add",
            sourceType: "ion",
            assetId: 1,
          }),
          addHandler()({
            type: "tileset_add",
            sourceType: "url",
            url: "https://example.com/1.json",
          }),
        ];

        const results = (await Promise.all(promises)) as Array<
          Record<string, unknown>
        >;
        expect(results.every((r) => r.success)).toBe(true);
        expect(mockPrimitives.add).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // tileset_remove Tests
  // ───────────────────────────────────────────────────────────────────────────

  describe("tileset_remove command", () => {
    const removeHandler = () =>
      commandHandlers.get("tileset_remove") as (cmd: MCPCommand) => unknown;

    async function setupTileset(
      sourceType = "ion",
      assetId = 1,
      name = "Test Tileset",
    ) {
      const addHandler = commandHandlers.get("tileset_add") as (
        cmd: MCPCommand,
      ) => Promise<unknown>;
      return (await addHandler({
        type: "tileset_add",
        sourceType,
        assetId,
        name,
      })) as Record<string, unknown>;
    }

    it("should remove tileset by tilesetId", async () => {
      const added = await setupTileset();
      const tilesetId = added.tilesetId as string;

      const result = removeHandler()({
        type: "tileset_remove",
        tilesetId,
      }) as Record<string, unknown>;

      expect(result.success).toBe(true);
      expect(result.removedTilesetId).toBe(tilesetId);
      expect(result.removedCount).toBe(1);
      expect(mockPrimitives.remove).toHaveBeenCalledTimes(1);
    });

    it("should remove tileset by name", async () => {
      await setupTileset("ion", 1, "MyTileset");

      const result = removeHandler()({
        type: "tileset_remove",
        name: "MyTileset",
      }) as Record<string, unknown>;

      expect(result.success).toBe(true);
      expect(result.removedName).toBe("MyTileset");
      expect(result.removedCount).toBe(1);
    });

    it("should remove all tilesets when removeAll is true", async () => {
      // Add 3 tilesets
      for (let i = 0; i < 3; i++) {
        await setupTileset("ion", i + 1, `Tileset${i}`);
      }

      const result = removeHandler()({
        type: "tileset_remove",
        removeAll: true,
      }) as Record<string, unknown>;

      expect(result.success).toBe(true);
      expect(result.removedCount).toBe(3);
      expect(mockPrimitives.remove).toHaveBeenCalledTimes(3);
    });

    it("should fail when tileset not found by id", async () => {
      const result = removeHandler()({
        type: "tileset_remove",
        tilesetId: "ts-999",
      }) as Record<string, unknown>;

      expect(result.success).toBe(false);
      expect(result.error).toContain("No tileset found");
    });

    it("should fail when tileset not found by name", async () => {
      const result = removeHandler()({
        type: "tileset_remove",
        name: "NonExistent",
      }) as Record<string, unknown>;

      expect(result.success).toBe(false);
    });

    it("should fail when no removal identifier provided", async () => {
      const result = removeHandler()({
        type: "tileset_remove",
      }) as Record<string, unknown>;

      expect(result.success).toBe(false);
      expect(result.error).toContain("Either tilesetId, name, or removeAll");
    });

    it("should handle removing from empty scene", async () => {
      const result = removeHandler()({
        type: "tileset_remove",
        removeAll: true,
      }) as Record<string, unknown>;

      expect(result.success).toBe(true);
      expect(result.removedCount).toBe(0);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // tileset_list Tests
  // ───────────────────────────────────────────────────────────────────────────

  describe("tileset_list command", () => {
    const listHandler = () =>
      commandHandlers.get("tileset_list") as (cmd: MCPCommand) => unknown;

    async function setupTileset(
      sourceType = "ion",
      idValue = 1,
      name = "Test Tileset",
    ) {
      const addHandler = commandHandlers.get("tileset_add") as (
        cmd: MCPCommand,
      ) => Promise<unknown>;

      const cmd: MCPCommand = {
        type: "tileset_add",
        sourceType,
        name,
      };

      // Set the appropriate ID field based on source type
      if (sourceType === "url") {
        cmd.url = `https://example.com/tileset${idValue}.json`;
      } else {
        // Default to ion
        cmd.assetId = idValue;
      }

      return (await addHandler(cmd)) as Record<string, unknown>;
    }

    it("should list empty scene", () => {
      const result = listHandler()({
        type: "tileset_list",
      }) as Record<string, unknown>;

      expect(result.success).toBe(true);
      expect(result.tilesets).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it("should list single tileset", async () => {
      await setupTileset("ion", 96188, "OSM Buildings");

      const result = listHandler()({
        type: "tileset_list",
      }) as Record<string, unknown>;

      expect(result.success).toBe(true);
      expect((result.tilesets as unknown[]).length).toBe(1);
      expect(result.totalCount).toBe(1);

      const tileset = (result.tilesets as unknown[])[0] as Record<
        string,
        unknown
      >;
      expect(tileset.name).toBe("OSM Buildings");
      expect(tileset.sourceType).toBe("ion");
    });

    it("should list multiple tilesets with all properties", async () => {
      // Add tilesets of different types
      await setupTileset("ion", 96188, "Tileset Ion");
      await setupTileset("url", 0, "Tileset URL");

      const result = listHandler()({
        type: "tileset_list",
      }) as Record<string, unknown>;

      expect(result.success).toBe(true);
      expect((result.tilesets as unknown[]).length).toBe(2);
      expect(result.totalCount).toBe(2);

      const tilesets = result.tilesets as Array<Record<string, unknown>>;
      expect(tilesets[0].sourceType).toBe("ion");
      expect(tilesets[1].sourceType).toBe("url");
    });

    it("should include tileset IDs and visibility state", async () => {
      const added = (await setupTileset("ion", 1, "Test")) as Record<
        string,
        unknown
      >;

      const result = listHandler()({
        type: "tileset_list",
      }) as Record<string, unknown>;

      const tilesets = result.tilesets as Array<Record<string, unknown>>;
      expect(tilesets[0].tilesetId).toBe(added.tilesetId);
      expect(tilesets[0].show).toBe(true);
    });

    it("should reflect removals in list", async () => {
      await setupTileset("ion", 1, "T1");
      await setupTileset("ion", 2, "T2");

      // Remove first tileset
      const removeHandler = commandHandlers.get("tileset_remove") as (
        cmd: MCPCommand,
      ) => unknown;
      removeHandler({
        type: "tileset_remove",
        name: "T1",
      });

      const result = listHandler()({
        type: "tileset_list",
      }) as Record<string, unknown>;

      expect((result.tilesets as unknown[]).length).toBe(1);
      const tilesets = result.tilesets as Array<Record<string, unknown>>;
      expect(tilesets[0].name).toBe("T2");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Manager Lifecycle Tests
  // ───────────────────────────────────────────────────────────────────────────

  describe("Manager lifecycle", () => {
    it("should initialize with empty tilesets", () => {
      const result = commandHandlers.get("tileset_list")!({
        type: "tileset_list",
      }) as Record<string, unknown>;
      expect((result.tilesets as unknown[]).length).toBe(0);
    });

    it("should support setUp() call", () => {
      expect(() => tilesManager.setUp()).not.toThrow();
    });

    it("should clear all tilesets on shutdown", async () => {
      // Add some tilesets
      const addHandler = commandHandlers.get("tileset_add") as (
        cmd: MCPCommand,
      ) => Promise<unknown>;
      await addHandler({
        type: "tileset_add",
        sourceType: "ion",
        assetId: 1,
      });
      await addHandler({
        type: "tileset_add",
        sourceType: "ion",
        assetId: 2,
      });

      // Shutdown
      tilesManager.shutdown();

      // Verify all removed
      expect(mockPrimitives.remove).toHaveBeenCalledTimes(2);

      // Verify list is empty after shutdown
      const result = commandHandlers.get("tileset_list")!({
        type: "tileset_list",
      }) as Record<string, unknown>;
      expect((result.tilesets as unknown[]).length).toBe(0);
    });

    it("should be able to add tilesets after initialization", async () => {
      tilesManager.setUp();

      const addHandler = commandHandlers.get("tileset_add") as (
        cmd: MCPCommand,
      ) => Promise<unknown>;
      const result = (await addHandler({
        type: "tileset_add",
        sourceType: "ion",
        assetId: 1,
      })) as Record<string, unknown>;

      expect(result.success).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // State Management Tests
  // ───────────────────────────────────────────────────────────────────────────

  describe("State management", () => {
    async function setupTileset(
      sourceType = "ion",
      assetId = 1,
      name = "Test Tileset",
    ) {
      const addHandler = commandHandlers.get("tileset_add") as (
        cmd: MCPCommand,
      ) => Promise<unknown>;
      return (await addHandler({
        type: "tileset_add",
        sourceType,
        assetId,
        name,
      })) as Record<string, unknown>;
    }

    it("should maintain tileset state with add/remove sequence", async () => {
      // Add 3 tilesets
      const _t1 = await setupTileset("ion", 1, "T1");
      const t2 = await setupTileset("ion", 2, "T2");
      const _t3 = await setupTileset("ion", 3, "T3");

      // Verify all 3 exist
      let result = commandHandlers.get("tileset_list")!({
        type: "tileset_list",
      }) as Record<string, unknown>;
      expect((result.tilesets as unknown[]).length).toBe(3);

      // Remove middle one
      const removeHandler = commandHandlers.get("tileset_remove") as (
        cmd: MCPCommand,
      ) => unknown;
      removeHandler({
        type: "tileset_remove",
        tilesetId: t2.tilesetId,
      });

      // Verify 2 remain
      result = commandHandlers.get("tileset_list")!({
        type: "tileset_list",
      }) as Record<string, unknown>;
      expect((result.tilesets as unknown[]).length).toBe(2);

      const tilesets = result.tilesets as Array<Record<string, unknown>>;
      expect(tilesets.map((t) => t.name)).toEqual(["T1", "T3"]);
    });

    it("should track metadata correctly for each source type", async () => {
      await setupTileset("ion", 96188, "Ion Asset");

      const result = commandHandlers.get("tileset_list")!({
        type: "tileset_list",
      }) as Record<string, unknown>;
      const tileset = (result.tilesets as unknown[])[0] as Record<
        string,
        unknown
      >;

      expect(tileset.assetId).toBe(96188);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Edge Cases
  // ───────────────────────────────────────────────────────────────────────────

  describe("Edge cases", () => {
    it("should handle tilesets with special characters in names", async () => {
      const addHandler = commandHandlers.get("tileset_add") as (
        cmd: MCPCommand,
      ) => Promise<unknown>;
      const result = (await addHandler({
        type: "tileset_add",
        sourceType: "ion",
        assetId: 1,
        name: "Buildings & Roads [v1.0] (2024)",
      })) as Record<string, unknown>;

      expect(result.success).toBe(true);
      expect(result.name).toBe("Buildings & Roads [v1.0] (2024)");
    });

    it("should handle assetId of 0", async () => {
      const addHandler = commandHandlers.get("tileset_add") as (
        cmd: MCPCommand,
      ) => Promise<unknown>;
      const result = (await addHandler({
        type: "tileset_add",
        sourceType: "ion",
        assetId: 0,
      })) as Record<string, unknown>;

      expect(result.success).toBe(true);
    });

    it("should handle very large assetIds", async () => {
      const addHandler = commandHandlers.get("tileset_add") as (
        cmd: MCPCommand,
      ) => Promise<unknown>;
      const result = (await addHandler({
        type: "tileset_add",
        sourceType: "ion",
        assetId: 999999999999,
      })) as Record<string, unknown>;

      expect(result.success).toBe(true);
    });

    it("should maintain separate tileset instances", async () => {
      const addHandler = commandHandlers.get("tileset_add") as (
        cmd: MCPCommand,
      ) => Promise<unknown>;

      const t1 = (await addHandler({
        type: "tileset_add",
        sourceType: "ion",
        assetId: 1,
      })) as Record<string, unknown>;

      const t2 = (await addHandler({
        type: "tileset_add",
        sourceType: "ion",
        assetId: 2,
      })) as Record<string, unknown>;

      expect(t1.tilesetId).not.toBe(t2.tilesetId);
    });
  });
});
