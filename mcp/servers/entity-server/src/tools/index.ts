import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICommunicationServer } from "@cesium-mcp/shared";
import { registerAddPointEntity } from "./entity-add-point.js";
import { registerAddBillboardEntity } from "./entity-add-billboard.js";
import { registerAddLabelEntity } from "./entity-add-label.js";
import { registerAddModelEntity } from "./entity-add-model.js";
import { registerAddPolygonEntity } from "./entity-add-polygon.js";
import { registerAddPolylineEntity } from "./entity-add-polyline.js";
import { registerListEntities } from "./entity-list.js";
import { registerRemoveEntity } from "./entity-remove.js";

/**
 * Register all entity tools with the MCP server
 */
export function registerEntityTools(
  server: McpServer,
  communicationServer: ICommunicationServer | undefined,
): void {
  if (!communicationServer) {
    throw new Error(
      "Entity tools require a communication server for browser visualization",
    );
  }

  // Register all entity tools
  registerAddPointEntity(server, communicationServer);
  registerAddBillboardEntity(server, communicationServer);
  registerAddLabelEntity(server, communicationServer);
  registerAddModelEntity(server, communicationServer);
  registerAddPolygonEntity(server, communicationServer);
  registerAddPolylineEntity(server, communicationServer);
  registerListEntities(server, communicationServer);
  registerRemoveEntity(server, communicationServer);

  console.error("✅ Registered 8 entity tools");
}
