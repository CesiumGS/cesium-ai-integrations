import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICommunicationServer } from "../communications/communication-server.js";

export type MCPTransportType = "stdio" | "sse" | "streamable-http";

export interface MCPServerConfig {
  name: string;
  version: string;
  communicationServerPort?: number; // Optional - only needed if using browser visualization
  communicationServerMaxRetries?: number;
  communicationServerStrictPort?: boolean;
  mcpTransport?: MCPTransportType;
  mcpTransportEndpoint?: string;
}

export type ToolRegistrationFunction = (
  mcpServer: McpServer,
  communicationServer: ICommunicationServer | undefined,
) => void;
