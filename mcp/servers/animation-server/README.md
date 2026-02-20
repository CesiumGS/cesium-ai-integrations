# 🎬 Cesium Animation MCP Server

MCP server for Cesium animation, path-based entity control, and clock management.

## ✨ Features

- **Route Animation**: Animate 3D models (Cesium Man, cars, bikes, airplanes) along routes from geolocation server
- **Path Visualization**: Show leading/trailing path trails with configurable appearance
- **Camera Tracking**: Follow animated entities with the camera
- **Clock Control**: Configure global animation clock, time settings, and playback speed
- **Globe Lighting**: Realistic day/night cycles and globe lighting effects
- **Timeline Management**: Zoom and control timeline visualization
- **Synchronized Clock**: All animations share the same timeline for coordinated movement
- **Default Models**: Built-in models for walking, driving, cycling, and flying
- **Flexible Control**: Play, pause, speed control for all animations
- **Multiple Interpolation Methods**: LINEAR, LAGRANGE, and HERMITE interpolation for smooth paths
- **Loop Modes**: Support for one-shot, loop, and ping-pong animations
- **Smart Route Processing**: Auto-decimation of large routes to prevent memory issues

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

The server will start on port 3004 with WebSocket transport (SSE also supported).

## 🛠️ Tools

### 1. `animation_create_from_route`

**Create animated entity from geolocation route**

Automatically creates an animated 3D model that follows a route obtained from the geolocation server. The model type is automatically selected based on the travel mode.

**Capabilities:**

- Automatic model selection (walking → Cesium Man, driving → car, cycling → bike, flying → airplane)
- Support for multiple route formats (polyline arrays, legs with steps, simple start/end)
- Configurable speed multipliers (0.1-100x)
- Smart coordinate decimation for large routes (prevents memory issues)
- Optional path trail visualization
- Camera tracking integration

**Input**:

- `route`: Route object from geolocation_route tool (supports polyline, legs, or simple start/end)
- `speedMultiplier` (optional): Playback speed multiplier (0.1-100, default: 10)
- `modelPreset` (optional): 'cesium_man', 'car', 'bike', 'airplane', or 'auto' (default: 'auto')
- `showPath` (optional): Show path trail (default: true)
- `name` (optional): Human-readable entity name
- `entityId` (optional): Custom entity ID (auto-generated if not provided)
- `autoPlay` (optional): Start animation immediately (default: true)
- `trackCamera` (optional): Automatically track entity with camera (default: false)

**Output**:

- Animation ID (for future control operations)
- Entity ID (for camera tracking and identification)
- Start/stop times (ISO 8601 format)
- Model preset used
- Statistics (response time, sample count)

---

### 2. `animation_create_custom_path`

**Create animation with custom position samples and explicit timing**

Allows full control over animation path with manually specified position samples and timing information.

**Capabilities:**

- Complete control over position and timing
- Support for LINEAR, LAGRANGE, and HERMITE interpolation
- Custom 3D model configuration
- Path visualization with customizable appearance
- Loop modes (none, loop, ping-pong)
- Terrain clamping option

**Input**:

- `positionSamples`: Array of position samples with ISO 8601 timestamps
- `interpolationAlgorithm` (optional): 'LINEAR', 'LAGRANGE', or 'HERMITE' (default: 'LAGRANGE')
- `model` (optional): Model configuration (preset or custom URI)
- `pathConfig` (optional): Path graphics configuration
- `loopMode` (optional): 'none', 'loop', or 'pingpong' (default: 'none')
- `autoOrient` (optional): Face direction of travel (default: true)
- `clampToGround` (optional): Clamp to terrain (default: false)

**Output**:

- Animation ID
- Entity ID
- Start/stop times
- Statistics

---

### 3. `animation_play`

**Start animation playback**

Starts the global clock to animate all entities.

---

### 4. `animation_pause`

**Pause animation playback**

Pauses the global clock, freezing all animations at their current positions.

---

### 5. `animation_remove`

**Remove animated entity**

Deletes an animated entity from the scene and removes it from the animation tracking system.

---

### 6. `animation_list_active`

**List all active animations with their current states**

Retrieves information about all registered animations including their playback status, progress, and configuration.

---

### 7. `animation_configure_path`

**Update path graphics appearance for an animated entity**

Modifies the visual appearance of an animation's path trail without recreating the animation.

---

### 8. `animation_track_entity`

**Set camera to track animated entity**

Locks the camera to follow a specific animated entity, maintaining a fixed distance and viewing angle.

---

### 9. `animation_untrack_camera`

**Stop camera tracking and restore free camera control**

Releases the camera from tracking mode, allowing manual control.

---

### 10. `clock_configure`

**Configure Animation Clock**

Set up the global animation clock with start time, stop time, and animation settings.

**Input**:

- `clock`: Clock configuration object
  - `startTime`: Julian date for clock start
  - `stopTime`: Julian date for clock stop
  - `currentTime`: Julian date for current time
  - `clockRange`: Clock behavior at boundaries ('UNBOUNDED', 'CLAMPED', 'LOOP_STOP')
  - `clockStep` (optional): Clock step mode (default: 'SYSTEM_CLOCK_MULTIPLIER')
  - `multiplier` (optional): Time rate multiplier (default: 1)
  - `shouldAnimate` (optional): Whether clock should animate (default: true)

**Output**:

- Success status
- Configured clock state
- Statistics

---

### 11. `clock_set_time`

**Set Clock Time**

Set the current time of the animation clock.

**Input**:

- `currentTime`: Julian date for the new current time

**Output**:

- Success status
- Confirmation message
- Statistics

---

### 12. `timeline_zoom_to_range`

**Zoom Timeline to Range**

Zoom the timeline to display a specific time range.

**Input**:

- `startTime`: Julian date for range start
- `stopTime`: Julian date for range stop

**Output**:

- Success status
- Confirmation message
- Statistics

---

### 13. `globe_set_lighting`

**Control Globe Lighting**

Enable or disable realistic globe lighting effects for day/night cycles.

**Input**:

- `enableLighting`: Enable realistic lighting effects (boolean)
- `enableDynamicAtmosphere` (optional): Enable dynamic atmosphere lighting (default: true)
- `enableSunLighting` (optional): Enable lighting from sun position (default: true)

**Output**:

- Success status
- Lighting configuration
- Statistics

---

### 14. `clock_set_multiplier`

**Set Clock Multiplier**

Change the time rate multiplier for speeding up or slowing down time.

**Input**:

- `multiplier`: Time rate multiplier (e.g., 1000 for 1000x real time)

**Output**:

- Success status
- Confirmation message
- Statistics

---

## 🌍 Integration with Geolocation

```javascript
// Example workflow:
// 1. Get route from geolocation server
const route = await geolocation_route({
  origin: { latitude: 54.6872, longitude: 25.2797 },
  destination: { latitude: 54.6968, longitude: 25.2793 },
  travelMode: 'walking'
});

// 2. Animate Cesium Man walking the route
const animation = await animation_create_from_route({
  route: route,
  speedMultiplier: 15,
  autoPlay: true,
  trackCamera: true
});
```

## 🎨 Default Models

- **Walking** (`cesium_man`): Cesium Man character
- **Driving** (`car`): Car model
- **Cycling** (`bike`): Bicycle model
- **Flying** (`airplane`): Airplane model

## 🏗️ Architecture

### Directory Structure

```
src/
├── index.ts                # Server initialization with main() pattern
├── schemas/
│   ├── core-schemas.ts     # Reusable core types
│   ├── tool-schemas.ts     # Tool input schemas
│   ├── response-schemas.ts # Tool output schemas
│   └── index.ts            # Schema exports
├── tools/
│   ├── animation-tools.ts  # Animation tool implementations
│   └── index.ts            # Tool registration
└── utils/
    ├── constants.ts        # Constants and emojis
    ├── utils.ts            # Helper functions
    ├── types.ts            # Type definitions
    └── index.ts            # Utility exports
```

### Key Components

- **Schema Organization**: Zod schemas split into core, tool, and response files
- **Utility Functions**: Reusable helpers for timing, error formatting, and response building
- **Browser Communication**: Commands sent via WebSocket/SSE to browser client
- **Shared Clock**: Single clock controls all animations for synchronized playback

## 🔧 Configuration

Environment variables:

- `PORT` or `ANIMATION_SERVER_PORT`: Server port (default: 3004)
- `COMMUNICATION_PROTOCOL`: 'websocket' or 'sse' (default: 'websocket')
- `MAX_RETRIES`: Connection retry attempts (default: 10)
- `STRICT_PORT`: Require exact port or fail (default: false)

## 📚 Related Resources

- [Camera Server](../camera-server/README.md) - Reference implementation
- [Shared Package](../shared/README.md) - Base classes and utilities

## � Example Test Queries

### Basic Route Animation

**Create walking animation from a route:**
```
Create a walking animation from Vilnius Old Town to Gediminas Tower with camera tracking
```

**Create driving animation with custom speed:**
```
Animate a car driving from Times Square to Central Park at 20x speed with a path trail
```

**Create cycling animation:**
```
Show a bike route from Golden Gate Bridge to Fisherman's Wharf and animate it at 15x speed
```

### Custom Path Animations

**Simple custom path with specific points:**
```
Create a custom animation path from coordinates [40.7589, -73.9851] to [40.7614, -73.9776] to [40.7580, -73.9855] 
over 2 minutes using HERMITE interpolation with the airplane model
```

**Looping animation:**
```
Create a looping circular flight path around the Eiffel Tower at 100 meters altitude
```

**Ping-pong animation:**
```
Create a ping-pong animation of Cesium Man walking back and forth between two points
```

### Animation Playback Control

**Control playback:**
```
Pause all animations
```
```
Resume animations at 5x speed
```
```
Set animation speed to 50x
```

**List and monitor:**
```
Show me all active animations and their current states
```
```
What animations are currently playing?
```

### Camera Tracking

**Track specific entities:**
```
Track the car animation with the camera
```
```
Follow the animated airplane
```
```
Stop camera tracking and give me manual control
```

### Clock and Timeline Management

**Configure animation clock:**
```
Set up the animation clock to run from 8 AM to 6 PM local time at 1000x speed
```
```
Configure the clock for a 24-hour day/night cycle starting now
```

**Timeline control:**
```
Zoom the timeline to show the next hour
```
```
Set the current animation time to noon
```

### Visual Effects

**Globe lighting:**
```
Enable realistic globe lighting with day/night cycles
```
```
Turn off sun lighting but keep dynamic atmosphere
```

**Path appearance:**
```
Change the animation path color to red with 80% opacity
```
```
Make the path trail thicker and show 200 meters behind the entity
```
```
Update the path to show both leading and trailing lines
```

### Advanced Use Cases

**Multi-step workflow:**
```
1. Get a driving route from San Francisco Airport to Silicon Valley
2. Create a car animation along that route at 25x speed
3. Enable camera tracking
4. Turn on globe lighting for realistic effects
```

**Synchronized animations:**
```
Create three different animations: a walker, a cyclist, and a driver all starting from different 
points in Paris but all heading to the Eiffel Tower. Start them all at the same time.
```

**Route comparison:**
```
Show me two different routes from Boston to Harvard - one driving and one walking. 
Animate both simultaneously so I can compare travel times.
```

### Cleanup and Management

**Remove animations:**
```
Remove the walking animation
```
```
Delete all car animations
```
```
Clear all active animations
```

**Check status:**
```
How many animations are currently active?
```
```
Are any animations currently playing?
```

### Troubleshooting Queries

**Check animation state:**
```
Why isn't my animation moving?
```
```
Is the clock running?
```
```
What's the current animation speed multiplier?
```

## �🤝 Contributing

Interested in contributing? Please read [CONTRIBUTING.md](CONTRIBUTING.md). We also ask that you follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Apache 2.0. See [LICENSE](LICENSE).

