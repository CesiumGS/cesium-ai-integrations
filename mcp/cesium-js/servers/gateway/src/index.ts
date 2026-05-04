#!/usr/bin/env node

import "dotenv/config";
import {
  CesiumMCPServer,
  CesiumSSEServer,
  CesiumWebSocketServer,
  ToolRegistrationFunction,
} from "@cesium-mcp/shared";
import { getEnabledDomains } from "./domains.js";
import { DomainRegistry } from "./domain-registry.js";
import { registerDiscoveryTools } from "./tools/discovery.js";

const PORT = parseInt(
  process.env.PORT || process.env.GATEWAY_SERVER_PORT || "3010",
);
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || "10");
const PROTOCOL = process.env.COMMUNICATION_PROTOCOL || "websocket";
const STRICT_PORT = process.env.STRICT_PORT === "true";

async function main() {
  try {
    const communicationServer =
      PROTOCOL === "sse" ? new CesiumSSEServer() : new CesiumWebSocketServer();

    const registry = new DomainRegistry();
    const domains = getEnabledDomains(process.env.CESIUM_DOMAINS);

    if (domains.length === 0) {
      console.error(
        "No domains enabled. Set CESIUM_DOMAINS or remove it to enable all.",
      );
      process.exit(1);
    }

    // Single registration function that registers all domain tools + discovery tools
    const gatewayRegistration: ToolRegistrationFunction = (
      mcpServer,
      commServer,
    ) => {
      for (const domain of domains) {
        registry.registerDomain(domain, mcpServer, commServer);
        console.error(`  Registered domain: ${domain.name}`);
      }
      // Register discovery tools (not intercepted — they belong to the gateway itself)
      registerDiscoveryTools(mcpServer, registry);
      console.error("  Registered discovery tools");
    };

    const server = new CesiumMCPServer(
      {
        name: "cesium-gateway-mcp-server",
        version: "1.0.0",
        communicationServerPort: PORT,
        communicationServerMaxRetries: MAX_RETRIES,
        communicationServerStrictPort: STRICT_PORT,
        mcpTransport: (process.env.MCP_TRANSPORT || "stdio") as
          | "stdio"
          | "streamable-http",
      },
      communicationServer,
    );

    const domainNames = domains.map((d) => d.name).join(", ");
    console.error(
      `Gateway starting with ${PROTOCOL.toUpperCase()} on port ${PORT} (domains: ${domainNames})`,
    );

    server.registerTools(gatewayRegistration);
    await server.start();
  } catch (error) {
    console.error("Failed to start gateway server:", error);
    process.exit(1);
  }
}

// Handle errors
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
