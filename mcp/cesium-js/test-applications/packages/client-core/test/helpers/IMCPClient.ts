/** Shape returned by MCP server tool calls. */
export interface MCPCallToolResult {
  content: { type: string; text?: string; [key: string]: unknown }[];
  structuredContent: {
    success: boolean;
    error?: string;
    animationId?: string;
    animations: Array<{ animationId: string; [key: string]: unknown }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/** Shape returned by MCP server tool listing. */
export interface MCPListToolsResult {
  tools: {
    name: string;
    description?: string;
    inputSchema?: unknown;
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

export interface IMCPClient {
  start(): Promise<void>;
  callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<MCPCallToolResult>;
  listTools(): Promise<MCPListToolsResult>;
  stop(): Promise<void>;
}
