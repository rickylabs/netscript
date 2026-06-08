/**
 * Shared key utilities for `@netscript/kv` adapters.
 *
 * This module consolidates duplicated helpers that were previously defined
 * independently in each adapter. It is internal to the package — nothing here
 * is re-exported from the public `mod.ts` entrypoint.
 *
 * @module
 */

import { monotonicUlid } from '@std/ulid';

import type { KvKey } from '../types/common.ts';

/**
 * Serialize a {@linkcode KvKey} to a deterministic string for `Map` lookups
 * and lexicographic comparison.
 *
 * Uses `JSON.stringify` so that keys containing numbers, strings, or booleans
 * produce a stable, comparable representation.
 *
 * @param key - The key to serialize.
 * @returns A JSON string representation of the key.
 *
 * @example
 * ```ts
 * import { keyToString } from "./keys.ts";
 *
 * keyToString(["users", "123"]); // '["users","123"]'
 * ```
 */
export function keyToString(key: KvKey): string {
  return JSON.stringify(key);
}

/**
 * Generate a monotonically increasing versionstamp.
 *
 * Replaces the previous `Date.now()-randomUUID().slice(0,8)` pattern which
 * produced variable-width decimal strings that broke lexicographic ordering at
 * digit-count boundaries. `monotonicUlid()` provides:
 *
 * - **Fixed-width** Crockford base-32 encoding (always 26 characters).
 * - **Strict monotonic guarantee** — values increase even within the same
 *   millisecond.
 * - **80 bits of entropy** (vs 32 bits from the old 8-hex-char suffix).
 * - **Single allocation** per call.
 *
 * Old-format stamps (`"1719000000000-a1b2c3d4"`) coexist safely with the new
 * ULID format because CAS checks use strict `===` equality — a format mismatch
 * simply triggers a re-read, which is the correct optimistic-concurrency
 * behavior.
 *
 * @returns A 26-character ULID string.
 *
 * @example
 * ```ts
 * import { generateVersionstamp } from "./keys.ts";
 *
 * const a = generateVersionstamp();
 * const b = generateVersionstamp();
 * console.assert(a < b, "stamps are strictly monotonic");
 * ```
 */
export function generateVersionstamp(): string {
  return monotonicUlid();
}

/**
 * Check whether a {@linkcode KvKey} starts with a given prefix.
 *
 * Performs an element-wise strict-equality comparison. This is the canonical
 * implementation used by every adapter — the memory adapter previously called
 * this `keyMatchesPrefix` with identical logic.
 *
 * @param key    - The full key to test.
 * @param prefix - The prefix to match against.
 * @returns `true` when every element in `prefix` matches the corresponding
 *          element in `key`.
 *
 * @example
 * ```ts
 * import { keyHasPrefix } from "./keys.ts";
 *
 * keyHasPrefix(["users", "123", "email"], ["users", "123"]); // true
 * keyHasPrefix(["orders", "1"], ["users"]);                  // false
 * ```
 */
export function keyHasPrefix(key: KvKey, prefix: KvKey): boolean {
  if (key.length < prefix.length) {
    return false;
  }

  for (let i = 0; i < prefix.length; i++) {
    if (key[i] !== prefix[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Lexicographically compare two {@linkcode KvKey KvKeys}.
 *
 * Each key part is coerced to a string via `String()` before comparison so that
 * mixed `string | number` segments are ordered consistently. When all compared
 * parts are equal, the shorter key sorts first.
 *
 * This function is extracted from the memory adapter and will also be needed by
 * the future `WatchableKvBridge` for correcting Redis SCAN ordering.
 *
 * @param a - First key.
 * @param b - Second key.
 * @returns A negative number if `a < b`, zero if equal, positive if `a > b`.
 *
 * @example
 * ```ts
 * import { compareKeys } from "./keys.ts";
 *
 * compareKeys(["a", 1], ["a", 2]);   // negative (1 < 2 as strings)
 * compareKeys(["b"], ["a"]);          // positive
 * compareKeys(["a"], ["a"]);          // 0
 * ```
 */
export function compareKeys(a: KvKey, b: KvKey): number {
  const minLength = Math.min(a.length, b.length);

  for (let i = 0; i < minLength; i++) {
    const left = String(a[i]);
    const right = String(b[i]);
    if (left < right) {
      return -1;
    }
    if (left > right) {
      return 1;
    }
  }

  return a.length - b.length;
}
