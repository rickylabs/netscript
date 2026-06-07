/**
 * Redis-backed `WatchableKv` implementation.
 *
 * Connection lifecycle, key serialization, and shared constants are extracted
 * into focused submodules under `./redis/`:
 *
 * - `redis/types.ts` — constants, `StoredValue`, `RedisKvOptions`
 * - `redis/serialization.ts` — `keyToRedisKey`, `redisKeyToKey`
 * - `redis/connection.ts` — `RedisConnectionManager` (retry, pub/sub)
 *
 * This module contains the adapter class itself, focused on KV semantics:
 * CRUD, list (SCAN), atomic transactions, and watch/watchPrefix.
 *
 * @module
 */

import { delay } from '@std/async';
import { createPackageLogger } from '@netscript/logger';
import { generateVersionstamp, keyHasPrefix, keyToString } from '../application/keys.ts';
import type { AtomicMutation } from '../types/kv-store.ts';
import type { WatchableKv } from '../types/watchable-kv.ts';
import type {
  AtomicCheck,
  AtomicResult,
  KvEntry,
  KvKey,
  KvListOptions,
  KvSetOptions,
  WatchEvent,
  WatchOptions,
  WatchPrefixOptions,
} from '../types/common.ts';

import { RedisConnectionManager } from './redis/connection.ts';
import { keyToRedisKey, redisKeyToKey } from './redis/serialization.ts';
import {
  DEFAULT_REDIS_NAMESPACE,
  DEFAULT_REDIS_URL,
  REDIS_MGET_BATCH_SIZE,
  REDIS_SCAN_COUNT,
  type StoredValue,
  WATCH_CHANNEL_SUFFIX,
} from './redis/types.ts';

export type { RedisKvOptions } from './redis/types.ts';

const logger = createPackageLogger('kv');

/**
 * Distributed Redis adapter for `@netscript/kv`.
 *
 * Provides a full `WatchableKv` implementation backed by Redis (or
 * Garnet). Connection management is delegated to
 * {@linkcode RedisConnectionManager}; key serialization lives in
 * `redis/serialization.ts`.
 *
 * @example
 * ```ts
 * import { RedisKvAdapter } from '@netscript/kv/redis';
 *
 * const kv = new RedisKvAdapter({ url: 'redis://localhost:6379' });
 * await kv.set(['users', '123'], { name: 'Ada' });
 * ```
 *
 * @example Explicit resource management (Deno 2.3+)
 * ```ts
 * await using kv = new RedisKvAdapter();
 * await kv.set(['key'], 'value');
 * // Automatically closed when scope exits
 * ```
 */
export class RedisKvAdapter implements WatchableKv {
  private readonly connection: RedisConnectionManager;
  private readonly namespace: string;

  /**
   * Redis supports watch operations through pub/sub and polling.
   */
  readonly supportsWatch: boolean = true;

  /**
   * Create a Redis-backed adapter.
   *
   * @param config - Redis connection configuration
   */
  constructor(config: import('./redis/types.ts').RedisKvOptions = {}) {
    const url = config.url ??
      Deno.env.get('REDIS_URI') ??
      Deno.env.get('GARNET_URI') ??
      DEFAULT_REDIS_URL;
    this.namespace = config.namespace ?? DEFAULT_REDIS_NAMESPACE;
    const options = (config.options as import('ioredis').RedisOptions | undefined) ?? {};
    this.connection = new RedisConnectionManager(url, options);
  }

  // ---------------------------------------------------------------------------
  // CRUD Operations
  // ---------------------------------------------------------------------------

  /**
   * Read a value by key.
   *
   * @param key - Key to resolve
   * @returns Stored entry or `null`
   */
  async get<T = unknown>(key: KvKey): Promise<KvEntry<T> | null> {
    const client = await this.connection.ensureClient();
    const data = await client.get(keyToRedisKey(key, this.namespace));

    if (data === null) {
      return null;
    }

    try {
      const stored = JSON.parse(data) as StoredValue<T>;
      return {
        key,
        value: stored.value,
        versionstamp: stored.versionstamp,
      };
    } catch {
      return {
        key,
        value: data as T,
        versionstamp: generateVersionstamp(),
      };
    }
  }

  /**
   * Store a value.
   *
   * @param key - Key to write
   * @param value - Value to store
   * @param options - Optional TTL settings
   */
  async set(key: KvKey, value: unknown, options?: KvSetOptions): Promise<void> {
    const client = await this.connection.ensureClient();
    const redisKey = keyToRedisKey(key, this.namespace);
    const stored: StoredValue = { value, versionstamp: generateVersionstamp() };

    if (options?.expireIn) {
      await client.psetex(redisKey, options.expireIn, JSON.stringify(stored));
    } else {
      await client.set(redisKey, JSON.stringify(stored));
    }

    await this.publishChange(key, 'set', value);
  }

  /**
   * Delete a value by key.
   *
   * @param key - Key to remove
   */
  async delete(key: KvKey): Promise<void> {
    const client = await this.connection.ensureClient();
    await client.del(keyToRedisKey(key, this.namespace));
    await this.publishChange(key, 'delete', null);
  }

  /**
   * Check whether a key exists.
   *
   * @param key - Key to inspect
   * @returns `true` when the key exists
   */
  async has(key: KvKey): Promise<boolean> {
    const client = await this.connection.ensureClient();
    return (await client.exists(keyToRedisKey(key, this.namespace))) === 1;
  }

  // ---------------------------------------------------------------------------
  // Batch Read
  // ---------------------------------------------------------------------------

  /**
   * Batch-read multiple keys in a single `MGET` round-trip.
   *
   * Returns an array whose indices correspond 1-to-1 with the input `keys`.
   * Missing or expired keys are returned as `null`.
   *
   * For large key sets the call is internally sub-batched at
   * {@linkcode REDIS_MGET_BATCH_SIZE} to bound per-call memory usage.
   *
   * @param keys - Array of keys to retrieve
   * @returns Array of entries (or `null`), same length and order as `keys`
   */
  async getMany<T = unknown>(keys: KvKey[]): Promise<(KvEntry<T> | null)[]> {
    if (keys.length === 0) return [];

    const client = await this.connection.ensureClient();
    const redisKeys = keys.map((k) => keyToRedisKey(k, this.namespace));
    const results: (KvEntry<T> | null)[] = new Array(keys.length);

    // Sub-batch MGET to keep per-call payload bounded.
    for (let offset = 0; offset < redisKeys.length; offset += REDIS_MGET_BATCH_SIZE) {
      const batchEnd = Math.min(offset + REDIS_MGET_BATCH_SIZE, redisKeys.length);
      const batchKeys = redisKeys.slice(offset, batchEnd);
      const values = await client.mget(...batchKeys);

      for (let i = 0; i < batchKeys.length; i++) {
        const data = values[i];
        const idx = offset + i;
        if (data === null) {
          results[idx] = null;
          continue;
        }
        try {
          const stored = JSON.parse(data) as StoredValue<T>;
          results[idx] = {
            key: keys[idx],
            value: stored.value,
            versionstamp: stored.versionstamp,
          };
        } catch {
          // Legacy value stored without the StoredValue envelope
          results[idx] = {
            key: keys[idx],
            value: data as T,
            versionstamp: generateVersionstamp(),
          };
        }
      }
    }

    return results;
  }

  // ---------------------------------------------------------------------------
  // List (SCAN + MGET)
  // ---------------------------------------------------------------------------

  /**
   * List entries under a prefix or range.
   *
   * Uses a two-strategy approach depending on ordering:
   *
   * **Forward (`reverse: false`, default)** — streaming SCAN + MGET.
   * Each SCAN batch is sorted lexicographically, values are fetched via
   * `MGET` in sub-batches of {@linkcode REDIS_MGET_BATCH_SIZE}, and entries
   * are yielded immediately. Early termination is respected: once `limit`
   * entries have been yielded, remaining sub-batches and SCAN iterations
   * are skipped.
   *
   * **Reverse (`reverse: true`)** — two-phase SCAN-all-keys then MGET-tail.
   * Because Redis `SCAN` returns keys in hash-table order (not
   * lexicographic), correct global reverse ordering requires collecting
   * **all** matching key names first. The adapter therefore:
   *
   * 1. Runs SCAN to completion, collecting only key names (cheap — no
   *    value fetching).
   * 2. Sorts all key names lexicographically in reverse.
   * 3. Applies `start`/`end` range filters on the sorted key list.
   * 4. `MGET`s only the keys that will be yielded (respecting `limit`),
   *    in sub-batches for bounded memory.
   *
   * This ensures the bridge layer (and any consumer) receives correctly
   * ordered reverse results without the previous N+1 GET anti-pattern
   * and without fetching values for keys that will be discarded.
   *
   * @param options - Selector and pagination options
   * @returns Async iterable of matching entries
   */
  async *list<T = unknown>(options: KvListOptions): AsyncIterable<KvEntry<T>> {
    const client = await this.connection.ensureClient();
    const pattern = `${keyToRedisKey(options.prefix, this.namespace)}:*`;
    const limit = options.limit ?? Number.POSITIVE_INFINITY;

    // Hoist start/end serialization — loop-invariant.
    const startStr = options.start ? keyToString(options.start) : undefined;
    const endStr = options.end ? keyToString(options.end) : undefined;

    if (options.reverse) {
      yield* this.listReverse<T>(client, pattern, limit, startStr, endStr);
    } else {
      yield* this.listForward<T>(client, pattern, limit, startStr, endStr);
    }
  }

  /**
   * Forward list: streaming SCAN → per-batch sort → MGET sub-batches → yield.
   *
   * Terminates as soon as `limit` entries have been yielded.
   */
  private async *listForward<T>(
    client: import('ioredis').Redis,
    pattern: string,
    limit: number,
    startStr: string | undefined,
    endStr: string | undefined,
  ): AsyncIterable<KvEntry<T>> {
    let count = 0;
    let cursor = '0';

    do {
      const [nextCursor, keys] = await client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        REDIS_SCAN_COUNT,
      );
      cursor = nextCursor;

      if (keys.length === 0) continue;

      const sortedKeys = [...keys].sort();

      // MGET in sub-batches with early termination
      for (
        let batchStart = 0;
        batchStart < sortedKeys.length && count < limit;
        batchStart += REDIS_MGET_BATCH_SIZE
      ) {
        const batchEnd = Math.min(batchStart + REDIS_MGET_BATCH_SIZE, sortedKeys.length);
        const batchKeys = sortedKeys.slice(batchStart, batchEnd);
        const values = await client.mget(...batchKeys);

        for (let i = 0; i < batchKeys.length; i++) {
          if (count >= limit) break;

          const data = values[i];
          if (data === null) continue;

          try {
            const stored = JSON.parse(data) as StoredValue<T>;
            const key = redisKeyToKey(batchKeys[i], this.namespace);

            if (startStr && keyToString(key) < startStr) continue;
            if (endStr && keyToString(key) >= endStr) continue;

            yield { key, value: stored.value, versionstamp: stored.versionstamp };
            count += 1;
          } catch {
            logger.warn('Skipping malformed Redis KV entry during list()', {
              redisKey: batchKeys[i],
            });
          }
        }
      }
    } while (cursor !== '0' && count < limit);
  }

  /**
   * Reverse list: two-phase SCAN-all-keys → global reverse sort → MGET tail.
   *
   * Phase 1 collects only key names (no value fetching) so the full SCAN is
   * cheap. Phase 2 MGET-fetches values only for the keys that will actually
   * be yielded, respecting `limit` and range filters.
   *
   * This eliminates the previous pathological behaviour where a
   * `reverse: true, limit: 1` query would fetch every value in the prefix.
   */
  private async *listReverse<T>(
    client: import('ioredis').Redis,
    pattern: string,
    limit: number,
    startStr: string | undefined,
    endStr: string | undefined,
  ): AsyncIterable<KvEntry<T>> {
    // --- Phase 1: SCAN all matching key names (no values) ---
    const allKeys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, keys] = await client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        REDIS_SCAN_COUNT,
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        allKeys.push(...keys);
      }
    } while (cursor !== '0');

    if (allKeys.length === 0) return;

    // Global reverse-lexicographic sort — gives correct ordering that
    // per-batch sorting could not guarantee across SCAN iterations.
    allKeys.sort();
    allKeys.reverse();

    // --- Pre-filter by start/end range on key names ---
    // This avoids MGET-fetching values for keys outside the requested range.
    let filteredKeys: string[];
    if (startStr || endStr) {
      filteredKeys = [];
      for (const redisKey of allKeys) {
        const key = redisKeyToKey(redisKey, this.namespace);
        const keyStr = keyToString(key);
        if (startStr && keyStr < startStr) continue;
        if (endStr && keyStr >= endStr) continue;
        filteredKeys.push(redisKey);
      }
    } else {
      filteredKeys = allKeys;
    }

    // --- Phase 2: MGET sub-batches, yielding up to `limit` entries ---
    let count = 0;
    for (
      let batchStart = 0;
      batchStart < filteredKeys.length && count < limit;
      batchStart += REDIS_MGET_BATCH_SIZE
    ) {
      const batchEnd = Math.min(batchStart + REDIS_MGET_BATCH_SIZE, filteredKeys.length);
      const batchKeys = filteredKeys.slice(batchStart, batchEnd);
      const values = await client.mget(...batchKeys);

      for (let i = 0; i < batchKeys.length; i++) {
        if (count >= limit) break;

        const data = values[i];
        if (data === null) continue;

        try {
          const stored = JSON.parse(data) as StoredValue<T>;
          const key = redisKeyToKey(batchKeys[i], this.namespace);

          yield { key, value: stored.value, versionstamp: stored.versionstamp };
          count += 1;
        } catch {
          logger.warn('Skipping malformed Redis KV entry during list()', {
            redisKey: batchKeys[i],
          });
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Atomic Transactions
  // ---------------------------------------------------------------------------

  /**
   * Execute an optimistic-concurrency Redis transaction.
   *
   * @param checks - Version checks that must succeed
   * @param mutations - Mutations to apply
   * @returns Atomic operation result
   */
  async atomic(
    checks: AtomicCheck[],
    mutations: AtomicMutation[],
  ): Promise<AtomicResult> {
    const client = await this.connection.ensureClient();
    const keysToWatch = checks.map((check) => keyToRedisKey(check.key, this.namespace));

    if (keysToWatch.length > 0) {
      await client.watch(...keysToWatch);
    }

    try {
      for (const check of checks) {
        const currentVersionstamp = (await this.get(check.key))?.versionstamp ?? null;
        if (currentVersionstamp !== check.versionstamp) {
          await client.unwatch();
          return { ok: false };
        }
      }

      const versionstamp = generateVersionstamp();
      const multi = client.multi();

      for (const mutation of mutations) {
        const redisKey = keyToRedisKey(mutation.key, this.namespace);
        switch (mutation.type) {
          case 'set': {
            const stored: StoredValue = { value: mutation.value, versionstamp };
            if (mutation.expireIn) {
              multi.psetex(redisKey, mutation.expireIn, JSON.stringify(stored));
            } else {
              multi.set(redisKey, JSON.stringify(stored));
            }
            break;
          }
          case 'delete':
            multi.del(redisKey);
            break;
          case 'sum':
          case 'min':
          case 'max': {
            logger.warn('Falling back to set semantics for unsupported Redis atomic mutation', {
              mutationType: mutation.type,
              redisKey,
            });
            const stored: StoredValue = { value: mutation.value, versionstamp };
            multi.set(redisKey, JSON.stringify(stored));
            break;
          }
        }
      }

      const result = await multi.exec();
      if (result === null) {
        return { ok: false };
      }

      for (const mutation of mutations) {
        await this.publishChange(
          mutation.key,
          mutation.type === 'delete' ? 'delete' : 'set',
          mutation.type === 'delete' ? null : mutation.value,
        );
      }

      return { ok: true, versionstamp };
    } catch (error: unknown) {
      await client.unwatch();
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Close the Redis clients owned by the adapter.
   */
  async close(): Promise<void> {
    await this.connection.close();
  }

  /**
   * Enable `await using` explicit resource management.
   *
   * @returns Result of {@linkcode close}
   */
  [Symbol.asyncDispose](): Promise<void> {
    return this.close();
  }

  // ---------------------------------------------------------------------------
  // Watch — Fixed Keys
  // ---------------------------------------------------------------------------

  /**
   * Watch a fixed set of keys for changes.
   *
   * @param keys - Keys to observe
   * @param options - Watch stream options
   * @returns Async iterable of event batches
   */
  async *watch<T = unknown>(
    keys: KvKey[],
    options?: WatchOptions,
  ): AsyncIterable<WatchEvent<T>[]> {
    const subscriber = await this.connection.ensureSubscriber();
    const channel = this.getWatchChannel();
    const previousValues = new Map<string, T | null>();
    const watchedKeys = new Set(keys.map(keyToString));

    for (const key of keys) {
      const entry = await this.get<T>(key);
      previousValues.set(keyToString(key), entry?.value ?? null);
    }

    await subscriber.subscribe(channel);

    const eventQueue: WatchEvent<T>[] = [];
    let resolveNext: ((events: WatchEvent<T>[]) => void) | null = null;
    const messageHandler = (receivedChannel: string, message: string): void => {
      if (receivedChannel !== channel) {
        return;
      }

      try {
        const data = JSON.parse(message) as {
          key: KvKey;
          timestamp: number;
          type: 'set' | 'delete';
          value: T | null;
        };
        const keyStr = keyToString(data.key);

        if (!watchedKeys.has(keyStr)) {
          return;
        }

        const event: WatchEvent<T> = {
          key: data.key,
          previousValue: previousValues.get(keyStr) ?? null,
          timestamp: new Date(data.timestamp),
          type: data.type,
          value: data.value,
          versionstamp: generateVersionstamp(),
        };

        previousValues.set(keyStr, data.value);
        eventQueue.push(event);

        if (resolveNext) {
          resolveNext([...eventQueue]);
          eventQueue.length = 0;
          resolveNext = null;
        }
      } catch {
        logger.warn('Ignoring malformed Redis watch message');
      }
    };

    subscriber.on('message', messageHandler);

    try {
      while (!options?.signal?.aborted) {
        const events = await new Promise<WatchEvent<T>[]>((resolve) => {
          resolveNext = resolve;
          if (options?.debounce) {
            setTimeout(() => {
              if (eventQueue.length === 0) {
                return;
              }

              resolve([...eventQueue]);
              eventQueue.length = 0;
              resolveNext = null;
            }, options.debounce);
          }
        });

        if (events.length > 0) {
          yield events;
        }
      }
    } finally {
      subscriber.off('message', messageHandler);
      await subscriber.unsubscribe(channel);
    }
  }

  // ---------------------------------------------------------------------------
  // Watch — Prefix
  // ---------------------------------------------------------------------------

  /**
   * Watch a key prefix, including newly created keys.
   *
   * @param prefix - Prefix to observe
   * @param options - Prefix watch options
   * @returns Async iterable of individual events
   */
  async *watchPrefix<T = unknown>(
    prefix: KvKey,
    options?: WatchPrefixOptions,
  ): AsyncIterable<WatchEvent<T>> {
    const subscriber = await this.connection.ensureSubscriber();
    const channel = this.getWatchChannel();
    const pollInterval = options?.pollInterval ?? 1000;
    const knownVersions = new Map<string, string>();

    if (!options?.skipInitial) {
      for await (const entry of this.list<T>({ prefix })) {
        const keyStr = keyToString(entry.key);
        const versionstamp = entry.versionstamp ?? generateVersionstamp();
        knownVersions.set(keyStr, versionstamp);
        yield {
          key: entry.key,
          timestamp: new Date(),
          type: 'set',
          value: entry.value,
          versionstamp,
        };
      }
    } else {
      for await (const entry of this.list<T>({ prefix })) {
        knownVersions.set(keyToString(entry.key), entry.versionstamp ?? generateVersionstamp());
      }
    }

    await subscriber.subscribe(channel);
    const eventQueue: WatchEvent<T>[] = [];
    const messageHandler = (_channel: string, message: string): void => {
      try {
        const data = JSON.parse(message) as {
          key: KvKey;
          timestamp: number;
          type: 'set' | 'delete';
          value: T | null;
        };

        if (!keyHasPrefix(data.key, prefix)) {
          return;
        }

        const keyStr = keyToString(data.key);
        const versionstamp = generateVersionstamp();
        eventQueue.push({
          key: data.key,
          timestamp: new Date(data.timestamp),
          type: data.type,
          value: data.value,
          versionstamp,
        });

        if (data.type === 'delete') {
          knownVersions.delete(keyStr);
        } else {
          knownVersions.set(keyStr, versionstamp);
        }
      } catch {
        logger.warn('Ignoring malformed Redis prefix watch message');
      }
    };

    subscriber.on('message', messageHandler);

    try {
      while (!options?.signal?.aborted) {
        while (eventQueue.length > 0) {
          yield eventQueue.shift()!;
        }

        await delay(pollInterval);

        if (options?.signal?.aborted) {
          break;
        }

        const seenKeys = new Set<string>();

        for await (const entry of this.list<T>({ prefix })) {
          const keyStr = keyToString(entry.key);
          const versionstamp = entry.versionstamp ?? generateVersionstamp();
          seenKeys.add(keyStr);

          const existingVersion = knownVersions.get(keyStr);
          if (existingVersion === versionstamp) {
            continue;
          }

          knownVersions.set(keyStr, versionstamp);
          yield {
            key: entry.key,
            timestamp: new Date(),
            type: 'set',
            value: entry.value,
            versionstamp,
          };
        }

        for (const keyStr of [...knownVersions.keys()]) {
          if (seenKeys.has(keyStr)) {
            continue;
          }

          knownVersions.delete(keyStr);
          yield {
            key: JSON.parse(keyStr) as KvKey,
            timestamp: new Date(),
            type: 'delete',
            value: null,
            versionstamp: null,
          };
        }
      }
    } finally {
      subscriber.off('message', messageHandler);
      await subscriber.unsubscribe(channel);
    }
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Get the pub/sub channel used for watch notifications.
   *
   * @returns Watch channel name
   */
  private getWatchChannel(): string {
    return `${this.namespace}:${WATCH_CHANNEL_SUFFIX}`;
  }

  /**
   * Publish a watch notification after a write mutation.
   *
   * @param key - Changed key
   * @param type - Mutation type
   * @param value - Updated value
   */
  private async publishChange(
    key: KvKey,
    type: 'set' | 'delete',
    value: unknown,
  ): Promise<void> {
    try {
      const client = await this.connection.ensureClient();
      await client.publish(
        this.getWatchChannel(),
        JSON.stringify({
          key,
          timestamp: Date.now(),
          type,
          value,
        }),
      );
    } catch (error: unknown) {
      logger.warn('Failed to publish Redis KV watch event', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
