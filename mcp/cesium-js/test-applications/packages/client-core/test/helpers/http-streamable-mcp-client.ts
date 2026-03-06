/**
 * HTTP Streamable MCP test client.
 *
 * Spawns an MCP server as a child process with `MCP_TRANSPORT=streamable-http`,
 * waits for it to become ready, then connects over HTTP using the official MCP SDK.
 *
 * This combines process management and MCP protocol into a single class, so tests
 * only need one object for the full lifecycle.
 *
 * Usage:
 *   const client = new HttpStreamableMCPClient({
 *     serverDir: path.resolve(__dirname, '../path/to/server'),
 *     port: 4011,
 *   });
 *   await client.start();
 *   const result = await client.callTool('tool_name', { arg: 'value' });
 *   await client.stop();
 */

import { spawn, type ChildProcess } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  type IMCPClient,
  type MCPCallToolResult,
  type MCPListToolsResult,
} from "./IMCPClient";

export interface HttpStreamableMCPClientConfig {
  /** Absolute path to the MCP server directory (must contain build/index.js) */
  serverDir: string;
  /** Port for the communication server (WebSocket/SSE) */
  port: number;
  /** MCP HTTP port offset from the communication port (default: 1000) */
  mcpPortOffset?: number;
  /** MCP HTTP endpoint path (default: '/mcp') */
  mcpEndpoint?: string;
  /** Client name sent during MCP initialize handshake (default: 'mcp-http-test') */
  clientName?: string;
  /** Additional environment variables for the server process */
  env?: Record<string, string>;
  /** How long to wait for the server ready signal (default: 15000) */
  startTimeoutMs?: number;
}

export class HttpStreamableMCPClient implements IMCPClient {
  private serverProcess: ChildProcess | null = null;
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | null = null;
  private _processExited = false;
  private config: Required<HttpStreamableMCPClientConfig>;

  constructor(config: HttpStreamableMCPClientConfig) {
    this.config = {
      mcpPortOffset: 1000,
      mcpEndpoint: "/mcp",
      clientName: "mcp-http-test",
      env: {},
      startTimeoutMs: 15000,
      ...config,
    };
  }

  /** Spawn the server, wait for readiness, then connect over HTTP. */
  async start(): Promise<void> {
    await this.spawnServer();
    await this.connectClient();
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

  /** Close the MCP session and kill the server process. */
  async stop(): Promise<void> {
    // Close MCP client first
    if (this.client) {
      try {
        await this.client.close();
      } catch {
        // Ignore — server may already be gone
      }
      this.client = null;
      this.transport = null;
    }

    // Then kill the server process
    if (this.serverProcess) {
      const proc = this.serverProcess;
      this.serverProcess = null;

      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          try {
            proc.kill("SIGKILL");
          } catch {
            /* already exited */
          }
          resolve();
        }, 3000);

        if (this._processExited) {
          clearTimeout(timeout);
          resolve();
          return;
        }

        proc.once("exit", () => {
          clearTimeout(timeout);
          resolve();
        });

        try {
          proc.kill("SIGTERM");
        } catch {
          clearTimeout(timeout);
          resolve();
        }
      });
    }
  }

  // ─── private ─────────────────────────────────────────────────────────

  private async spawnServer(): Promise<void> {
    this.serverProcess = spawn(process.execPath, ["build/index.js"], {
      cwd: this.config.serverDir,
      stdio: ["ignore", "ignore", "pipe"],
      env: {
        ...process.env,
        PORT: this.config.port.toString(),
        COMMUNICATION_PROTOCOL: "websocket",
        STRICT_PORT: "true",
        MCP_TRANSPORT: "streamable-http",
        ...this.config.env,
      },
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Server did not become ready within timeout"));
      }, this.config.startTimeoutMs);

      this.serverProcess!.stderr?.on("data", (data: Buffer) => {
        const msg = data.toString().trim();
        if (msg) {
          console.log("[Server stderr]", msg);
        }
        if (/started successfully/i.test(msg)) {
          clearTimeout(timeout);
          resolve();
        }
      });

      this.serverProcess!.on("error", (err) => {
        clearTimeout(timeout);
        reject(new Error(`Server process error: ${err.message}`));
      });

      this.serverProcess!.on("exit", (code, signal) => {
        this._processExited = true;
        clearTimeout(timeout);
        reject(
          new Error(
            `Server process exited before becoming ready (code=${code}, signal=${signal})`,
          ),
        );
      });
    });

    // Give the server a moment to finish binding all ports
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  private async connectClient(): Promise<void> {
    const mcpPort = this.config.port + this.config.mcpPortOffset;
    const url = new URL(
      `http://localhost:${mcpPort}${this.config.mcpEndpoint}`,
    );

    this.transport = new StreamableHTTPClientTransport(url);

    this.client = new Client(
      { name: this.config.clientName, version: "1.0.0" },
      { capabilities: {} },
    );

    await this.client.connect(this.transport);
  }
}
