# Cesium Geolocation MCP Server

MCP server providing geolocation-aware search and routing capabilities integrated with Google Maps APIs for 3D visualization in CesiumJS.

## Features

- **Place Search**: Text-based and nearby search for places (restaurants, gyms, hotels, etc.)
- **Route Computation**: Multi-modal routing with traffic awareness (driving, walking, cycling, transit)
- **Browser Geolocation**: Access user location for "near me" queries
- **3D Visualization**: Automatic route polyline and place marker rendering on Cesium globe

## Setup

### Prerequisites

1. **Google Cloud Platform API Key**:
   - Go to [GCP Console](https://console.cloud.google.com/)
   - Enable "Places API (New)" and "Routes API"
   - Create API key and restrict by HTTP referrers and API services
   - Set environment variable: `GOOGLE_MAPS_API_KEY=your_api_key_here`

### Installation

```bash
npm install
npm run build
```

### Running

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server runs on port 3005 by default for SSE connections.

## API Tools

### `geolocation_search`

Search for places by name or type.

### `geolocation_nearby`

Find places within a radius of a location.

### `geolocation_route`

Compute optimal routes between locations.

### `geolocation_get_user_location`

Request browser geolocation (requires user permission).

## Environment Variables

- `GOOGLE_MAPS_API_KEY`: Required for Google Maps API access
- `SSE_PORT`: Override default SSE server port (default: 3005)

## Cost Considerations

Google Maps Platform pricing:

- Places API: $17/1K requests (Text Search), $32/1K requests (Nearby Search)
- Routes API: $5/1K requests (basic), $10/1K requests (advanced with traffic)
- Free tier: $200/month credit (~10K-40K requests depending on API mix)

Alternative: Use Mapbox (50K free requests/month) or OpenStreetMap Nominatim (free, self-hosted).
