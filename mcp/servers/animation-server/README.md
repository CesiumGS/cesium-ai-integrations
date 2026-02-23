# 🎬 Cesium Animation MCP Server

MCP server for Cesium animation, path-based entity control, and clock management.

## ✨ Features

- **Custom Path Animation**: Animate 3D models along manually specified position samples with precise timing
- **Path Visualization**: Show leading/trailing path trails with configurable appearance
- **Camera Tracking**: Follow animated entities with the camera, or stop tracking to restore manual control
- **Clock Control**: Configure global animation clock, current time, and playback speed in one unified tool
- **Globe Lighting**: Realistic day/night cycles and globe lighting effects
- **Synchronized Clock**: All animations share the same timeline for coordinated movement
- **Default Models**: Built-in models for walking, driving, cycling, and flying
- **Flexible Control**: Play/pause and per-animation speed multiplier control
- **Multiple Interpolation Methods**: LINEAR, LAGRANGE, and HERMITE interpolation for smooth paths
- **Loop Modes**: Support for one-shot, loop, and ping-pong animations

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

### 1. `animation_create`

**Create an animated entity with custom position samples**

Creates a 3D model that moves along a path defined by explicit position samples with timestamps. Provides full control over interpolation, model appearance, path visualization, and playback.

**Input**:

- `positionSamples` _(required)_: Array of position samples, each with an ISO 8601 timestamp plus `longitude`, `latitude`, and optional `height`
- `name` (optional): Human-readable name for the animation
- `startTime` (optional): Animation start time (ISO 8601, defaults to first sample time)
- `stopTime` (optional): Animation stop time (ISO 8601, defaults to last sample time)
- `interpolationAlgorithm` (optional): `'LINEAR'`, `'LAGRANGE'`, or `'HERMITE'` (default: `'LAGRANGE'`)
- `showPath` (optional): Show path trail visualization (default: `true`)
- `modelPreset` (optional): `'cesium_man'`, `'car'`, `'bike'`, or `'airplane'` (default: `'cesium_man'`)
- `modelUri` (optional): Custom glTF/glb model URI (overrides preset)
- `modelScale` (optional): Model scale factor (default: `1`)
- `loopMode` (optional): `'none'`, `'loop'`, or `'pingpong'` (default: `'none'`)
- `clampToGround` (optional): Clamp entity to terrain (default: `false`)
- `speedMultiplier` (optional): Playback speed multiplier (0.1–100, default: `10`)
- `autoPlay` (optional): Start animation immediately after creation (default: `true`)
- `trackCamera` (optional): Automatically track entity with camera (default: `true`)

**Output**:

- Animation ID (for future control operations)
- Entity ID
- Start/stop times (ISO 8601)
- Statistics (response time)

---

### 2. `animation_control`

**Start or pause animation playback**

Controls playback of a specific animation. Use `'play'` to start or resume, `'pause'` to freeze.

**Input**:

- `animationId` _(required)_: ID of the animation to control
- `action` _(required)_: `'play'` or `'pause'`

**Output**:

- Success status
- Confirmation message
- Statistics

---

### 3. `animation_remove`

**Remove an animated entity**

Deletes an animated entity from the scene and removes it from the animation tracking system.

**Input**:

- `animationId` _(required)_: ID of the animation to remove

**Output**:

- Success status
- Confirmation message
- Statistics

---

### 4. `animation_list_active`

**List all active animations with their current states**

Retrieves information about all registered animations including playback status, progress, timing, and clock state. Takes no input.

**Output**:

- Array of animation states (ID, name, progress, isAnimating, start/stop times, loop mode, etc.)
- Current clock state (multiplier, time, clockRange)
- Statistics

---

### 5. `animation_update_path`

**Update path trail appearance for an animated entity**

Modifies the visual appearance of an animation's path trail without recreating the animation.

**Input**:

- `animationId` _(required)_: ID of the animation to update
- `leadTime` (optional): Seconds of path ahead of entity to show
- `trailTime` (optional): Seconds of path behind entity to show
- `width` (optional): Path line width in pixels
- `color` (optional): Path color as `{ red, green, blue, alpha }` (values 0–1)

**Output**:

- Success status
- Confirmation message
- Statistics

---

### 6. `animation_camera_tracking`

**Control camera tracking of an animated entity**

Makes the camera follow a specific animated entity or stops tracking to restore free camera control. Combines track and untrack into one tool via the `track` boolean.

**Input**:

- `animationId` _(required)_: ID of the animation to track or untrack
- `track` _(required)_: `true` to start tracking, `false` to stop tracking
- `range` (optional): Camera distance from entity in meters (default: `1000`)
- `pitch` (optional): Camera pitch angle in degrees (default: `-45`)
- `heading` (optional): Camera heading angle offset in degrees (default: `0`)

**Output**:

- Success status
- `isTracking` state
- Tracked animation ID (when tracking)
- Statistics

---

### 7. `clock_control`

**Configure the global animation clock**

Unified clock control tool. Use `action` to select the operation:

- `'configure'`: Full clock setup (start/stop times, multiplier, loop behavior)
- `'setTime'`: Jump to a specific time
- `'setMultiplier'`: Change playback speed

**Input**:

- `action` _(required)_: `'configure'` | `'setTime'` | `'setMultiplier'`
- `clock` (required for `'configure'`): Clock configuration object
  - `startTime` (optional): Clock start time as ISO 8601 string (e.g., `"2026-02-23T08:00:00Z"`)
  - `stopTime` (optional): Clock stop time as ISO 8601 string (e.g., `"2026-02-23T18:00:00Z"`)
  - `currentTime` (optional): Initial clock time as ISO 8601 string
  - `clockRange` (optional): `'UNBOUNDED'`, `'CLAMPED'`, or `'LOOP_STOP'`
  - `multiplier` (optional): Time rate multiplier (default: `1`)
  - `shouldAnimate` (optional): Whether clock should animate (default: `true`)
- `currentTime` (required for `'setTime'`): ISO 8601 string to jump to (e.g., `"2026-02-23T12:00:00Z"`)
- `multiplier` (required for `'setMultiplier'`): Time rate multiplier (e.g., `1000` for 1000× real time)

**Output**:

- Success status
- Confirmation message
- Statistics

---

### 8. `globe_set_lighting`

**Control globe lighting**

Enable or disable realistic globe lighting effects for day/night cycles.

**Input**:

- `enableLighting` _(required)_: Enable realistic lighting effects (boolean)
- `enableDynamicAtmosphere` (optional): Enable dynamic atmosphere lighting (default: `true`)
- `enableSunLighting` (optional): Enable sun-position lighting (default: `true`)

**Output**:

- Success status
- Lighting configuration
- Statistics

---

## 🌍 Example Workflow

```javascript
// 1. Create a Cesium Man animation from explicit position samples
const animation = await animation_create({
  positionSamples: [
    {
      time: "2026-01-01T00:00:00Z",
      longitude: 25.2797,
      latitude: 54.6872,
      height: 0,
    },
    {
      time: "2026-01-01T00:01:00Z",
      longitude: 25.2793,
      latitude: 54.6968,
      height: 0,
    },
  ],
  modelPreset: "cesium_man",
  speedMultiplier: 15,
  autoPlay: true,
  trackCamera: true,
});

// 2. Pause and then resume at 5x speed
await animation_control({
  animationId: animation.animationId,
  action: "pause",
});
await clock_control({ action: "setMultiplier", multiplier: 5 });
await animation_control({ animationId: animation.animationId, action: "play" });
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
├── index.ts                        # Server initialization with main() pattern
├── schemas.ts                       # Top-level schema re-exports
├── schemas/
│   ├── core-schemas.ts             # Reusable core types (positions, colors, dates)
│   ├── tool-schemas.ts             # Tool input schemas
│   ├── response-schemas.ts         # Tool output schemas
│   ├── unified-animation-schema.ts # Unified animation_create input schema
│   └── index.ts                    # Schema exports
├── tools/
│   ├── animation-create.ts         # animation_create
│   ├── animation-control.ts        # animation_control (play/pause)
│   ├── animation-remove.ts         # animation_remove
│   ├── animation-list-active.ts    # animation_list_active
│   ├── animation-update-path.ts    # animation_update_path
│   ├── animation-camera-tracking.ts# animation_camera_tracking
│   ├── clock-control.ts            # clock_control (configure/setTime/setMultiplier)
│   ├── globe-set-lighting.ts       # globe_set_lighting
│   └── index.ts                    # Tool registration
├── managers/                       # Animation state managers
└── utils/
    ├── animation-creator.ts        # Core animation creation logic
    ├── model-registry.ts           # Model preset resolution
    ├── constants.ts                # Constants and emojis
    ├── types.ts                    # Type definitions
    └── index.ts                    # Utility exports
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

## 💬 Example Test Queries

### Creating Animations

**Simple two-point path with Cesium Man:**

```
Create a Cesium Man animation walking between [40.7589, -73.9851] and [40.7614, -73.9776] over 2 minutes with camera tracking
```

**Airplane path with HERMITE interpolation:**

```
Create a custom airplane animation from coordinates [40.7589, -73.9851] to [40.7614, -73.9776] to [40.7580, -73.9855]
over 3 minutes using HERMITE interpolation
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
Pause the animation
```

```
Resume animation
```

**Change speed:**

```
Set animation speed to 50x
```

**List and monitor:**

```
Show me all active animations
```

```
What animations are currently playing?
```

### Camera Tracking

**Track a specific entity:**

```
Track the animation with the camera
```

```
Stop camera tracking and give me manual control
```

### Clock Management

**Configure animation clock:**

```
Set up the animation clock to run from 8 AM to 6 PM local time at 1000x speed
```

```
Configure the clock for a 24-hour day/night cycle starting now
```

**Set time or speed:**

```
Set the current animation time to noon
```

```
Change the clock multiplier to 500x
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
Make the path trail thicker and show more trail behind the entity
```

### Cleanup and Management

**Remove animations:**

```
Remove animation
```

```
Clear all active animations
```

## �🤝 Contributing

Interested in contributing? Please read [CONTRIBUTING.md](CONTRIBUTING.md). We also ask that you follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Apache 2.0. See [LICENSE](LICENSE).
