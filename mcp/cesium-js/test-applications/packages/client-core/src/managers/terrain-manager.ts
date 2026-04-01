/**
 * Cesium Terrain Manager Module
 * Handles terrain provider operations: set, get, and remove terrain providers
 */

import type {
  MCPCommand,
  CommandHandler,
  ManagerInterface,
} from "../types/mcp.js";
import type {
  TerrainSetResult,
  TerrainGetResult,
  TerrainRemoveResult,
} from "../types/terrain-types.js";
import type { CesiumViewer } from "../types/cesium-types.js";
import {
  CesiumTerrainProvider,
  EllipsoidTerrainProvider,
  ArcGISTiledElevationTerrainProvider,
  TerrainProvider,
} from "cesium";

// Track the current terrain metadata
interface TerrainMeta {
  sourceType: string;
  name?: string;
  assetId?: number;
  url?: string;
}

class CesiumTerrainManager implements ManagerInterface {
  public viewer: CesiumViewer;
  private currentMeta: TerrainMeta;

  constructor(viewer: CesiumViewer) {
    this.viewer = viewer;
    this.currentMeta = { sourceType: "ellipsoid" };
  }

  public setUp(): void {
    // Detect initial terrain provider type
    this.detectCurrentTerrain();
  }

  public shutdown(): void {
    // No cleanup needed
  }

  /**
   * Detect the current terrain provider type from the viewer
   */
  private detectCurrentTerrain(): void {
    const provider = this.viewer.scene.terrainProvider;

    if (provider instanceof EllipsoidTerrainProvider) {
      this.currentMeta = { sourceType: "ellipsoid", name: "WGS84 Ellipsoid" };
    } else if (provider instanceof CesiumTerrainProvider) {
      this.currentMeta = {
        sourceType: "unknown",
        name: "CesiumTerrainProvider",
      };
    } else if (provider instanceof ArcGISTiledElevationTerrainProvider) {
      this.currentMeta = {
        sourceType: "url",
        name: "ArcGIS Elevation",
      };
    } else {
      this.currentMeta = { sourceType: "unknown" };
    }
  }

  /**
   * Set terrain provider
   */
  private async setTerrain(cmd: MCPCommand): Promise<TerrainSetResult> {
    try {
      const sourceType = cmd.sourceType as string;
      const assetId = cmd.assetId as number | undefined;
      const url = cmd.url as string | undefined;
      const name = cmd.name as string | undefined;
      const requestVertexNormals =
        (cmd.requestVertexNormals as boolean | undefined) ?? true;
      const requestWaterMask =
        (cmd.requestWaterMask as boolean | undefined) ?? false;
      const requestMetadata =
        (cmd.requestMetadata as boolean | undefined) ?? true;

      let provider: TerrainProvider;

      switch (sourceType) {
        case "ion": {
          if (assetId === undefined) {
            return {
              success: false,
              error: "assetId is required when sourceType is 'ion'",
            };
          }
          provider = await CesiumTerrainProvider.fromIonAssetId(assetId, {
            requestVertexNormals,
            requestWaterMask,
            requestMetadata,
          });
          break;
        }

        case "url": {
          if (!url) {
            return {
              success: false,
              error: "url is required when sourceType is 'url'",
            };
          }
          provider = await CesiumTerrainProvider.fromUrl(url, {
            requestVertexNormals,
            requestWaterMask,
            requestMetadata,
          });
          break;
        }

        case "ellipsoid": {
          provider = new EllipsoidTerrainProvider();
          break;
        }

        default:
          return {
            success: false,
            error: `Unsupported terrain source type: ${sourceType}`,
          };
      }

      this.viewer.scene.terrainProvider = provider;

      const terrainName = name || this.getDefaultName(sourceType, assetId, url);
      this.currentMeta = {
        sourceType,
        name: terrainName,
        assetId,
        url,
      };

      return {
        success: true,
        message: `Terrain provider '${terrainName}' set successfully`,
        sourceType,
        name: terrainName,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get current terrain provider information
   */
  private getTerrain(): TerrainGetResult {
    try {
      const provider = this.viewer.scene.terrainProvider;

      const terrain = {
        sourceType: this.currentMeta.sourceType,
        name: this.currentMeta.name,
        assetId: this.currentMeta.assetId,
        url: this.currentMeta.url,
        hasVertexNormals: provider.hasVertexNormals,
        hasWaterMask: provider.hasWaterMask,
        hasMetadata:
          "hasMetadata" in provider ? (provider.hasMetadata as boolean) : false,
      };

      return {
        success: true,
        message: `Current terrain: ${terrain.name || terrain.sourceType}`,
        terrain,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Remove terrain provider (reset to ellipsoid)
   */
  private removeTerrain(): TerrainRemoveResult {
    try {
      const previousSourceType = this.currentMeta.sourceType;
      const previousName = this.currentMeta.name;

      this.viewer.scene.terrainProvider = new EllipsoidTerrainProvider();
      this.currentMeta = {
        sourceType: "ellipsoid",
        name: "WGS84 Ellipsoid",
      };

      return {
        success: true,
        message: previousName
          ? `Terrain provider '${previousName}' removed, reset to ellipsoid`
          : "Terrain provider removed, reset to ellipsoid",
        previousSourceType,
        previousName,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Generate a default name based on source type
   */
  private getDefaultName(
    sourceType: string,
    assetId?: number,
    url?: string,
  ): string {
    switch (sourceType) {
      case "ion":
        return assetId === 1
          ? "Cesium World Terrain"
          : `Ion Terrain (${assetId})`;
      case "url":
        return url ? `Terrain (${new URL(url).hostname})` : "URL Terrain";
      case "ellipsoid":
        return "WGS84 Ellipsoid";
      default:
        return sourceType;
    }
  }

  public getCommandHandlers(): Map<string, CommandHandler> {
    const handlers = new Map<string, CommandHandler>();

    handlers.set("terrain_set", async (cmd: MCPCommand) =>
      this.setTerrain(cmd),
    );
    handlers.set("terrain_get", () => this.getTerrain());
    handlers.set("terrain_remove", () => this.removeTerrain());

    return handlers;
  }
}

export default CesiumTerrainManager;
