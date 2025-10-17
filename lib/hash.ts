/**
 * Generic hash utility - can be used in any project
 * Generates a simple hash from a string
 */

/**
 * Creates a simple hash from a string
 * @param str - Input string to hash
 * @param length - Desired hash length (default: 8)
 * @returns Hash string of specified length
 */
export function simpleHash(str: string, length: number = 8): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  const hashStr = Math.abs(hash).toString(36);
  return hashStr.padEnd(length, '0').slice(0, length);
}
