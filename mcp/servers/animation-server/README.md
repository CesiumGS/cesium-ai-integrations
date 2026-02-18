# Cesium Animation MCP Server

MCP server for Cesium animation and path-based entity control with route integration.

## Features

- **Route Animation**: Animate 3D models (Cesium Man, cars, bikes) along routes from geolocation server
- **Path Visualization**: Show leading/trailing path trails with configurable appearance
- **Camera Tracking**: Follow animated entities with the camera
- **Synchronized Clock**: All animations share the same timeline for coordinated movement
- **Default Models**: Built-in models for walking, driving, and cycling
- **Flexible Control**: Play, pause, speed control for all animations

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

The server will start on port 3006 with SSE transport.

## Tools

### 1. `animation_create_from_route`

Create animated entity from geolocation route.

**Input**:

- `route`: Route object with positions array and duration
- `travelMode`: 'walking', 'driving', 'cycling', 'transit'
- `modelUri` (optional): Custom model URI (defaults based on travel mode)
- `showPath` (optional): Show path trail (default: true)
- `autoOrient` (optional): Face direction of travel (default: true)

**Output**: Animated entity ID

### 2. `animation_create_custom_path`

Create animation with custom position samples and explicit timing.

### 3. `animation_play`

Start animation playback (all entities via shared clock).

### 4. `animation_pause`

Pause animation playback.

### 5. `animation_update_speed`

Change animation playback speed (clock multiplier).

### 6. `animation_remove`

Remove animated entity.

### 7. `animation_list_active`

List all active animations with their current states.

### 8. `animation_configure_path`

Update path graphics appearance for an animated entity.

### 9. `animation_track_entity`

Set camera to track animated entity.

### 10. `animation_untrack_camera`

Stop camera tracking and restore free camera control.

## Integration with Geolocation

```javascript
// Example workflow:
// 1. Get route from geolocation server
const route = await geolocation_route({
  origin: { latitude: 54.6872, longitude: 25.2797 },
  destination: { latitude: 54.6968, longitude: 25.2793 },
  travelMode: "walking",
});

// 2. Animate Cesium Man walking the route
const animation = await animation_create_from_route({
  route: route,
  travelMode: "walking", // Auto-selects Cesium Man model
});

// 3. Track with camera
await animation_track_entity({ entityId: animation.entityId });

// 4. Play animation
await animation_play();
```

## Default Models

- **Walking**: Cesium Man (built-in glTF)
- **Driving**: Simple car model (`/models/car.glb`)
- **Cycling**: Simple bike model (`/models/bike.glb`)

## Configuration

Add to your `config.local.js`:

```javascript
MCP_SERVERS: [
  // ... other servers
  {
    name: "Animation Server",
    port: 3006,
    capabilities: ["animation", "camera-tracking"],
  },
];
```

## Architecture

- **Server**: Registers MCP tools, exposes SSE endpoint on port 3006
- **Browser Manager**: Handles animation commands, manages Cesium entities with SampledPositionProperty
- **Shared Clock**: Single `viewer.clock` controls all animations for synchronized playback
- **Path Graphics**: Configurable trail visualization with lead/trail times
