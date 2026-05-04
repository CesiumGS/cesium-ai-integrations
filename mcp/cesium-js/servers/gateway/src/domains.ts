import { ToolRegistrationFunction } from "@cesium-mcp/shared";
import { registerCameraTools } from "@cesium-mcp/camera-server/tools";
import { registerEntityTools } from "@cesium-mcp/entity-server/tools";
import { registerAllAnimationTools } from "@cesium-mcp/animation-server/tools";
import { registerImageryTools } from "@cesium-mcp/imagery-server/tools";
import { registerTilesTools } from "@cesium-mcp/tiles-server/tools";
import { registerTerrainTools } from "@cesium-mcp/terrain-server/tools";

/**
 * Domain definition mapping a domain name to its tool registration function.
 */
export interface DomainDefinition {
  name: string;
  registerTools: ToolRegistrationFunction;
}

/**
 * All available domain definitions.
 */
export const ALL_DOMAINS: DomainDefinition[] = [
  { name: "camera", registerTools: registerCameraTools },
  { name: "entity", registerTools: registerEntityTools },
  { name: "animation", registerTools: registerAllAnimationTools },
  { name: "imagery", registerTools: registerImageryTools },
  { name: "tiles", registerTools: registerTilesTools },
  { name: "terrain", registerTools: registerTerrainTools },
];

/**
 * All valid domain names.
 */
export const VALID_DOMAIN_NAMES = ALL_DOMAINS.map((d) => d.name);

/**
 * Filter domains by the CESIUM_DOMAINS environment variable.
 * If not set or empty, returns all domains.
 */
export function getEnabledDomains(
  envValue: string | undefined,
): DomainDefinition[] {
  if (!envValue || envValue.trim() === "") {
    return ALL_DOMAINS;
  }

  const requested = envValue
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);

  const invalid = requested.filter((r) => !VALID_DOMAIN_NAMES.includes(r));
  if (invalid.length > 0) {
    console.error(
      `Warning: Unknown domain(s): ${invalid.join(", ")}. Valid domains: ${VALID_DOMAIN_NAMES.join(", ")}`,
    );
  }

  return ALL_DOMAINS.filter((d) => requested.includes(d.name));
}
