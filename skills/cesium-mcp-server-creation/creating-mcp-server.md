# Creating a New Cesium MCP Server

This guide walks through creating a new MCP server for Cesium from scratch. We'll use an **Entity Server** as an example to demonstrate the complete process.

## Related Documentation

- **[Tool and Schema Patterns](./tool-and-schema-patterns.md)** - Detailed patterns for creating tools and defining schemas
- **[Integrating with PoC Samples](./integrating-poc-samples.md)** - Complete guide for integrating with the PoC web app

## Prerequisites

- Node.js 18+ installed
- pnpm package manager
- Familiarity with TypeScript and CesiumJS concepts
- Understanding of the MCP protocol (optional but helpful)

## Step 1: Create Project Structure

Create a new directory for your server in the `mcp/servers/` directory:

```bash
cd mcp/servers
mkdir entity-server
cd entity-server
```

Create the following directory structure:

```
entity-server/
├── src/
│   ├── index.ts              # Server entry point
│   ├── schemas/
│   │   ├── index.ts          # Schema exports
│   │   ├── core-schemas.ts   # Core type definitions
│   │   ├── tool-schemas.ts   # Tool input/output schemas
│   │   └── response-schemas.ts # Response structures
│   ├── tools/
│   │   ├── index.ts          # Tool registration
│   │   └── entity-create.ts  # Example tool
│   └── utils/
│       ├── constants.ts      # Constants
│       └── utils.ts          # Helper functions
├── build/                    # Compiled output (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

## Step 2: Setup package.json

Create `package.json` with appropriate dependencies:

```json
{
  "name": "@cesium-mcp/[feature]-server",
  "version": "1.0.0",
  "description": "MCP server for Cesium [feature] management",
  "type": "module",
  "main": "./build/index.js",
  "bin": {
    "cesium-[feature]-mcp": "./build/index.js"
  },
  "scripts": {
    "build": "tsc",
    "clean": "rimraf build",
    "dev": "tsx src/index.ts",
    "start": "node build/index.js"
  },
  "keywords": [
    "mcp",
    "cesium",
    "entity",
    "3d"
  ],
  "license": "Apache-2.0",
  "exports": {
    ".": "./build/index.js"
  },
  "dependencies": {
    "@cesium-mcp/shared": "workspace:*",
    "@modelcontextprotocol/sdk": "^1.26.0",
    "dotenv": "^16.4.7",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@types/node": "^25.2.2",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3"
  }
}
```

## Step 3: Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "rootDir": "./src",
    "outDir": "./build",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build"]
}
```

## Step 4: Define Core Schemas

> **📖 For comprehensive schema patterns and best practices, see [Tool and Schema Patterns](./tool-and-schema-patterns.md)**

Create `src/schemas/core-schemas.ts` with reusable Zod schemas. Example:

```typescript
import { z } from "zod";

export const PositionSchema = z.object({
  longitude: z.number().min(-180).max(180).describe("Longitude in degrees"),
  latitude: z.number().min(-90).max(90).describe("Latitude in degrees"),
  height: z.number().min(0).describe("Height above ground in meters"),
});

export const EntityIdSchema = z.string().min(1).describe("Unique entity identifier");

export type Position = z.infer<typeof PositionSchema>;
```

See the [Tool and Schema Patterns](./tool-and-schema-patterns.md) guide for complete examples of core schemas, color definitions, and schema composition patterns.

## Step 5: Define Tool Schemas

Create `src/schemas/tool-schemas.ts` for tool-specific inputs. Example:

```typescript
import { z } from "zod";
import { PositionSchema, EntityIdSchema } from "./core-schemas.js";

export const CreatePointEntityInputSchema = z.object({
  id: EntityIdSchema,
  position: PositionSchema.describe("Geographic position of the point"),
  // Additional properties...
});

export type CreatePointEntityInput = z.infer<typeof CreatePointEntityInputSchema>;
```

See [Tool and Schema Patterns](./tool-and-schema-patterns.md) for complete input schema examples and composition patterns.

## Step 6: Define Response Schemas

Create `src/schemas/response-schemas.ts`:

```typescript
import { z } from "zod";

export const EntityResponseSchema = z.object({
  success: z.boolean().describe("Operation success status"),
  message: z.string().describe("Human-readable result message"),
  entityId: z.string().optional().describe("ID of affected entity"),
  stats: z.object({
    responseTime: z.number().describe("Operation time in milliseconds"),
    clientCount: z.number().optional().describe("Number of connected clients"),
  }),
});

export type EntityResponse = z.infer<typeof EntityResponseSchema>;
```

## Step 7: Create Schema Index

Create `src/schemas/index.ts`:

```typescript
export * from "./core-schemas.js";
export * from "./tool-schemas.js";
export * from "./response-schemas.js";
```

## Step 8: Create Utility Constants

Create `src/utils/constants.ts`:

```typescript
/**
 * Default timeout for operations (ms)
 */
export const DEFAULT_TIMEOUT_MS = 5000;

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
```

## Step 9: Create Utility Functions

Create `src/utils/utils.ts`:

```typescript
import { ICommunicationServer } from "@cesium-mcp/shared";
import { ResponseEmoji } from "./constants.js";

/**
 * Execute command with timing
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
 * Build success response
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
          uri: "cesium://entity/response",
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
          uri: "cesium://entity/error",
          mimeType: "application/json",
          text: JSON.stringify(errorData, null, 2),
        },
      },
    ],
    isError: true,
  };
}

/**
 * Format error message
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
```

## Step 10: Implement a Tool

> **📖 For detailed tool implementation patterns and examples, see [Tool and Schema Patterns](./tool-and-schema-patterns.md)**

Create `src/tools/entity-create.ts` - here's a simplified structure:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ICommunicationServer } from "@cesium-mcp/shared";
import {
  CreatePointEntityInputSchema,
  EntityResponseSchema,
} from "../schemas/index.js";
import {
  DEFAULT_TIMEOUT_MS,
  ResponseEmoji,
} from "../utils/constants.js";
import {
  executeWithTiming,
  formatErrorMessage,
  buildSuccessResponse,
  buildErrorResponse,
} from "../utils/utils.js";

export function registerCreatePointEntity(
  server: McpServer,
  communicationServer: ICommunicationServer,
): void {
  server.registerTool(
    "entity_create_point",
    {
      title: "Create Point Entity",
      description: "Create a point entity at a specified geographic location",
      inputSchema: CreatePointEntityInputSchema.shape,
      outputSchema: EntityResponseSchema.shape,
    },
    async ({ id, position, properties, point }) => {
      try {
        const command = {
          type: "entity_create_point",
          id,
          position,
          properties: properties || {},
          point: point || { pixelSize: 10, color: { red: 1, green: 1, blue: 0, alpha: 1 } },
        };

        const { result, responseTime } = await executeWithTiming(
          communicationServer,
          command,
          DEFAULT_TIMEOUT_MS,
        );

        if (result.success) {
          return buildSuccessResponse(ResponseEmoji.Success, responseTime, {
            success: true,
            message: `Created point entity '${id}'`,
            entityId: id,
            stats: { responseTime, clientCount: result.clientCount },
          });
        }

        throw new Error(result.error || "Unknown error from client");
      } catch (error) {
        return buildErrorResponse(0, {
          success: false,
          message: `Failed to create entity: ${formatErrorMessage(error)}`,
          entityId: id,
          stats: { responseTime: 0 },
        });
      }
    },
  );
}
```

See [Tool and Schema Patterns](./tool-and-schema-patterns.md) for complete examples with validation, error handling, and best practices.

## Step 11: Create Tool Registration Index

Create `src/tools/index.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICommunicationServer } from "@cesium-mcp/shared";
import { registerCreatePointEntity } from "./entity-create.js";
// Import other tool registrations here

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
  // Register additional tools here
}
```

## Step 12: Create Server Entry Point

Create `src/index.ts`:

```typescript
#!/usr/bin/env node

import "dotenv/config";
import {
  CesiumMCPServer,
  CesiumSSEServer,
  CesiumWebSocketServer,
} from "@cesium-mcp/shared";
import { register[Feature]Tools } from "./tools/index.js";

const PORT = parseInt(
  process.env.PORT || process.env.[FEATURE]_SERVER_PORT || "3003",
);
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || "10");
const PROTOCOL = process.env.COMMUNICATION_PROTOCOL || "websocket";
const STRICT_PORT = process.env.STRICT_PORT === "true";

async function main() {
  try {
    // Create communication server based on protocol
    const communicationServer =
      PROTOCOL === "sse" ? new CesiumSSEServer() : new CesiumWebSocketServer();

    // Create MCP server
    const server = new CesiumMCPServer(
      {
        name: "cesium-[feature]-mcp-server",
        version: "1.0.0",
        communicationServerPort: PORT,
        communicationServerMaxRetries: MAX_RETRIES,
        communicationServerStrictPort: STRICT_PORT,
      },
      communicationServer,
    );

    console.error(
      `🚀 Entity Server starting with ${PROTOCOL.toUpperCase()} on port ${PORT} (strictPort: ${STRICT_PORT})`,
    );

    // Register entity tools
    server.registerTools(registerEntityTools);

    // Start the server
    await server.start();
  } catch (error) {
    console.error("❌ Failed to start entity server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
```

## Step 13: Install Dependencies

From the server directory:

```bash
pnpm install
```

## Step 14: Build the Server

```bash
pnpm run build
```

This compiles TypeScript to the `build/` directory.

## Step 15: Test the Server

Run in development mode:

```bash
pnpm run dev
```

The server should start and wait for MCP client connections.

## Step 16: Add to Workspace Configuration

Update `mcp/pnpm-workspace.yaml` if it doesn't already include your server:

```yaml
packages:
  - "servers/*"
  - "PoC/CesiumJs/packages/*"
  - "PoC/CesiumJs/web-app"
```

Add a dev script to the root `mcp/package.json`:

```json
{
  "scripts": {
    "dev:entity": "cd servers/entity-server && pnpm run dev"
  }
}
```

## Step 17: Create README.md

Document your server's capabilities:

```markdown
# 🎯 Cesium Entity MCP Server

MCP server for creating and managing entities in CesiumJS applications.

## Features

- **Point Entities**: Create customizable point markers
- **Entity Management**: Add, remove, and update entities
- **Property Control**: Manage visibility, names, and descriptions

## Installation

\`\`\`bash
pnpm install
pnpm run build
\`\`\`

## Running

\`\`\`bash
pnpm run dev    # Development
pnpm start      # Production
\`\`\`

## Tools

### 1. `entity_create_point`

Create a point entity at a geographic location.

**Input:**
- `id`: Unique entity identifier
- `position`: Location (longitude, latitude, height)
- `properties`: Optional display properties
- `point`: Optional appearance settings

**Output:**
- Success status and entity details
```

## Next Steps

1. **Add More Tools**: Create additional entity types (billboards, labels, models, polygons)
2. **Implement Update/Delete**: Add tools to modify or remove entities
3. **Add Query Tools**: Enable entity search and information retrieval
4. **Integration**: Connect to the PoC web application following [Integrating with PoC Samples](./integrating-poc-samples.md)
   - Note: Remember to add your server to the `mcpServers` array in `web-app/src/app.ts` (Step 4)

## Common Patterns

### Multiple Tool Registration

```typescript
// tools/index.ts
export function registerEntityTools(server, communicationServer) {
  registerCreatePointEntity(server, communicationServer);
  registerCreateBillboardEntity(server, communicationServer);
  registerRemoveEntity(server, communicationServer);
  registerUpdateEntity(server, communicationServer);
  registerQueryEntity(server, communicationServer);
}
```

### Schema Composition

```typescript
// Reuse common schemas
const BaseEntitySchema = z.object({
  id: EntityIdSchema,
  position: PositionSchema,
  properties: EntityPropertiesSchema.optional(),
});

const BillboardEntitySchema = BaseEntitySchema.extend({
  billboard: z.object({
    image: z.string().url(),
    scale: z.number().positive().optional(),
  }),
});
```

### Error Handling with Context

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
  
  return buildSuccessResponse(ResponseEmoji.Success, responseTime, {
    success: true,
    message: `Operation completed successfully`,
    // ... additional data
  });
} catch (error) {
  console.error(`Tool execution failed:`, error);
  return buildErrorResponse(0, {
    success: false,
    message: formatErrorMessage(error),
    // ... error context
  });
}
```

## Troubleshooting

### Port Already in Use

Change the port in environment variables or `.env`:

```bash
[FEATURE]_SERVER_PORT=3004
```

### Connection Timeout

Increase timeout in tool implementation:

```typescript
const CUSTOM_TIMEOUT_MS = 10000; // 10 seconds
const { result, responseTime } = await executeWithTiming(
  communicationServer,
  command,
  CUSTOM_TIMEOUT_MS,
);
```

### Schema Validation Errors

Enable detailed Zod error messages:

```typescript
try {
  const validated = MySchema.parse(input);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Validation errors:", error.errors);
  }
  throw error;
}
```

## Best Practices

1. **Descriptive Tool Names**: Use `[domain]_[action]_[target]` pattern
2. **Comprehensive Schemas**: Include descriptions for all fields
3. **Optional Parameters**: Provide sensible defaults
4. **Response Consistency**: Always include success, message, and stats
5. **Timeout Calculation**: Base on expected operation duration
6. **Logging**: Use `console.error` for server logs (stdout reserved for MCP)
7. **Type Safety**: Export Zod inferred types for reuse
8. **Documentation**: Keep README.md updated with all tools

## Resources

- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [Zod Documentation](https://zod.dev/)
