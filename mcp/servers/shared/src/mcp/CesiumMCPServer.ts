import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import { randomUUID } from "crypto";
import type { Server as HttpServer } from "http";
import { ICommunicationServer } from "../communications/communication-server.js";
import { ServerConfig } from "../models/serverConfig.js";
import {
  MCPServerConfig,
  ToolRegistrationFunction,
} from "../models/mcpServerConfig.js";
import { MCP_PORT_OFFSET } from "../utils/constants.js";

/**
 * Generic MCP Server class that handles common setup for all Cesium MCP servers
 */
export class CesiumMCPServer {
  private mcpServer: McpServer;
  private communicationServer?: ICommunicationServer;
  private config: MCPServerConfig;
  private toolRegistrationFunctions: ToolRegistrationFunction[] = [];
  private serverConfig?: ServerConfig;
  private mcpTransportApp?: express.Application;
  private mcpTransportServer?: HttpServer;

  constructor(
    config: MCPServerConfig,
    communicationServer?: ICommunicationServer,
  ) {
    this.config = config;
    this.communicationServer = communicationServer;

    this.mcpServer = new McpServer({
      name: this.config.name,
      version: this.config.version,
    });

    if (this.communicationServer && this.config.communicationServerPort) {
      this.serverConfig = {
        port: this.config.communicationServerPort,
        maxRetries: this.config.communicationServerMaxRetries ?? 10,
        strictPort: this.config.communicationServerStrictPort ?? true,
      };
    }
  }

  /**
   * Register tools with the MCP server
   * Note: Tool registration functions will receive undefined for communicationServer if not provided
   */
  public registerTools(...registrationFns: ToolRegistrationFunction[]): void {
    this.toolRegistrationFunctions.push(...registrationFns);
  }

  /**
   * Start the MCP server with optional communication server and transport
   */
  public async start(): Promise<void> {
    try {
      // Start communication server if provided
      if (this.communicationServer && this.serverConfig) {
        const actualPort = await this.communicationServer.start(
          this.serverConfig,
        );
        console.error(`Communication server started on port ${actualPort}`);
      }

      // Register all tools
      for (const registerFn of this.toolRegistrationFunctions) {
        registerFn(this.mcpServer, this.communicationServer);
      }

      // Start MCP server with configured transport
      const transportType = this.config.mcpTransport || "stdio";

      switch (transportType) {
        case "stdio":
          await this.startStdioTransport();
          break;
        case "streamable-http":
          await this.startStreamableHttpTransport();
          break;
        default:
          throw new Error(`Unsupported transport type: ${transportType}`);
      }

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      console.error(`✅ ${this.config.name} started successfully`);
    } catch (error) {
      console.error(`❌ Failed to start ${this.config.name}:`, error);
      throw error;
    }
  }

  /**
   * Start stdio transport (default)
   */
  private async startStdioTransport(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);
    console.error("MCP Server running with stdio transport");
  }

  /**
   * Start Streamable HTTP transport (recommended for HTTP-based scenarios)
   */
  private async startStreamableHttpTransport(): Promise<void> {
    const endpoint = this.config.mcpTransportEndpoint || "/mcp";
    const mcpPort =
      (this.config.communicationServerPort || 3000) + MCP_PORT_OFFSET; // Use different port for MCP transport

    this.mcpTransportApp = express();
    this.mcpTransportApp.use(express.json());

    // Create transport with session management
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        console.error(`Session initialized: ${sessionId}`);
      },
      onsessionclosed: (sessionId) => {
        console.error(`Session closed: ${sessionId}`);
      },
    });

    await this.mcpServer.connect(transport);

    // Handle all HTTP methods for the MCP endpoint
    this.mcpTransportApp.all(endpoint, async (req: Request, res: Response) => {
      await transport.handleRequest(req, res, req.body);
    });

    this.mcpTransportServer = this.mcpTransportApp.listen(mcpPort, () => {
      console.error(
        `MCP Server running with Streamable HTTP transport on port ${mcpPort}${endpoint}`,
      );
    });
  }

  /**
   * Stop the server gracefully
   */
  public async stop(): Promise<void> {
    console.error("\n🛑 Shutting down...");

    // Close MCP transport server if it exists
    if (this.mcpTransportServer) {
      await new Promise<void>((resolve) => {
        this.mcpTransportServer!.close(() => {
          console.error("MCP transport server closed");
          resolve();
        });
      });
    }

    // Stop communication server if it exists
    if (this.communicationServer) {
      await this.communicationServer.stop();
    }
    // MCP server doesn't have an explicit stop method
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      await this.stop();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }
}
