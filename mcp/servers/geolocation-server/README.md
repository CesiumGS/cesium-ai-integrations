# 🌍 Cesium Geolocation MCP Server

MCP server providing geolocation-aware search and routing capabilities with support for multiple providers (Google, Nominatim, Overpass, OSRM) for 3D visualization in CesiumJS.

## ✨ Features

- **Geocoding**: Convert addresses and place names to coordinates ("Empire State Building" → lat/long)
- **POI Search**: Find points of interest by type/category (restaurants, gyms, hotels, etc.) - supports both general and location-based (nearby) search
- **Route Computation**: Multi-modal routing with traffic awareness (driving, walking, cycling, transit)
- **Browser Geolocation**: Access user location for "near me" queries
- **3D Visualization**: Automatic route polyline and place marker rendering on Cesium globe
- **Multiple Providers**: Choose between Google, Nominatim, Overpass, and OSRM backends
- **Smart Provider Selection**: Each provider optimized for specific tasks (see provider capabilities below)

## 🔌 Provider Support

This server uses a **generic, provider-agnostic schema** that works with multiple backend services. Each provider has different capabilities - see **[PROVIDERS.md](./PROVIDERS.md)** for detailed comparison.

### 📍 Places Providers

#### Nominatim (OpenStreetMap) 🌍 (Default)

- **Pros**: Free, no API key required, **excellent for geocoding** addresses and place names
- **Cons**: Limited POI data, no ratings/hours/photos, rate limit (1 req/sec)
- **Best For**: **Geocoding** (address-to-coordinates), finding major landmarks and cities
- **Supports**: ✅ Geocoding, ❌ POI Search (use Overpass instead)
- **Setup**:
  - Recommended: Set `OSM_USER_AGENT` environment variable (e.g., `"MyApp/1.0 (contact@example.com)"`)
  - Required by Nominatim's usage policy to include contact information

#### Overpass API (OpenStreetMap) 🆕

- **Pros**: Free, no API key required, **excellent for POI search** (restaurants, cafes, shops)
- **Cons**: Slower queries, no ratings/hours/photos, rate limit (recommend 2 sec/req), **NOT for geocoding**
- **Best For**: **POI Search** - finding businesses, amenities, and points of interest
- **Supports**: ✅ POI Search, ✅ Nearby Search, ❌ Geocoding (use Nominatim instead)
- **Setup**:
  - Set `PLACES_PROVIDER=overpass`
  - Recommended: Set `OSM_USER_AGENT` environment variable
  - Optional: Set `OVERPASS_SERVER_URL` for custom instance
- **Note**: Will throw error if used for geocoding - automatically fall back to Nominatim

#### Google Places API ✨

- **Pros**: Full POI database, **excellent geocoding**, ratings, reviews, photos, opening hours, price levels
- **Cons**: Requires API key, pay-per-use ($17-32/1K requests)
- **Best For**: Production apps requiring rich business data, supports **both geocoding and POI search**
- **Supports**: ✅ Geocoding, ✅ POI Search, ✅ Nearby Search, ✅ Rich Details
- **Setup**: Set `GOOGLE_MAPS_API_KEY` environment variable and `PLACES_PROVIDER=google`

### 🛣️ Routes Providers

#### OSRM (Open Source Routing Machine) 🌍 (Default)

- **Pros**: Free, no API key required, good routing quality
- **Cons**: No traffic data, no transit mode, no avoid options
- **Setup**:
  - Recommended: Set `OSM_USER_AGENT` environment variable (e.g., `"MyApp/1.0 (contact@example.com)"`)
  - Best practice for identifying your application to the OSRM public server

#### Google Routes API ✨

- **Pros**: Real-time traffic, transit routing, avoid options (tolls/highways/ferries)
- **Cons**: Requires API key, pay-per-use ($5-10/1K requests)
- **Setup**: Set `GOOGLE_MAPS_API_KEY` environment variable and `ROUTES_PROVIDER=google`

> **📖 For detailed provider comparisons, capabilities, and limitations, see [PROVIDERS.md](./PROVIDERS.md)**

## 📦 Installation

```bash
pnpm install
pnpm run build
```

## 🚀 Setup

### Prerequisites

The server works out-of-the-box with free providers (Nominatim + OSRM). For Google features, follow these steps:

**Option 1: Free/Open Source (Default - Nominatim)**

- Places: Nominatim (default, no configuration needed)
- Routes: OSRM (default, no configuration needed)
- Recommended: Set `OSM_USER_AGENT` (e.g., `"MyApp/1.0 (your@email.com)"`)
- **Best for**: **Geocoding** addresses and place names to coordinates
- **Limited**: Basic POI search only (use Overpass for better POI results)

**Option 2: Free/Open Source (Recommended - Hybrid)**

- Places: Use **Nominatim for geocoding** + **Overpass for POI search** (auto-fallback)
- Routes: OSRM (default)
- Setup:
  - `PLACES_PROVIDER=overpass` (will auto-fallback to Nominatim for geocoding)
  - Optional: `OVERPASS_SERVER_URL=https://your-instance.com` (for custom server)
  - Recommended: Set `OSM_USER_AGENT`
- **Best for**: Finding businesses and POIs while still supporting address lookups
- **Note**: Server automatically uses Nominatim for geocoding when Overpass is primary provider

**Option 3: Google (Full Features)**

1. Go to [GCP Console](https://console.cloud.google.com/)
2. Enable "Places API (New)" and "Routes API"
3. Create API key and restrict by HTTP referrers and API services
4. Set environment variables:
   - `GOOGLE_MAPS_API_KEY=your_api_key_here`
   - `PLACES_PROVIDER=google`
   - `ROUTES_PROVIDER=google`

- **Best for**: Production apps with budget for rich data

**Option 4: Hybrid**
Mix and match providers based on your needs (e.g., Overpass for POI search, Google for routing with traffic)

### Running the Server

```bash
pnpm run dev    # Development mode with auto-reload
pnpm start      # Production mode
```

The server will start on port 3005 with WebSocket transport.

## 🛠️ Tools

### 1. `geolocation_geocode` 🆕

**Convert address or place name to coordinates (single location)**

Geocodes an address or landmark name to geographic coordinates. Returns a **single best matching location**, not a list of places.

**Capabilities:**

- Address to coordinates conversion
- Landmark and place name lookup
- City, state, country geocoding
- Single result (best match)
- Automatic 3D marker visualization on Cesium globe
- Bounding box information

**Best Providers:**

- 🌍 Nominatim (free, excellent)
- ✨ Google (commercial, very accurate)
- ❌ Overpass (not supported - will error)

**Input:**

- `address`: Address or place name (e.g., "Empire State Building", "1600 Pennsylvania Avenue", "Tokyo, Japan")
- `countryCode` (optional): Two-letter country code to restrict search (e.g., "US", "GB", "JP")

**Output:**

- Single location with coordinates (latitude, longitude)
- Display name and formatted address
- Bounding box (if available)
- Place ID and types
- Visualization marker on Cesium globe

**Example:**

```
"What are the coordinates of the Eiffel Tower?"
"Geocode 1600 Pennsylvania Avenue"
"Where is Tokyo Tower located?"
```

---

### 2. `geolocation_search`

**Search for Points of Interest (POIs) by type/category**

Searches for multiple POIs (restaurants, hotels, gyms, etc.) matching your query. Returns a **list of places**, not just one location. Supports both general search and location-based (nearby) search.

**Capabilities:**

- POI search by type or category
- Location-biased results
- Nearby search (use location + radius parameters)
- Multiple results
- Type filtering (restaurant, cafe, hotel, etc.)
- Automatic 3D marker visualization on Cesium globe
- Provider-specific enhancements (ratings, photos with Google)

**Best Providers:**

- 🆕 Overpass (free, excellent for POIs)
- ✨ Google (commercial, includes ratings/reviews/photos)
- 🌍 Nominatim (basic support, better for geocoding)

**Use When:**

- Finding businesses: "coffee shops", "pizza restaurants", "hotels"
- Searching amenities: "gas stations", "pharmacies", "gyms"
- Looking for multiple options
- Nearby searches: "gyms near Golden Gate Bridge", "restaurants within 2km"

**DON'T Use For:**

- Single address lookup (use `geolocation_geocode` instead)
- Getting coordinates of a place (use `geolocation_geocode` instead)

**Input:**

- `query`: Search query describing type (e.g., "pizza restaurants", "gyms", "coffee shops")
- `location` (optional): Center location for biased/nearby results (longitude, latitude)
- `radius` (optional): Search radius in meters (when used with location, performs nearby search)
- `types` (optional): Filter by place types array
- `maxResults` (optional): Maximum number of results (default: 10)

**Output:**

- Array of matching places with coordinates
- Place details (name, address, types)
- Provider-specific data (ratings, photos, hours when available)
- Visualization markers on Cesium globe

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
- `OSM_USER_AGENT`: Recommended for Nominatim (format: `"AppName/Version (contact@email.com)"`)
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
