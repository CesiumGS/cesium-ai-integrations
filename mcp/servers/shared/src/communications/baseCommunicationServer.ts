import express, { Request, Response } from 'express';
import cors from 'cors';
import { ServerConfig, ServerStats } from "../models/serverConfig.js";
import { ICommunicationServer } from "./communication-server.js";

/**
 * Interface for pending command promise handlers
 */
interface PendingCommand {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeout: NodeJS.Timeout;
}

/**
 * Base class implementing common command execution logic and HTTP setup
 */
export abstract class BaseCommunicationServer implements ICommunicationServer {
  protected pendingCommands: Map<string, PendingCommand> = new Map();
  protected actualPort: number = 0;
  protected app: express.Application;
  protected server: any = null;

  public constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Get the server instance to start (can be HTTP server or other)
   * Subclasses override this to return their specific server instance
   */
  protected abstract getServerToStart(): any;

  /**
   * Get the protocol name for logging
   */
  protected abstract getProtocolName(): string;

  /**
   * Stop the communication server and close all connections
   */
  public abstract stop(): Promise<void>;

  /**
   * Setup Express middleware (CORS, JSON parsing)
   */
  protected setupMiddleware(): void {
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Cache-Control', 'Connection']
    }));
    this.app.use(express.json());
  }

  /**
   * Setup common HTTP routes (health check endpoint)
   * Subclasses can override to add protocol-specific routes
   */
  protected setupRoutes(): void {
    // Health check endpoint
    this.app.get('/mcp/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        connected: this.isClientConnected(),
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Generic start method that handles port binding and retries
   */
  public async start(config: ServerConfig): Promise<number> {
    return new Promise((resolve, reject) => {
      let port = config.port;
      let retries = config.maxRetries;
      const strictPort = config.strictPort ?? false;

      const tryPort = (portToTry: number) => {
        this.server = this.getServerToStart();
        
        this.server.listen(portToTry, () => {
          this.actualPort = portToTry;
          console.error(`${this.getProtocolName()} server running on port ${portToTry}`);
          resolve(portToTry);
        });

        this.server.on('error', (err: any) => {
          if (err.code === 'EADDRINUSE') {
            if (strictPort) {
              reject(new Error(`Port ${config.port} is in use and strictPort mode is enabled. Please free up port ${config.port} or disable strictPort.`));
            } else if (retries > 0) {
              console.error(`Port ${portToTry} is in use, trying port ${portToTry + 1}...`);
              retries--;
              tryPort(portToTry + 1);
            } else {
              reject(new Error(`No available ports found after ${config.maxRetries} retries starting from port ${config.port}`));
            }
          } else {
            reject(err);
          }
        });
      };

      tryPort(port);
    });
  }

  /**
   * Get server statistics
   */
  public getStats(): ServerStats {
    return {
      port: this.actualPort,
      clients: this.isClientConnected() ? 1 : 0,
      pendingCommands: this.pendingCommands.size
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
  protected sendCommand(command: any): void {
    if (!this.isClientConnected()) {
      throw new Error('No client connected');
    }

    const commandData = JSON.stringify({
      type: 'command',
      command: command
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
  public async executeCommand(command: any, timeoutMs: number = 10000): Promise<any> {
    if (!this.isClientConnected()) {
      throw new Error('No client connected - Cesium application may not be running');
    }

    const commandId = Date.now().toString() + Math.random().toString(36);
    command.id = commandId;

    // Create deferred promise with timeout
    return new Promise((resolve, reject) => {
      // Setup timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingCommands.delete(commandId);
        reject(new Error('Command timeout - Cesium application may not be responding'));
      }, timeoutMs);

      // Store resolver/rejector
      this.pendingCommands.set(commandId, { resolve, reject, timeout: timeoutHandle });

      // Send command
      try {
        this.sendCommand(command);
        console.error('Command sent to client');
      } catch (error) {
        clearTimeout(timeoutHandle);
        this.pendingCommands.delete(commandId);
        reject(new Error(`Failed to send command: ${error}`));
      }
    });
  }

  /**
   * Store a command result received from the client
   * Resolves pending promise immediately if command is waiting
   * @param id Command ID
   * @param result Command result
   */
  protected storeCommandResult(id: string, result: any): void {
    const pending = this.pendingCommands.get(id);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingCommands.delete(id);
      pending.resolve(result);
    } else {
      console.error(`⚠️ Received result for unknown command ID: ${id}`);
    }
  }

  /**
   * Reject all pending commands with a specific reason
   * Used during shutdown or connection loss
   * @param reason The error message to reject pending promises with
   */
  protected rejectAllPendingCommands(reason: string): void {
    for (const [id, pending] of this.pendingCommands.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error(reason));
    }
    this.pendingCommands.clear();
  }
}