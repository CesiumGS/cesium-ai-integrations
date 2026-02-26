/**
 * Centralized schema exports for the geolocation server
 *
 * These schemas are provider-agnostic, supporting multiple geocoding and routing
 * services (Google, OSM/Nominatim, OSRM, etc.). See PROVIDERS.md for details.
 *
 * - core-schemas.ts:     Fundamental geographic data types (Position, PlaceType, TravelMode)
 * - tool-schemas.ts:     Tool-specific input schemas
 * - response-schemas.ts: Tool output / response schemas
 */

export * from "./core-schemas.js";
export * from "./tool-schemas.js";
export * from "./response-schemas.js";
