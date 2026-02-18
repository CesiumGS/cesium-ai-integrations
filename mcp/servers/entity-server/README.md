# Cesium Entity MCP Server

MCP server for creating and managing 3D entities (points, billboards, labels, models, polygons, polylines) on the CesiumJS globe.

## Features

- **Point Entities**: Colored point markers with size control
- **Billboards**: Image/icon markers with pixel offset and sizing
- **Text Labels**: 3D text labels with font, color, and outline styling
- **3D Models**: GLTF/GLB model placement with scale and orientation
- **Polygons**: Area visualization with fill and outline styling
- **Polylines**: Path/line rendering with width and color
- **Entity Management**: List and remove entities by ID

## Installation

```bash
npm install
npm run build
```

## Running the Server

```bash
npm run dev    # Development mode with auto-reload
npm start      # Production mode
```

The server will start on port 3004 with SSE transport.

## Tools

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
  id: 'marker1',
  position: { longitude: -122.4, latitude: 37.8, height: 0 },
  color: '#FF6B6B',
  pixelSize: 15
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
  id: 'icon1',
  position: { longitude: 2.35, latitude: 48.86, height: 100 },
  image: 'https://example.com/marker.png',
  width: 32,
  height: 32
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
  id: 'label1',
  position: { longitude: -74.0, latitude: 40.7, height: 500 },
  text: 'New York City',
  font: '32px Helvetica',
  fillColor: '#FFFFFF',
  outlineColor: '#000000',
  outlineWidth: 3
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
- `uri`: Model file URL (.gltf or .glb)
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
await entity_add_model({
  id: 'building1',
  position: { longitude: 139.69, latitude: 35.65, height: 0 },
  uri: '/models/tokyo-tower.glb',
  scale: 2.0,
  heading: 45,
  minimumPixelSize: 128
});
```

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
  id: 'zone1',
  positions: [
    { longitude: -122.4, latitude: 37.8, height: 0 },
    { longitude: -122.3, latitude: 37.8, height: 0 },
    { longitude: -122.3, latitude: 37.7, height: 0 },
    { longitude: -122.4, latitude: 37.7, height: 0 }
  ],
  material: 'rgba(0, 255, 0, 0.3)',
  outlineColor: '#00FF00',
  extrudedHeight: 500
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
  id: 'route1',
  positions: [
    { longitude: -122.4, latitude: 37.8, height: 100 },
    { longitude: -122.3, latitude: 37.75, height: 150 },
    { longitude: -122.2, latitude: 37.7, height: 100 }
  ],
  width: 5,
  material: '#FF0000',
  clampToGround: false
});
```

---

### 7. `entity_list`
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
await entity_remove({ id: 'marker1' });
// Returns: { success: true, id: 'marker1', message: 'Entity removed successfully' }
```

---

## Integration Examples

### Visualize Multiple Locations
```javascript
// Add points of interest
await entity_add_point({
  id: 'poi1',
  position: { longitude: -122.4, latitude: 37.8, height: 0 },
  color: '#FF6B6B',
  pixelSize: 12
});

await entity_add_label({
  id: 'label1',
  position: { longitude: -122.4, latitude: 37.8, height: 100 },
  text: 'Golden Gate Bridge',
  font: '24px sans-serif'
});
```

### Display 3D Building
```javascript
await entity_add_model({
  id: 'building1',
  position: { longitude: -73.9, latitude: 40.7, height: 0 },
  uri: '/models/skyscraper.glb',
  scale: 1.5,
  heading: 0,
  minimumPixelSize: 100
});
```

### Show Geographic Boundary
```javascript
await entity_add_polygon({
  id: 'district1',
  positions: [
    { longitude: -122.5, latitude: 37.9, height: 0 },
    { longitude: -122.3, latitude: 37.9, height: 0 },
    { longitude: -122.3, latitude: 37.7, height: 0 },
    { longitude: -122.5, latitude: 37.7, height: 0 }
  ],
  material: 'rgba(100, 150, 255, 0.4)',
  outlineColor: '#0066FF',
  outlineWidth: 3
});
```

### Draw Route Path
```javascript
await entity_add_polyline({
  id: 'flight_path',
  positions: routeCoordinates,  // Array of {longitude, latitude, height}
  width: 4,
  material: '#00FFFF'
});
```

## Architecture

- **Server**: Registers MCP tools, exposes SSE endpoint on port 3004
- **Browser Manager**: Creates and manages Cesium Entity objects
- **Entity Types**: Supports all major Cesium entity graphics types
- **Color Parsing**: Handles CSS colors, hex codes, and rgba strings

## Configuration

Add to your `config.local.js`:

```javascript
MCP_SERVERS: [
  { name: 'Entity Server', port: 3004, capabilities: ['entity-management', '3d-objects'] }
]
```

## Environment Variables

- `SSE_PORT`: Override default SSE server port (default: 3004)
