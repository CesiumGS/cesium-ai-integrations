import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  GeocodeInputSchema,
  GeocodeResponseSchema,
  type GeocodeInput,
} from "../schemas/index.js";
import type { IGeocodeProvider } from "../services/places-provider.interface.js";
import {
  ICommunicationServer,
  ResponseEmoji,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
} from "@cesium-mcp/shared";

/**
 * Register the geolocation_geocode tool
 * Converts address or place name to geographic coordinates
 * Returns a single best matching location (not a list of POIs)
 *
 * Best providers:
 * - Nominatim: Free, excellent for addresses and landmarks
 * - Google: Commercial, very accurate
 *
 * NOT supported by:
 * - Overpass: Use Nominatim or Google for geocoding
 */
export function registerGeolocationGeocode(
  server: McpServer,
  communicationServer: ICommunicationServer | undefined,
  placesProvider: IGeocodeProvider,
): void {
  server.registerTool(
    "geolocation_geocode",
    {
      title: "Geocode Address to Coordinates",
      description:
        "Convert an address, landmark, or place name to geographic coordinates. " +
        'Use this for "What are the coordinates of X?" or "Where is X located?" queries. ' +
        'Examples: "Empire State Building", "Eiffel Tower", "1600 Pennsylvania Avenue", "Tokyo Tower", "Tokyo, Japan". ' +
        "Returns a SINGLE best matching location (not a list). " +
        'DO NOT use for finding multiple businesses by category (use geolocation_search for "find restaurants", "find hotels", etc.).',
      inputSchema: GeocodeInputSchema.shape,
      outputSchema: GeocodeResponseSchema.shape,
    },
    async (params: GeocodeInput) => {
      const startTime = Date.now();

      try {
        const result = await placesProvider.geocode(params);
        const responseTime = Date.now() - startTime;

        // Send location to client for visualization (if available)
        if (communicationServer && result.location) {
          await communicationServer
            .executeCommand(
              {
                type: "geolocation_geocode",
                location: result.location,
                displayName: result.displayName,
                boundingBox: result.boundingBox,
              },
              5000, // 5 second timeout
            )
            .catch((err) => {
              // Non-fatal: visualization failed but geocoding succeeded
              console.warn("[Geocode] Failed to visualize location:", err);
            });
        }

        const output = {
          success: true,
          location: result.location,
          displayName: result.displayName,
          address: result.address,
          boundingBox: result.boundingBox,
          message:
            `${result.displayName}\n` +
            `📏 Coordinates: ${result.location.latitude.toFixed(6)}, ${result.location.longitude.toFixed(6)}${
              result.address ? `\n🏠 Address: ${result.address}` : ""
            }`,
          stats: {
            queryTime: responseTime,
            resultsCount: 1,
          },
        };

        return buildSuccessResponse(
          ResponseEmoji.Location,
          responseTime,
          output,
        );
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMsg = formatErrorMessage(error);

        const output = {
          success: false,
          message: `Geocoding failed: ${errorMsg}`,
          stats: {
            queryTime: responseTime,
            resultsCount: 0,
          },
        };

        return buildErrorResponse(responseTime, output);
      }
    },
  );
}
