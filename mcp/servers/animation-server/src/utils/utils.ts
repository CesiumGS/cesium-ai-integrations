import { MAX_POSITION_SAMPLES, TRAVEL_MODE_TO_MODEL } from "./constants.js";
import { ModelPresetType } from "./types.js";

/**
 * Parse duration string to milliseconds
 */
export function parseDuration(durationStr: string): number {
  const matches = durationStr.match(/(\d+)\s*(min|sec|hour)/i);
  if (!matches) {
    return 60000; // Default 1 minute
  }

  const value = parseInt(matches[1]);
  const unit = matches[2].toLowerCase();

  switch (unit) {
    case "sec":
      return value * 1000;
    case "min":
      return value * 60000;
    case "hour":
      return value * 3600000;
    default:
      return 60000;
  }
}

/**
 * Decimate array to max size while preserving start/end
 * Prevents memory issues from too many position samples
 */
export function decimateArray<T>(
  arr: T[],
  maxSize: number = MAX_POSITION_SAMPLES,
): T[] {
  if (arr.length <= maxSize) {
    return arr;
  }

  const result: T[] = [arr[0]]; // Always include first
  const step = (arr.length - 1) / (maxSize - 1);

  for (let i = 1; i < maxSize - 1; i++) {
    const index = Math.round(i * step);
    result.push(arr[index]);
  }

  result.push(arr[arr.length - 1]); // Always include last
  return result;
}

/**
 * Get model preset from travel mode using the travel mode mapping
 * @param travelMode - The travel mode string (e.g., 'walking', 'driving', 'flying')
 * @returns The corresponding model preset or undefined if no mapping exists
 */
export function getModelPresetFromTravelMode(
  travelMode?: string,
): ModelPresetType | undefined {
  if (!travelMode) {
    return undefined;
  }

  const mapped = TRAVEL_MODE_TO_MODEL[travelMode];
  return mapped ? (mapped as ModelPresetType) : undefined;
}
