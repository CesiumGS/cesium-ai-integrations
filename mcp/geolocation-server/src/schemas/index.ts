/**
 * Centralized schema exports for the geolocation server
 *
 * These schemas support OSM-based geocoding and routing services
 * (Nominatim, Overpass, OSRM). See PROVIDERS.md for details.
 *
 * - core-schemas.ts:     Fundamental geographic data types (Position, PlaceType, TravelMode)
 * - tool-schemas.ts:     Tool-specific input schemas
 * - response-schemas.ts: Tool output / response schemas
 */

export * from "./core-schemas.js";
export * from "./tool-schemas.js";
export * from "./response-schemas.js";
