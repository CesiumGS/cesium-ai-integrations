/**
 * Cesium 3D Tiles Manager Module
 * Handles 3D tileset operations: add, remove, and list tilesets in the scene
 *
 * Supports two source types:
 *   - ion: Cesium Ion asset (Cesium3DTileset.fromIonAssetId)
 *   - url: Direct tileset.json URL (Cesium3DTileset.fromUrl)
 */

import type {
  MCPCommand,
  CommandHandler,
  ManagerInterface,
} from "../types/mcp.js";
import type {
  TilesetAddResult,
  TilesetRemoveResult,
  TilesetInfo,
  TilesetListResult,
  TilesetStyleResult,
} from "../types/tiles-types.js";
import type { CesiumViewer } from "../types/cesium-types.js";
import type { Cesium3DTileset } from "cesium";

interface TrackedTileset {
  tilesetId: string;
  name: string;
  sourceType: string;
  tileset: Cesium3DTileset;
  assetId?: number;
  url?: string;
}

class CesiumTilesManager implements ManagerInterface {
  public viewer: CesiumViewer;
  private tilesets: Map<string, TrackedTileset> = new Map();
  private nextId = 1;

  constructor(viewer: CesiumViewer) {
    this.viewer = viewer;
  }

  public setUp(): void {
    // No initialization needed
  }

  public shutdown(): void {
    for (const tracked of this.tilesets.values()) {
      this.viewer.scene.primitives.remove(tracked.tileset);
    }
    this.tilesets.clear();
  }

  private generateId(): string {
    return `ts-${this.nextId++}`;
  }

  /**
   * Resolve the Ion asset ID for a given command.
   * For 'ion', the assetId is provided directly.
   */
  private resolveIonAssetId(cmd: MCPCommand): number | undefined {
    const sourceType = cmd.sourceType as string;
    if (sourceType === "ion") {
      return cmd.assetId as number | undefined;
    }
    return undefined;
  }

  /**
   * Load a Cesium3DTileset from a command
   */
  private async loadTileset(cmd: MCPCommand): Promise<Cesium3DTileset> {
    const sourceType = cmd.sourceType as string;

    if (sourceType === "url") {
      const url = cmd.url as string;
      return Cesium.Cesium3DTileset.fromUrl(url);
    }

    const ionAssetId = this.resolveIonAssetId(cmd);
    if (ionAssetId === undefined) {
      throw new Error(
        `Cannot load tileset: missing required ID for source type '${sourceType}'`,
      );
    }
    return Cesium.Cesium3DTileset.fromIonAssetId(ionAssetId);
  }

  /**
   * Add a 3D tileset to the scene
   */
  private async addTileset(cmd: MCPCommand): Promise<TilesetAddResult> {
    try {
      const tileset = await this.loadTileset(cmd);

      const show = cmd.show as boolean | undefined;
      if (show !== undefined) {
        tileset.show = show;
      }

      this.viewer.scene.primitives.add(tileset);

      const tilesetId = this.generateId();
      const name =
        (cmd.name as string | undefined) || (cmd.sourceType as string);

      const tracked: TrackedTileset = {
        tilesetId,
        name,
        sourceType: cmd.sourceType as string,
        tileset,
        assetId: cmd.assetId as number | undefined,
        url: cmd.url as string | undefined,
      };
      this.tilesets.set(tilesetId, tracked);

      return {
        success: true,
        message: `3D tileset '${name}' added successfully`,
        tilesetId,
        name,
        sourceType: cmd.sourceType as string,
        totalTilesets: this.tilesets.size,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Remove a tileset (or all tilesets) from the scene
   */
  private removeTileset(cmd: MCPCommand): TilesetRemoveResult {
    try {
      const tilesetId = cmd.tilesetId as string | undefined;
      const name = cmd.name as string | undefined;
      const removeAll = cmd.removeAll as boolean | undefined;

      if (removeAll) {
        const count = this.tilesets.size;
        for (const tracked of this.tilesets.values()) {
          this.viewer.scene.primitives.remove(tracked.tileset);
        }
        this.tilesets.clear();
        return {
          success: true,
          message: `Removed all ${count} tileset${count === 1 ? "" : "s"}`,
          removedCount: count,
        };
      }

      if (tilesetId) {
        const tracked = this.tilesets.get(tilesetId);
        if (!tracked) {
          return {
            success: false,
            error: `No tileset found with id '${tilesetId}'`,
          };
        }
        this.viewer.scene.primitives.remove(tracked.tileset);
        this.tilesets.delete(tilesetId);
        return {
          success: true,
          message: `Tileset '${tracked.name}' removed`,
          removedTilesetId: tilesetId,
          removedName: tracked.name,
          removedCount: 1,
        };
      }

      if (name) {
        for (const [id, tracked] of this.tilesets.entries()) {
          if (tracked.name === name) {
            this.viewer.scene.primitives.remove(tracked.tileset);
            this.tilesets.delete(id);
            return {
              success: true,
              message: `Tileset '${name}' removed`,
              removedTilesetId: id,
              removedName: name,
              removedCount: 1,
            };
          }
        }
        return {
          success: false,
          error: `No tileset found with name '${name}'`,
        };
      }

      return {
        success: false,
        error: "Either tilesetId, name, or removeAll must be provided",
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Apply or update 3D Tiles styling on a loaded tileset
   */
  private styleTileset(cmd: MCPCommand): TilesetStyleResult {
    try {
      const tilesetId = cmd.tilesetId as string | undefined;
      const name = cmd.name as string | undefined;

      let tracked: TrackedTileset | undefined;
      if (tilesetId) {
        tracked = this.tilesets.get(tilesetId);
        if (!tracked) {
          return {
            success: false,
            error: `No tileset found with id '${tilesetId}'`,
          };
        }
      } else if (name) {
        for (const t of this.tilesets.values()) {
          if (t.name === name) {
            tracked = t;
            break;
          }
        }
        if (!tracked) {
          return {
            success: false,
            error: `No tileset found with name '${name}'`,
          };
        }
      } else {
        return {
          success: false,
          error: "Either tilesetId or name must be provided",
        };
      }

      const color = cmd.color as string | undefined;
      const colorConditions = cmd.colorConditions as string[][] | undefined;
      const show = cmd.show as boolean | string | undefined;
      const showConditions = cmd.showConditions as string[][] | undefined;

      const styleJson: Record<string, unknown> = {};

      if (colorConditions !== undefined) {
        styleJson.color = { conditions: colorConditions };
      } else if (color !== undefined) {
        styleJson.color = color;
      }

      if (showConditions !== undefined) {
        styleJson.show = { conditions: showConditions };
      } else if (show !== undefined) {
        styleJson.show = show;
      }

      tracked.tileset.style = new Cesium.Cesium3DTileStyle(styleJson);

      const appliedStyle: TilesetStyleResult["appliedStyle"] = {};
      if (color !== undefined) {
        appliedStyle.color = color;
      }
      if (colorConditions !== undefined) {
        appliedStyle.colorConditions = colorConditions;
      }
      if (show !== undefined) {
        appliedStyle.show = show;
      }
      if (showConditions !== undefined) {
        appliedStyle.showConditions = showConditions;
      }

      return {
        success: true,
        message: `Tileset '${tracked.name}' styled successfully`,
        tilesetId: tracked.tilesetId,
        name: tracked.name,
        appliedStyle,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * List all loaded tilesets
   */
  private listTilesets(): TilesetListResult {
    try {
      const tilesets: TilesetInfo[] = Array.from(this.tilesets.values()).map(
        (tracked) => ({
          tilesetId: tracked.tilesetId,
          name: tracked.name,
          sourceType: tracked.sourceType,
          show: tracked.tileset.show,
          assetId: tracked.assetId,
          url: tracked.url,
        }),
      );

      return {
        success: true,
        tilesets,
        totalCount: tilesets.length,
        message: `Found ${tilesets.length} tileset${tilesets.length === 1 ? "" : "s"}`,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        tilesets: [],
      };
    }
  }

  public getCommandHandlers(): Map<string, CommandHandler> {
    const handlers = new Map<string, CommandHandler>();

    handlers.set("tileset_add", async (cmd: MCPCommand) =>
      this.addTileset(cmd),
    );
    handlers.set("tileset_remove", (cmd: MCPCommand) =>
      this.removeTileset(cmd),
    );
    handlers.set("tileset_list", () => this.listTilesets());
    handlers.set("tileset_style", (cmd: MCPCommand) => this.styleTileset(cmd));

    return handlers;
  }
}

export default CesiumTilesManager;
