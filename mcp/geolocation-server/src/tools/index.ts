import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NominatimPlacesProvider } from "../services/providers/osm/nominatim-places-provider.js";
import { OverpassPlacesProvider } from "../services/providers/osm/overpass-places-provider.js";
import { OSRMRoutesProvider } from "../services/providers/osm/osrm-routes-provider.js";
import { registerGeolocationGeocode } from "./geolocation-geocode.js";
import { registerGeolocationSearch } from "./geolocation-search.js";
import { registerGeolocationRoute } from "./geolocation-route.js";

/**
 * Register all geolocation tools with the MCP server
 * @param server - The MCP server instance
 */
export function registerGeolocationTools(server: McpServer): void {
  const geocodeProvider = new NominatimPlacesProvider();
  const searchProvider = new OverpassPlacesProvider();
  const routesProvider = new OSRMRoutesProvider();

  console.error(`📍 Geocode provider: ${geocodeProvider.getProviderName()}`);
  console.error(`🔍 Search provider: ${searchProvider.getProviderName()}`);
  console.error(`🗺️  Routes provider: ${routesProvider.getProviderName()}`);

  registerGeolocationGeocode(server, geocodeProvider);
  registerGeolocationSearch(server, searchProvider);
  registerGeolocationRoute(server, routesProvider);

  console.error(`✅ Registered 3 geolocation tool(s)`);
}
