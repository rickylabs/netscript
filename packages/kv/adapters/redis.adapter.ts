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
import { combineAtomicValue } from '../application/atomic-combine.ts';
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

import {
  decodeEnvelope,
  encodeEnvelope,
  encodeStoredValue,
  type WatchMessage,
} from './redis/codec.ts';
import { RedisConnectionManager } from './redis/connection.ts';
import { keyToRedisKey, redisKeyToKey } from './redis/serialization.ts';
import { WatchBatchQueue } from './redis/watch-batch-queue.ts';
import {
  DEFAULT_REDIS_NAMESPACE,
  DEFAULT_REDIS_URL,
  REDIS_ATOMIC_MAX_ATTEMPTS,
  REDIS_MGET_BATCH_SIZE,
  REDIS_SCAN_COUNT,
  type StoredValue,
  WATCH_CHANNEL_SUFFIX,
} from './redis/types.ts';

export type { RedisKvOptions } from './redis/types.ts';

const logger = createPackageLogger('kv');

/** A change to publish on the watch channel once its write has committed. */
interface WatchChange {
  key: KvKey;
  type: 'set' | 'delete';
  value: unknown;
}

type CombineMutation = Extract<AtomicMutation, { type: 'sum' | 'min' | 'max' }>;

function isCombineMutation(mutation: AtomicMutation): mutation is CombineMutation {
  return mutation.type === 'sum' || mutation.type === 'min' || mutation.type === 'max';
}

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
  private atomicTail: Promise<void> = Promise.resolve();

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

    const stored = this.decodeStored<T>(data);
    return { key, value: stored.value, versionstamp: stored.versionstamp };
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
    const versionstamp = generateVersionstamp();
    const stored = encodeStoredValue(value, versionstamp);

    if (options?.expireIn) {
      await client.psetex(redisKey, options.expireIn, stored);
    } else {
      await client.set(redisKey, stored);
    }

    await this.publishChanges([{ key, type: 'set', value }], versionstamp);
  }

  /**
   * Delete a value by key.
   *
   * @param key - Key to remove
   */
  async delete(key: KvKey): Promise<void> {
    const client = await this.connection.ensureClient();
    await client.del(keyToRedisKey(key, this.namespace));
    await this.publishChanges([{ key, type: 'delete', value: null }], generateVersionstamp());
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
        const stored = this.decodeStored<T>(data);
        results[idx] = { key: keys[idx], value: stored.value, versionstamp: stored.versionstamp };
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
            const stored = decodeEnvelope<StoredValue<T>>(data);
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
          const stored = decodeEnvelope<StoredValue<T>>(data);
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
    const previous = this.atomicTail;
    const next = Promise.withResolvers<void>();
    this.atomicTail = next.promise;
    await previous;

    try {
      return await this.executeAtomic(checks, mutations);
    } finally {
      next.resolve();
    }
  }

  /**
   * Commit optimistically, retrying while only a concurrent write to a
   * watched key prevented `EXEC`.
   *
   * A retry re-runs the checks, so a commit whose check key changed still
   * fails; a retry only rescues commits that conflicted on a `sum`/`min`/`max`
   * operand, which Deno KV never reports as a failure.
   */
  private async executeAtomic(
    checks: AtomicCheck[],
    mutations: AtomicMutation[],
  ): Promise<AtomicResult> {
    const client = await this.connection.ensureClient();

    for (let attempt = 1; attempt <= REDIS_ATOMIC_MAX_ATTEMPTS; attempt++) {
      const outcome = await this.tryCommit(client, checks, mutations);
      if (outcome !== 'conflict') {
        return outcome;
      }
    }

    logger.warn('Redis atomic commit kept conflicting with concurrent writes', {
      attempts: REDIS_ATOMIC_MAX_ATTEMPTS,
    });
    return { ok: false };
  }

  /**
   * One optimistic attempt: `WATCH` every key the commit reads, verify the
   * checks and read the combine operands in one `MGET`, then `EXEC` every
   * write under a single versionstamp.
   *
   * @returns The commit result, or `'conflict'` when a watched key changed
   *   before `EXEC`.
   */
  private async tryCommit(
    client: import('ioredis').Redis,
    checks: AtomicCheck[],
    mutations: AtomicMutation[],
  ): Promise<AtomicResult | 'conflict'> {
    const readKeys = [
      ...new Set([
        ...checks.map((check) => keyToRedisKey(check.key, this.namespace)),
        ...mutations.filter(isCombineMutation).map((mutation) =>
          keyToRedisKey(mutation.key, this.namespace)
        ),
      ]),
    ];

    if (readKeys.length > 0) {
      await client.watch(...readKeys);
    }

    try {
      const current = await this.readStored(client, readKeys);
      for (const check of checks) {
        const stored = current.get(keyToRedisKey(check.key, this.namespace));
        if ((stored?.versionstamp ?? null) !== check.versionstamp) {
          await client.unwatch();
          return { ok: false };
        }
      }

      const versionstamp = generateVersionstamp();
      const multi = client.multi();
      const changes = this.queueMutations(multi, mutations, current, versionstamp);

      if ((await multi.exec()) === null) {
        return 'conflict';
      }

      await this.publishChanges(changes, versionstamp);
      return { ok: true, versionstamp };
    } catch (error: unknown) {
      await client.unwatch();
      throw error;
    }
  }

  /**
   * Read stored envelopes for the given Redis keys in one `MGET`.
   *
   * @param client - Command client
   * @param redisKeys - Keys to read; bounded by the size of one commit
   * @returns Envelope per key, `null` when absent
   */
  private async readStored(
    client: import('ioredis').Redis,
    redisKeys: string[],
  ): Promise<Map<string, StoredValue | null>> {
    const stored = new Map<string, StoredValue | null>();
    if (redisKeys.length === 0) {
      return stored;
    }

    const values = await client.mget(...redisKeys);
    redisKeys.forEach((redisKey, index) => {
      const data = values[index];
      stored.set(redisKey, data === null ? null : this.decodeStored(data));
    });
    return stored;
  }

  /**
   * Queue every mutation of a commit on `multi` under one versionstamp.
   *
   * `sum`/`min`/`max` combine with the value stored before the commit, or
   * with the value an earlier mutation of the same commit wrote.
   *
   * @returns The changes to publish once the commit succeeds
   */
  private queueMutations(
    multi: import('ioredis').ChainableCommander,
    mutations: AtomicMutation[],
    current: ReadonlyMap<string, StoredValue | null>,
    versionstamp: string,
  ): WatchChange[] {
    const written = new Map<string, unknown>();
    const changes: WatchChange[] = [];

    for (const mutation of mutations) {
      const redisKey = keyToRedisKey(mutation.key, this.namespace);

      if (mutation.type === 'delete') {
        multi.del(redisKey);
        written.set(redisKey, undefined);
        changes.push({ key: mutation.key, type: 'delete', value: null });
        continue;
      }

      const value = mutation.type === 'set' ? mutation.value : combineAtomicValue(
        mutation.type,
        written.has(redisKey) ? written.get(redisKey) : current.get(redisKey)?.value,
        mutation.value,
      );
      const stored = encodeStoredValue(value, versionstamp);
      if (mutation.type === 'set' && mutation.expireIn) {
        multi.psetex(redisKey, mutation.expireIn, stored);
      } else {
        multi.set(redisKey, stored);
      }
      written.set(redisKey, value);
      changes.push({ key: mutation.key, type: 'set', value });
    }

    return changes;
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

    const queue = new WatchBatchQueue<WatchEvent<T>>();
    const messageHandler = (receivedChannel: string, message: string): void => {
      if (receivedChannel !== channel) {
        return;
      }

      const data = this.parseWatchMessage<T>(message);
      if (!data) {
        return;
      }

      const keyStr = keyToString(data.key);
      if (!watchedKeys.has(keyStr)) {
        return;
      }

      queue.push({
        key: data.key,
        previousValue: previousValues.get(keyStr) ?? null,
        timestamp: new Date(data.timestamp),
        type: data.type,
        value: data.value,
        versionstamp: data.versionstamp ?? generateVersionstamp(),
      });
      previousValues.set(keyStr, data.value);
    };

    subscriber.on('message', messageHandler);

    try {
      while (!options?.signal?.aborted) {
        const events = await queue.next(options?.debounce, options?.signal);
        if (events.length > 0 && !options?.signal?.aborted) {
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
      const data = this.parseWatchMessage<T>(message);
      if (!data || !keyHasPrefix(data.key, prefix)) {
        return;
      }

      const keyStr = keyToString(data.key);
      const versionstamp = data.versionstamp ?? generateVersionstamp();
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
   * Publish watch notifications for committed writes in one pipeline.
   *
   * @param changes - Committed changes, in commit order
   * @param versionstamp - Versionstamp of the commit
   */
  private async publishChanges(
    changes: readonly WatchChange[],
    versionstamp: string,
  ): Promise<void> {
    try {
      const client = await this.connection.ensureClient();
      const pipeline = client.pipeline();
      const timestamp = Date.now();
      for (const change of changes) {
        const message: WatchMessage = { ...change, timestamp, versionstamp };
        pipeline.publish(this.getWatchChannel(), encodeEnvelope({ ...message }));
      }
      await pipeline.exec();
    } catch (error: unknown) {
      logger.warn('Failed to publish Redis KV watch event', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Parse a watch-channel message.
   *
   * @param message - Raw pub/sub payload
   * @returns The decoded message, or `null` when malformed
   */
  private parseWatchMessage<T>(message: string): WatchMessage<T> | null {
    try {
      return decodeEnvelope<WatchMessage<T>>(message);
    } catch {
      logger.warn('Ignoring malformed Redis watch message');
      return null;
    }
  }

  /**
   * Decode a stored envelope, tolerating values written without one.
   *
   * @param data - Raw Redis value
   * @returns The envelope; legacy raw (non-JSON) values get a fresh versionstamp
   * @throws {TypeError} When the envelope's bigint metadata is malformed
   */
  private decodeStored<T = unknown>(data: string): StoredValue<T> {
    try {
      return decodeEnvelope<StoredValue<T>>(data);
    } catch (error: unknown) {
      if (!(error instanceof SyntaxError)) {
        throw error;
      }
      return { value: data as T, versionstamp: generateVersionstamp() };
    }
  }
}
