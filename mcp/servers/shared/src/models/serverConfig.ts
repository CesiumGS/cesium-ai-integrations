export interface ServerConfig {
  port: number;
  maxRetries: number;
  strictPort?: boolean; // If true, only use the specified port and fail if unavailable
}

export interface ServerStats {
  port: number;
  clients: number;
  pendingCommands: number;
}