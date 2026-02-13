import express, { Request, Response } from "express";
import cors from "cors";
import type { Server as HttpServer } from "http";
import { randomUUID } from "crypto";
import { ICommunicationServer } from "./communication-server.js";
import {
  CommandInput,
  CommandPayload,
  CommandResult,
  ServerConfig,
  ServerStats,
  LogLevel,
} from "../index.js";
import {
  DEFAULT_COMMAND_TIMEOUT_MS,
  HEARTBEAT_INTERVAL_MS,
  GRACEFUL_SHUTDOWN_TIMEOUT_MS,
  ServerDefaults,
} from "../constants.js";

/**
 * Interface for pending command promise handlers
 */
interface PendingCommand {
  resolve: (value: CommandResult) => void;
  reject: (reason?: Error) => void;
  timeout: NodeJS.Timeout;
}

interface ServerToStart {
  listen: (port: number, callback: () => void) => HttpServer;
}

/**
 * Base class implementing common command execution logic and HTTP setup
 */
export abstract class BaseCommunicationServer implements ICommunicationServer {
  protected pendingCommands: Map<string, PendingCommand> = new Map();
  protected actualPort: number = 0;
  protected app: express.Application;
  protected server: HttpServer | null = null;
  protected heartbeatInterval?: NodeJS.Timeout;
  protected startTime: number = 0;
  protected commandsExecuted: number = 0;
  protected logLevel: LogLevel = "info";

  public constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Get the server instance to start (can be HTTP server or other)
   * Subclasses override this to return their specific server instance
   */
  protected abstract getServerToStart(): ServerToStart;

  /**
   * Get the protocol name for logging
   */
  protected abstract getProtocolName(): string;

  /**
   * Stop the communication server and close all connections
   */
  public abstract stop(): Promise<void>;

  /**
   * Log a message at the specified level
   */
  protected log(level: LogLevel, message: string, ...args: unknown[]): void {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    if (messageLevelIndex >= currentLevelIndex) {
      const prefix = `[${level.toUpperCase()}]`;
      console.error(prefix, message, ...args);
    }
  }

  /**
   * Setup Express middleware (CORS, JSON parsing)
   */
  protected setupMiddleware(): void {
    // CORS will be configured in start() with config
    this.app.use(express.json());
  }

  /**
   * Setup common HTTP routes (health check endpoint)
   * Subclasses can override to add protocol-specific routes
   */
  protected setupRoutes(): void {
    // Enhanced health check endpoint
    this.app.get("/mcp/health", (req: Request, res: Response) => {
      const stats = this.getStats();
      res.json({
        status: "healthy",
        connected: this.isClientConnected(),
        timestamp: new Date().toISOString(),
        port: stats.port,
        clients: stats.clients,
        uptime: stats.uptime,
        commandsExecuted: stats.commandsExecuted,
      });
    });
  }

  /**
   * Hook method called after server successfully starts and binds to a port
   * Subclasses can override this to perform initialization that depends on the server being ready
   */
  protected onServerStarted(): void {
    // Default implementation does nothing
  }

  /**
   * Generic start method that handles port binding and retries
   */
  public async start(config: ServerConfig): Promise<number> {
    // Configure logging level
    this.logLevel = config.logLevel || "info";

    // Configure CORS
    const corsOrigin = config.corsOrigin || ServerDefaults.CORS_ORIGIN;
    this.app.use(
      cors({
        origin: corsOrigin,
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Cache-Control", "Connection"],
      }),
    );

    return new Promise((resolve, reject) => {
      this.tryBindPort(config, resolve, reject);
    });
  }

  /**
   * Attempt to bind to a port with retry logic
   */
  private tryBindPort(
    config: ServerConfig,
    resolve: (port: number) => void,
    reject: (error: Error) => void,
    currentPort?: number,
    retriesLeft?: number,
  ): void {
    const port = currentPort ?? config.port;
    const retries = retriesLeft ?? config.maxRetries;
    const strictPort = config.strictPort ?? false;
    const serverToStart = this.getServerToStart();

    this.server = serverToStart.listen(port, () => {
      this.actualPort = port;
      this.startTime = Date.now();
      this.log(
        "info",
        `${this.getProtocolName()} server running on port ${port}`,
      );
      this.onServerStarted();
      resolve(port);
    });

    this.server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        if (strictPort) {
          reject(
            new Error(
              `Port ${config.port} is in use and strictPort mode is enabled. Please free up port ${config.port} or disable strictPort.`,
            ),
          );
        } else if (retries > 0) {
          this.log(
            "warn",
            `Port ${port} is in use, trying port ${port + 1}...`,
          );
          this.tryBindPort(config, resolve, reject, port + 1, retries - 1);
        } else {
          reject(
            new Error(
              `No available ports found after ${config.maxRetries} retries starting from port ${config.port}`,
            ),
          );
        }
      } else {
        reject(err);
      }
    });
  }

  /**
   * Get server statistics
   */
  public getStats(): ServerStats {
    return {
      port: this.actualPort,
      clients: this.isClientConnected() ? 1 : 0,
      uptime: this.startTime > 0 ? Date.now() - this.startTime : 0,
      commandsExecuted: this.commandsExecuted,
    };
  }

  /**
   * Check if a client is connected
   */
  protected abstract isClientConnected(): boolean;

  /**
   * Send raw data to the client (protocol-specific)
   * @param data The data to send (already stringified)
   */
  protected abstract sendRawData(data: string): void;

  /**
   * Handle connection death (protocol-specific cleanup)
   */
  protected abstract handleConnectionDeath(): void;

  /**
   * Send a command to the client via the transport-specific method
   * @param command Command object with id already assigned
   */
  protected sendCommand(command: CommandPayload): void {
    if (!this.isClientConnected()) {
      throw new Error("No client connected");
    }

    const commandData = JSON.stringify({
      type: "command",
      command: command,
    });

    try {
      this.sendRawData(commandData);
    } catch (error) {
      // Connection is dead
      this.handleConnectionDeath();
      throw error;
    }
  }

  /**
   * Execute a command by sending it to the connected client and waiting for response
   * Uses deferred promise pattern for immediate response when result arrives
   */
  public async executeCommand(
    command: CommandInput,
    timeoutMs: number = DEFAULT_COMMAND_TIMEOUT_MS,
  ): Promise<CommandResult> {
    if (!this.isClientConnected()) {
      throw new Error(
        "No client connected - Cesium application may not be running",
      );
    }

    const commandId = randomUUID();
    const commandPayload: CommandPayload = { ...command, id: commandId };

    // Create deferred promise with timeout
    return new Promise((resolve, reject) => {
      // Setup timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingCommands.delete(commandId);
        reject(
          new Error(
            "Command timeout - Cesium application may not be responding",
          ),
        );
      }, timeoutMs);

      // Store resolver/rejector
      this.pendingCommands.set(commandId, {
        resolve,
        reject,
        timeout: timeoutHandle,
      });

      // Send command
      try {
        this.sendCommand(commandPayload);
        this.commandsExecuted++;
        this.log("debug", `Command sent to client: ${commandId}`);
      } catch (error) {
        clearTimeout(timeoutHandle);
        this.pendingCommands.delete(commandId);
        reject(
          new Error(
            `Failed to send command: ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
      }
    });
  }

  /**
   * Store a command result received from the client
   * Resolves pending promise immediately if command is waiting
   * @param id Command ID
   * @param result Command result
   */
  protected storeCommandResult(id: string, result: CommandResult): void {
    const pending = this.pendingCommands.get(id);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingCommands.delete(id);
      pending.resolve(result);
      this.log("debug", `Command result received: ${id}`);
    } else {
      this.log("warn", `Received result for unknown command ID: ${id}`);
    }
  }

  /**
   * Reject all pending commands with a specific reason
   * Used during shutdown or connection loss
   * @param reason The error message to reject pending promises with
   */
  protected rejectAllPendingCommands(reason: string): void {
    for (const [, pending] of this.pendingCommands.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error(reason));
    }
    this.pendingCommands.clear();
  }

  /**
   * Start a heartbeat interval for keeping connections alive
   * @param onHeartbeat Callback function to execute on each heartbeat
   * @param intervalMs Interval in milliseconds (default: 30 seconds)
   */
  protected startHeartbeat(
    onHeartbeat: () => void,
    intervalMs: number = HEARTBEAT_INTERVAL_MS,
  ): void {
    this.heartbeatInterval = setInterval(onHeartbeat, intervalMs);
  }

  /**
   * Stop and clear the heartbeat interval
   */
  protected cleanupHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  /**
   * Perform common shutdown tasks
   * @param shutdownTimeout Maximum time to wait for graceful shutdown
   */
  protected async performShutdown(shutdownTimeout?: number): Promise<void> {
    const timeout = shutdownTimeout ?? GRACEFUL_SHUTDOWN_TIMEOUT_MS;

    // Reject all pending commands
    this.rejectAllPendingCommands("Server shutting down");

    // Clear heartbeat
    this.cleanupHeartbeat();

    // Wait for server to close with timeout
    if (this.server) {
      return Promise.race([
        new Promise<void>((resolve) => {
          this.server!.close(() => {
            this.log("info", `${this.getProtocolName()} server stopped`);
            resolve();
          });
        }),
        new Promise<void>((resolve) => {
          setTimeout(() => {
            this.log("warn", "Shutdown timeout reached, forcing close");
            resolve();
          }, timeout);
        }),
      ]);
    }
  }
}
