/**
 * Geospatial calculation utilities
 */
import type { Position } from "../../schemas/index.js";

/**
 * Calculate distance between two points in meters using Haversine formula
 *
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculate bounding box from an array of coordinates
 *
 * @param coords Array of positions
 * @returns Bounding box with northeast and southwest corners
 */
export function calculateBounds(coords: Position[]): {
  northeast: Position;
  southwest: Position;
} {
  if (coords.length === 0) {
    return {
      northeast: { latitude: 0, longitude: 0, height: 0 },
      southwest: { latitude: 0, longitude: 0, height: 0 },
    };
  }

  let minLat = coords[0].latitude;
  let maxLat = coords[0].latitude;
  let minLon = coords[0].longitude;
  let maxLon = coords[0].longitude;

  coords.forEach((coord) => {
    minLat = Math.min(minLat, coord.latitude);
    maxLat = Math.max(maxLat, coord.latitude);
    minLon = Math.min(minLon, coord.longitude);
    maxLon = Math.max(maxLon, coord.longitude);
  });

  return {
    northeast: { latitude: maxLat, longitude: maxLon, height: 0 },
    southwest: { latitude: minLat, longitude: minLon, height: 0 },
  };
}
