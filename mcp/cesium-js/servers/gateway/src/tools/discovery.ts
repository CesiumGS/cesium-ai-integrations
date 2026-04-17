import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DomainRegistry } from "../domain-registry.js";
import { VALID_DOMAIN_NAMES } from "../domains.js";

/**
 * Register the gateway discovery tools (list, enable, disable domains).
 */
export function registerDiscoveryTools(
  server: McpServer,
  registry: DomainRegistry,
): void {
  // List all domains and their status
  server.registerTool(
    "cesium_list_domains",
    {
      title: "List Cesium Domains",
      description:
        "List all available Cesium tool domains with their enabled/disabled status and tool counts",
    },
    () => {
      const domains = registry.listDomains();
      const summary = domains
        .map(
          (d) =>
            `${d.enabled ? "[ON]" : "[OFF]"} ${d.name} (${d.toolCount} tools)`,
        )
        .join("\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `Cesium Gateway Domains:\n\n${summary}\n\nTotal: ${domains.length} domains, ${domains.reduce((sum, d) => sum + d.toolCount, 0)} tools`,
          },
        ],
      };
    },
  );

  // Enable a domain
  server.registerTool(
    "cesium_enable_domain",
    {
      title: "Enable Cesium Domain",
      description:
        "Enable a previously disabled Cesium tool domain, making its tools available again",
      inputSchema: {
        domain: z
          .enum(VALID_DOMAIN_NAMES as [string, ...string[]])
          .describe("The domain to enable"),
      },
    },
    ({ domain }: { domain: string }) => {
      const success = registry.enableDomain(domain);
      if (!success) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Domain "${domain}" not found. Available: ${registry.getDomainNames().join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      const state = registry.getDomain(domain);
      return {
        content: [
          {
            type: "text" as const,
            text: `Domain "${domain}" enabled. ${state?.tools.size ?? 0} tools are now available.`,
          },
        ],
      };
    },
  );

  // Disable a domain
  server.registerTool(
    "cesium_disable_domain",
    {
      title: "Disable Cesium Domain",
      description:
        "Disable a Cesium tool domain, hiding its tools from the tool list. Can be re-enabled later.",
      inputSchema: {
        domain: z
          .enum(VALID_DOMAIN_NAMES as [string, ...string[]])
          .describe("The domain to disable"),
      },
    },
    ({ domain }: { domain: string }) => {
      const success = registry.disableDomain(domain);
      if (!success) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Domain "${domain}" not found. Available: ${registry.getDomainNames().join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Domain "${domain}" disabled. Its tools are now hidden.`,
          },
        ],
      };
    },
  );
}
