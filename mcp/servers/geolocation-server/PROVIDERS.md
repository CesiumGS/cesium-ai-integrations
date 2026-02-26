# Geolocation Service Providers

This document outlines the capabilities and limitations of different geolocation service providers supported by this MCP server.

## Provider Comparison

### Places Search Providers

| Feature               | Google Places API  | Nominatim (OSM) | Overpass API (OSM) |
| --------------------- | ------------------ | --------------- | ------------------ |
| **API Key Required**  | ✅ Yes             | ❌ No           | ❌ No              |
| **Cost**              | Paid (per request) | Free            | Free               |
| **Rate Limiting**     | Generous           | 1 req/sec       | ~2 req/sec         |
| **Address Geocoding** | ✅ Excellent       | ✅ Good         | ⚠️ Limited         |
| **POI Database**      | ✅ Comprehensive   | ⚠️ Limited      | ✅ Good            |
| **Place Ratings**     | ✅ Yes             | ❌ No           | ❌ No              |
| **User Reviews**      | ✅ Yes             | ❌ No           | ❌ No              |
| **Opening Hours**     | ✅ Yes             | ❌ No           | ❌ No              |
| **Photos**            | ✅ Yes             | ❌ No           | ❌ No              |
| **Price Levels**      | ✅ Yes             | ❌ No           | ❌ No              |
| **Real-time Data**    | ✅ Yes             | ❌ No           | ❌ No              |
| **Best Use Case**     | Rich business data | Geocoding       | POI search         |

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

- No API key required
- **Recommended**: Set `OSM_USER_AGENT` environment variable
  - Format: `"ApplicationName/Version (contact@example.com)"`
  - Required by [Nominatim's usage policy](https://operations.osmfoundation.org/policies/nominatim/)
  - Should include contact information (email or website)
  - Example: `OSM_USER_AGENT="MyApp/1.0 (contact@example.com)"`
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

### Overpass API (OpenStreetMap)

**Configuration:**

- No API key required
- **Recommended**: Set `OSM_USER_AGENT` environment variable
  - Format: `"ApplicationName/Version (contact@example.com)"`
  - Should include contact information (email or website)
  - Example: `OSM_USER_AGENT="MyApp/1.0 (contact@example.com)"`
- Optional: Set `OVERPASS_SERVER_URL` for custom instance
  - Default: `https://overpass-api.de/api/interpreter` (public instance)
  - Self-hosting recommended for production: https://github.com/drolbr/Overpass-API
- Enable with `PLACES_PROVIDER=overpass`
- Respects usage policy (~2 requests/second recommended)

**Supported Place Types:**
Overpass uses OSM's full tagging system with direct queries. Supports all OSM tags including:

- **Amenities**: `restaurant`, `cafe`, `bar`, `pub`, `hotel`, `hospital`, `pharmacy`, `bank`, `atm`, `fuel`, `parking`, `library`
- **Shops**: `supermarket`, `convenience`, `clothes`, `bakery`, `mall`, `department_store`
- **Tourism**: `museum`, `attraction`, `hotel`, `hostel`, `viewpoint`, `artwork`
- **Leisure**: `park`, `playground`, `fitness_centre`, `sports_centre`, `swimming_pool`
- See [OSM Map Features](https://wiki.openstreetmap.org/wiki/Map_Features) for complete list

**Best Use Cases:**

- POI searches (cafes, restaurants, shops)
- "Near me" queries for businesses
- Finding amenities within a specific area
- Free, open-source projects needing better POI coverage than Nominatim
- When self-hosting for unlimited queries

**Advantages over Nominatim:**

- ✅ Better POI search capabilities
- ✅ More flexible querying (Overpass QL)
- ✅ Direct access to OSM amenity database
- ✅ Can self-host for unlimited queries
- ✅ Better for finding businesses by type

**Limitations:**

- No ratings, reviews, or user-generated content
- No opening hours or real-time availability
- No photos or price levels
- Slower than Nominatim for simple geocoding
- More complex query language (handled by provider)
- Public server rate limits (~2 req/sec recommended)
- Less suitable for address/city geocoding than Nominatim

**When to Use Overpass vs Nominatim:**

- **Use Overpass**: "Find cafes near me", "restaurants in downtown", POI searches
- **Use Nominatim**: "Get coordinates of Seattle", "123 Main St address lookup", city/landmark geocoding

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

- No API key required
- **Recommended**: Set `OSM_USER_AGENT` environment variable
  - Format: `"ApplicationName/Version (contact@example.com)"`
  - Best practice for identifying your application
  - Example: `OSM_USER_AGENT="MyApp/1.0 (contact@example.com)"`
- Set `OSRM_SERVER_URL` to use your own instance (optional)
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

- **Places:** MapBox, HERE, Azure Maps, Foursquare, Pelias, Photon
- **Routing:** Valhalla, GraphHopper, MapBox Directions, HERE Routing

To add a new provider:

1. Implement the `IPlacesProvider` or `IRoutesProvider` interface
2. Add provider detection logic in the service manager
3. Update this documentation with provider capabilities
