/**
 * Redis key serialization utilities for the `@netscript/kv` Redis adapter.
 *
 * These functions convert between the portable {@linkcode KvKey} format and
 * namespaced Redis key strings. They are extracted from `redis.adapter.ts`
 * to keep the adapter class focused on CRUD, watch, and atomic semantics.
 *
 * @module
 */

import type { KvKey } from '../../types/common.ts';

/** Default Redis key namespace applied when none is configured. */
export const DEFAULT_REDIS_NAMESPACE = 'kv';

/**
 * Serialize a {@linkcode KvKey} into a namespaced Redis key string.
 *
 * Builds the result via string concatenation in a single pass — no
 * intermediate `string[]` from `.map()` and no `.join()` allocation.
 * `key[i]` auto-coerces to string in the concatenation context, which is
 * correct for the valid `Deno.KvKeyPart` types (`string | number | bigint |
 * boolean | Uint8Array`).
 *
 * @param key       - KV key to serialize.
 * @param namespace - Redis key prefix (default `"kv"`).
 * @returns The fully-qualified Redis key string.
 *
 * @example
 * ```ts
 * import { keyToRedisKey } from "./serialization.ts";
 *
 * keyToRedisKey(["users", "123"]);        // "kv:users:123"
 * keyToRedisKey(["ns", 42], "myapp");     // "myapp:ns:42"
 * ```
 */
export function keyToRedisKey(
  key: KvKey,
  namespace = DEFAULT_REDIS_NAMESPACE,
): string {
  let result = namespace;
  for (let i = 0; i < key.length; i++) {
    result += ':' + String(key[i]);
  }
  return result;
}

/**
 * Parse a namespaced Redis key string back into a {@linkcode KvKey}.
 *
 * Uses a single-pass scan instead of `.split(':').map()` to avoid allocating
 * two intermediate arrays per call. Numeric segments are coerced back to
 * `number` via the unary `+` operator (marginally faster than `Number()`).
 *
 * **Edge-case note:** Empty segments between consecutive colons (e.g.
 * `kv:a::b`) are coerced to `0` because `+'' === 0`. This matches the
 * previous implementation's behavior (`Number('') === 0`). NetScript keys
 * never contain empty segments in practice.
 *
 * @param redisKey  - Raw Redis key to parse.
 * @param namespace - Expected prefix (default `"kv"`).
 * @returns The decoded KV key.
 *
 * @example
 * ```ts
 * import { redisKeyToKey } from "./serialization.ts";
 *
 * redisKeyToKey("kv:users:123");   // ["users", 123]
 * redisKeyToKey("kv:name:alice");  // ["name", "alice"]
 * ```
 */
export function redisKeyToKey(
  redisKey: string,
  namespace = DEFAULT_REDIS_NAMESPACE,
): KvKey {
  const offset = namespace.length + 1;
  if (
    redisKey.length < offset ||
    !redisKey.startsWith(namespace) ||
    redisKey[namespace.length] !== ':'
  ) {
    return [redisKey];
  }

  const parts: Deno.KvKeyPart[] = [];
  let start = offset;
  for (let i = offset; i <= redisKey.length; i++) {
    if (i === redisKey.length || redisKey[i] === ':') {
      const part = redisKey.substring(start, i);
      const n = +part; // faster than Number(part); NaN !== NaN
      parts.push(n === n && part !== '' ? n : part);
      start = i + 1;
    }
  }
  return parts;
}

/**
 * Extract a human-readable message from an unknown error value.
 *
 * @param error - The caught value.
 * @returns `error.message` when the value is an `Error`, otherwise `String(error)`.
 */
export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
