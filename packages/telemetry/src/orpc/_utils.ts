/**
 * Extract top-level input keys without leaking values.
 *
 * @param input - Procedure input value.
 * @param maxKeys - Maximum keys to return.
 * @returns Safe key list.
 */
export function extractInputKeys(input: unknown, maxKeys: number): string[] {
  if (!input || typeof input !== 'object') {
    return [];
  }

  const keys = Object.keys(input);
  if (keys.length > maxKeys) {
    return [...keys.slice(0, maxKeys), `...(${keys.length - maxKeys} more)`];
  }

  return keys;
}
