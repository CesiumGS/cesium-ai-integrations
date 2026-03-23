# 🗺️ Cesium Imagery MCP Server

MCP server for managing imagery layers on CesiumJS 3D globe applications.

## ✨ Features

- **Multiple Provider Types**: Support for URL templates, WMS, WMTS, ArcGIS, Bing Maps, TMS, OpenStreetMap, Cesium Ion, and single tile providers
- **Layer Management**: Add, remove, and list imagery layers dynamically
- **Opacity & Visibility**: Control layer transparency and visibility
- **Geographic Extent**: Restrict imagery layers to specific geographic rectangles
- **Batch Operations**: Remove all non-base imagery layers at once

## 📦 Installation

```bash
pnpm install
pnpm run build
```

## 🚀 Running the Server

```bash
pnpm run dev    # Development mode with auto-reload
pnpm start      # Production mode
```

The server will start on port 3005 with WebSocket transport.

## 🛠️ Tools

### 1. `imagery_add`

**Add a new imagery layer to the globe**

Supports various imagery provider types for overlaying map tiles, satellite imagery, or custom tile services.

**Supported Provider Types:**

- `UrlTemplateImageryProvider` — Custom URL template tiles
- `WebMapServiceImageryProvider` — OGC WMS services
- `WebMapTileServiceImageryProvider` — OGC WMTS services
- `ArcGisMapServerImageryProvider` — ArcGIS MapServer
- `BingMapsImageryProvider` — Bing Maps tiles
- `TileMapServiceImageryProvider` — TMS tile services
- `OpenStreetMapImageryProvider` — OpenStreetMap tiles
- `IonImageryProvider` — Cesium Ion assets
- `SingleTileImageryProvider` — Single image overlay
- `GoogleEarthEnterpriseImageryProvider` — Google Earth Enterprise

**Input:**

- `type` (required): Type of imagery provider to create
- `url` (required): URL of the imagery service or tile template
- `name` (optional): Display name for the imagery layer
- `layers` (optional): Comma-separated layer names (for WMS/WMTS providers)
- `style` (optional): Style name (for WMS/WMTS providers)
- `format` (optional): Image format, e.g. `image/png` (for WMS/WMTS providers)
- `tileMatrixSetID` (optional): Tile matrix set identifier (for WMTS providers)
- `maximumLevel` (optional): Maximum zoom level (0–30)
- `minimumLevel` (optional): Minimum zoom level (0–30)
- `assetId` (optional): Cesium Ion asset ID (required for `IonImageryProvider`)
- `key` (optional): API key (required for `BingMapsImageryProvider`)
- `alpha` (optional): Layer opacity (0 = transparent, 1 = opaque)
- `show` (optional): Whether the layer is visible (default: true)
- `rectangle` (optional): Geographic extent to restrict the imagery layer (`west`, `south`, `east`, `north` in degrees)

**Output:**

- Layer index, name, provider type
- Total layer count and response time

---

### 2. `imagery_remove`

**Remove an imagery layer from the globe**

Remove a single layer by index or name, or remove all non-base imagery layers at once.

**Input:**

- `index` (optional): Index of the imagery layer to remove
- `name` (optional): Name of the imagery layer to remove
- `removeAll` (optional): Remove all non-base imagery layers

**Output:**

- Removed layer index, name, and count
- Response time

---

### 3. `imagery_list`

**List all imagery layers on the globe**

Get a summary of all imagery layers including their indices, names, visibility, opacity, and provider types.

**Input:**

- `includeDetails` (optional): Include detailed provider information

**Output:**

- Array of imagery layers with index, name, visibility, alpha, and provider type
- Total layer count and response time

---

## 🔌 Using with AI Clients

The imagery server works with any MCP-compatible client: **Cline**, **Github Copilot** (VS Code), **Claude Desktop**, or other MCP clients.

### Example: Configure with Cline

Add to your Cline MCP settings:

```json
{
  "mcpServers": {
    "cesium-imagery-server": {
      "command": "node",
      "args": [
        "{YOUR_WORKSPACE}/cesium-ai-integrations/mcp/cesium-js/servers/imagery-server/build/index.js"
      ],
      "env": {
        "PORT": "3005",
        "COMMUNICATION_PROTOCOL": "websocket"
      }
    }
  }
}
```

> **Note:** Replace `{YOUR_WORKSPACE}` with the absolute path to your local clone.

## 🧪 Example Test Queries

Try these natural language queries with your AI client:

### Adding Imagery

```
"Add an OpenStreetMap imagery layer"
"Add a WMS layer from this URL with layer name 'elevation'"
"Overlay a satellite imagery from ArcGIS MapServer"
```

### Managing Layers

```
"List all imagery layers on the globe"
"Remove the imagery layer at index 2"
"Remove all imagery layers"
```

### Advanced Usage

```
"Add a WMTS layer with 50% opacity restricted to North America"
"Add a custom tile URL template as a semi-transparent overlay"
```

## ⚙️ Configuration

Environment variables:

- `PORT` or `IMAGERY_SERVER_PORT`: Server port (default: 3005)
- `COMMUNICATION_PROTOCOL`: `websocket` or `sse` (default: `websocket`)
- `MAX_RETRIES`: Maximum retry attempts for port binding (default: 10)
- `STRICT_PORT`: If `true`, fail if exact port unavailable (default: false)
- `MCP_TRANSPORT`: `stdio` or `streamable-http` (default: `stdio`)

## 🤝 Contributing

Interested in contributing? Please read [CONTRIBUTING.md](CONTRIBUTING.md). We also ask that you follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Apache 2.0. See [LICENSE](LICENSE).
