/**
 * Cesium Imagery Manager Module
 * Handles imagery layer operations: add, remove, and list imagery providers
 */

import type {
  MCPCommand,
  CommandHandler,
  ManagerInterface,
} from "../types/mcp.js";
import type {
  ImageryAddResult,
  ImageryRemoveResult,
  ImageryLayerInfo,
  ImageryListResult,
} from "../types/imagery-types.js";
import type { CesiumViewer } from "../types/cesium-types.js";
import {
  ImageryProvider,
  ImageryLayer,
  UrlTemplateImageryProvider,
  WebMapServiceImageryProvider,
  WebMapTileServiceImageryProvider,
  OpenStreetMapImageryProvider,
  ArcGisMapServerImageryProvider,
  BingMapsImageryProvider,
  TileMapServiceImageryProvider,
  IonImageryProvider,
  SingleTileImageryProvider,
  GoogleEarthEnterpriseImageryProvider,
  GoogleEarthEnterpriseMetadata,
  Rectangle,
} from "cesium";

// Extend ImageryLayer with custom metadata
interface ImageryLayerWithMeta extends ImageryLayer {
  _mcpName?: string;
}

class CesiumImageryManager implements ManagerInterface {
  public viewer: CesiumViewer;

  constructor(viewer: CesiumViewer) {
    this.viewer = viewer;
  }

  public setUp(): void {
    // No initialization needed
  }

  public shutdown(): void {
    // No cleanup needed
  }

  /**
   * Create an imagery provider based on provider type and parameters.
   * Some providers (ArcGIS, Bing, TMS, Ion, SingleTile) require async fromUrl factory.
   */
  private async createImageryProvider(
    cmd: MCPCommand,
  ): Promise<ImageryProvider | null> {
    const providerType = cmd.providerType as string;
    const url = cmd.url as string;
    const layers = cmd.layers as string | undefined;
    const style = cmd.style as string | undefined;
    const format = cmd.format as string | undefined;
    const tileMatrixSetID = cmd.tileMatrixSetID as string | undefined;
    const minimumLevel = cmd.minimumLevel as number | undefined;
    const maximumLevel = cmd.maximumLevel as number | undefined;
    const rectangle = cmd.rectangle as
      | { west: number; south: number; east: number; north: number }
      | undefined;

    const rect = rectangle
      ? Rectangle.fromDegrees(
          rectangle.west,
          rectangle.south,
          rectangle.east,
          rectangle.north,
        )
      : undefined;

    switch (providerType) {
      case "UrlTemplateImageryProvider":
        return new UrlTemplateImageryProvider({
          url,
          minimumLevel,
          maximumLevel,
          rectangle: rect,
        });

      case "WebMapServiceImageryProvider":
        return new WebMapServiceImageryProvider({
          url,
          layers: layers || "",
          parameters: {
            transparent: true,
            format: format || "image/png",
            styles: style || "",
          },
          rectangle: rect,
        });

      case "WebMapTileServiceImageryProvider":
        return new WebMapTileServiceImageryProvider({
          url,
          layer: layers || "",
          style: style || "default",
          format: format || "image/png",
          tileMatrixSetID: tileMatrixSetID || "default",
          rectangle: rect,
        });

      case "ArcGisMapServerImageryProvider":
        return await ArcGisMapServerImageryProvider.fromUrl(url, {
          rectangle: rect,
        });

      case "BingMapsImageryProvider":
        return await BingMapsImageryProvider.fromUrl(url, {
          key: (cmd.key as string) || "",
        });

      case "TileMapServiceImageryProvider":
        return await TileMapServiceImageryProvider.fromUrl(url, {
          minimumLevel,
          maximumLevel,
          rectangle: rect,
        });

      case "OpenStreetMapImageryProvider":
        return new OpenStreetMapImageryProvider({
          url: url || "https://tile.openstreetmap.org/",
        });

      case "IonImageryProvider":
        return await IonImageryProvider.fromAssetId(cmd.assetId as number);

      case "SingleTileImageryProvider":
        return await SingleTileImageryProvider.fromUrl(url, {
          rectangle: rect || Rectangle.MAX_VALUE,
        });

      case "GoogleEarthEnterpriseImageryProvider": {
        const metadata = await GoogleEarthEnterpriseMetadata.fromUrl(url);
        return GoogleEarthEnterpriseImageryProvider.fromMetadata(metadata, {});
      }

      default:
        return null;
    }
  }

  /**
   * Detect the provider type name from a Cesium ImageryProvider instance
   */
  private getProviderTypeName(provider: ImageryProvider): string {
    if (provider instanceof WebMapServiceImageryProvider) {
      return "WebMapServiceImageryProvider";
    }
    if (provider instanceof WebMapTileServiceImageryProvider) {
      return "WebMapTileServiceImageryProvider";
    }
    if (provider instanceof ArcGisMapServerImageryProvider) {
      return "ArcGisMapServerImageryProvider";
    }
    if (provider instanceof BingMapsImageryProvider) {
      return "BingMapsImageryProvider";
    }
    if (provider instanceof OpenStreetMapImageryProvider) {
      return "OpenStreetMapImageryProvider";
    }
    if (provider instanceof TileMapServiceImageryProvider) {
      return "TileMapServiceImageryProvider";
    }
    if (provider instanceof IonImageryProvider) {
      return "IonImageryProvider";
    }
    if (provider instanceof SingleTileImageryProvider) {
      return "SingleTileImageryProvider";
    }
    if (provider instanceof GoogleEarthEnterpriseImageryProvider) {
      return "GoogleEarthEnterpriseImageryProvider";
    }
    if (provider instanceof UrlTemplateImageryProvider) {
      return "UrlTemplateImageryProvider";
    }
    return "Unknown";
  }

  /**
   * Add an imagery layer
   */
  private async addImagery(cmd: MCPCommand): Promise<ImageryAddResult> {
    try {
      const provider = await this.createImageryProvider(cmd);
      if (!provider) {
        return {
          success: false,
          error: `Unsupported provider type: ${cmd.providerType}`,
        };
      }

      const layer = this.viewer.imageryLayers.addImageryProvider(
        provider,
      ) as ImageryLayerWithMeta;
      const name = (cmd.name as string) || (cmd.providerType as string);

      // Apply optional settings
      if (cmd.alpha !== undefined) {
        layer.alpha = cmd.alpha as number;
      }
      if (cmd.show !== undefined) {
        layer.show = cmd.show as boolean;
      }

      // Store name for later reference
      layer._mcpName = name;

      const layerIndex = this.viewer.imageryLayers.indexOf(layer);

      return {
        success: true,
        message: `Imagery layer '${name}' added successfully`,
        layerIndex,
        layerName: name,
        providerType: cmd.providerType as string,
        totalLayers: this.viewer.imageryLayers.length,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Remove imagery layer(s)
   */
  private removeImagery(cmd: MCPCommand): ImageryRemoveResult {
    try {
      const index = cmd.index as number | undefined;
      const name = cmd.name as string | undefined;
      const removeAll = cmd.removeAll as boolean | undefined;

      if (removeAll) {
        const count = this.viewer.imageryLayers.length;
        this.viewer.imageryLayers.removeAll();
        return {
          success: true,
          message: `Removed all ${count} imagery layers`,
          removedCount: count,
          totalLayers: 0,
        };
      }

      if (index !== undefined) {
        const layer = this.viewer.imageryLayers.get(
          index,
        ) as ImageryLayerWithMeta;
        if (!layer) {
          return {
            success: false,
            error: `No imagery layer at index ${index}`,
          };
        }
        const layerName = layer._mcpName || `Layer ${index}`;
        this.viewer.imageryLayers.remove(layer);
        return {
          success: true,
          message: `Imagery layer '${layerName}' at index ${index} removed`,
          removedIndex: index,
          removedName: layerName,
          totalLayers: this.viewer.imageryLayers.length,
        };
      }

      if (name) {
        for (let i = 0; i < this.viewer.imageryLayers.length; i++) {
          const layer = this.viewer.imageryLayers.get(
            i,
          ) as ImageryLayerWithMeta;
          if (layer._mcpName === name) {
            this.viewer.imageryLayers.remove(layer);
            return {
              success: true,
              message: `Imagery layer '${name}' removed`,
              removedIndex: i,
              removedName: name,
              totalLayers: this.viewer.imageryLayers.length,
            };
          }
        }
        return {
          success: false,
          error: `No imagery layer found with name '${name}'`,
        };
      }

      return {
        success: false,
        error:
          "Either index, name, or removeAll must be provided for imagery removal",
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * List all imagery layers
   */
  private listImagery(): ImageryListResult {
    try {
      const layers: ImageryLayerInfo[] = [];
      for (let i = 0; i < this.viewer.imageryLayers.length; i++) {
        const layer = this.viewer.imageryLayers.get(i) as ImageryLayerWithMeta;
        const name = layer._mcpName || `Layer ${i}`;

        const info: ImageryLayerInfo = {
          index: i,
          name,
          show: layer.show,
          alpha: layer.alpha,
          ready: layer.ready,
        };

        if (layer.imageryProvider) {
          info.providerType = this.getProviderTypeName(layer.imageryProvider);
          const provider = layer.imageryProvider as ImageryProvider & {
            url?: string;
          };
          if (provider.url) {
            info.url = provider.url;
          }
        }

        layers.push(info);
      }

      return {
        success: true,
        layers,
        totalCount: layers.length,
        message: `Found ${layers.length} imagery layer${layers.length === 1 ? "" : "s"}`,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        layers: [],
      };
    }
  }

  public getCommandHandlers(): Map<string, CommandHandler> {
    const handlers = new Map<string, CommandHandler>();

    handlers.set("imagery_add", async (cmd: MCPCommand) =>
      this.addImagery(cmd),
    );
    handlers.set("imagery_remove", (cmd: MCPCommand) =>
      this.removeImagery(cmd),
    );
    handlers.set("imagery_list", () => this.listImagery());

    return handlers;
  }
}

export default CesiumImageryManager;
