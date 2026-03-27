# 🌍 Cesium 3D Tiles MCP Server

MCP server for managing 3D Tiles tilesets in CesiumJS scene applications.

## ✨ Features

- **Multiple Source Types**: Load tilesets from Cesium Ion assets and direct URLs
- **Tileset Management**: Add, remove, list, and style 3D tilesets dynamically
- **ID-based Tracking**: Each tileset receives a unique ID for reliable removal
- **Visibility Control**: Set tileset visibility on load
- **Batch Operations**: Remove all loaded tilesets at once
- **3D Tiles Styling**: Apply color and show conditions using the 3D Tiles Styling specification

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

The server will start on port 3006 with WebSocket transport.

## 🛠️ Tools

### 1. `tileset_add`

**Add a 3D tileset to the Cesium scene**

Supports two source types for flexible tileset loading.

**Source Types:**

| `type` | Required parameter | Description                         |
| ------ | ------------------ | ----------------------------------- |
| `ion`  | `assetId`          | Generic Cesium Ion 3D Tiles asset   |
| `url`  | `url`              | Direct URL to a `tileset.json` file |

**Input:**

- `type` (required): Source type — `"ion"` or `"url"`
- `assetId` (required for `ion`): Cesium Ion asset ID
- `url` (required for `url`): URL of the `tileset.json`
- `name` (optional): Display name used for listing and removal by name
- `show` (optional): Visibility on load (default: `true`)

**Output:**

- `tilesetId`: Unique ID for use with `tileset_remove`
- Name, source type, total tileset count, and response time

---

### 2. `tileset_remove`

**Remove a 3D tileset from the scene**

**Input:**

- `tilesetId` (optional): ID returned by `tileset_add` — preferred removal method
- `name` (optional): Display name of the tileset to remove
- `removeAll` (optional): Remove all loaded tilesets at once

**Output:**

- Removed tileset ID, name, and count

---

### 3. `tileset_list`

**List all 3D tilesets currently in the scene**

**Input:**

- `includeDetails` (optional): Include full source metadata for each tileset

**Output:**

- Array of tilesets with `tilesetId`, `name`, `sourceType`, `show`, and source parameters
- Total count and response time

---

### 4. `tileset_style`

**Apply or update 3D Tiles styling on a loaded tileset**

Targets a tileset by `tilesetId` or `name`. Style expressions follow the [3D Tiles Styling specification](https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling).

**Input:**

- `tilesetId` (optional): ID returned by `tileset_add` — preferred targeting method
- `name` (optional): Display name of the tileset to style
- `color` (optional): A single color expression string (e.g. `"color('red')"`)
- `colorConditions` (optional): Array of `[condition, color]` pairs for conditional coloring
- `show` (optional): Boolean or expression string controlling feature visibility
- `showConditions` (optional): Array of `[condition, show]` pairs for conditional visibility

> Either `tilesetId` or `name` must be provided. At least one style property must be specified.

**Output:**

- `tilesetId`, `name`, and `appliedStyle` (the style properties that were applied)

---

## 🔌 Using with AI Clients

### Example: Configure with Cline

```json
{
  "mcpServers": {
    "cesium-tiles-server": {
      "command": "node",
      "args": [
        "{YOUR_WORKSPACE}/cesium-ai-integrations/mcp/cesium-js/servers/tiles-server/build/index.js"
      ],
      "env": {
        "PORT": "3006",
        "COMMUNICATION_PROTOCOL": "websocket"
      }
    }
  }
}
```

> **Note:** Replace `{YOUR_WORKSPACE}` with the absolute path to your local clone.

## 🧪 Example Test Queries

```
"Add the Cesium OSM Buildings tileset"
"Load a 3D tileset from this URL: https://example.com/tileset/tileset.json"
"List all 3D tilesets in the scene"
"Remove the tileset named 'Cesium OSM Buildings'"
"Remove all loaded tilesets"
"Color the OSM Buildings tileset red"
"Style buildings taller than 100m blue, everything else white"
"Hide all features shorter than 10 meters in the Buildings tileset"
```

## ⚙️ Configuration

Environment variables:

- `PORT` or `TILES_SERVER_PORT`: Server port (default: 3006)
- `COMMUNICATION_PROTOCOL`: `websocket` or `sse` (default: `websocket`)
- `MAX_RETRIES`: Maximum retry attempts for port binding (default: 10)
- `STRICT_PORT`: If `true`, fail if exact port unavailable (default: false)
- `MCP_TRANSPORT`: `stdio` or `streamable-http` (default: `stdio`)

## 🤝 Contributing

Interested in contributing? Please read [CONTRIBUTING.md](CONTRIBUTING.md). We also ask that you follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Apache 2.0. See [LICENSE](LICENSE).
