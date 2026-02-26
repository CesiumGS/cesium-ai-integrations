import { ICommunicationServer, TIMEOUT_BUFFER_MS } from "@cesium-mcp/shared";
import type { Place } from "../schemas/index.js";

/**
 * Sends an array of places to the client for visualization
 * @param communicationServer - The communication server instance (optional - visualization skipped if undefined)
 * @param type - The command type (e.g., "geolocation_search", "geolocation_nearby")
 * @param places - Array of places to send
 */
export async function sendPlacesToClient(
  communicationServer: ICommunicationServer | undefined,
  type: string,
  places: Place[],
): Promise<void> {
  // Skip visualization if no communication server or no places
  if (!communicationServer || places.length === 0) {
    return;
  }

  await communicationServer.executeCommand(
    {
      type,
      places: places.map((p) => ({
        id: p.id,
        name: p.name,
        location: p.location,
        rating: p.rating,
        types: p.types,
      })),
    },
    TIMEOUT_BUFFER_MS,
  );
}

/**
 * Creates a standard place search response output structure
 * @param success - Whether the operation succeeded
 * @param places - Array of places found
 * @param responseTime - Time taken for the operation in ms
 * @param customMessage - Optional custom message, defaults to standard message
 * @param additionalContext - Optional additional context for error messages
 */
export function createPlacesResponseOutput(
  success: boolean,
  places: Place[],
  responseTime: number,
  customMessage?: string,
  additionalContext?: string,
) {
  if (success) {
    return {
      success: true,
      places,
      message: customMessage ?? `Found ${places.length} place(s)`,
      stats: {
        queryTime: responseTime,
        resultsCount: places.length,
      },
    };
  }

  const baseMessage = customMessage ?? "Search failed";
  const fullMessage = additionalContext
    ? `${baseMessage}: ${additionalContext}`
    : baseMessage;

  return {
    success: false,
    places: [],
    message: fullMessage,
    stats: {
      queryTime: responseTime,
      resultsCount: 0,
    },
  };
}
