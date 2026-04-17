import {
  McpServer,
  RegisteredTool,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICommunicationServer } from "@cesium-mcp/shared";
import { DomainDefinition } from "./domains.js";

/**
 * Tracks which RegisteredTool instances belong to each domain.
 */
export interface DomainState {
  name: string;
  tools: Map<string, RegisteredTool>;
  enabled: boolean;
}

/**
 * Registry that manages domain-to-tool mappings.
 * Uses a proxy on McpServer.registerTool to intercept tool registrations
 * and associate them with the current domain being registered.
 */
export class DomainRegistry {
  private domains: Map<string, DomainState> = new Map();

  /**
   * Register a domain's tools by calling its registration function while
   * intercepting all registerTool calls to track the resulting RegisteredTool objects.
   */
  registerDomain(
    domain: DomainDefinition,
    mcpServer: McpServer,
    communicationServer: ICommunicationServer | undefined,
  ): void {
    const domainState: DomainState = {
      name: domain.name,
      tools: new Map(),
      enabled: true,
    };

    // Wrap registerTool to capture the returned RegisteredTool.
    // IMPORTANT: wrapped via try/finally so a throwing domain registration
    // cannot permanently pollute mcpServer.registerTool.
    // Note: registerTool has multiple overloads, so we type-erase args to unknown[]
    // and cast the wrapper back to the original type — this is safe because we
    // only forward arguments verbatim and return the original result.
    // We keep the original reference for restoration, and use a bound copy
    // for invocation (so `this` is preserved when calling through).
    const originalRegisterTool = mcpServer.registerTool;
    const boundOriginal = originalRegisterTool.bind(mcpServer);
    const wrappedRegisterTool = ((...args: unknown[]) => {
      const registeredTool = (
        boundOriginal as (...a: unknown[]) => RegisteredTool
      )(...args);
      const name = args[0] as string;
      domainState.tools.set(name, registeredTool);
      return registeredTool;
    }) as unknown as typeof mcpServer.registerTool;

    mcpServer.registerTool = wrappedRegisterTool;
    try {
      domain.registerTools(mcpServer, communicationServer);
    } finally {
      // Always restore original registerTool, even if registration throws
      mcpServer.registerTool = originalRegisterTool;
    }

    this.domains.set(domain.name, domainState);
  }

  /**
   * Disable all tools in a domain.
   */
  disableDomain(name: string): boolean {
    const domain = this.domains.get(name);
    if (!domain) {
      return false;
    }
    if (!domain.enabled) {
      return true;
    }

    for (const tool of domain.tools.values()) {
      tool.disable();
    }
    domain.enabled = false;
    return true;
  }

  /**
   * Enable all tools in a domain.
   */
  enableDomain(name: string): boolean {
    const domain = this.domains.get(name);
    if (!domain) {
      return false;
    }
    if (domain.enabled) {
      return true;
    }

    for (const tool of domain.tools.values()) {
      tool.enable();
    }
    domain.enabled = true;
    return true;
  }

  /**
   * List all domains with their status.
   */
  listDomains(): Array<{
    name: string;
    enabled: boolean;
    toolCount: number;
    tools: string[];
  }> {
    return Array.from(this.domains.values()).map((d) => ({
      name: d.name,
      enabled: d.enabled,
      toolCount: d.tools.size,
      tools: Array.from(d.tools.keys()),
    }));
  }

  /**
   * Get a specific domain state.
   */
  getDomain(name: string): DomainState | undefined {
    return this.domains.get(name);
  }

  /**
   * Get all registered domain names.
   */
  getDomainNames(): string[] {
    return Array.from(this.domains.keys());
  }
}
