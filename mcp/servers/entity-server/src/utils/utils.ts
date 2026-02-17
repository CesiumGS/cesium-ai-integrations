/**
 * Generate unique entity ID with prefix
 */
export function generateEntityId(prefix: string): string {
  return `${prefix}_${Date.now()}`;
}
