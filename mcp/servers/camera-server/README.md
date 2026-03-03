# 🎥 Cesium Camera MCP Server

MCP server for advanced camera control and navigation in CesiumJS 3D globe applications.

<video src="https://github.com/user-attachments/assets/348f7575-4cd2-4732-9885-2da40962bdf3" controls></video>

## ✨ Features

- **Smooth Camera Flights**: Animated camera transitions with customizable easing functions
- **Instant Positioning**: Direct camera placement without animation
- **Look-At Controls**: Lock camera to specific points for orbital viewing
- **Orbit Automation**: Automated circular orbit around targets
- **Camera State Queries**: Get current position, orientation, and view bounds
- **Controller Configuration**: Adjust camera movement constraints and behavior

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

The server will start on port 3002 with SSE transport.

## 🛠️ Tools

### 1. `camera_fly_to`

**Execute camera fly operation with advanced options**

Smoothly animates the camera to a destination with configurable easing and flight path.

**Capabilities:**

- Customizable flight duration (default: 3 seconds)
- 40+ easing functions (LINEAR, QUADRATIC, CUBIC, QUARTIC, QUINTIC, SINUSOIDAL, EXPONENTIAL, CIRCULAR, ELASTIC, BOUNCE, BACK)
- Maximum height control during flight
- Pitch adjustment at specific heights
- Fly-over longitude control for curved paths
- Automatic orientation adjustment

**Input:**

- `destination`: Target position (longitude, latitude, height)
- `orientation` (optional): Camera orientation (heading, pitch, roll in degrees)
- `duration` (optional): Animation duration in seconds
- `easingFunction` (optional): Animation curve
- `maximumHeight` (optional): Maximum height during flight in meters
- `pitchAdjustHeight` (optional): Height to adjust pitch
- `flyOverLongitude` (optional): Longitude to fly over
- `flyOverLongitudeWeight` (optional): Weight of flyOverLongitude (0-1)

**Output:**

- Final camera position and orientation
- Animation statistics (duration, client count, response time)

---

### 2. `camera_set_view`

**Instantly set camera position without animation**

Immediately positions the camera at the specified location and orientation.

**Capabilities:**

- Zero-animation instant positioning
- Precise position and orientation control
- Rectangle-based view framing
- Heading-pitch-range positioning relative to targets

**Input:**

- `destination`: Target position (longitude, latitude, height)
- `orientation` (optional): Camera orientation (heading, pitch, roll in degrees)

**Output:**

- Final camera position and orientation
- Client broadcast statistics

---

### 3. `camera_look_at_transform`

**Lock camera to look at a specific point on Earth**

Sets up a look-at relationship between the camera and a target point, useful for orbiting around landmarks.

**Capabilities:**

- Target-relative camera positioning
- Automatic heading/pitch/range calculation
- Orbit-ready camera setup
- Landmark inspection mode

**Input:**

- `target`: Target position to look at (longitude, latitude, height)
- `offset` (optional): Camera offset from target (heading, pitch, range)

**Output:**

- Camera configuration confirmation
- Target and offset details

---

### 4. `camera_start_orbit`

**Start automated camera orbit around target**

Begins automatic circular orbit around the current look-at target.

**Capabilities:**

- Configurable orbit speed and direction
- Smooth circular motion
- Maintains fixed altitude and distance
- Automatic heading updates

**Input:**

- `speed` (optional): Orbit speed multiplier (default: 1.0, range: 0.1-10.0)
- `direction` (optional): 'clockwise' or 'counterclockwise' (default: 'clockwise')

**Output:**

- Orbit activation confirmation
- Speed and direction settings

---

### 5. `camera_stop_orbit`

**Stop the current camera orbit animation**

Halts any active automated orbit, returning camera control to user.

**Capabilities:**

- Immediate orbit cessation
- Preserves current camera position
- Restores manual camera control

**Input:** None

**Output:**

- Orbit deactivation confirmation

---

### 6. `camera_get_position`

**Get comprehensive camera information**

Retrieves detailed camera state including position, orientation, and visible bounds.

**Capabilities:**

- Current position in cartographic coordinates
- Full orientation (heading, pitch, roll)
- View rectangle (visible lat/lon bounds)
- Height above terrain/ellipsoid
- Real-time state queries

**Input:** None

**Output:**

- `position`: Current camera position (longitude, latitude, height)
- `orientation`: Current orientation (heading, pitch, roll in degrees)
- `viewRectangle`: Visible bounds (west, south, east, north in degrees)
- `timestamp`: Query timestamp

---

### 7. `camera_set_controller_options`

**Configure camera movement constraints and behavior**

Adjusts camera controller settings to customize user interaction and enforce constraints.

**Capabilities:**

- Enable/disable specific camera movements (rotate, translate, zoom, tilt, look)
- Set maximum/minimum zoom distances
- Configure collision detection
- Adjust inertia and momentum
- Set movement speed multipliers

**Input:**

- `enableRotate` (optional): Allow camera rotation
- `enableTranslate` (optional): Allow camera panning
- `enableZoom` (optional): Allow zoom in/out
- `enableTilt` (optional): Allow pitch adjustment
- `enableLook` (optional): Allow free-look mode
- `maximumZoomDistance` (optional): Maximum zoom-out distance in meters
- `minimumZoomDistance` (optional): Minimum zoom-in distance in meters
- `enableCollisionDetection` (optional): Prevent camera from going underground

**Output:**

- Applied configuration settings
- Client broadcast statistics

---

## 🔌 Using with AI Clients

The camera server works with any MCP-compatible client: **Cline**, **Github Copilot** (VS Code), **Claude Desktop**, or other MCP clients.

### Example: Configure with Cline

**Step 1: Install Cline**

Install the [Cline extension](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev) from VS Code marketplace.

**Step 2: Configure MCP Server**

Add to your Cline MCP settings (`~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` or via Cline settings UI):

> **Note:** For Github Copilot or Claude Desktop, use similar configuration in their respective MCP settings files.

```json
{
  "mcpServers": {
    "cesium-camera-server": {
      "command": "node",
      "args": [
        "{YOUR_WORKSPACE}/cesium-ai-integrations/mcp/servers/camera-server/build/index.js"
      ],
      "env": {
        "PORT": "3002",
        "COMMUNICATION_PROTOCOL": "sse" // "websocket"
      }
    }
  }
}
```

**Step 3: Start the Visual Client (Optional but Recommended)**

To see camera movements in real-time 3D:

```bash
# Configure environment
cd test-applications/cesium-js/web-app
cp .env.example .env
# Edit .env and add your Cesium Ion token from https://ion.cesium.com/tokens

# Start the web client
pnpm start
```

Open http://localhost:8080 to view the 3D globe. The status panel will show the camera server connection.

**Step 4: Use Cline**

Open Cline in VS Code and use natural language commands (see example queries below). The camera server tools will be available automatically.

## 🧪 Example Test Queries

Try these natural language queries with your AI client:

### Basic Navigation

```
"Fly to the Eiffel Tower in Paris"
"Show me Mount Everest from 5000 meters altitude"
```

### Advanced Camera Controls

```
"Fly to the Golden Gate Bridge at 500m height, looking down at 45 degrees, over 5 seconds"
"Create a cinematic flight to Dubai's Burj Khalifa using exponential easing, maximum height 8000m"
```

### Orbital Views

```
"Lock camera to look at the Colosseum from 300 meters away, then start orbiting clockwise"
"Stop the current orbit"
```

### Camera State & Configuration

```
"Where is the camera currently positioned?"
"Disable camera tilt and set maximum zoom to 20km"
```

### Complex Sequences

```
"Fly to the Great Wall of China, then orbit around it for a full 360-degree view"
```

## 🏗️ Architecture

- **Server**: Registers MCP tools, exposes SSE endpoint on port 3002
- **Browser Manager**: Translates commands to Cesium Camera API calls
- **Easing Functions**: Maps string names to Cesium.EasingFunction enums
- **Coordinate Transforms**: Handles cartographic ↔ cartesian conversions

## ⚙️ Configuration

### Web Client Configuration

Add to your `.env` file in `test-applications/cesium-js/web-app`:

```bash
CESIUM_ACCESS_TOKEN=your_token_here
MCP_PROTOCOL=websocket
MCP_CAMERA_PORT=3002
```

### Server Configuration

Environment variables for the camera server:

- `PORT` or `CAMERA_SERVER_PORT`: Override default server port (default: 3002)
- `COMMUNICATION_PROTOCOL`: Choose 'sse' or 'websocket' (default: 'websocket')
- `MAX_RETRIES`: Maximum retry attempts for port binding (default: 10)
- `STRICT_PORT`: If 'true', fail if exact port unavailable (default: false)

## 🤝 Contributing

Interested in contributing? Please read [CONTRIBUTING.md](CONTRIBUTING.md). We also ask that you follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Apache 2.0. See [LICENSE](LICENSE).
