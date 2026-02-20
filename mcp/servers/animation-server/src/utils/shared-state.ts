/**
 * Shared animation state accessible to all animation tools
 */

/**
 * Animation state tracker
 */
export interface AnimationState {
  id: string;
  entityId: string;
  startTime: string;
  stopTime: string;
  currentSpeed: number;
  isPlaying: boolean;
  loopMode: "none" | "loop" | "pingpong";
  createdAt: Date;
}

/**
 * Global animation state storage
 */
export const animations = new Map<string, AnimationState>();

/**
 * Currently tracked entity for camera following
 */
export let trackedEntityId: string | null = null;

/**
 * Set the tracked entity ID
 */
export function setTrackedEntityId(entityId: string | null): void {
  trackedEntityId = entityId;
}

/**
 * Get the tracked entity ID
 */
export function getTrackedEntityId(): string | null {
  return trackedEntityId;
}
