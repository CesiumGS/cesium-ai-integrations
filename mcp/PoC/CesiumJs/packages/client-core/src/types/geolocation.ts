/**
 * Geolocation-specific types
 */

import type { Position, MCPCommandResult } from "./mcp.js";
import type { Color } from "cesium";

/**
 * Place types from location services
 */
export type PlaceType =
  | "restaurant"
  | "food"
  | "cafe"
  | "coffee"
  | "bar"
  | "hotel"
  | "lodging"
  | "gym"
  | "fitness"
  | "hospital"
  | "health"
  | "pharmacy"
  | "park"
  | "recreation"
  | "shopping"
  | "mall"
  | "store"
  | "bank"
  | "atm"
  | "gas"
  | "fuel"
  | "airport"
  | "transit"
  | "station"
  | "museum"
  | "library"
  | string; // Allow other types

/**
 * Travel modes for routing
 */
export type TravelMode = "driving" | "walking" | "cycling" | "transit";

/**
 * Place information from location services
 */
export interface Place {
  id: string;
  name: string;
  location: Position;
  rating?: number;
  types?: PlaceType[];
  address?: string;
  phoneNumber?: string;
  website?: string;
  openingHours?: string[];
}

/**
 * Route information from routing services
 */
export interface Route {
  positions: Position[];
  distance: number; // meters
  duration: number; // seconds
  summary: string;
  travelMode: TravelMode;
  steps?: RouteStep[];
}

/**
 * Individual step in a route
 */
export interface RouteStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  startPosition: Position;
  endPosition: Position;
}

/**
 * Options for route visualization
 */
export interface RouteVisualizationOptions {
  clearPrevious?: boolean; // Default: true
  showMarkers?: boolean; // Show start/end markers
  showLabels?: boolean; // Show labels on markers
  flyToRoute?: boolean; // Fly camera to view route
  routeWidth?: number; // Width of route line
  routeColor?: string; // Override default color
}

/**
 * User location information
 */
export interface UserLocation {
  position: Position;
  accuracy: number; // meters
  timestamp: number; // Unix timestamp
}

/**
 * Place marker configuration
 */
export interface PlaceMarkerConfig {
  color: Color; // Cesium.Color
  icon: string; // Emoji or text
  labelText: string;
}

/**
 * Result from get user location command
 */
export interface UserLocationResult extends MCPCommandResult {
  location?: Position;
  accuracy?: number;
  cached?: boolean;
}

/**
 * Result from visualize places command
 */
export interface VisualizePlacesResult extends MCPCommandResult {
  entityCount?: number;
}

/**
 * Result from visualize route command
 */
export interface VisualizeRouteResult extends MCPCommandResult {
  entityCount?: number;
  distance?: number;
  duration?: number;
}

/**
 * Result from clear visualization command
 */
export interface ClearVisualizationResult extends MCPCommandResult {
  removedCount?: number;
}
