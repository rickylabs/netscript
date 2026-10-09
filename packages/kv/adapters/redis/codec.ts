/**
 * JSON codec for the envelopes the Redis adapter stores and publishes.
 *
 * Plain `JSON.stringify` throws on `bigint`, which is the operand and result
 * type of the `sum`/`min`/`max` atomic mutations. The codec never interprets
 * user data to find a `bigint`: it writes each `bigint` as its decimal string
 * and records where it was in the adapter-owned envelope's `bigints` field (a
 * list of property paths from the envelope root). Only those paths are revived
 * on read, so any user object — including one shaped like an encoding marker —
 * round-trips exactly. An envelope without `bigints` is plain JSON, which is
 * how every entry written before the codec existed reads back unchanged.
 *
 * @module
 */

import type { KvKey } from '../../types/common.ts';
import type { StoredValue } from './types.ts';

/** A property path from the envelope root: object keys and array indices. */
type PropertyPath = readonly string[];

/** Reserved envelope field that lists the paths of encoded `bigint` values. */
const BIGINT_PATHS_FIELD = 'bigints';

/**
 * Serialize an adapter envelope, encoding `bigint` values losslessly.
 *
 * @param envelope - Adapter-owned envelope; user data lives in its fields.
 * @returns JSON text.
 *
 * @example
 * ```ts
 * import { decodeEnvelope, encodeEnvelope } from "./codec.ts";
 *
 * decodeEnvelope<{ value: bigint }>(encodeEnvelope({ value: 8n })).value; // 8n
 * ```
 */
export function encodeEnvelope(envelope: Readonly<Record<string, unknown>>): string {
  const paths = new WeakMap<object, PropertyPath>();
  const bigints: PropertyPath[] = [];

  const json = JSON.stringify(
    envelope,
    function (this: unknown, key: string, value: unknown): unknown {
      const parent = paths.get(this as object);
      const path = parent === undefined ? [] : [...parent, key];
      if (typeof value === 'bigint') {
        bigints.push(path);
        return value.toString();
      }
      if (typeof value === 'object' && value !== null) {
        paths.set(value, path);
      }
      return value;
    },
  );

  if (bigints.length === 0) {
    return json;
  }
  return `${json.slice(0, -1)}${json.length > 2 ? ',' : ''}"${BIGINT_PATHS_FIELD}":${
    JSON.stringify(bigints)
  }}`;
}

/**
 * Parse an envelope written by {@linkcode encodeEnvelope} or as plain JSON.
 *
 * @param text - JSON text.
 * @returns The decoded envelope, with recorded `bigint` values revived.
 * @throws {SyntaxError} When `text` is not valid JSON.
 * @throws {TypeError} When the envelope's `bigint` metadata is malformed.
 */
export function decodeEnvelope<T>(text: string): T {
  const envelope = JSON.parse(text) as Record<string, unknown>;
  const bigints = envelope?.[BIGINT_PATHS_FIELD];
  if (bigints === undefined) {
    return envelope as T;
  }

  if (!Array.isArray(bigints)) {
    throw new TypeError('Malformed Redis KV envelope: bigint metadata is not a list');
  }
  delete envelope[BIGINT_PATHS_FIELD];
  for (const path of bigints) {
    reviveBigint(envelope, path);
  }
  return envelope as T;
}

function reviveBigint(root: Record<string, unknown>, path: unknown): void {
  if (!Array.isArray(path) || path.length === 0) {
    throw new TypeError('Malformed Redis KV envelope: invalid bigint path');
  }

  // Follow own properties only, so a crafted path cannot reach a prototype.
  let holder: unknown = root;
  for (const key of path.slice(0, -1)) {
    holder = ownProperty(holder, key);
  }
  const leaf = path[path.length - 1];
  const encoded = ownProperty(holder, leaf);
  if (typeof encoded !== 'string' || !/^-?\d+$/.test(encoded)) {
    throw new TypeError('Malformed Redis KV envelope: bigint path does not hold an integer');
  }
  Object.defineProperty(holder, leaf, {
    configurable: true,
    enumerable: true,
    value: BigInt(encoded),
    writable: true,
  });
}

function ownProperty(holder: unknown, key: unknown): unknown {
  if (
    typeof holder !== 'object' || holder === null || typeof key !== 'string' ||
    !Object.hasOwn(holder, key)
  ) {
    throw new TypeError('Malformed Redis KV envelope: bigint path is not present');
  }
  return (holder as Record<string, unknown>)[key];
}

/**
 * Serialize the stored envelope for one entry.
 *
 * @param value - User value.
 * @param versionstamp - Versionstamp of the write.
 * @returns JSON text for the Redis value.
 */
export function encodeStoredValue(value: unknown, versionstamp: string): string {
  return encodeEnvelope({ value, versionstamp } satisfies StoredValue);
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
