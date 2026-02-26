# MCP Tool and Schema Creation Patterns

This guide provides detailed patterns and best practices for creating MCP tools and defining schemas in Cesium MCP servers.

## Table of Contents

- [Schema Design with Zod](#schema-design-with-zod)
- [Tool Creation Patterns](#tool-creation-patterns)
- [Response Formatting](#response-formatting)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## Schema Design with Zod

All MCP server tools use **Zod schemas** for type-safe validation and automatic documentation generation.

### Schema Organization

Organize schemas into three files within `src/schemas/`:

```
src/schemas/
├── core-schemas.ts       # Reusable core types
├── tool-schemas.ts       # Tool input schemas
├── response-schemas.ts   # Tool output schemas
└── index.ts              # Export aggregator
```

### Core Schemas

**Purpose**: Define reusable building blocks shared across multiple tools.

**Example**: `src/schemas/core-schemas.ts`

```typescript
import { z } from "zod";

/**
 * Geographic position (WGS84)
 */
export const PositionSchema = z.object({
  longitude: z.number()
    .min(-180)
    .max(180)
    .describe("Longitude in degrees (-180 to 180)"),
  latitude: z.number()
    .min(-90)
    .max(90)
    .describe("Latitude in degrees (-90 to 90)"),
  height: z.number()
    .min(0)
    .describe("Height above ground in meters"),
});

/**
 * RGBA color with normalized values
 */
export const ColorSchema = z.object({
  red: z.number().min(0).max(1).describe("Red component (0-1)"),
  green: z.number().min(0).max(1).describe("Green component (0-1)"),
  blue: z.number().min(0).max(1).describe("Blue component (0-1)"),
  alpha: z.number().min(0).max(1).optional().default(1).describe("Alpha transparency (0-1)"),
});

/**
 * Duration for animations
 */
export const DurationSchema = z.number()
  .min(0)
  .describe("Duration in seconds");

/**
 * Entity identifier
 */
export const EntityIdSchema = z.string()
  .min(1)
  .describe("Unique entity identifier");

// Export inferred types
export type Position = z.infer<typeof PositionSchema>;
export type Color = z.infer<typeof ColorSchema>;
```

**Key Principles**:
- Add `.describe()` to every field for automatic documentation
- Use `.min()` and `.max()` for validation constraints
- Export TypeScript types with `z.infer<>`
- Keep schemas focused and composable

### Tool Input Schemas

**Purpose**: Define inputs specific to each tool.

**Example**: `src/schemas/tool-schemas.ts`

```typescript
import { z } from "zod";
import { PositionSchema, ColorSchema, EntityIdSchema } from "./core-schemas.js";

/**
 * Create a point entity
 */
export const CreatePointEntityInputSchema = z.object({
  id: EntityIdSchema,
  position: PositionSchema.describe("Location of the point"),
  properties: z.object({
    name: z.string().optional().describe("Display name"),
    description: z.string().optional().describe("Entity description"),
    show: z.boolean().optional().default(true).describe("Initial visibility"),
  }).optional(),
  point: z.object({
    pixelSize: z.number().min(1).max(100).optional().default(10).describe("Point size in pixels"),
    color: ColorSchema.optional().describe("Point color"),
    outlineColor: ColorSchema.optional().describe("Outline color"),
    outlineWidth: z.number().min(0).max(10).optional().default(2).describe("Outline width"),
  }).optional(),
});

/**
 * Update entity visibility
 */
export const UpdateEntityVisibilityInputSchema = z.object({
  id: EntityIdSchema,
  show: z.boolean().describe("Visibility state"),
});

/**
 * Remove an entity
 */
export const RemoveEntityInputSchema = z.object({
  id: EntityIdSchema,
});

// Export types
export type CreatePointEntityInput = z.infer<typeof CreatePointEntityInputSchema>;
export type UpdateEntityVisibilityInput = z.infer<typeof UpdateEntityVisibilityInputSchema>;
export type RemoveEntityInput = z.infer<typeof RemoveEntityInputSchema>;
```

**Key Principles**:
- Compose from core schemas for consistency
- Provide sensible defaults with `.default()`
- Use `.optional()` for non-required fields
- Group related properties in nested objects
- Export inferred types for use in tool implementations

### Response Schemas

**Purpose**: Define consistent output structures for all tools.

**Example**: `src/schemas/response-schemas.ts`

```typescript
import { z } from "zod";

/**
 * Standard statistics included in all responses
 */
export const ResponseStatsSchema = z.object({
  responseTime: z.number().describe("Operation time in milliseconds"),
  clientCount: z.number().optional().describe("Number of connected clients"),
  actualDuration: z.number().optional().describe("Actual animation duration if different from requested"),
});

/**
 * Standard response for entity operations
 */
export const EntityResponseSchema = z.object({
  success: z.boolean().describe("Operation success status"),
  message: z.string().describe("Human-readable result message"),
  entityId: z.string().optional().describe("ID of affected entity"),
  stats: ResponseStatsSchema,
});

/**
 * Response for entity query operations
 */
export const EntityQueryResponseSchema = z.object({
  success: z.boolean().describe("Query success status"),
  message: z.string().describe("Result message"),
  entities: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
    type: z.string(),
    visible: z.boolean(),
  })).optional().describe("Array of found entities"),
  stats: ResponseStatsSchema,
});

// Export types
export type EntityResponse = z.infer<typeof EntityResponseSchema>;
export type EntityQueryResponse = z.infer<typeof EntityQueryResponseSchema>;
export type ResponseStats = z.infer<typeof ResponseStatsSchema>;
```

**Key Principles**:
- Always include `success`, `message`, and `stats`
- Use consistent structure across all response types
- Add domain-specific fields as needed
- Make supplementary data optional

### Schema Composition

Reuse and extend existing schemas:

```typescript
// Base entity schema
const BaseEntitySchema = z.object({
  id: EntityIdSchema,
  position: PositionSchema,
  properties: EntityPropertiesSchema.optional(),
});

// Extend for specific entity types
export const PointEntitySchema = BaseEntitySchema.extend({
  point: PointStyleSchema,
});

export const BillboardEntitySchema = BaseEntitySchema.extend({
  billboard: BillboardStyleSchema,
});

export const ModelEntitySchema = BaseEntitySchema.extend({
  model: ModelStyleSchema,
});
```

### Schema Index

**Always create an index file**: `src/schemas/index.ts`

```typescript
export * from "./core-schemas.js";
export * from "./tool-schemas.js";
export * from "./response-schemas.js";
```

---

## Tool Creation Patterns

### Tool Structure

Every tool follows this registration pattern:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";

export function registerMyTool(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "tool_name",                    // Tool identifier (kebab-case)
    {
      title: "Human-Readable Name", // Display name
      description: "What this tool does and when to use it",
      inputSchema: InputSchema.shape,   // Zod schema shape
      outputSchema: OutputSchema.shape, // Zod schema shape
    },
    async (params) => {             // Tool implementation
      // Tool logic here
    },
  );
}
```

### Tool Naming Convention

Format: `[domain]_[action]_[target]`

**Examples**:
- `camera_fly_to` - Camera domain, fly action, to a location
- `entity_create_point` - Entity domain, create action, point type
- `camera_set_view` - Camera domain, set action, view target
- `entity_remove` - Entity domain, remove action

### Complete Tool Implementation

**Example**: `src/tools/entity-create.ts`

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import {
  CreatePointEntityInputSchema,
  EntityResponseSchema,
  type CreatePointEntityInput,
} from "../schemas/index.js";
import {
  DEFAULT_TIMEOUT_MS,
  ResponseEmoji,
  DEFAULT_POINT_SIZE,
} from "../utils/constants.js";
import {
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
} from "../utils/utils.js";

/**
 * Register the create point entity tool
 */
export function registerCreatePointEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_create_point",
    {
      title: "Create Point Entity",
      description:
        "Create a point entity at a specified geographic location with customizable appearance. " +
        "Use this to add markers, landmarks, or points of interest to the 3D scene.",
      inputSchema: CreatePointEntityInputSchema.shape,
      outputSchema: EntityResponseSchema.shape,
    },
    async (params: CreatePointEntityInput) => {
      try {
        // Build command with defaults
        const command = {
          type: "entity_create_point",
          id: params.id,
          position: params.position,
          properties: params.properties || {},
          point: {
            pixelSize: params.point?.pixelSize || DEFAULT_POINT_SIZE,
            color: params.point?.color || { red: 1, green: 1, blue: 0, alpha: 1 },
            outlineColor: params.point?.outlineColor || { red: 0, green: 0, blue: 0, alpha: 1 },
            outlineWidth: params.point?.outlineWidth || 2,
          },
        };

        // Execute with timing
        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
          DEFAULT_TIMEOUT_MS,
        );

        // Check result
        if (result.success) {
          const output = {
            success: true,
            message: `Created point entity '${params.id}' at ${params.position.latitude}°N, ${params.position.longitude}°E`,
            entityId: params.id,
            stats: {
              responseTime,
              clientCount: result.clientCount,
            },
          };

          return buildSuccessResponse(
            ResponseEmoji.Success,
            responseTime,
            output,
          );
        }

        // Handle client-side failure
        throw new Error(result.error || "Unknown error from client");
        
      } catch (error) {
        // Handle errors
        const errorOutput = {
          success: false,
          message: `Failed to create entity: ${formatErrorMessage(error)}`,
          entityId: params.id,
          stats: {
            responseTime: 0,
          },
        };

        return buildErrorResponse(0, errorOutput);
      }
    },
  );
}
```

### Tool Registration Index

**File**: `src/tools/index.ts`

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICommunicationServer } from "@cesium-mcp/shared";
import { registerCreatePointEntity } from "./entity-create.js";
import { registerRemoveEntity } from "./entity-remove.js";
import { registerUpdateEntity } from "./entity-update.js";
import { registerQueryEntities } from "./entity-query.js";

/**
 * Register all entity tools with the MCP server
 */
export function registerEntityTools(
  server: McpServer,
  communicationServer: ICommunicationServer | undefined,
): void {
  if (!communicationServer) {
    throw new Error(
      "Entity tools require a communication server for browser interaction",
    );
  }

  // Register all tools
  registerCreatePointEntity(server, communicationServer);
  registerRemoveEntity(server, communicationServer);
  registerUpdateEntity(server, communicationServer);
  registerQueryEntities(server, communicationServer);
  
  console.error("✅ Registered 4 entity tools");
}
```

---

## Response Formatting

### Utility Functions

**File**: `src/utils/utils.ts`

```typescript
import { ICommunicationServer } from "@cesium-mcp/shared";
import { ResponseEmoji } from "./constants.js";

/**
 * Execute command with timing measurement
 */
export async function executeWithTiming(
  communicationServer: ICommunicationServer,
  command: any,
  timeoutMs: number,
): Promise<{ result: any; responseTime: number }> {
  const startTime = Date.now();
  const result = await communicationServer.sendCommand(command, timeoutMs);
  const responseTime = Date.now() - startTime;
  return { result, responseTime };
}

/**
 * Build successful response with emoji and resource
 */
export function buildSuccessResponse(
  emoji: ResponseEmoji,
  responseTime: number,
  data: any,
): { content: any[] } {
  return {
    content: [
      {
        type: "text",
        text: `${emoji} ${data.message} (${responseTime}ms)`,
      },
      {
        type: "resource",
        resource: {
          uri: `cesium://${data.entityId || "operation"}/response`,
          mimeType: "application/json",
          text: JSON.stringify(data, null, 2),
        },
      },
    ],
  };
}

/**
 * Build error response
 */
export function buildErrorResponse(
  responseTime: number,
  errorData: any,
): { content: any[]; isError: true } {
  return {
    content: [
      {
        type: "text",
        text: `${ResponseEmoji.Error} ${errorData.message} (${responseTime}ms)`,
      },
      {
        type: "resource",
        resource: {
          uri: "cesium://error",
          mimeType: "application/json",
          text: JSON.stringify(errorData, null, 2),
        },
      },
    ],
    isError: true,
  };
}

/**
 * Format error message from various error types
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
```

### Constants

**File**: `src/utils/constants.ts`

```typescript
/**
 * Default timeout for operations (ms)
 */
export const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Timeout for long operations (ms)
 */
export const LONG_TIMEOUT_MS = 15000;

/**
 * Response emojis for visual feedback
 */
export enum ResponseEmoji {
  Success = "✅",
  Error = "❌",
  Info = "ℹ️",
  Warning = "⚠️",
}

/**
 * Default entity properties
 */
export const DEFAULT_POINT_SIZE = 10;
export const DEFAULT_OUTLINE_WIDTH = 2;
export const DEFAULT_BILLBOARD_SCALE = 1.0;
```

---

## Error Handling

### Validation Errors

Zod automatically validates inputs. Handle validation errors explicitly if needed:

```typescript
import { z } from "zod";

try {
  const validated = CreatePointEntityInputSchema.parse(params);
  // Use validated data
} catch (error) {
  if (error instanceof z.ZodError) {
    return buildErrorResponse(0, {
      success: false,
      message: `Validation error: ${error.errors.map(e => e.message).join(", ")}`,
      stats: { responseTime: 0 },
    });
  }
  throw error;
}
```

### Communication Errors

Handle timeouts and connection issues:

```typescript
try {
  const { result, responseTime } = await executeWithTiming(
    communicationServer,
    command,
    timeoutMs,
  );
  
  if (!result.success) {
    throw new Error(result.error || "Operation failed");
  }
  
  return buildSuccessResponse(ResponseEmoji.Success, responseTime, result);
  
} catch (error) {
  // Check for timeout
  if (error instanceof Error && error.message.includes("timeout")) {
    return buildErrorResponse(0, {
      success: false,
      message: `Operation timed out after ${timeoutMs}ms`,
      stats: { responseTime: timeoutMs },
    });
  }
  
  // Check for connection error
  if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
    return buildErrorResponse(0, {
      success: false,
      message: "Could not connect to browser client",
      stats: { responseTime: 0 },
    });
  }
  
  // Generic error
  return buildErrorResponse(0, {
    success: false,
    message: formatErrorMessage(error),
    stats: { responseTime: 0 },
  });
}
```

### Logging Best Practices

```typescript
// Use console.error for server logs (stdout is for MCP protocol)
console.error("🚀 Starting entity server...");
console.error(`✅ Created entity: ${entityId}`);
console.error(`❌ Failed to create entity: ${error.message}`);
console.error(`⚠️ Warning: Using default color`);

// Include context in error logs
console.error(`Failed to create entity "${params.id}":`, error);
```

---

## Best Practices

### Schema Design

✅ **DO**: Add `.describe()` to every field • Use validation constraints • Provide defaults • Export TypeScript types • Compose from smaller schemas

❌ **DON'T**: Create overly complex nested schemas • Forget descriptions • Use `any` or loose validation • Duplicate definitions

### Tool Implementation

✅ **DO**: Use `[domain]_[action]_[target]` naming • Provide detailed descriptions • Measure timing • Handle all errors • Log to `console.error` • Return consistent responses

❌ **DON'T**: Use generic names • Skip error handling • Log to `console.log` (breaks MCP protocol) • Return inconsistent structures

### Response Formatting

✅ **DO**: Include `success`, `message`, `stats` • Use emojis for feedback • Include timing • Provide detailed errors • Return structured JSON

❌ **DON'T**: Return plain strings • Skip timing • Use vague errors

### Code Organization

✅ **DO**: Separate files per tool • Export registration functions • Create utility functions • Use TypeScript • Follow consistent structure

❌ **DON'T**: Put all tools in one file • Duplicate utility code • Mix concerns

### Testing

✅ **DO**: Test valid and invalid inputs • Test timeouts • Test with no clients • Test error conditions

❌ **DON'T**: Only test happy path • Skip edge cases • Forget concurrent operations

---

## Examples

### Simple Tool (No Client Communication)

```typescript
export function registerGetServerInfo(server: McpServer): void {
  server.registerTool(
    "server_get_info",
    {
      title: "Get Server Information",
      description: "Retrieve server version and capabilities",
      inputSchema: z.object({}).shape,
      outputSchema: z.object({
        version: z.string(),
        capabilities: z.array(z.string()),
      }).shape,
    },
    async () => {
      return {
        content: [
          {
            type: "text",
            text: "Server information retrieved",
          },
          {
            type: "resource",
            resource: {
              uri: "cesium://server/info",
              mimeType: "application/json",
              text: JSON.stringify({
                version: "1.0.0",
                capabilities: ["entities", "camera", "terrain"],
              }, null, 2),
            },
          },
        ],
      };
    },
  );
}
```

### Tool with Animation (Long Operation)

```typescript
export function registerAnimateEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_animate",
    {
      title: "Animate Entity",
      description: "Animate entity movement along a path",
      inputSchema: AnimateEntityInputSchema.shape,
      outputSchema: EntityResponseSchema.shape,
    },
    async (params) => {
      try {
        const command = {
          type: "entity_animate",
          id: params.id,
          path: params.path,
          duration: params.duration,
        };

        // Use longer timeout for animations
        const timeout = params.duration * 1000 + 2000; // duration + 2s buffer
        
        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
          timeout,
        );

        if (result.success) {
          return buildSuccessResponse(
            ResponseEmoji.Success,
            responseTime,
            {
              success: true,
              message: `Animated entity '${params.id}' over ${params.duration}s`,
              entityId: params.id,
              stats: {
                responseTime,
                actualDuration: result.actualDuration,
              },
            },
          );
        }

        throw new Error(result.error || "Animation failed");
        
      } catch (error) {
        return buildErrorResponse(0, {
          success: false,
          message: `Animation failed: ${formatErrorMessage(error)}`,
          entityId: params.id,
          stats: { responseTime: 0 },
        });
      }
    },
  );
}
```

---

## Reference

- **Camera Server**: Reference implementation at `mcp/servers/camera-server/`
- **Shared Package**: Base classes at `mcp/servers/shared/`
- **Zod Documentation**: https://zod.dev/
- **MCP SDK**: https://github.com/modelcontextprotocol/typescript-sdk

---

## Next Steps

After creating your tools and schemas:

1. See [creating-mcp-server.md](./creating-mcp-server.md) for complete server setup
2. See [integrating-poc-samples.md](./integrating-poc-samples.md) for client integration
3. Test your tools with the PoC web application