/**
 * WatchableKv Interface
 *
 * Extended KV interface with reactive watch capabilities.
 * This is what @netscript/kv provides beyond Fedify's basic KvStore.
 *
 * @module
 */

import type { KvStore } from './kv-store.ts';
import type { KvKey, WatchEvent, WatchOptions, WatchPrefixOptions, WatchStream } from './common.ts';

/**
 * Extended KV interface with reactive watch capabilities.
 *
 * Provides real-time observation of key changes.
 * This interface extends KvStore and is the primary interface for
 * applications that need reactive updates.
 *
 * @example
 * ```ts
 * import { getKv } from '@netscript/kv';
 *
 * const kv = await getKv();
 *
 * // Watch specific keys for changes
 * for await (const events of kv.watch([['users', '123'], ['users', '456']])) {
 *   for (const event of events) {
 *     console.log(`Key ${event.key} changed: ${event.type}`);
 *   }
 * }
 *
 * // Watch all keys under a prefix (including new keys)
 * for await (const event of kv.watchPrefix(['executions'])) {
 *   console.log(`Execution update: ${event.key} = ${event.value}`);
 * }
 * ```
 */
export interface WatchableKv extends KvStore {
  /**
   * Watch specific keys for changes.
   *
   * With `initial: true`, subscribe before emitting a snapshot of every key
   * as the first batch. Present keys emit `set`; absent keys emit `delete`
   * with a null value. Snapshot events carry `initial: true`. Changes follow,
   * including writes committed after subscription acknowledgement. A write
   * racing the snapshot may appear twice; dedupe by versionstamp. Without
   * `initial`, the backend's existing behavior is preserved.
   *
   * First-party handles expose an optional `ready` promise. Start iteration
   * before awaiting it; it resolves on backend subscription acknowledgement
   * (the first native frame for Deno KV), before the snapshot is delivered.
   *
   * @param keys - Array of keys to watch
   * @param options - Watch options (initial, signal, debounce)
   * @returns Async iterable that yields arrays of watch events
   *
   * @example
   * ```ts
   * import { getKv } from '@netscript/kv';
   *
   * const kv = await getKv();
   * const controller = new AbortController();
   *
   * for await (const events of kv.watch(
   *   [['config', 'theme'], ['config', 'locale']],
   *   { initial: true, signal: controller.signal }
   * )) {
   *   for (const event of events) {
   *     if (event.type === 'set') {
   *       console.log(`Config updated: ${event.key} = ${event.value}`);
   *     }
   *   }
   * }
   * ```
   */
  watch<T = unknown>(
    keys: KvKey[],
    options?: WatchOptions,
  ): WatchStream<T>;

  /**
   * Watch all keys under a prefix.
   *
   * More powerful than watch() because it captures newly created keys,
   * not just changes to known keys. Uses a combination of native watch
   * and periodic polling to discover new keys.
   *
   * This is the recommended method for watching job executions and
   * other dynamic collections where new entries are created frequently.
   *
   * @param prefix - Key prefix to watch
   * @param options - Watch options (signal, debounce, pollInterval)
   * @returns Async iterable that yields individual watch events
   *
   * @example
   * ```ts
   * // Frontend: Stream execution updates via SSE
   * for await (const event of kv.watchPrefix(['executions'])) {
   *   const data = {
   *     type: event.type,
   *     jobId: event.key[1],
   *     executionId: event.key[2],
   *     execution: event.value,
   *   };
   *   writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
   * }
   * ```
   */
  watchPrefix<T = unknown>(
    prefix: KvKey,
    options?: WatchPrefixOptions,
  ): AsyncIterable<WatchEvent<T>>;

  /**
   * Check if watch is supported by this backend.
   *
   * All backends should support some form of watch, but native
   * implementations (Deno KV) are more efficient than polling-based ones.
   */
  readonly supportsWatch: boolean;
}

/**
 * Check whether a store implements the `WatchableKv` contract.
 *
 * @param store - Store instance to inspect
 * @returns `true` when the store exposes the watch APIs
 */
export function isWatchable(store: KvStore): store is WatchableKv {
  return (
    'watch' in store &&
    'watchPrefix' in store &&
    typeof (store as WatchableKv).watch === 'function'
  );
}
