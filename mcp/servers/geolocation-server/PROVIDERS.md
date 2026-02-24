# Geolocation Service Providers

This document outlines the capabilities and limitations of different geolocation service providers supported by this MCP server.

## Provider Comparison

### Places Search Providers

| Feature               | Google Places API  | Nominatim (OSM) |
| --------------------- | ------------------ | --------------- |
| **API Key Required**  | ✅ Yes             | ❌ No           |
| **Cost**              | Paid (per request) | Free            |
| **Rate Limiting**     | Generous           | 1 req/sec       |
| **Address Geocoding** | ✅ Excellent       | ✅ Good         |
| **POI Database**      | ✅ Comprehensive   | ⚠️ Limited      |
| **Place Ratings**     | ✅ Yes             | ❌ No           |
| **User Reviews**      | ✅ Yes             | ❌ No           |
| **Opening Hours**     | ✅ Yes             | ❌ No           |
| **Photos**            | ✅ Yes             | ❌ No           |
| **Price Levels**      | ✅ Yes             | ❌ No           |
| **Real-time Data**    | ✅ Yes             | ❌ No           |

### Routing Providers

| Feature                | Google Routes API           | OSRM (OSM)           |
| ---------------------- | --------------------------- | -------------------- |
| **API Key Required**   | ✅ Yes                      | ❌ No                |
| **Cost**               | Paid (per request)          | Free                 |
| **Rate Limiting**      | Generous                    | Public server limits |
| **Travel Modes**       | Drive, Walk, Cycle, Transit | Drive, Walk, Cycle   |
| **Real-time Traffic**  | ✅ Yes                      | ❌ No                |
| **Avoid Options**      | ✅ Tolls, Highways, Ferries | ❌ No                |
| **Departure Time**     | ✅ Yes                      | ❌ No                |
| **Traffic Prediction** | ✅ Yes                      | ❌ No                |
| **Alternative Routes** | ✅ Yes                      | ✅ Yes               |
| **Step Instructions**  | ✅ Yes                      | ✅ Yes               |

## Provider-Specific Details

### Google Places API

**Configuration:**

- Set `GOOGLE_MAPS_API_KEY` environment variable
- Enable Places API (New) in Google Cloud Console
- Recommended for production applications requiring rich POI data

**Supported Place Types:**
Google supports a comprehensive taxonomy of place types. See [Google's documentation](https://developers.google.com/maps/documentation/places/web-service/place-types) for the full list.

**Best Use Cases:**

- Applications requiring ratings, reviews, and user-generated content
- Real-time business information (opening hours, current status)
- Rich POI data with photos and detailed information
- When budget allows for paid API usage

### Nominatim (OpenStreetMap)

**Configuration:**

- No configuration required
- Uses public OSM data
- Respects usage policy (1 request/second)

**Supported Place Types:**
Nominatim uses OSM's tagging system. Common amenity types include:

- `restaurant`, `cafe`, `bar`, `pub`
- `hotel`, `hospital`, `pharmacy`
- `bank`, `atm`, `post_office`
- `fuel`, `parking`, `charging_station`
- `school`, `library`, `museum`
- See [OSM Map Features](https://wiki.openstreetmap.org/wiki/Map_Features) for more

**Best Use Cases:**

- Free, open-source projects
- Geocoding and address search
- Finding major landmarks and amenities
- When real-time business data is not required

**Limitations:**

- No ratings, reviews, or user-generated content
- No opening hours or real-time availability
- No photos or price levels
- Limited POI data compared to commercial services
- Stricter rate limiting (1 req/sec for free tier)

### Google Routes API

**Configuration:**

- Set `GOOGLE_MAPS_API_KEY` environment variable
- Enable Routes API in Google Cloud Console
- Recommended for production applications requiring traffic data

**Travel Modes:**

- `driving`: Car routing with real-time traffic
- `walking`: Pedestrian routing
- `cycling`: Bicycle routing
- `transit`: Public transportation routing

**Advanced Features:**

- Real-time traffic data and prediction
- Avoid tolls, highways, or ferries
- Departure time for traffic forecasting
- Traffic models (best_guess, pessimistic, optimistic)

**Best Use Cases:**

- Applications requiring real-time traffic information
- Route optimization with avoid preferences
- Time-sensitive routing with departure times
- Enterprise applications with budget for API costs

### OSRM (Open Source Routing Machine)

**Configuration:**

- No configuration required for public server
- Set `OSRM_SERVER_URL` to use your own instance
- Public server at `https://router.project-osrm.org`

**Travel Modes:**

- `car`: Driving routing
- `foot`: Walking routing
- `bike`: Cycling routing

**Features:**

- Fast routing with alternative routes
- Step-by-step turn instructions
- Based on OpenStreetMap data
- No real-time traffic data

**Best Use Cases:**

- Free, open-source projects
- Basic routing without traffic requirements
- Self-hosted routing solutions
- Testing and development

**Limitations:**

- No real-time traffic data
- No transit routing
- Cannot avoid tolls, highways, or ferries
- No departure time or traffic prediction
- Public server has usage limits

## Provider Selection Strategy

The server automatically selects providers based on configuration:

### Places Search

1. **Google Places API** - Used if `GOOGLE_MAPS_API_KEY` is set
2. **Nominatim (OSM)** - Fallback when Google is not configured

### Routing

1. **Google Routes API** - Used if `GOOGLE_MAPS_API_KEY` is set
2. **OSRM** - Fallback when Google is not configured

## Configuration Examples

### Using Google (Recommended for Production)

```bash
# Set Google Maps API Key
export GOOGLE_MAPS_API_KEY="your-api-key-here"

# Start the server - will automatically use Google providers
npm start
```

### Using Open Source Providers (Free)

```bash
# No configuration needed - will automatically use OSM providers
npm start

# Optionally set custom OSRM server
export OSRM_SERVER_URL="https://your-osrm-server.com"
npm start
```

### Hybrid Configuration

You can use Google for one service and OSM for another by selectively setting environment variables, though this is not typical.

## Rate Limiting

### Google APIs

- Generous rate limits based on your plan
- Typically allows many requests per second
- Monitor usage in Google Cloud Console

### Nominatim

- 1 request per second for free tier
- Enforced by client with 1.1 second delay
- Consider hosting your own Nominatim instance for higher loads

### OSRM Public Server

- Shared public server with community limits
- For high-volume usage, host your own OSRM instance
- See [OSRM documentation](http://project-osrm.org/) for self-hosting

## Schema Compatibility

All providers implement the same interface and return data matching the common schema. However:

- **Optional fields** may be undefined if the provider doesn't support them
- **Provider-specific parameters** in requests may be ignored with warnings
- **Type formats** may vary between providers (e.g., place types, polyline encoding)

The schema is designed to be **provider-agnostic**, with clear documentation of which fields are provider-specific.

## Future Providers

The architecture supports adding new providers. Potential candidates:

- **Places:** MapBox, HERE, Azure Maps, OpenTripPlanner
- **Routing:** Valhalla, GraphHopper, MapBox Directions, HERE Routing

To add a new provider:

1. Implement the `IPlacesProvider` or `IRoutesProvider` interface
2. Add provider detection logic in the service manager
3. Update this documentation with provider capabilities
