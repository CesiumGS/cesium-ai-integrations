import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import { z } from "zod";
import { UserLocationResponseSchema } from "../schemas/index.js";
import {
  USER_INTERACTION_TIMEOUT_MS,
} from "../utils/constants.js";
import {
  ResponseEmoji,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
} from "@cesium-mcp/shared";

/**
 * Register the geolocation_get_user_location tool
 * Requests the user's current GPS location from the browser
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
        "Request the user's current location from the browser (requires user permission). " +
        'Useful for "near me" queries.',
      inputSchema: z.object({}).shape,
      outputSchema: UserLocationResponseSchema.shape,
    },
    async () => {
      const startTime = Date.now();

      try {
        const result = (await communicationServer.executeCommand(
          { type: "geolocation_get_user_location" },
          USER_INTERACTION_TIMEOUT_MS,
        )) as Record<string, unknown>;

        const responseTime = Date.now() - startTime;

        if (result["success"] && result["location"]) {
          const loc = result["location"] as { latitude: number; longitude: number };
          const accuracy = result["accuracy"] as number | undefined;

          const output = {
            success: true,
            location: loc,
            message:
              `Location acquired — Lat: ${loc.latitude.toFixed(6)}, ` +
              `Lon: ${loc.longitude.toFixed(6)}` +
              (accuracy ? ` (±${accuracy.toFixed(0)}m)` : ""),
            accuracy: accuracy ?? null,
            timestamp: Date.now(),
          };

          return buildSuccessResponse(ResponseEmoji.Location, responseTime, output);
        }

        throw new Error((result["error"] as string | undefined) ?? "Failed to get location");
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const output = {
          success: false,
          message:
            `Location request failed: ${formatErrorMessage(error)}. ` +
            "Make sure to grant location permission in your browser.",
          timestamp: Date.now(),
        };

        return buildErrorResponse(responseTime, output);
      }
    },
  );
}
