# Cesium Clock MCP Server

MCP server for animation timeline and clock control in CesiumJS applications.

## Features

- **Clock Configuration**: Set time bounds, multiplier, and animation mode
- **Time Control**: Set current simulation time
- **Speed Control**: Adjust animation speed (slow motion, time-lapse, reverse)
- **Timeline Zooming**: Focus timeline on specific date ranges
- **Globe Lighting**: Toggle sun-based lighting effects

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

The server will start on port 3003 with SSE transport.

## Tools

### 1. `clock_configure`
**Configure clock settings**

Sets up the animation clock with time bounds, playback mode, and speed.

**Capabilities:**
- Set start/stop/current time
- Configure animation looping behavior
- Adjust playback speed multiplier
- Control clock range (UNBOUNDED, CLAMPED, LOOP_STOP)
- Enable/disable clock for time-dependent visualizations

**Input:**
- `startTime` (optional): Animation start time (ISO 8601 format)
- `stopTime` (optional): Animation end time (ISO 8601 format)
- `currentTime` (optional): Current simulation time (ISO 8601 format)
- `multiplier` (optional): Time speed (1.0 = real-time, 2.0 = 2x speed, -1.0 = reverse, default: 1.0)
- `shouldAnimate` (optional): Auto-play animation (default: true)
- `clockRange` (optional): Behavior at time bounds:
  - `UNBOUNDED`: No limits
  - `CLAMPED`: Stop at bounds
  - `LOOP_STOP`: Loop back to start (default)

**Output:**
- Applied clock configuration
- Current, start, and stop times
- Multiplier and animation state

**Example:**
```javascript
await clock_configure({
  startTime: '2024-01-01T00:00:00Z',
  stopTime: '2024-12-31T23:59:59Z',
  currentTime: '2024-06-15T12:00:00Z',
  multiplier: 10.0,
  shouldAnimate: true,
  clockRange: 'LOOP_STOP'
});
```

---

### 2. `clock_set_time`
**Set current simulation time**

Directly sets the clock's current time without changing other settings.

**Capabilities:**
- Jump to specific date/time
- Useful for time-based data visualization
- Maintains current multiplier and animation state
- Instant time positioning (no animation)

**Input:**
- `time`: Target time (ISO 8601 format, e.g., '2024-06-15T14:30:00Z')

**Output:**
- New current time
- Confirmation message

**Example:**
```javascript
await clock_set_time({
  time: '2024-07-04T20:00:00Z'
});
```

---

### 3. `clock_set_multiplier`
**Set time speed multiplier**

Adjusts the animation playback speed without changing the current time.

**Capabilities:**
- Speed up time (values > 1.0)
- Slow motion (values between 0 and 1.0)
- Reverse time (negative values)
- Real-time playback (1.0)
- Common presets: 0.1x, 0.5x, 1x, 2x, 5x, 10x, 60x (1 min/sec), 3600x (1 hour/sec)

**Input:**
- `multiplier`: Time speed multiplier (range: -100.0 to 100.0, default: 1.0)
  - `1.0` = real-time
  - `2.0` = double speed
  - `0.5` = half speed (slow motion)
  - `-1.0` = reverse at real-time
  - `60.0` = 1 minute per second
  - `3600.0` = 1 hour per second

**Output:**
- Applied multiplier value
- Confirmation message

**Example:**
```javascript
// Time-lapse: 1 hour per second
await clock_set_multiplier({ multiplier: 3600 });

// Slow motion
await clock_set_multiplier({ multiplier: 0.1 });

// Reverse playback
await clock_set_multiplier({ multiplier: -1.0 });
```

---

### 4. `timeline_zoom_to_range`
**Zoom timeline to specific date range**

Adjusts the timeline widget's visible range to focus on a specific time period.

**Capabilities:**
- Focus on specific date range in timeline UI
- Useful for historical data analysis
- Event-focused visualization
- Multi-scale time exploration (hours, days, months, years)

**Input:**
- `startTime`: Range start time (ISO 8601 format)
- `stopTime`: Range end time (ISO 8601 format)

**Output:**
- Applied timeline range
- Start and stop times

**Example:**
```javascript
// Focus on summer 2024
await timeline_zoom_to_range({
  startTime: '2024-06-01T00:00:00Z',
  stopTime: '2024-08-31T23:59:59Z'
});

// Focus on single day
await timeline_zoom_to_range({
  startTime: '2024-07-04T00:00:00Z',
  stopTime: '2024-07-04T23:59:59Z'
});
```

---

### 5. `globe_set_lighting`
**Enable/disable sun-based lighting**

Toggles realistic sun-based lighting and shadows on the globe based on the current time.

**Capabilities:**
- Realistic day/night visualization
- Dynamic shadows based on sun position
- Time-of-day lighting effects
- Atmospheric scattering
- Useful for sunrise/sunset visualizations and solar analysis

**Input:**
- `enabled`: Enable (true) or disable (false) globe lighting

**Output:**
- Lighting state (enabled/disabled)
- Confirmation message

**Example:**
```javascript
// Enable realistic lighting
await globe_set_lighting({ enabled: true });

// Disable for better visibility
await globe_set_lighting({ enabled: false });
```

---

## Integration Examples

### Historical Event Visualization
```javascript
// Configure clock for WWII timeline
await clock_configure({
  startTime: '1939-09-01T00:00:00Z',
  stopTime: '1945-05-08T23:59:59Z',
  currentTime: '1941-12-07T12:00:00Z',
  multiplier: 86400,  // 1 day per second
  shouldAnimate: true,
  clockRange: 'CLAMPED'
});

// Enable lighting to show time of day
await globe_set_lighting({ enabled: true });
```

### Weather Pattern Animation
```javascript
// Set up 7-day forecast animation
await clock_configure({
  startTime: '2024-11-20T00:00:00Z',
  stopTime: '2024-11-27T23:59:59Z',
  currentTime: '2024-11-20T00:00:00Z',
  multiplier: 3600,  // 1 hour per second
  shouldAnimate: true,
  clockRange: 'LOOP_STOP'
});

await timeline_zoom_to_range({
  startTime: '2024-11-20T00:00:00Z',
  stopTime: '2024-11-27T23:59:59Z'
});
```

### Satellite Orbit Simulation
```javascript
// Real-time satellite tracking
await clock_configure({
  currentTime: new Date().toISOString(),
  multiplier: 1.0,  // Real-time
  shouldAnimate: true,
  clockRange: 'UNBOUNDED'
});

// Speed up to see full orbit
await clock_set_multiplier({ multiplier: 100 });
```

### Solar Analysis
```javascript
// Analyze sunlight throughout a day
await clock_configure({
  startTime: '2024-06-21T00:00:00Z',  // Summer solstice
  stopTime: '2024-06-21T23:59:59Z',
  currentTime: '2024-06-21T06:00:00Z',
  multiplier: 360,  // 6 minutes per second
  shouldAnimate: true,
  clockRange: 'LOOP_STOP'
});

await globe_set_lighting({ enabled: true });

await timeline_zoom_to_range({
  startTime: '2024-06-21T00:00:00Z',
  stopTime: '2024-06-21T23:59:59Z'
});
```

### Replay Mode
```javascript
// Jump to specific moment
await clock_set_time({ time: '2024-07-04T16:30:00Z' });

// Slow motion playback
await clock_set_multiplier({ multiplier: 0.25 });
```

## Common Multiplier Values

| Multiplier | Description | Use Case |
|------------|-------------|----------|
| -10.0 | 10x reverse | Rewind animation quickly |
| -1.0 | Reverse real-time | Go back in time |
| 0.1 | 10% speed (slow motion) | Detailed analysis |
| 0.5 | Half speed | Slow viewing |
| 1.0 | Real-time | Live tracking |
| 2.0 | Double speed | Faster preview |
| 10.0 | 10x speed | Quick overview |
| 60.0 | 1 minute/second | Hour-scale events |
| 3600.0 | 1 hour/second | Day-scale events |
| 86400.0 | 1 day/second | Week/month scale |

## Architecture

- **Server**: Registers MCP tools, exposes SSE endpoint on port 3003
- **Browser Manager**: Controls Cesium Clock and Timeline widgets
- **Time Handling**: Parses ISO 8601 timestamps and converts to JulianDate
- **Clock Modes**: Supports UNBOUNDED, CLAMPED, and LOOP_STOP behaviors

## Configuration

Add to your `config.local.js`:

```javascript
MCP_SERVERS: [
  { name: 'Clock Server', port: 3003, capabilities: ['time-control', 'animation'] }
]
```

## Environment Variables

- `SSE_PORT`: Override default SSE server port (default: 3003)
