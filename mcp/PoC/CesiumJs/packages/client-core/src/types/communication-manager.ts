
export interface CommunicationManager {
  connect(): Promise<void>;
  disconnect(): void;
  getConnectionStatus(): ConnectionStatus;
}

export interface ConnectionStatus {
  servers: ServerStatus[];
  totalServers: number;
  connectedServers: number;
}

export interface ServerStatus {
  name: string;
  port: number;
  capabilities: string[];
  isConnected: boolean;
  readyState: string | number;
  reconnectAttempts?: number;
}