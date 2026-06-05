/**
 * Query-key contracts and helpers for the SDK cache/query system.
 *
 * @module
 */

/**
 * Primitive query-key segment supported by the SDK cache layer.
 */
export type QueryKeyPart = string | number | boolean | null | undefined;

/**
 * Serializable query key used to address cached entries.
 */
export type QueryKey = readonly QueryKeyPart[];

/**
 * Serialize structured query input into the canonical cache-key segment.
 *
 * @param value - Structured query input.
 * @returns Serialized cache-key segment.
 */
export function serializeQueryKeyInput(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * Build a canonical `[resource, action, input]` query key.
 *
 * @param resource - Resource identifier.
 * @param action - Action/procedure name.
 * @param input - Action input payload.
 * @returns Canonical action query key.
 */
export function createActionQueryKey(
  resource: string,
  action: string,
  input: unknown,
): readonly [string, string, string] {
  return [resource, action, serializeQueryKeyInput(input)];
}
