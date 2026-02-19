# 🌍 Cesium Entity MCP Server

MCP server for creating and managing 3D entities (points, billboards, labels, models, polygons, polylines) on the CesiumJS globe.

<video src="https://github.com/user-attachments/assets/1b72b095-4b74-49b4-b959-a83f8136ace0" controls></video>

## ✨ Features

- **Point Entities**: Colored point markers with size control
- **Billboards**: Image/icon markers with pixel offset and sizing
- **Text Labels**: 3D text labels with font, color, and outline styling
- **3D Models**: GLTF/GLB model placement with scale and orientation
- **Polygons**: Area visualization with fill and outline styling
- **Polylines**: Path/line rendering with width and color
- **Box Entities**: 3D boxes for buildings, containers, or volumetric data
- **Corridor Entities**: Paths with width for roads, pipelines, or routes
- **Cylinder Entities**: Cylinders and cones for towers or pillars
- **Ellipse Entities**: Circular areas for zones or coverage regions
- **Rectangle Entities**: Geographic rectangles for regions or bounding boxes
- **Wall Entities**: Vertical walls for barriers or fences
- **Entity Management**: List and remove entities by ID

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

The server will start on port 3003 with WebSocket transport by default.

## 🛠️ Tools

### 1. `entity_add_point`

**Add a point marker entity**

Creates a colored point entity at the specified location.

**Capabilities:**

- Custom color (CSS color names or hex codes)
- Configurable point size in pixels
- Height/altitude positioning
- Optional description metadata

**Input:**

- `id`: Unique identifier for the entity
- `position`: Location (longitude, latitude, height)
- `color` (optional): Point color (default: 'yellow')
- `pixelSize` (optional): Size in pixels (default: 10)
- `description` (optional): Metadata text

**Output:**

- Entity ID
- Position coordinates
- Applied styling

**Example:**

```javascript
await entity_add_point({
  id: "marker1",
  position: { longitude: -122.4, latitude: 37.8, height: 0 },
  color: "#FF6B6B",
  pixelSize: 15,
});
```

---

### 2. `entity_add_billboard`

**Add an image/icon billboard**

Places a 2D image that always faces the camera (billboard behavior).

**Capabilities:**

- Custom image URL support
- Pixel offset for precise positioning
- Width/height control
- Auto-scaling and rotation
- Always faces camera

**Input:**

- `id`: Unique identifier
- `position`: Location (longitude, latitude, height)
- `image`: Image URL (can be data URI or external URL)
- `pixelOffset` (optional): Pixel offset (x, y)
- `width` (optional): Image width in pixels
- `height` (optional): Image height in pixels
- `description` (optional): Metadata text

**Output:**

- Entity ID
- Image URL
- Position and offset

**Example:**

```javascript
await entity_add_billboard({
  id: "icon1",
  position: { longitude: 2.35, latitude: 48.86, height: 100 },
  image: "https://example.com/marker.png",
  width: 32,
  height: 32,
});
```

---

### 3. `entity_add_label`

**Add a text label**

Creates 3D text label that can face the camera or have fixed orientation.

**Capabilities:**

- Custom text content
- Font family and size control
- Fill and outline colors
- Outline width adjustment
- Pixel offset positioning
- Auto-scaling and rotation

**Input:**

- `id`: Unique identifier
- `position`: Location (longitude, latitude, height)
- `text`: Label text content
- `font` (optional): CSS font string (e.g., '24px sans-serif')
- `fillColor` (optional): Text color (default: 'white')
- `outlineColor` (optional): Outline color (default: 'black')
- `outlineWidth` (optional): Outline thickness in pixels (default: 2)
- `pixelOffset` (optional): Pixel offset (x, y)
- `description` (optional): Metadata text

**Output:**

- Entity ID
- Label text
- Applied styling

**Example:**

```javascript
await entity_add_label({
  id: "label1",
  position: { longitude: -74.0, latitude: 40.7, height: 500 },
  text: "New York City",
  font: "32px Helvetica",
  fillColor: "#FFFFFF",
  outlineColor: "#000000",
  outlineWidth: 3,
});
```

---

### 4. `entity_add_model`

**Add a 3D model (GLTF/GLB)**

Places a 3D model on the globe with position, scale, and orientation control.

**Capabilities:**

- GLTF/GLB format support
- Scale multiplier (uniform scaling)
- Full 3D orientation (heading, pitch, roll)
- Minimum pixel size for visibility
- Run model animations automatically
- Height clamping options

**Input:**

- `id`: Unique identifier
- `position`: Location (longitude, latitude, height)
- `uri`: Model file URL (.gltf or .glb) - **MUST be a valid URL; ask the user for their model URL or use publicly available models**
- `scale` (optional): Size multiplier (default: 1.0)
- `heading` (optional): Rotation around Z-axis in degrees
- `pitch` (optional): Rotation around Y-axis in degrees
- `roll` (optional): Rotation around X-axis in degrees
- `minimumPixelSize` (optional): Minimum size in pixels (default: 64)
- `description` (optional): Metadata text

**Output:**

- Entity ID
- Model URI
- Position and orientation

**Example:**

```javascript
// Using a publicly available Cesium sample model
await entity_add_model({
  id: "cesium-air",
  position: { longitude: -122.4, latitude: 37.8, height: 1000 },
  model: {
    uri: "https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/SampleData/models/CesiumAir/Cesium_Air.glb",
    scale: 2.0,
    minimumPixelSize: 128,
  },
  name: "Cesium Air Plane",
});

// Using Cesium Man character model
await entity_add_model({
  id: "character",
  position: { longitude: 139.69, latitude: 35.65, height: 0 },
  model: {
    uri: "https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/SampleData/models/CesiumMan/Cesium_Man.glb",
  },
  orientation: {
    heading: 0.785, // 45 degrees in radians
    pitch: 0,
    roll: 0,
  },
  name: "Walking Character",
});
```

**Available Public Models:**

- Cesium Air: `https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/SampleData/models/CesiumAir/Cesium_Air.glb`
- Cesium Man: `https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/SampleData/models/CesiumMan/Cesium_Man.glb`
- Cesium Milk Truck: `https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/SampleData/models/CesiumMilkTruck/CesiumMilkTruck.glb`
- Ground Vehicle: `https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/SampleData/models/GroundVehicle/GroundVehicle.glb`

**Important:** Always use a valid model URL. If you don't have a model URL, ask the user to provide one or use one of the public models listed above.

---

### 5. `entity_add_polygon`

**Add a polygon area**

Creates a filled polygon with optional outline, useful for boundaries, zones, or regions.

**Capabilities:**

- Multi-point polygon definition
- Fill color and opacity
- Outline color and width
- Height/altitude positioning
- Extruded 3D volumes (building footprints)
- Ground clamping

**Input:**

- `id`: Unique identifier
- `positions`: Array of corner positions [{longitude, latitude, height}, ...]
- `material` (optional): Fill color (default: 'rgba(255, 255, 0, 0.5)')
- `outlineColor` (optional): Outline color (default: 'black')
- `outlineWidth` (optional): Outline thickness in pixels (default: 2)
- `height` (optional): Polygon altitude in meters
- `extrudedHeight` (optional): Extrusion height for 3D volume
- `description` (optional): Metadata text

**Output:**

- Entity ID
- Number of vertices
- Applied styling

**Example:**

```javascript
await entity_add_polygon({
  id: "zone1",
  positions: [
    { longitude: -122.4, latitude: 37.8, height: 0 },
    { longitude: -122.3, latitude: 37.8, height: 0 },
    { longitude: -122.3, latitude: 37.7, height: 0 },
    { longitude: -122.4, latitude: 37.7, height: 0 },
  ],
  material: "rgba(0, 255, 0, 0.3)",
  outlineColor: "#00FF00",
  extrudedHeight: 500,
});
```

---

### 6. `entity_add_polyline`

**Add a polyline path**

Creates a line connecting multiple points, useful for routes, boundaries, or paths.

**Capabilities:**

- Multi-point path definition
- Line width control
- Color customization
- Glow/outline effects
- Ground clamping or altitude following
- Arrow/directional indicators

**Input:**

- `id`: Unique identifier
- `positions`: Array of path positions [{longitude, latitude, height}, ...]
- `width` (optional): Line width in pixels (default: 3)
- `material` (optional): Line color (default: 'yellow')
- `clampToGround` (optional): Follow terrain (default: false)
- `description` (optional): Metadata text

**Output:**

- Entity ID
- Number of path points
- Applied styling

**Example:**

```javascript
await entity_add_polyline({
  id: "route1",
  positions: [
    { longitude: -122.4, latitude: 37.8, height: 100 },
    { longitude: -122.3, latitude: 37.75, height: 150 },
    { longitude: -122.2, latitude: 37.7, height: 100 },
  ],
  width: 5,
  material: "#FF0000",
  clampToGround: false,
});
```

---

### 7. `entity_add_box`

**Add a 3D box entity**

Creates a box entity with customizable dimensions, useful for representing buildings, containers, or volumetric data.

**Capabilities:**

- Custom dimensions (length, width, height)
- Fill color and outline styling
- Orientation control (heading, pitch, roll)
- Height positioning
- Optional extrusion

**Input:**

- `id` (optional): Unique identifier for the entity
- `position`: Location (longitude, latitude, height)
- `box`: Box properties
  - `dimensions`: Box size (x, y, z in meters)
  - `material` (optional): Fill color
  - `outline` (optional): Show outline (default: false)
  - `outlineColor` (optional): Outline color
- `orientation` (optional): Heading, pitch, roll in degrees
- `name` (optional): Display name
- `description` (optional): Metadata text

**Output:**

- Entity ID
- Position coordinates
- Applied styling
  14
  **Example:**

```javascript
await entity_add_box({
  position: { longitude: -122.4, latitude: 37.8, height: 0 },
  box: {
    dimensions: { x: 100, y: 50, z: 200 },
    material: "#0000FF",
    outline: true,
    outlineColor: "#000000",
  },
  orientation: { heading: 45, pitch: 0, roll: 0 },
  name: "Building",
});
```

---

### 8. `entity_add_corridor`

**Add a corridor path entity**

Creates a corridor along a path with specified width, useful for roads, pipelines, routes, or paths.

**Capabilities:**

- Multi-point path definition
- Customizable width
- Fill color and outline styling
- Corner type control (rounded, mitered, beveled)
- Height/altitude positioning
- Extrusion for 3D volume

**Input:**

- `id` (optional): Unique identifier
- `corridor`: Corridor properties
  - `positions`: Array of path positions [{longitude, latitude, height}, ...]
  - `width`: Corridor width in meters
  - `material` (optional): Fill color
  - `outline` (optional): Show outline
  - `outlineColor` (optional): Outline color
  - `cornerType` (optional): Corner style
  - `height` (optional): Corridor altitude
  - `extrudedHeight` (optional): Extrusion height
- `name` (optional): Display name
- `description` (optional): Metadata text

**Output:**

- Entity ID
- Number of path positions
- Center position

**Example:**

```javascript
await entity_add_corridor({
  corridor: {
    positions: [
      { longitude: -122.4, latitude: 37.8, height: 0 },
      { longitude: -122.39, latitude: 37.79, height: 0 },
      { longitude: -122.38, latitude: 37.78, height: 0 },
    ],
    width: 50,
    material: "#FF6600",
    outline: true,
  },
  name: "Highway Route",
});
```

---

### 9. `entity_add_cylinder`

**Add a cylinder entity**

Creates a cylinder or cone entity, useful for towers, pillars, or volumetric structures.

**Capabilities:**

- Customizable length (height)
- Top and bottom radius (cone if different)
- Fill color and outline styling
- Orientation control
- Height positioning

**Input:**

- `id` (optional): Unique identifier
- `position`: Location (longitude, latitude, height)
- `cylinder`: Cylinder properties
  - `length`: Height of cylinder in meters
  - `topRadius`: Radius at top in meters
  - `bottomRadius`: Radius at bottom in meters
  - `material` (optional): Fill color
  - `outline` (optional): Show outline
  - `outlineColor` (optional): Outline color
- `orientation` (optional): Heading, pitch, roll in degrees
- `name` (optional): Display name
- `description` (optional): Metadata text

**Output:**

- Entity ID
- Position coordinates
- Applied styling

**Example:**

```javascript
await entity_add_cylinder({
  position: { longitude: 139.69, latitude: 35.65, height: 0 },
  cylinder: {
    length: 333,
    topRadius: 10,
    bottomRadius: 20,
    material: "#FF0000",
    outline: true,
  },
  name: "Tower",
});
```

---

### 10. `entity_add_ellipse`

**Add an ellipse entity**

Creates an ellipse for representing circular areas, zones, or coverage regions.

**Capabilities:**

- Semi-major and semi-minor axes
- Rotation control
- Fill color and outline styling
- Height positioning
- Extrusion for 3D volume
- Number of vertices control

**Input:**

- `id` (optional): Unique identifier
- `position`: Center location (longitude, latitude, height)
- `ellipse`: Ellipse properties
  - `semiMajorAxis`: Semi-major axis length in meters
  - `semiMinorAxis`: Semi-minor axis length in meters
  - `material` (optional): Fill color
  - `outline` (optional): Show outline
  - `outlineColor` (optional): Outline color
  - `rotation` (optional): Rotation in radians
  - `height` (optional): Ellipse altitude
  - `extrudedHeight` (optional): Extrusion height
- `name` (optional): Display name
- `description` (optional): Metadata text

**Output:**

- Entity ID
- Position coordinates
- Applied styling

**Example:**

```javascript
await entity_add_ellipse({
  position: { longitude: -74.0, latitude: 40.7, height: 0 },
  ellipse: {
    semiMajorAxis: 500,
    semiMinorAxis: 300,
    material: "rgba(0, 255, 0, 0.3)",
    outline: true,
    rotation: 0.785398, // 45 degrees
  },
  name: "Coverage Zone",
});
```

---

### 11. `entity_add_rectangle`

**Add a rectangle entity**

Creates a rectangle defined by geographic bounds, useful for regions, bounding boxes, or areas of interest.

**Capabilities:**

- Geographic bounds (north, south, east, west)
- Fill color and outline styling
- Height positioning
- Extrusion for 3D volume
- Rotation control

**Input:**

- `id` (optional): Unique identifier
- `rectangle`: Rectangle properties
  - `coordinates`: Geographic bounds
    - `north`: North latitude in degrees
    - `south`: South latitude in degrees
    - `east`: East longitude in degrees
    - `west`: West longitude in degrees
  - `material` (optional): Fill color
  - `outline` (optional): Show outline
  - `outlineColor` (optional): Outline color
  - `height` (optional): Rectangle altitude
  - `extrudedHeight` (optional): Extrusion height
- `name` (optional): Display name
- `description` (optional): Metadata text

**Output:**

- Entity ID
- Center position
- Applied styling

**Example:**

```javascript
await entity_add_rectangle({
  rectangle: {
    coordinates: {
      north: 37.9,
      south: 37.7,
      east: -122.3,
      west: -122.5,
    },
    material: "rgba(255, 0, 0, 0.3)",
    outline: true,
    extrudedHeight: 100,
  },
  name: "Region of Interest",
});
```

---

### 12. `entity_add_wall`

**Add a wall entity**

Creates a vertical wall from a series of positions, useful for barriers, fences, or vertical structures.

**Capabilities:**

- Multi-point path definition
- Variable heights along the wall
- Fill color and outline styling
- Minimum and maximum heights
- Ground clamping options

**Input:**

- `id` (optional): Unique identifier
- `wall`: Wall properties
  - `positions`: Array of path positions [{longitude, latitude, height}, ...]
  - `minimumHeights` (optional): Array of minimum heights for each position
  - `maximumHeights`: Array of maximum heights for each position
  - `material` (optional): Fill color
  - `outline` (optional): Show outline
  - `outlineColor` (optional): Outline color
- `name` (optional): Display name
- `description` (optional): Metadata text

**Output:**

- Entity ID
- Number of positions
- Center position

**Example:**

```javascript
await entity_add_wall({
  wall: {
    positions: [
      { longitude: -122.4, latitude: 37.8, height: 0 },
      { longitude: -122.39, latitude: 37.79, height: 0 },
      { longitude: -122.38, latitude: 37.78, height: 0 },
    ],
    maximumHeights: [10, 15, 10],
    material: "#8B4513",
    outline: true,
  },
  name: "Barrier Wall",
});
```

---

### 13. `entity_list`

**List all entities**

Retrieves information about all entities currently in the Cesium viewer.

**Capabilities:**

- Complete entity inventory
- Type identification (point, billboard, label, model, polygon, polyline)
- Position data for each entity
- Entity count statistics

**Input:** None

**Output:**

- `entities`: Array of entity objects with:
  - `id`: Entity identifier
  - `type`: Entity type
  - `position`: Location coordinates (if applicable)
- `count`: Total number of entities

**Example:**

```javascript
const result = await entity_list();
// Returns: { entities: [{id: 'marker1', type: 'point', position: {...}}, ...], count: 5 }
```

---

### 8. `entity_remove`

**Remove an entity by ID**

Deletes a specific entity from the viewer.

**Capabilities:**

- Remove by unique ID
- Automatic cleanup of all entity graphics
- Returns removed entity details for confirmation

**Input:**

- `id`: Entity identifier to remove

**Output:**

- `success`: Boolean indicating removal status
- `id`: Removed entity ID
- `message`: Confirmation or error message

**Example:**

```javascript
await entity_remove({ id: "marker1" });
// Returns: { success: true, id: 'marker1', message: 'Entity removed successfully' }
```

---

## 🔌 Using with AI Clients

The entity server works with any MCP-compatible client: **Cline**, **Github Copilot** (VS Code), **Claude Desktop**, or other MCP clients.

### Example: Configure with Cline

**Step 1: Install Cline**

Install the [Cline extension](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev) from VS Code marketplace.

**Step 2: Configure MCP Server**

Add to your Cline MCP settings (`~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` or via Cline settings UI):

> **Note:** For Github Copilot or Claude Desktop, use similar configuration in their respective MCP settings files.

```json
{
  "mcpServers": {
    "cesium-entity-server": {
      "command": "node",
      "args": [
        "{YOUR_WORKSPACE}/cesium-ai-integrations/mcp/servers/entity-server/build/index.js"
      ],
      "env": {
        "PORT": "3003",
        "COMMUNICATION_PROTOCOL": "websocket" // "sse"
      }
    }
  }
}
```

**Step 3: Start the Visual Client (Optional but Recommended)**

To see entities in real-time 3D:

```bash
# Configure environment
cd PoC/CesiumJs/web-app
cp .env.example .env
# Edit .env and add your Cesium Ion token from https://ion.cesium.com/tokens

# Start the web client
pnpm start
```

Open http://localhost:8080 to view the 3D globe. The status panel will show the entity server connection.

**Step 4: Use Cline**

Open Cline in VS Code and use natural language commands (see example queries below). The entity server tools will be available automatically.

## 🧪 Example Queries

Try these simple commands with your AI client:

### Getting Started

```
"Add a red point"
"Add a label that says Hello"
"Show me all entities"
"Remove the point"
```

### Points and Labels

```
"Add a yellow point at the Eiffel Tower"
"Create a blue point at Mount Fuji with size 20"
"Add a label saying Big Ben at the Big Ben location"
"Add a white label that says Tokyo Tower above the Tokyo Tower with a black outline"
```

### Billboards and Models

```
"Add a billboard with Cesium logo https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/Sandcastle/images/cesium-logomark-192.png at the Statue of Liberty"
"Place a facility marker https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/Sandcastle/images/facility.gif at the Sydney Opera House"
"Add the Cesium Air plane model https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/SampleData/models/CesiumAir/Cesium_Air.glb at the Space Needle in Seattle"
"Load the Cesium Man model from https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/SampleData/models/CesiumMan/Cesium_Man.glb at Times Square and scale it to 2x"
```

### Lines and Areas

```
"Draw a red line from New York to London"
"Create a green polygon around the Colosseum"
"Add a yellow polyline connecting Tokyo, Sydney, and Los Angeles"
"Draw a blue rectangle around Central Park"
"Create a purple rectangular region over Manhattan"
"Draw a green circle around the Golden Gate Bridge"
"Add a yellow ellipse at the White House with 1000m by 500m size"
```

### 3D Shapes

```
"Add a blue box at the Empire State Building"
"Create a red cylinder at the CN Tower"
```

### Corridors and Walls

```
"Create a corridor from San Francisco to Los Angeles with 50 meter width"
"Add an orange corridor for a pipeline from Dubai to Abu Dhabi"
"Create a 200-meter tall red wall from Times Square to the Empire State Building"
"Draw a 500-meter wall barrier around the Pentagon"
```

### Managing Entities

```
"List all entities"
"Remove entity with ID point1"
"Show what's on the globe"
```

## 🏗️ Architecture

- **Server**: Registers MCP tools, exposes WebSocket/SSE endpoint on port 3003
- **Browser Manager**: Creates and manages Cesium Entity objects
- **Entity Types**: Supports all major Cesium entity graphics types (Point, Billboard, Label, Model, Polygon, Polyline, Box, Corridor, Cylinder, Ellipse, Rectangle, Wall)
- **Color Parsing**: Handles CSS colors, hex codes, and rgba strings
- **Coordinate System**: Uses WGS84 cartographic coordinates (longitude, latitude, height)

## ⚙️ Configuration

### Web Client Configuration

Add to your `.env` file in `PoC/CesiumJs/web-app`:

```bash
CESIUM_ACCESS_TOKEN=your_token_here
MCP_PROTOCOL=websocket
MCP_ENTITY_PORT=3003
```

### Server Configuration

Environment variables for the entity server:

- `PORT` or `ENTITY_SERVER_PORT`: Override default server port (default: 3003)
- `COMMUNICATION_PROTOCOL`: Choose 'sse' or 'websocket' (default: 'websocket')
- `MAX_RETRIES`: Maximum retry attempts for port binding (default: 10)
- `STRICT_PORT`: If 'true', fail if exact port unavailable (default: false)

## 🤝 Contributing

Interested in contributing? Please read [CONTRIBUTING.md](../../CONTRIBUTING.md). We also ask that you follow the [Code of Conduct](../../CODE_OF_CONDUCT.md).

## License

Apache 2.0. See [LICENSE](../../LICENSE).
