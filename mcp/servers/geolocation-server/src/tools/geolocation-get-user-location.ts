import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import { UserLocationResponseSchema } from "../schemas/index.js";
import { GEOLOCATION_TIMEOUT_MS } from "../utils/constants.js";

/**
 * Register geolocation_get_user_location tool
 */
export function registerGeolocationGetUserLocation(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "geolocation_get_user_location",
    {
      title: "Get User Location",
      description:
        'Request the user\'s current location from the browser (requires user permission). Useful for "near me" queries.',
      inputSchema: {},
      outputSchema: UserLocationResponseSchema.shape,
    },
    async () => {
      try {
        const result = await communicationServer.executeCommand(
          {
            type: "geolocation_get_user_location",
          },
          GEOLOCATION_TIMEOUT_MS,
        );

        if (result.success && result.location) {
          return {
            content: [
              {
                type: "text",
                text:
                  `✅ User location acquired\n` +
                  `📍 Lat: ${(result.location as { latitude: number; longitude: number }).latitude.toFixed(6)}, Lon: ${(result.location as { latitude: number; longitude: number }).longitude.toFixed(6)}\n` +
                  `🎯 Accuracy: ${result.accuracy ? `±${(result.accuracy as number).toFixed(0)}m` : "Unknown"}`,
              },
            ],
            structuredContent: {
              success: true,
              location: result.location,
              message: "Location acquired",
              accuracy: result.accuracy,
              timestamp: Date.now(),
            },
          };
        }

        throw new Error(
          (result.error as string) || "Failed to get location",
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text: `❌ Location request failed: ${errorMessage}\n\n💡 Make sure to grant location permission in your browser`,
            },
          ],
          structuredContent: {
            success: false,
            message: errorMessage,
            timestamp: Date.now(),
          },
          isError: true,
        };
      }
    },
  );
}
