/**
 * Unit Tests for Imagery Manager MCP Communication
 * Tests request/response handling between imagery manager and MCP server
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import CesiumImageryManager from "../../src/managers/imagery-manager";
import type { CesiumViewer } from "../../src/types/cesium-types";
import type { MCPCommand } from "../../src/types/mcp";
import type {
  ImageryAddResult,
  ImageryRemoveResult,
  ImageryListResult,
} from "../../src/types/imagery-types";

// Mock Cesium module
vi.mock("cesium", () => {
  class MockImageryProvider {
    url?: string;
  }

  class MockUrlTemplateImageryProvider extends MockImageryProvider {
    constructor(options: { url: string }) {
      super();
      this.url = options.url;
    }
  }

  class MockWebMapServiceImageryProvider extends MockImageryProvider {
    constructor(options: { url: string }) {
      super();
      this.url = options.url;
    }
  }

  class MockWebMapTileServiceImageryProvider extends MockImageryProvider {
    constructor(options: { url: string }) {
      super();
      this.url = options.url;
    }
  }

  class MockOpenStreetMapImageryProvider extends MockImageryProvider {
    constructor(options?: { url?: string }) {
      super();
      this.url = options?.url || "https://tile.openstreetmap.org/";
    }
  }

  class MockArcGisMapServerImageryProvider extends MockImageryProvider {
    static async fromUrl(url: string) {
      const provider = new MockArcGisMapServerImageryProvider();
      provider.url = url;
      return provider;
    }
  }

  class MockBingMapsImageryProvider extends MockImageryProvider {
    static async fromUrl(url: string) {
      const provider = new MockBingMapsImageryProvider();
      provider.url = url;
      return provider;
    }
  }

  class MockTileMapServiceImageryProvider extends MockImageryProvider {
    static async fromUrl(url: string) {
      const provider = new MockTileMapServiceImageryProvider();
      provider.url = url;
      return provider;
    }
  }

  class MockIonImageryProvider extends MockImageryProvider {
    static async fromAssetId(assetId: number) {
      const provider = new MockIonImageryProvider();
      provider.url = `ion://asset/${assetId}`;
      return provider;
    }
  }

  class MockSingleTileImageryProvider extends MockImageryProvider {
    static async fromUrl(url: string) {
      const provider = new MockSingleTileImageryProvider();
      provider.url = url;
      return provider;
    }
  }

  class MockGoogleEarthEnterpriseImageryProvider extends MockImageryProvider {
    static fromMetadata(metadata: unknown) {
      const provider = new MockGoogleEarthEnterpriseImageryProvider();
      provider.url = (metadata as { url: string }).url;
      return provider;
    }
  }

  class MockGoogleEarthEnterpriseMetadata {
    url: string;
    constructor() {
      this.url = "";
    }
    static async fromUrl(url: string) {
      const metadata = new MockGoogleEarthEnterpriseMetadata();
      metadata.url = url;
      return metadata;
    }
  }

  return {
    ImageryProvider: MockImageryProvider,
    ImageryLayer: class {},
    UrlTemplateImageryProvider: MockUrlTemplateImageryProvider,
    WebMapServiceImageryProvider: MockWebMapServiceImageryProvider,
    WebMapTileServiceImageryProvider: MockWebMapTileServiceImageryProvider,
    OpenStreetMapImageryProvider: MockOpenStreetMapImageryProvider,
    ArcGisMapServerImageryProvider: MockArcGisMapServerImageryProvider,
    BingMapsImageryProvider: MockBingMapsImageryProvider,
    TileMapServiceImageryProvider: MockTileMapServiceImageryProvider,
    IonImageryProvider: MockIonImageryProvider,
    SingleTileImageryProvider: MockSingleTileImageryProvider,
    GoogleEarthEnterpriseImageryProvider:
      MockGoogleEarthEnterpriseImageryProvider,
    GoogleEarthEnterpriseMetadata: MockGoogleEarthEnterpriseMetadata,
    Rectangle: {
      fromDegrees: vi.fn(
        (west: number, south: number, east: number, north: number) => ({
          west,
          south,
          east,
          north,
        }),
      ),
      MAX_VALUE: { west: -180, south: -90, east: 180, north: 90 },
    },
  };
});

// Helper to create a mock imagery layer
function createMockLayer(
  options: {
    show?: boolean;
    alpha?: number;
    name?: string;
    imageryProvider?: { url?: string };
    ready?: boolean;
  } = {},
) {
  return {
    show: options.show ?? true,
    alpha: options.alpha ?? 1.0,
    _mcpName: options.name,
    imageryProvider: options.imageryProvider ?? null,
    ready: options.ready ?? true,
  };
}

describe("Imagery Manager MCP Communication Tests", () => {
  let imageryManager: CesiumImageryManager;
  let mockViewer: CesiumViewer;
  let commandHandlers: Map<string, (cmd: MCPCommand) => unknown>;
  let mockLayers: ReturnType<typeof createMockLayer>[];

  beforeEach(() => {
    mockLayers = [];

    mockViewer = {
      imageryLayers: {
        length: 0,
        addImageryProvider: vi.fn((provider: unknown) => {
          const layer = createMockLayer({
            imageryProvider: provider as { url?: string },
          });
          mockLayers.push(layer);
          (mockViewer.imageryLayers as { length: number }).length =
            mockLayers.length;
          return layer;
        }),
        get: vi.fn((index: number) => mockLayers[index] ?? null),
        remove: vi.fn((layer: unknown) => {
          const idx = mockLayers.indexOf(
            layer as ReturnType<typeof createMockLayer>,
          );
          if (idx >= 0) {
            mockLayers.splice(idx, 1);
            (mockViewer.imageryLayers as { length: number }).length =
              mockLayers.length;
            return true;
          }
          return false;
        }),
        removeAll: vi.fn(() => {
          mockLayers.length = 0;
          (mockViewer.imageryLayers as { length: number }).length = 0;
        }),
        indexOf: vi.fn((layer: unknown) =>
          mockLayers.indexOf(layer as ReturnType<typeof createMockLayer>),
        ),
      },
    } as unknown as CesiumViewer;

    imageryManager = new CesiumImageryManager(mockViewer);
    commandHandlers = imageryManager.getCommandHandlers();
  });

  describe("imagery_add", () => {
    it("should add a UrlTemplateImageryProvider layer", async () => {
      const command: MCPCommand = {
        type: "imagery_add",
        providerType: "UrlTemplateImageryProvider",
        url: "https://example.com/tiles/{z}/{x}/{y}.png",
        name: "Test Layer",
      };

      const handler = commandHandlers.get("imagery_add")!;
      const response = (await handler(command)) as ImageryAddResult;

      expect(response.success).toBe(true);
      expect(response.layerName).toBe("Test Layer");
      expect(response.providerType).toBe("UrlTemplateImageryProvider");
      expect(response.layerIndex).toBeDefined();
      expect(response.totalLayers).toBe(1);
    });

    it("should add an OpenStreetMapImageryProvider layer", async () => {
      const command: MCPCommand = {
        type: "imagery_add",
        providerType: "OpenStreetMapImageryProvider",
        url: "https://tile.openstreetmap.org/",
      };

      const handler = commandHandlers.get("imagery_add")!;
      const response = (await handler(command)) as ImageryAddResult;

      expect(response.success).toBe(true);
      expect(response.totalLayers).toBe(1);
    });

    it("should add a WebMapServiceImageryProvider layer", async () => {
      const command: MCPCommand = {
        type: "imagery_add",
        providerType: "WebMapServiceImageryProvider",
        url: "https://example.com/wms",
        layers: "layer1,layer2",
        style: "default",
        format: "image/png",
      };

      const handler = commandHandlers.get("imagery_add")!;
      const response = (await handler(command)) as ImageryAddResult;

      expect(response.success).toBe(true);
      expect(response.providerType).toBe("WebMapServiceImageryProvider");
    });

    it("should add a WebMapTileServiceImageryProvider layer", async () => {
      const command: MCPCommand = {
        type: "imagery_add",
        providerType: "WebMapTileServiceImageryProvider",
        url: "https://example.com/wmts",
        layers: "layer1",
        tileMatrixSetID: "default028mm",
      };

      const handler = commandHandlers.get("imagery_add")!;
      const response = (await handler(command)) as ImageryAddResult;

      expect(response.success).toBe(true);
      expect(response.providerType).toBe("WebMapTileServiceImageryProvider");
    });

    it("should add an ArcGisMapServerImageryProvider layer", async () => {
      const command: MCPCommand = {
        type: "imagery_add",
        providerType: "ArcGisMapServerImageryProvider",
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
      };

      const handler = commandHandlers.get("imagery_add")!;
      const response = (await handler(command)) as ImageryAddResult;

      expect(response.success).toBe(true);
      expect(response.providerType).toBe("ArcGisMapServerImageryProvider");
    });

    it("should add a BingMapsImageryProvider layer with key", async () => {
      const command: MCPCommand = {
        type: "imagery_add",
        providerType: "BingMapsImageryProvider",
        url: "https://dev.virtualearth.net",
        key: "test-bing-key",
      };

      const handler = commandHandlers.get("imagery_add")!;
      const response = (await handler(command)) as ImageryAddResult;

      expect(response.success).toBe(true);
      expect(response.providerType).toBe("BingMapsImageryProvider");
    });

    it("should add an IonImageryProvider layer with assetId", async () => {
      const command: MCPCommand = {
        type: "imagery_add",
        providerType: "IonImageryProvider",
        url: "",
        assetId: 3954,
      };

      const handler = commandHandlers.get("imagery_add")!;
      const response = (await handler(command)) as ImageryAddResult;

      expect(response.success).toBe(true);
      expect(response.providerType).toBe("IonImageryProvider");
    });

    it("should add a SingleTileImageryProvider layer", async () => {
      const command: MCPCommand = {
        type: "imagery_add",
        providerType: "SingleTileImageryProvider",
        url: "https://example.com/image.png",
      };

      const handler = commandHandlers.get("imagery_add")!;
      const response = (await handler(command)) as ImageryAddResult;

      expect(response.success).toBe(true);
      expect(response.providerType).toBe("SingleTileImageryProvider");
    });

    it("should add a GoogleEarthEnterpriseImageryProvider layer", async () => {
      const command: MCPCommand = {
        type: "imagery_add",
        providerType: "GoogleEarthEnterpriseImageryProvider",
        url: "https://earth.localdomain",
      };

      const handler = commandHandlers.get("imagery_add")!;
      const response = (await handler(command)) as ImageryAddResult;

      expect(response.success).toBe(true);
      expect(response.providerType).toBe(
        "GoogleEarthEnterpriseImageryProvider",
      );
    });

    it("should apply alpha and show settings", async () => {
      const command: MCPCommand = {
        type: "imagery_add",
        providerType: "UrlTemplateImageryProvider",
        url: "https://example.com/tiles/{z}/{x}/{y}.png",
        alpha: 0.5,
        show: false,
      };

      const handler = commandHandlers.get("imagery_add")!;
      const response = (await handler(command)) as ImageryAddResult;

      expect(response.success).toBe(true);
      expect(mockLayers[0].alpha).toBe(0.5);
      expect(mockLayers[0].show).toBe(false);
    });

    it("should use providerType as name when name is not provided", async () => {
      const command: MCPCommand = {
        type: "imagery_add",
        providerType: "UrlTemplateImageryProvider",
        url: "https://example.com/tiles/{z}/{x}/{y}.png",
      };

      const handler = commandHandlers.get("imagery_add")!;
      const response = (await handler(command)) as ImageryAddResult;

      expect(response.success).toBe(true);
      expect(response.layerName).toBe("UrlTemplateImageryProvider");
    });

    it("should return error for unsupported provider type", async () => {
      const command: MCPCommand = {
        type: "imagery_add",
        providerType: "UnsupportedProvider",
        url: "https://example.com",
      };

      const handler = commandHandlers.get("imagery_add")!;
      const response = (await handler(command)) as ImageryAddResult;

      expect(response.success).toBe(false);
      expect(response.error).toContain("Unsupported provider type");
    });

    it("should handle rectangle parameter", async () => {
      const command: MCPCommand = {
        type: "imagery_add",
        providerType: "UrlTemplateImageryProvider",
        url: "https://example.com/tiles/{z}/{x}/{y}.png",
        rectangle: { west: -120, south: 30, east: -100, north: 50 },
      };

      const handler = commandHandlers.get("imagery_add")!;
      const response = (await handler(command)) as ImageryAddResult;

      expect(response.success).toBe(true);
    });
  });

  describe("imagery_remove", () => {
    beforeEach(async () => {
      // Add two layers for removal tests
      const handler = commandHandlers.get("imagery_add")!;
      await handler({
        type: "imagery_add",
        providerType: "UrlTemplateImageryProvider",
        url: "https://example.com/1/{z}/{x}/{y}.png",
        name: "Layer A",
      } as MCPCommand);
      await handler({
        type: "imagery_add",
        providerType: "UrlTemplateImageryProvider",
        url: "https://example.com/2/{z}/{x}/{y}.png",
        name: "Layer B",
      } as MCPCommand);
    });

    it("should remove layer by index", () => {
      const command: MCPCommand = {
        type: "imagery_remove",
        index: 0,
      };

      const handler = commandHandlers.get("imagery_remove")!;
      const response = handler(command) as ImageryRemoveResult;

      expect(response.success).toBe(true);
      expect(response.removedIndex).toBe(0);
      expect(response.removedName).toBe("Layer A");
      expect(response.totalLayers).toBe(1);
    });

    it("should remove layer by name", () => {
      const command: MCPCommand = {
        type: "imagery_remove",
        name: "Layer B",
      };

      const handler = commandHandlers.get("imagery_remove")!;
      const response = handler(command) as ImageryRemoveResult;

      expect(response.success).toBe(true);
      expect(response.removedName).toBe("Layer B");
      expect(response.totalLayers).toBe(1);
    });

    it("should remove all layers", () => {
      const command: MCPCommand = {
        type: "imagery_remove",
        removeAll: true,
      };

      const handler = commandHandlers.get("imagery_remove")!;
      const response = handler(command) as ImageryRemoveResult;

      expect(response.success).toBe(true);
      expect(response.removedCount).toBe(2);
      expect(response.totalLayers).toBe(0);
    });

    it("should handle removeAll on empty collection", () => {
      // Remove all first to empty the collection
      const handler = commandHandlers.get("imagery_remove")!;
      handler({
        type: "imagery_remove",
        removeAll: true,
      } as MCPCommand);

      // Now removeAll on empty
      const response = handler({
        type: "imagery_remove",
        removeAll: true,
      } as MCPCommand) as ImageryRemoveResult;

      expect(response.success).toBe(true);
      expect(response.removedCount).toBe(0);
    });

    it("should return error for invalid index", () => {
      const command: MCPCommand = {
        type: "imagery_remove",
        index: 99,
      };

      const handler = commandHandlers.get("imagery_remove")!;
      const response = handler(command) as ImageryRemoveResult;

      expect(response.success).toBe(false);
      expect(response.error).toContain("No imagery layer at index");
    });

    it("should return error for non-existent name", () => {
      const command: MCPCommand = {
        type: "imagery_remove",
        name: "NonExistent",
      };

      const handler = commandHandlers.get("imagery_remove")!;
      const response = handler(command) as ImageryRemoveResult;

      expect(response.success).toBe(false);
      expect(response.error).toContain("No imagery layer found with name");
    });

    it("should return error when no removal criteria provided", () => {
      const command: MCPCommand = {
        type: "imagery_remove",
      };

      const handler = commandHandlers.get("imagery_remove")!;
      const response = handler(command) as ImageryRemoveResult;

      expect(response.success).toBe(false);
      expect(response.error).toContain(
        "Either index, name, or removeAll must be provided",
      );
    });
  });

  describe("imagery_list", () => {
    it("should list empty layers", () => {
      const handler = commandHandlers.get("imagery_list")!;
      const response = handler({
        type: "imagery_list",
      } as MCPCommand) as ImageryListResult;

      expect(response.success).toBe(true);
      expect(response.layers).toEqual([]);
      expect(response.totalCount).toBe(0);
    });

    it("should list layers after adding", async () => {
      const addHandler = commandHandlers.get("imagery_add")!;
      await addHandler({
        type: "imagery_add",
        providerType: "UrlTemplateImageryProvider",
        url: "https://example.com/tiles/{z}/{x}/{y}.png",
        name: "My Layer",
      } as MCPCommand);

      const listHandler = commandHandlers.get("imagery_list")!;
      const response = listHandler({
        type: "imagery_list",
      } as MCPCommand) as ImageryListResult;

      expect(response.success).toBe(true);
      expect(response.totalCount).toBe(1);
      expect(response.layers).toHaveLength(1);
      expect(response.layers![0].name).toBe("My Layer");
      expect(response.layers![0].index).toBe(0);
      expect(response.layers![0].show).toBe(true);
      expect(response.layers![0].alpha).toBe(1.0);
    });

    it("should include url and ready in layer info", async () => {
      const addHandler = commandHandlers.get("imagery_add")!;
      await addHandler({
        type: "imagery_add",
        providerType: "UrlTemplateImageryProvider",
        url: "https://example.com/tiles/{z}/{x}/{y}.png",
        name: "Test",
      } as MCPCommand);

      const listHandler = commandHandlers.get("imagery_list")!;
      const response = listHandler({
        type: "imagery_list",
      } as MCPCommand) as ImageryListResult;

      expect(response.success).toBe(true);
      expect(response.layers![0].ready).toBeDefined();
      expect(response.layers![0].url).toBe(
        "https://example.com/tiles/{z}/{x}/{y}.png",
      );
    });

    it("should list multiple layers with correct indices", async () => {
      const addHandler = commandHandlers.get("imagery_add")!;
      await addHandler({
        type: "imagery_add",
        providerType: "UrlTemplateImageryProvider",
        url: "https://a.com",
        name: "First",
      } as MCPCommand);
      await addHandler({
        type: "imagery_add",
        providerType: "OpenStreetMapImageryProvider",
        url: "https://b.com",
        name: "Second",
      } as MCPCommand);

      const listHandler = commandHandlers.get("imagery_list")!;
      const response = listHandler({
        type: "imagery_list",
      } as MCPCommand) as ImageryListResult;

      expect(response.success).toBe(true);
      expect(response.totalCount).toBe(2);
      expect(response.layers![0].name).toBe("First");
      expect(response.layers![1].name).toBe("Second");
    });
  });

  describe("command handler registration", () => {
    it("should register all three command handlers", () => {
      expect(commandHandlers.has("imagery_add")).toBe(true);
      expect(commandHandlers.has("imagery_remove")).toBe(true);
      expect(commandHandlers.has("imagery_list")).toBe(true);
      expect(commandHandlers.size).toBe(3);
    });
  });
});
