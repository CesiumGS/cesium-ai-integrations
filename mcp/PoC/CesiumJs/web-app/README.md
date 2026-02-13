# CesiumJS MCP Client

Web-based 3D visualization client for Cesium MCP servers.

## Quick Start

```bash
# From project root (cesium-mcp-servers/)
pnpm run start:web        # Start the client on http://localhost:8080
pnpm run start:web:dev    # Start and auto-open browser
```

Or from this directory:

```bash
pnpm start             # Start server
pnpm run serve:dev     # Start and open browser
```

## Setup

### 1. Configure Access Token

Create a local environment file with your Cesium Ion access token:

```bash
# Copy the template
cp .env.example .env
```

Edit `.env` and add your token:

```bash
CESIUM_ACCESS_TOKEN=your_actual_token_here
MCP_PROTOCOL=websocket
MCP_CAMERA_PORT=3002
```

Get your token from: https://ion.cesium.com/tokens

⚠️ **Important:** `.env` is gitignored and should never be committed!

### 2. Configure Camera Server

In `.env`, the camera MCP server connection is configured via:

```bash
MCP_PROTOCOL=websocket
MCP_CAMERA_PORT=3002
```

### 3. Start Everything

**Terminal 1 - MCP Servers:**

```bash
# From mcp directory
pnpm run dev:camera
```

**Terminal 2 - Web Client:**

```bash
# From mcp directory
pnpm run start:web
```

Then open http://localhost:8080 in your browser. The status panel shows server connection.

## Architecture

This browser application uses the shared **`@cesium-mcp/client-core`** package, which provides:

- Reusable Cesium MCP client library
- Cesium viewer initialization and management
- MCP manager implementations
- MCP server communication (SSE/WebSocket)

The browser app only contains:

- `app.ts` - Browser-specific UI initialization and DOM handling
- `index.html` - HTML structure and styling

## Features

- 🌍 3D globe visualization with CesiumJS
- 📡 Real-time connection to camera MCP server
- 📊 Status panel with live server monitoring
- 🎯 Camera control operations
- 🔄 Automatic reconnection on connection loss
- 🎨 Modern, responsive UI

## Configuration Files

- `.env.example` - Template configuration (committed to git)
- `.env` - Your personal configuration (gitignored, not committed)
- `.gitignore` - Ensures secrets aren't committed

## Security

**Never commit your access tokens!**

- `.env` is automatically gitignored
- Always use the `.env` file for personal tokens
- The default `.env.example` contains placeholder values only

## Troubleshooting

### "Access token not configured" error

- Create `.env` from `.env.example`
- Add your Cesium Ion access token to `.env`
- Rebuild the app with `pnpm run build:web`
- Refresh the page

### Camera server showing as disconnected

- Ensure camera server is running on port 3002
- Check console for connection errors
- Verify port in `.env` (MCP_CAMERA_PORT) matches the running server

### CORS errors

- MCP servers include CORS headers
- Ensure you're accessing via `http://localhost` or `file://`
- Check browser console for specific CORS issues
