/**
 * Polyline encoding/decoding utilities
 * Supports Google's polyline algorithm (polyline5)
 */
import type { Position } from "../../schemas/index.js";

/**
 * Decode polyline string to coordinates
 * Uses Google's encoded polyline algorithm (precision 5)
 *
 * This is the standard implementation used by both Google Maps and OSRM
 *
 * @param encoded Encoded polyline string
 * @returns Array of positions
 */
export function decodePolyline(encoded: string): Position[] {
  const positions: Position[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    positions.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
      height: 0,
    });
  }

  return positions;
}
