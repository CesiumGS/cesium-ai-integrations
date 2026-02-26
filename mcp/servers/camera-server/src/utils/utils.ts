import {
  CommandInput,
  CommandResult,
  ICommunicationServer,
} from "@cesium-mcp/shared";
import { StructuredContent } from "./types.js";

/**
 * Formats error messages consistently
 */
export function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

/**
 * Executes a command with timing measurement
 */
export async function executeWithTiming<
  T extends CommandResult = CommandResult,
>(
  communicationServer: ICommunicationServer,
  command: CommandInput,
  timeoutMs?: number,
): Promise<{ result: T; responseTime: number }> {
  const startTime = Date.now();
  const result = (await communicationServer.executeCommand(
    command,
    timeoutMs,
  )) as T;
  const responseTime = Date.now() - startTime;
  return { result, responseTime };
}

/**
 * Builds a success response structure
 */
export function buildSuccessResponse<T extends StructuredContent>(
  responseTime: number,
  structuredContent: T,
) {
  return {
    content: [
      {
        type: "text" as const,
        text: `${structuredContent.message} (${responseTime}ms)`,
      },
    ],
    structuredContent,
  };
}

/**
 * Builds an error response structure
 */
export function buildErrorResponse<T extends StructuredContent>(
  responseTime: number,
  structuredContent: T,
) {
  return {
    content: [
      {
        type: "text" as const,
        text: `Error: ${structuredContent.message} (${responseTime}ms)`,
      },
    ],
    structuredContent,
    isError: true,
  };
}
