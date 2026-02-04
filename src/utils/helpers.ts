import { Vector3 } from '@babylonjs/core/Maths/math.vector';

/**
 * Returns a random position on a circle around the origin
 * @param radius - Distance from origin
 * @param y - Y coordinate (height)
 * @returns A Vector3 position
 */
export function getRandomCirclePosition(radius: number, y: number = 0): Vector3 {
  const angle = Math.random() * Math.PI * 2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  return new Vector3(x, y, z);
}

/**
 * Clamps a value between min and max
 * @param value - The value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Checks if a device is mobile based on touch support
 * @returns True if mobile device detected
 */
export function isMobile(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
