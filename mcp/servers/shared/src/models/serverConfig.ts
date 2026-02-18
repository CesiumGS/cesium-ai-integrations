export interface ServerConfig {
  port: number;
  maxRetries: number;
  strictPort?: boolean; // If true, only use the specified port and fail if unavailable
  corsOrigin?: string; // CORS origin configuration (default: "*")
  shutdownTimeout?: number; // Graceful shutdown timeout in milliseconds
  logLevel?: "info" | "warn" | "error" | "debug"; // Logging level
}

export interface ServerStats {
  port: number;
  clients: number;
  uptime: number; // Server uptime in milliseconds
  commandsExecuted: number; // Total commands executed
}
