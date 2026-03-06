/**
 * Stdio MCP test client.
 *
 * Spawns an MCP server as a child process and communicates via stdin/stdout
 * using the official MCP SDK. Use this to test MCP servers over stdio transport.
 *
 * Usage:
 *   const client = new StdioMCPClient({
 *     serverDir: path.resolve(__dirname, '../path/to/server'),
 *     port: 4003,
 *   });
 *   await client.start();
 *   const result = await client.callTool('tool_name', { arg: 'value' });
 *   await client.stop();
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  type IMCPClient,
  type MCPCallToolResult,
  type MCPListToolsResult,
} from "./IMCPClient";

export interface StdioMCPClientConfig {
  /** Absolute path to the MCP server directory (must contain build/index.js) */
  serverDir: string;
  /** Port for the communication server (WebSocket/SSE) */
  port: number;
  /** Client name sent during MCP initialize handshake (default: 'mcp-stdio-test') */
  clientName?: string;
  /** Additional environment variables for the server process */
  env?: Record<string, string>;
}

export class StdioMCPClient implements IMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private config: Required<StdioMCPClientConfig>;

  constructor(config: StdioMCPClientConfig) {
    this.config = {
      clientName: "mcp-stdio-test",
      env: {},
      ...config,
    };
  }

  /** Spawn the server and perform the MCP initialize handshake. */
  async start(): Promise<void> {
    this.transport = new StdioClientTransport({
      command: process.execPath,
      args: ["build/index.js"],
      cwd: this.config.serverDir,
      env: {
        ...process.env,
        PORT: this.config.port.toString(),
        COMMUNICATION_PROTOCOL: "websocket",
        STRICT_PORT: "true",
        ...this.config.env,
      },
    });

    this.client = new Client(
      { name: this.config.clientName, version: "1.0.0" },
      { capabilities: {} },
    );

    await this.client.connect(this.transport);
  }

  /** Call an MCP tool and return the result. */
  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<MCPCallToolResult> {
    if (!this.client) {
      throw new Error("Client not started");
    }
    return this.client.callTool({
      name,
      arguments: args,
    }) as Promise<MCPCallToolResult>;
  }

  /** List all available tools from the MCP server. */
  async listTools(): Promise<MCPListToolsResult> {
    if (!this.client) {
      throw new Error("Client not started");
    }
    return this.client.listTools() as Promise<MCPListToolsResult>;
  }

  /** Close the connection and kill the server process. */
  async stop(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.transport = null;
    }
  }
}
