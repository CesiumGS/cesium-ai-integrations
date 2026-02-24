import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import { PlacesService } from "../services/places-service.js";
import { RoutesService } from "../services/routes-service.js";
import { registerGeolocationSearch } from "./geolocation-search.js";
import { registerGeolocationNearby } from "./geolocation-nearby.js";
import { registerGeolocationRoute } from "./geolocation-route.js";
import { registerGeolocationGetUserLocation } from "./geolocation-get-user-location.js";

/**
 * Register all geolocation tools with the MCP server
 * @param server              - The MCP server instance
 * @param communicationServer - The communication server for browser interaction
 */
export function registerGeolocationTools(
  server: McpServer,
  communicationServer: ICommunicationServer | undefined,
): void {
  if (!communicationServer) {
    throw new Error(
      "Geolocation tools require a communication server for browser visualization",
    );
  }

  // Shared service instances (shared across tools so caches are reused)
  const placesService = new PlacesService();
  const routesService = new RoutesService();

  registerGeolocationSearch(server, communicationServer, placesService);
  registerGeolocationNearby(server, communicationServer, placesService);
  registerGeolocationRoute(server, communicationServer, routesService);
  registerGeolocationGetUserLocation(server, communicationServer);

  console.error("✅ Registered 4 geolocation tools");
}
