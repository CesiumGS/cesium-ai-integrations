# 🌍 Cesium Geolocation MCP Server

MCP server providing geolocation-aware search and routing capabilities with support for multiple providers (Google, Nominatim, OSRM) for 3D visualization in CesiumJS.

## ✨ Features

- **Place Search**: Text-based and nearby search for places (restaurants, gyms, hotels, etc.)
- **Route Computation**: Multi-modal routing with traffic awareness (driving, walking, cycling, transit)
- **Browser Geolocation**: Access user location for "near me" queries
- **3D Visualization**: Automatic route polyline and place marker rendering on Cesium globe
- **Multiple Providers**: Choose between Google, Nominatim, and OSRM backends
- **Generic Schema**: Provider-agnostic API design that works with any geocoding/routing service

## 🔌 Provider Support

This server uses a **generic, provider-agnostic schema** that works with multiple backend services. Each provider has different capabilities - see **[PROVIDERS.md](./PROVIDERS.md)** for detailed comparison.

### 📍 Places Providers

#### Google Places API ✨ (Default)

- **Pros**: Full POI database, ratings, reviews, photos, opening hours, price levels
- **Cons**: Requires API key, pay-per-use ($17-32/1K requests)
- **Setup**: Set `GOOGLE_MAPS_API_KEY` environment variable

#### Nominatim (OpenStreetMap) 🌍

- **Pros**: Free, no API key required, good for geocoding and basic search
- **Cons**: Limited POI data, no ratings/hours/photos, rate limit (1 req/sec)
- **Setup**: Set `PLACES_PROVIDER=nominatim`

### 🛣️ Routes Providers

#### Google Routes API ✨ (Default)

- **Pros**: Real-time traffic, transit routing, avoid options (tolls/highways/ferries)
- **Cons**: Requires API key, pay-per-use ($5-10/1K requests)
- **Setup**: Set `GOOGLE_MAPS_API_KEY` environment variable

#### OSRM (Open Source Routing Machine) 🌍

- **Pros**: Free, no API key required, good routing quality
- **Cons**: No traffic data, no transit mode, no avoid options
- **Setup**: Set `ROUTES_PROVIDER=osrm`

> **📖 For detailed provider comparisons, capabilities, and limitations, see [PROVIDERS.md](./PROVIDERS.md)**

## 📦 Installation

```bash
pnpm install
pnpm run build
```

## 🚀 Setup

### Prerequisites

Choose your providers and set up authentication:

**Option 1: Google (Full Features)**

1. Go to [GCP Console](https://console.cloud.google.com/)
2. Enable "Places API (New)" and "Routes API"
3. Create API key and restrict by HTTP referrers and API services
4. Set environment variable: `GOOGLE_MAPS_API_KEY=your_api_key_here`

**Option 2: Free/Open Source**

- For places: Use Nominatim (set `PLACES_PROVIDER=nominatim`)
- For routes: Use OSRM (set `ROUTES_PROVIDER=osrm`)
- No API keys required!

**Option 3: Hybrid**
Mix and match providers based on your needs (e.g., Nominatim for search, Google for routing with traffic)

### Running the Server

```bash
pnpm run dev    # Development mode with auto-reload
pnpm start      # Production mode
```

The server will start on port 3005 with WebSocket transport.

## 🛠️ Tools

### 1. `geolocation_search`

**Search for places by name or type**

Performs text-based search to find locations, points of interest, or addresses matching your query.

**Capabilities:**

- Text-based location search
- Points of interest (POI) search by type (restaurants, hotels, gyms, etc.)
- Address geocoding
- Automatic 3D marker visualization on Cesium globe
- Provider-specific enhancements (ratings, photos with Google)

**Input:**

- `query`: Search text (e.g., "coffee shops", "Eiffel Tower", "123 Main St")
- `location` (optional): Center location for biased results (longitude, latitude)
- `radius` (optional): Search radius in meters (default: based on provider)
- `maxResults` (optional): Maximum number of results to return

**Output:**

- Array of matching places with coordinates
- Place details (name, address, type)
- Provider-specific data (ratings, photos, hours when available)
- Visualization markers on Cesium globe

---

### 2. `geolocation_nearby`

**Find places within a radius of a location**

Searches for places of specific types near a given location (e.g., "restaurants near me").

**Capabilities:**

- Proximity-based search
- Place type filtering (restaurants, gas stations, hotels, etc.)
- Radius-based filtering
- Result ranking by distance or relevance
- Automatic 3D marker visualization

**Input:**

- `location`: Center location (longitude, latitude)
- `radius`: Search radius in meters
- `placeType` (optional): Filter by place type (e.g., "restaurant", "hotel")
- `maxResults` (optional): Maximum number of results

**Output:**

- Array of nearby places with coordinates
- Distance from center point
- Place details and provider-specific data
- Visualization markers on Cesium globe

---

### 3. `geolocation_route`

**Compute optimal routes between locations**

Calculates turn-by-turn directions between origin and destination with support for multiple travel modes and traffic awareness.

**Capabilities:**

- Multi-modal routing (driving, walking, cycling, transit)
- Real-time traffic data (Google provider)
- Multiple route alternatives
- Turn-by-turn navigation instructions
- Route avoid options (tolls, highways, ferries)
- Automatic 3D polyline visualization on Cesium globe

**Input:**

- `origin`: Starting location (longitude, latitude)
- `destination`: Ending location (longitude, latitude)
- `travelMode` (optional): 'drive', 'walk', 'bicycle', 'transit' (default: 'drive')
- `alternatives` (optional): Return alternative routes (default: false)
- `avoid` (optional): Array of features to avoid ('tolls', 'highways', 'ferries')

**Output:**

- Route polyline with coordinates
- Total distance and duration
- Turn-by-turn instructions
- Traffic-adjusted duration (when available)
- Multiple route alternatives (when requested)
- Visualization polyline on Cesium globe

---

### 4. `geolocation_get_user_location`

**Request browser geolocation for user's current position**

Accesses the user's current location via browser Geolocation API (requires user permission).

**Capabilities:**

- Browser-based geolocation
- High-accuracy GPS positioning
- Fallback to network/IP-based location
- Privacy-respecting (requires explicit user consent)

**Input:** None

**Output:**

- User's current position (longitude, latitude, accuracy)
- Altitude and heading (when available)
- Timestamp of location acquisition

---

## 🔌 Using with AI Clients

The geolocation server works with any MCP-compatible client: **Cline**, **Github Copilot** (VS Code), **Claude Desktop**, or other MCP clients.

### Example: Configure with Cline

**Step 1: Install Cline**

Install the [Cline extension](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev) from VS Code marketplace.

**Step 2: Configure MCP Server**

Add to your Cline MCP settings (`~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` or via Cline settings UI):

> **Note:** For Github Copilot or Claude Desktop, use similar configuration in their respective MCP settings files.

```json
{
  "mcpServers": {
    "cesium-geolocation-server": {
      "command": "node",
      "args": [
        "{YOUR_WORKSPACE}/cesium-ai-integrations/mcp/servers/geolocation-server/build/index.js"
      ],
      "env": {
        "PORT": "3005",
        "COMMUNICATION_PROTOCOL": "websocket",
        "GOOGLE_MAPS_API_KEY": "your_api_key_here",
        "PLACES_PROVIDER": "google",
        "ROUTES_PROVIDER": "google"
      }
    }
  }
}
```

**Step 3: Start the Visual Client (Optional but Recommended)**

To see search results and routes in real-time 3D:

```bash
# Configure environment
cd PoC/CesiumJs/web-app
cp .env.example .env
# Edit .env and add your Cesium Ion token from https://ion.cesium.com/tokens

# Start the web client
pnpm start
```

Open http://localhost:8080 to view the 3D globe. The status panel will show the geolocation server connection.

**Step 4: Use Cline**

Open Cline in VS Code and use natural language commands (see example queries below). The geolocation server tools will be available automatically.

## 🧪 Example Test Queries

Try these natural language queries with your AI client:

### Basic Search

```
"Find coffee shops in Seattle"
"Search for the Statue of Liberty"
"Show me hotels in downtown San Francisco"
```

### Nearby Search

```
"Find restaurants within 1 kilometer of Times Square"
"What gyms are near the Golden Gate Bridge?"
"Show gas stations within 5 miles of my current location"
```

### Route Planning

```
"Get driving directions from Los Angeles to San Diego"
"Plan a walking route from Central Park to Empire State Building"
"Show me the fastest route from London to Oxford, avoiding tolls"
```

### Complex Queries

```
"Find Italian restaurants within 2km of the Eiffel Tower, then give me directions from my hotel"
"What's the cycling route from Golden Gate Bridge to Fisherman's Wharf?"
"Show me coffee shops near me and create a route visiting the 3 closest ones"
```

### User Location

```
"Where am I right now?"
"Find pizza places near my current location"
```

## 🏗️ Architecture

- **Server**: Registers MCP tools, exposes WebSocket endpoint on port 3005
- **Provider Adapters**: Translates generic schema to provider-specific APIs (Google, Nominatim, OSRM)
- **Browser Manager**: Handles browser geolocation requests and visualization
- **Schema Validators**: Ensures data consistency across providers
- **Visualization Engine**: Renders search results and routes on Cesium globe

## ⚙️ Configuration

### Web Client Configuration

Add to your `.env` file in `PoC/CesiumJs/web-app`:

```bash
CESIUM_ACCESS_TOKEN=your_token_here
MCP_PROTOCOL=websocket
MCP_GEOLOCATION_PORT=3005
```

### Server Configuration

#### Provider Selection

- `PLACES_PROVIDER`: 'google' | 'nominatim' (default: 'google')
- `ROUTES_PROVIDER`: 'google' | 'osrm' (default: 'google')

### API Keys

- `GOOGLE_MAPS_API_KEY`: Required for Google providers
- `OSRM_SERVER_URL`: Optional custom OSRM server URL (default: public demo server)

### Server Configuration

- `PORT` or `GEOLOCATION_SERVER_PORT`: Override default port (default: 3005)
- `COMMUNICATION_PROTOCOL`: 'websocket' | 'sse' (default: 'websocket')
- `STRICT_PORT`: 'true' | 'false' (default: false)
- `MAX_RETRIES`: Maximum retry attempts for port binding (default: 10)

## 📊 Provider Comparison

### Places Providers

| Feature       | Google Places | Nominatim  |
| ------------- | ------------- | ---------- |
| Search        | ✅ Full       | ✅ Basic   |
| Nearby Search | ✅ Full       | ⚠️ Limited |
| Ratings       | ✅ Yes        | ❌ No      |
| Opening Hours | ✅ Yes        | ❌ No      |
| Photos        | ✅ Yes        | ❌ No      |
| Price Levels  | ✅ Yes        | ❌ No      |
| API Key       | ⚠️ Required   | ✅ Free    |
| Rate Limit    | Pay-per-use   | 1 req/sec  |

### Routes Providers

| Feature       | Google Routes | OSRM        |
| ------------- | ------------- | ----------- |
| Routing       | ✅ Full       | ✅ Full     |
| Traffic Data  | ✅ Yes        | ❌ No       |
| Transit Mode  | ✅ Yes        | ❌ No       |
| Avoid Options | ✅ Yes        | ❌ No       |
| Alternatives  | ✅ Yes        | ✅ Yes      |
| API Key       | ⚠️ Required   | ✅ Free     |
| Rate Limit    | Pay-per-use   | Unlimited\* |

\* When self-hosted. Demo server has limits.

## 💰 Cost Considerations

### Google Maps Platform Pricing

- Places API: $17/1K requests (Text Search), $32/1K requests (Nearby Search)
- Routes API: $5/1K requests (basic), $10/1K requests (advanced with traffic)
- Free tier: $200/month credit (~10K-40K requests depending on API mix)

### Free Alternatives

- **Nominatim**: Free for reasonable use (1 req/sec limit)
- **OSRM**: Free demo server with limits, or self-host for unlimited use

## 💡 Usage Examples

### Using Google Providers (Default)

```bash
export GOOGLE_MAPS_API_KEY=your_key_here
pnpm start
```

### Using Free Providers

```bash
export PLACES_PROVIDER=nominatim
export ROUTES_PROVIDER=osrm
pnpm start
```

### Using Hybrid Setup

```bash
export GOOGLE_MAPS_API_KEY=your_key_here
export PLACES_PROVIDER=nominatim  # Free search
export ROUTES_PROVIDER=google     # Premium routing with traffic
pnpm start
```

## 🚢 Self-Hosting OSRM

For production use with OSRM, consider self-hosting for better performance and no rate limits:

```bash
# Run OSRM server with Docker
docker run -t -i -p 5000:5000 -v "${PWD}:/data" osrm/osrm-backend osrm-routed --algorithm mld /data/your-region.osrm

# Configure geolocation server to use your instance
export OSRM_SERVER_URL=http://localhost:5000
pnpm start
```

Visit [OSRM documentation](http://project-osrm.org/) for setup instructions.

## 🤝 Contributing

Interested in contributing? Please read [CONTRIBUTING.md](../../CONTRIBUTING.md). We also ask that you follow the [Code of Conduct](../../CODE_OF_CONDUCT.md).

## 📄 License

Apache 2.0. See [LICENSE](../../LICENSE).
