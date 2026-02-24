/**
 * Geolocation Utility Functions
 * Helper functions for geolocation-specific operations
 */

import type {
  PlaceType,
  TravelMode,
  PlaceMarkerConfig,
} from "../types/geolocation.js";
import type { Color } from "cesium";

/**
 * Color mappings for different place types
 */
const PLACE_TYPE_COLORS: Record<string, string> = {
  restaurant: "#FF8C00", // Orange
  food: "#FF8C00",
  cafe: "#8B4513", // Brown
  coffee: "#8B4513",
  bar: "#FFD700", // Gold
  hotel: "#800080", // Purple
  lodging: "#800080",
  gym: "#FF0000", // Red
  fitness: "#FF0000",
  hospital: "#FF0080", // Pink
  health: "#FF0080",
  pharmacy: "#00CED1", // Turquoise
  park: "#228B22", // Green
  recreation: "#228B22",
  shopping: "#4169E1", // Blue
  mall: "#4169E1",
  store: "#4169E1",
  bank: "#FFD700", // Gold
  atm: "#FFD700",
  gas: "#DC143C", // Red
  fuel: "#DC143C",
  airport: "#1E90FF", // Sky Blue
  transit: "#FF6347", // Tomato
  station: "#FF6347",
  museum: "#8B008B", // Dark Magenta
  library: "#4682B4", // Steel Blue
};

/**
 * Icon mappings for different place types
 */
const PLACE_TYPE_ICONS: Record<string, string> = {
  restaurant: "🍽️",
  food: "🍽️",
  cafe: "☕",
  coffee: "☕",
  bar: "🍺",
  hotel: "🏨",
  lodging: "🏨",
  gym: "💪",
  fitness: "💪",
  hospital: "🏥",
  health: "🏥",
  pharmacy: "💊",
  park: "🌳",
  recreation: "🌳",
  shopping: "🛍️",
  mall: "🛍️",
  store: "🏪",
  bank: "🏦",
  atm: "💰",
  gas: "⛽",
  fuel: "⛽",
  airport: "✈️",
  transit: "🚇",
  station: "🚉",
  museum: "🏛️",
  library: "📚",
};

/**
 * Travel mode color mappings (Google Maps style)
 */
const TRAVEL_MODE_COLORS: Record<TravelMode, string> = {
  driving: "#4285F4", // Blue
  walking: "#34A853", // Green
  cycling: "#FBBC04", // Yellow/Orange
  transit: "#EA4335", // Red
};

/**
 * Get color for a place based on its type
 */
export function getPlaceColor(types?: PlaceType[]): Color {
  if (!types || types.length === 0) {
    return Cesium.Color.YELLOW;
  }

  const type = types[0].toLowerCase();

  // Find matching color
  for (const [key, color] of Object.entries(PLACE_TYPE_COLORS)) {
    if (type.includes(key)) {
      return Cesium.Color.fromCssColorString(color);
    }
  }

  // Default color
  return Cesium.Color.YELLOW;
}

/**
 * Get emoji icon for a place based on its type
 */
export function getPlaceIcon(types?: PlaceType[]): string {
  if (!types || types.length === 0) {
    return "📍";
  }

  const type = types[0].toLowerCase();

  // Find matching icon
  for (const [key, icon] of Object.entries(PLACE_TYPE_ICONS)) {
    if (type.includes(key)) {
      return icon;
    }
  }

  // Default icon
  return "📍";
}

/**
 * Get color for a travel mode
 */
export function getTravelModeColor(mode: TravelMode | string): Color {
  const normalizedMode = mode.toLowerCase() as TravelMode;
  const colorHex = TRAVEL_MODE_COLORS[normalizedMode];

  if (colorHex) {
    return Cesium.Color.fromCssColorString(colorHex);
  }

  // Default to blue
  return Cesium.Color.BLUE;
}

/**
 * Get emoji icon for a travel mode
 */
export function getTravelModeIcon(mode: TravelMode | string): string {
  const normalizedMode = mode.toLowerCase();

  switch (normalizedMode) {
    case "driving":
      return "🚗";
    case "walking":
      return "🚶";
    case "cycling":
      return "🚴";
    case "transit":
      return "🚌";
    default:
      return "🚗";
  }
}

/**
 * Create a place marker configuration
 */
export function createPlaceMarkerConfig(
  name: string,
  types?: PlaceType[],
  rating?: number,
): PlaceMarkerConfig {
  const color = getPlaceColor(types);
  const icon = getPlaceIcon(types);
  const ratingText = rating ? ` ⭐${rating.toFixed(1)}` : "";
  const labelText = `${icon} ${name}${ratingText}`;

  return {
    color,
    icon,
    labelText,
  };
}

/**
 * Format distance in a human-readable way
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration in a human-readable way
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  return `${minutes} min`;
}

/**
 * Format route summary
 */
export function formatRouteSummary(
  distance: number,
  duration: number,
  travelMode: TravelMode | string,
): string {
  const icon = getTravelModeIcon(travelMode);
  const distanceStr = formatDistance(distance);
  const durationStr = formatDuration(duration);

  return `${icon} ${distanceStr} • ${durationStr}`;
}

/**
 * Check if location permission is likely granted
 */
export function isGeolocationAvailable(): boolean {
  return "geolocation" in navigator;
}

/**
 * Check if a location is cached and still fresh
 */
export function isLocationCacheFresh(
  timestamp: number,
  maxAgeMs: number = 5 * 60 * 1000,
): boolean {
  return Date.now() - timestamp < maxAgeMs;
}
