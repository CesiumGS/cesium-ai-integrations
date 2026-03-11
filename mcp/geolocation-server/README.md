# 🌍 Cesium Geolocation MCP Server

MCP server providing geolocation-aware search and routing capabilities using free, open-source providers (Nominatim, Overpass, OSRM) for 3D visualization in CesiumJS.

## ✨ Features

- **Geocoding**: Convert addresses and place names to coordinates ("Empire State Building" → lat/long)
- **POI Search**: Find points of interest by type/category (restaurants, gyms, hotels, etc.) - supports both general and location-based (nearby) search
- **Route Computation**: Multi-modal routing (driving, walking, cycling, transit) with turn-by-turn directions
- **Multiple Providers**: Dedicated provider per task — Nominatim for geocoding, Overpass for POI search, OSRM for routing
- **Caching & Rate Limiting**: Built-in response caching and per-provider rate limiting
- **Schema Validation**: Zod-validated inputs and outputs

> **📖 For a detailed comparison against other geolocation MCP servers, see [COMPARISON.md](./COMPARISON.md)**

## 🔌 Provider Support

Each tool uses the provider best suited for its task — no configuration needed.

### 📍 Places Providers

#### Nominatim (OpenStreetMap) — Geocoding

- **Pros**: Free, no API key required, excellent for addresses and landmarks
- **Cons**: Limited POI data, rate limit (1 req/sec)
- **Used for**: `geolocation_geocode` — single location lookup
- **Setup**: Recommended: set `OSM_USER_AGENT` (e.g., `"MyApp/1.0 (contact@example.com)"`)

#### Overpass API (OpenStreetMap) — POI Search

- **Pros**: Free, no API key required, excellent for POI search (restaurants, cafes, shops)
- **Cons**: Slower queries, no ratings/hours/photos, rate limit (2 sec/req)
- **Used for**: `geolocation_search` — finding businesses and amenities
- **Setup**: Optional: set `OVERPASS_SERVER_URL` for a custom instance

### 🛣️ Routes Provider

#### OSRM (Open Source Routing Machine)

- **Pros**: Free, no API key required, good routing quality, supports alternative routes
- **Cons**: No real-time traffic data, transit mode falls back to driving
- **Used for**: `geolocation_route`
- **Setup**: Optional: set `OSRM_SERVER_URL` for a custom/self-hosted instance

## 📦 Installation

```bash
pnpm install
pnpm run build
```

## 🚀 Setup

### Prerequisites

The server works out-of-the-box — no API keys required.

**Recommended: set `OSM_USER_AGENT`**

Nominatim and OSRM usage policies ask that you identify your application:

```bash
export OSM_USER_AGENT="MyApp/1.0 (your@email.com)"
```

**Optional: use a custom Overpass or OSRM server**

```bash
export OVERPASS_SERVER_URL="https://your-overpass-instance.com/api/interpreter"
export OSRM_SERVER_URL="http://localhost:5000"
```

### Running the Server

```bash
pnpm run dev        # Development mode (tsx, auto-reload)
node build/index.js # Production mode (after pnpm run build)
```

The server uses **stdio transport** and is designed to be launched by an MCP client.

## 🛠️ Tools

The server registers **3 tools**, each backed by the provider best suited for its task.

### 1. `geolocation_geocode`

**Convert address or place name to coordinates (single location)**

Uses **Nominatim**. Geocodes an address or landmark name to geographic coordinates. Returns a **single best matching location**, not a list of places.

**Capabilities:**

- Address to coordinates conversion
- Landmark and place name lookup
- City, state, country geocoding
- Single result (best match)
- Bounding box information

**Input:**

- `address`: Address or place name (e.g., "Empire State Building", "1600 Pennsylvania Avenue", "Tokyo, Japan")
- `countryCode` (optional): Two-letter country code to restrict search (e.g., "US", "GB", "JP")

**Output:**

- Single location with coordinates (latitude, longitude)
- Display name and formatted address
- Bounding box (if available)

**Example:**

```
"What are the coordinates of the Eiffel Tower?"
"Geocode 1600 Pennsylvania Avenue"
"Where is Tokyo Tower located?"
```

---

### 2. `geolocation_search`

**Search for Points of Interest (POIs) by type/category**

Uses **Overpass API**. Searches for multiple POIs (restaurants, hotels, gyms, etc.) matching your query. Returns a **list of places**, not just one location. Supports both general search and location-based (nearby) search.

**Capabilities:**

- POI search by type or category
- Location-biased results
- Nearby search (use location + radius parameters)
- Multiple results (default: 10)

**Use When:**

- Finding businesses: "coffee shops", "pizza restaurants", "hotels"
- Searching amenities: "gas stations", "pharmacies", "gyms"
- Nearby searches: "gyms near Golden Gate Bridge", "restaurants within 2km"

**DON'T Use For:**

- Single address lookup (use `geolocation_geocode` instead)
- Getting coordinates of a specific place (use `geolocation_geocode` instead)

**Input:**

- `query`: Search query describing type (e.g., "pizza restaurants", "gyms", "coffee shops")
- `location` (optional): Center location for biased/nearby results (longitude, latitude)
- `radius` (optional): Search radius in meters (when used with location, performs nearby search)
- `types` (optional): Filter by place types array
- `maxResults` (optional): Maximum number of results (default: 10)

**Output:**

- Array of matching places with coordinates
- Place details (name, address, types)

**Example:**

```
"Find coffee shops near downtown Seattle"
"Search for Italian restaurants within 5km"
"Show me all gyms in this area"
"What gyms are near the Golden Gate Bridge?"
```

---

### 3. `geolocation_route`

**Compute optimal routes between locations**

Uses **OSRM**. Calculates turn-by-turn directions between origin and destination with support for multiple travel modes.

**Capabilities:**

- Multi-modal routing (driving, walking, cycling)
- Multiple route alternatives
- Turn-by-turn navigation instructions
- Waypoint support

> **Note:** Transit mode is not supported by OSRM and falls back to driving.

**Input:**

- `origin`: Starting location (longitude, latitude)
- `destination`: Ending location (longitude, latitude)
- `travelMode` (optional): `'drive'`, `'walk'`, `'bicycle'`, `'transit'` (default: `'drive'`)
- `alternatives` (optional): Return alternative routes (default: false)
- `waypoints` (optional): Intermediate stops (longitude, latitude)

**Output:**

- Route polyline with coordinates
- Total distance and duration
- Turn-by-turn instructions
- Multiple route alternatives (when requested)

---

## 🔌 Using with AI Clients

The geolocation server works with any MCP-compatible client: **GitHub Copilot** (VS Code), **Cline**, **Claude Desktop**, or other MCP clients.

### Example: Configure with GitHub Copilot (VS Code)

Add to your VS Code MCP settings (`.vscode/mcp.json` or user-level MCP settings):

```json
{
  "servers": {
    "cesium-geolocation-server": {
      "type": "stdio",
      "command": "node",
      "args": [
        "{YOUR_WORKSPACE}/cesium-ai-integrations/mcp/geolocation-server/build/index.js"
      ],
      "env": {
        "OSM_USER_AGENT": "MyApp/1.0 (your@email.com)"
      }
    }
  }
}
```

### Example: Configure with Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cesium-geolocation-server": {
      "command": "node",
      "args": [
        "{YOUR_WORKSPACE}/cesium-ai-integrations/mcp/geolocation-server/build/index.js"
      ],
      "env": {
        "OSM_USER_AGENT": "MyApp/1.0 (your@email.com)"
      }
    }
  }
}
```

## 🧪 Example Test Queries

Try these natural language queries with your AI client:

### Geocoding (Address to Coordinates)

```
"What are the coordinates of the Empire State Building?"
"Geocode 1600 Pennsylvania Avenue"
"Where is the Eiffel Tower located?"
"Find the latitude and longitude of Tokyo Tower"
```

### POI Search (Finding Businesses/Amenities)

```
"Find coffee shops in Seattle"
"Search for Italian restaurants near downtown"
"Show me gyms within 2km"
"Find gas stations nearby"
"Show me hotels in downtown San Francisco"
"What gyms are near the Golden Gate Bridge?"
"Find restaurants within 1 kilometer of Times Square"
```

### Route Planning

```
"Get driving directions from Los Angeles to San Diego"
"Plan a walking route from Central Park to Empire State Building"
"Show me the fastest cycling route from Golden Gate Bridge to Fisherman's Wharf"
```

### Complex Queries

```
"Find Italian restaurants within 2km of the Eiffel Tower, then give me driving directions to the closest one"
"What's the cycling route from Golden Gate Bridge to Fisherman's Wharf?"
"Show me coffee shops near Times Square and plan a route visiting the 3 closest ones"
```

## 🏗️ Architecture

- **Transport**: stdio (launched directly by MCP clients)
- **Geocode tool**: Nominatim (OpenStreetMap) — free, no API key, excellent for addresses
- **Search tool**: Overpass API (OpenStreetMap) — free, no API key, excellent for POI queries
- **Route tool**: OSRM (Open Source Routing Machine) — free, no API key, turn-by-turn directions
- **Caching**: In-memory LRU cache per provider (5 min TTL for places, 1 hr TTL for routes)
- **Rate Limiting**: Per-provider rate limiter (1.1 sec Nominatim, 2 sec Overpass)
- **Schema Validation**: Zod schemas for all inputs and outputs

## ⚙️ Configuration

All configuration is optional — the server works with no environment variables set.

| Variable              | Description                                       | Default                                   |
| --------------------- | ------------------------------------------------- | ----------------------------------------- |
| `OSM_USER_AGENT`      | User-Agent header for Nominatim and OSRM requests | `cesium-geolocation-mcp/1.0`              |
| `OVERPASS_SERVER_URL` | Custom Overpass API server URL                    | `https://overpass-api.de/api/interpreter` |
| `OSRM_SERVER_URL`     | Custom OSRM routing server URL                    | `https://router.project-osrm.org`         |

## 📊 Provider Comparison

### Places Providers

| Feature       | Nominatim    | Overpass API     |
| ------------- | ------------ | ---------------- |
| Geocoding     | ✅ Excellent | ❌ Not supported |
| POI Search    | ⚠️ Limited   | ✅ Excellent     |
| Nearby Search | ⚠️ Limited   | ✅ Full          |
| Ratings       | ❌ No        | ❌ No            |
| Opening Hours | ❌ No        | ❌ No            |
| Photos        | ❌ No        | ❌ No            |
| API Key       | ✅ Free      | ✅ Free          |
| Rate Limit    | 1 req/sec    | ~2 sec/req       |

### Routes Providers

| Feature      | OSRM                       |
| ------------ | -------------------------- |
| Routing      | ✅ Full                    |
| Traffic Data | ❌ No                      |
| Transit Mode | ❌ (falls back to driving) |
| Waypoints    | ✅ Yes                     |
| Alternatives | ✅ Yes                     |
| API Key      | ✅ Free                    |
| Rate Limit   | Unlimited\*                |

\* When self-hosted. The public demo server has usage limits.

## 🚢 Self-Hosting for Production

For production use, consider self-hosting OSRM and/or Overpass for better performance and no rate limits:

```bash
# Run OSRM server with Docker
docker run -t -i -p 5000:5000 -v "${PWD}:/data" osrm/osrm-backend osrm-routed --algorithm mld /data/your-region.osrm

# Point the geolocation server at your instance
export OSRM_SERVER_URL=http://localhost:5000
node build/index.js
```

Visit [OSRM documentation](http://project-osrm.org/) and [Overpass API documentation](https://wiki.openstreetmap.org/wiki/Overpass_API) for self-hosting instructions.

## 🤝 Contributing

Interested in contributing? Please read [CONTRIBUTING.md](../../CONTRIBUTING.md). We also ask that you follow the [Code of Conduct](../../CODE_OF_CONDUCT.md).

## 📄 License

Apache 2.0. See [LICENSE](../../LICENSE).
