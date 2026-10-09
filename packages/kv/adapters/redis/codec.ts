/**
 * JSON codec for values and watch messages stored by the Redis adapter.
 *
 * Plain `JSON.stringify` throws on `bigint`, which is the operand and result
 * type of the `sum`/`min`/`max` atomic mutations. This codec writes a
 * `bigint` as a single-property tagged object and restores it on read; every
 * other value round-trips exactly as plain JSON, so entries written before the
 * codec existed still decode unchanged.
 *
 * @module
 */

import type { KvKey } from '../../types/common.ts';
import type { StoredValue } from './types.ts';

/** Property name that marks an encoded `bigint`. */
const BIGINT_TAG = '$kv:bigint';

function replaceBigint(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? { [BIGINT_TAG]: value.toString() } : value;
}

function reviveBigint(_key: string, value: unknown): unknown {
  if (typeof value !== 'object' || value === null || !(BIGINT_TAG in value)) {
    return value;
  }
  const tagged = (value as Record<string, unknown>)[BIGINT_TAG];
  return typeof tagged === 'string' && Object.keys(value).length === 1 ? BigInt(tagged) : value;
}

/**
 * Serialize a value to JSON, encoding `bigint` values losslessly.
 *
 * @param value - Value to serialize.
 * @returns JSON text.
 *
 * @example
 * ```ts
 * import { decodeRedisJson, encodeRedisJson } from "./codec.ts";
 *
 * decodeRedisJson<bigint>(encodeRedisJson(8n)); // 8n
 * ```
 */
export function encodeRedisJson(value: unknown): string {
  return JSON.stringify(value, replaceBigint);
}

/**
 * Parse JSON written by {@linkcode encodeRedisJson}.
 *
 * @param text - JSON text.
 * @returns The decoded value.
 * @throws {SyntaxError} When `text` is not valid JSON.
 */
export function decodeRedisJson<T>(text: string): T {
  return JSON.parse(text, reviveBigint) as T;
}

/**
 * Serialize the stored envelope for one entry.
 *
 * @param value - User value.
 * @param versionstamp - Versionstamp of the write.
 * @returns JSON text for the Redis value.
 */
export function encodeStoredValue(value: unknown, versionstamp: string): string {
  return encodeRedisJson({ value, versionstamp } satisfies StoredValue);
}

/**
 * Change notification published on the adapter's watch channel.
 */
export interface WatchMessage<T = unknown> {
  /** Changed key. */
  key: KvKey;
  /** Publish time (epoch ms). */
  timestamp: number;
  /** Change kind. */
  type: 'set' | 'delete';
  /** New value, `null` for a deletion. */
  value: T | null;
  /** Versionstamp of the write; absent in messages from older publishers. */
  versionstamp?: string;
}
