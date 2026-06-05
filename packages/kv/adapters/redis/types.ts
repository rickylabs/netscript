/**
 * Shared constants, interfaces, and configuration types for the Redis adapter.
 *
 * This module is internal to `@netscript/kv` — nothing here is re-exported
 * from the public entrypoints.
 *
 * @module
 */

/**
 * Default Redis key namespace prefix applied to every key managed by the
 * adapter.
 */
export const DEFAULT_REDIS_NAMESPACE = 'kv';

/**
 * Fallback Redis connection URL when no environment variable is set.
 */
export const DEFAULT_REDIS_URL = 'redis://localhost:6379';

/**
 * Number of keys requested per `SCAN` iteration.
 *
 * Higher values reduce network round-trips at the cost of slightly higher
 * per-batch server-side processing. With Garnet/Redis on localhost the
 * round-trip overhead dominates, so a larger batch size is a net win:
 *
 *   COUNT 100  → ~50 round-trips for 5 000 keys → ~500ms
 *   COUNT 5000 → ~1  round-trip  for 5 000 keys → ~10ms
 *
 * The Redis default is 10. Community guidance suggests < 1 000 for shared
 * multi-tenant Redis (single-threaded blocking concern). However:
 *
 * - Garnet is **multi-threaded** — SCAN does not block the entire server.
 * - Our instances are dedicated (no multi-tenant risk).
 * - At typical keyspace sizes (5–50k keys), per-batch processing is
 *   negligible; round-trip overhead dominates.
 *
 * 5 000 gives 1 round-trip for ≤5k keys and ~10 for 50k keys.
 *
 * Override at runtime via `REDIS_SCAN_BATCH_SIZE` env var for operator
 * tuning without a code change.
 */
export const REDIS_SCAN_COUNT: number = (() => {
  try {
    const env = Deno.env.get('REDIS_SCAN_BATCH_SIZE');
    if (env) {
      const parsed = parseInt(env, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // Permission denied or non-Deno runtime — use default
  }
  return 5_000;
})();

/**
 * Maximum number of keys fetched in a single `MGET` call within `list()`.
 *
 * After each `SCAN` iteration the adapter batch-fetches values via `MGET`
 * instead of issuing one `GET` per key (the previous N+1 pattern).
 * Sub-batching keeps individual `MGET` payloads bounded so that:
 *
 * - Memory usage per round-trip stays predictable.
 * - The Redis/Garnet server is not blocked for extended periods by a
 *   single giant `MGET` response.
 * - When a `limit` is set, early termination can skip remaining
 *   sub-batches once enough entries have been yielded.
 *
 * Research benchmarks (ioredis + Redis/Garnet localhost):
 *
 *   MGET 100 keys  → ~53× faster than individual GET
 *   MGET 500 keys  → ~120× faster
 *   MGET 1000 keys → ~148× faster
 *   Diminishing returns past ~1 000 keys.
 *
 * 500 is the sweet-spot: well within the efficient range, small enough to
 * terminate early for small `limit` values (e.g. `limit: 10` only fetches
 * one sub-batch of 500 keys instead of the full SCAN batch of 5 000).
 *
 * Override at runtime via `REDIS_MGET_BATCH_SIZE` env var.
 */
export const REDIS_MGET_BATCH_SIZE: number = (() => {
  try {
    const env = Deno.env.get('REDIS_MGET_BATCH_SIZE');
    if (env) {
      const parsed = parseInt(env, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // Permission denied or non-Deno runtime — use default
  }
  return 500;
})();

/**
 * Maximum time (ms) to wait for the initial Redis connection.
 */
export const REDIS_CONNECT_TIMEOUT_MS = 10_000;

/**
 * TCP keep-alive interval (ms) for the Redis connection.
 */
export const REDIS_KEEPALIVE_MS = 30_000;

/**
 * Suffix appended to the namespace to form the pub/sub channel used for
 * watch notifications.
 */
export const WATCH_CHANNEL_SUFFIX = '__watch__';

/**
 * Internal wrapper stored as the Redis value for every key managed by the
 * adapter.
 *
 * Combines the user-supplied value with a versionstamp so that optimistic
 * concurrency checks (`atomic()`) can compare versions without a separate
 * metadata key.
 */
export interface StoredValue<T = unknown> {
  /** The user-supplied value. */
  value: T;
  /** Versionstamp generated at write time. */
  versionstamp: string;
}

/**
 * Redis connection options for the adapter.
 */
export interface RedisKvOptions {
  /**
   * Redis connection URL.
   *
   * Falls back to `REDIS_URI` → `GARNET_URI` → `redis://localhost:6379`.
   */
  url?: string;

  /**
   * Prefix applied to every Redis key managed by the adapter.
   *
   * @default "kv"
   */
  namespace?: string;

  /**
   * Additional ioredis client options merged into the default configuration.
   */
  options?: Record<string, unknown>;
}
