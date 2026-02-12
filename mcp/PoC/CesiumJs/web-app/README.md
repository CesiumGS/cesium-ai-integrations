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

Create a local configuration file with your Cesium Ion access token:

```bash
# Copy the template
cp config.js config.local.js
```

Edit `config.local.js` and add your token:

```javascript
const CONFIG = {
  CESIUM_ACCESS_TOKEN: "your_actual_token_here",
  // ... other settings
};
```

Get your token from: https://ion.cesium.com/tokens

⚠️ **Important:** `config.local.js` is gitignored and should never be committed!

### 2. Configure Camera Server

In `config.local.js`, configure the camera MCP server connection:

```javascript
MCP_SERVERS: [{ name: "Camera Server", port: 3002, capabilities: ["camera"] }];
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

- `config.js` - Template configuration (committed to git)
- `config.local.js` - Your personal configuration (gitignored, not committed)
- `.gitignore` - Ensures secrets aren't committed

## Security

**Never commit your access tokens!**

- `config.local.js` is automatically gitignored
- Always use the local config for personal tokens
- The default `config.js` contains placeholder values only

## Troubleshooting

### "Access token not configured" error

- Create `config.local.js` from `config.js`
- Add your Cesium Ion access token
- Refresh the page

### Camera server showing as disconnected

- Ensure camera server is running on port 3002
- Check console for connection errors
- Verify port in `config.local.js` matches the running server

### CORS errors

- MCP servers include CORS headers
- Ensure you're accessing via `http://localhost` or `file://`
- Check browser console for specific CORS issues
