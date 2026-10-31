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

import { createWatchHandle } from '../application/watch-handle.ts';
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
  WatchStream,
} from '../types/common.ts';

import {
  decodeEnvelope,
  encodeEnvelope,
  encodeStoredValue,
  type WatchMessage,
} from './redis/codec.ts';
import { RedisConnectionManager } from './redis/connection.ts';
import { listEntries, scanEntries } from './redis/list-entries.ts';
import { keyToRedisKey } from './redis/serialization.ts';
import { WatchBatchQueue } from './redis/watch-batch-queue.ts';
import { WatchSubscriptions } from './redis/watch-subscriptions.ts';
import {
  DEFAULT_REDIS_NAMESPACE,
  DEFAULT_REDIS_URL,
  REDIS_ATOMIC_MAX_ATTEMPTS,
  REDIS_MGET_BATCH_SIZE,
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
  private readonly subscriptions: WatchSubscriptions<WatchMessage>;
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
    this.subscriptions = new WatchSubscriptions(
      () => this.connection.ensureSubscriber(),
      (message) => this.parseWatchMessage(message),
    );
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
   * List globally ordered entries with exclusive bounds and bounded key selection memory.
   *
   * Each output window scans the keyspace before fetching selected values. See the
   * package README for the repeated-scan cost of large or unlimited iterations.
   *
   * @param options - Selector and pagination options
   * @returns Async iterable of matching entries
   */
  async *list<T = unknown>(options: KvListOptions): AsyncIterable<KvEntry<T>> {
    const client = await this.connection.ensureClient();
    yield* listEntries<T>(client, this.namespace, options);
  }

  /** Watch discovery needs one unordered SCAN pass, regardless of prefix cardinality. */
  private async *scanPrefix<T>(prefix: KvKey): AsyncIterable<KvEntry<T>> {
    const client = await this.connection.ensureClient();
    yield* scanEntries<T>(client, this.namespace, prefix);
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
  watch<T = unknown>(
    keys: KvKey[],
    options?: WatchOptions,
  ): WatchStream<T> {
    return createWatchHandle((ready) => this.watchKeys<T>(keys, options, ready));
  }

  /** Subscribe, acknowledge readiness, and deliver fixed-key batches. */
  private async *watchKeys<T>(
    keys: KvKey[],
    options: WatchOptions | undefined,
    ready: () => void,
  ): AsyncIterable<WatchEvent<T>[]> {
    if (options?.signal?.aborted) return;
    const channel = this.getWatchChannel();
    const previousValues = new Map<string, T | null>();
    const knownVersions = new Map<string, string>();
    const watchedKeys = new Set(keys.map(keyToString));
    const queue = new WatchBatchQueue<WatchEvent<T>>();
    const messageHandler = (data: WatchMessage): void => {
      const keyStr = keyToString(data.key);
      if (!watchedKeys.has(keyStr)) {
        return;
      }
      const versionstamp = data.versionstamp ?? generateVersionstamp();
      if (knownVersions.get(keyStr) === versionstamp) return;
      knownVersions.set(keyStr, versionstamp);
      queue.push({
        key: data.key,
        previousValue: previousValues.get(keyStr) ?? null,
        timestamp: new Date(data.timestamp),
        type: data.type,
        value: data.value as T | null,
        versionstamp,
      });
      previousValues.set(keyStr, data.value as T | null);
    };
    const release = await this.subscriptions.acquire(channel, messageHandler);
    try {
      if (options?.signal?.aborted) return;
      ready();
      // Messages received during these reads remain queued. A read must not
      // overwrite the previous value already advanced by a startup message.
      // Its first previousValue is null: the baseline may already contain that
      // write (or a newer write), so it cannot establish the preceding value.
      const entries = await this.getMany<T>(keys);
      for (const [index, key] of keys.entries()) {
        const entry = entries[index];
        const keyStr = keyToString(key);
        if (!knownVersions.has(keyStr)) previousValues.set(keyStr, entry?.value ?? null);
      }
      if (options?.initial && !options.signal?.aborted) {
        yield keys.map((key, index) => {
          const entry = entries[index];
          return {
            key,
            timestamp: new Date(),
            type: entry ? 'set' : 'delete',
            value: entry?.value ?? null,
            versionstamp: entry?.versionstamp ?? null,
            initial: true,
          };
        });
      }
      while (!options?.signal?.aborted) {
        const events = await queue.next(options?.debounce, options?.signal);
        if (events.length > 0 && !options?.signal?.aborted) {
          yield events;
        }
      }
    } finally {
      await release();
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
    if (options?.signal?.aborted) return;
    const channel = this.getWatchChannel();
    const pollInterval = options?.pollInterval ?? 1000;
    const knownVersions = new Map<string, string>();

    const queue = new WatchBatchQueue<WatchEvent<T>>();
    const startupKeys = new Set<string>();
    let initializing = true;
    const messageHandler = (data: WatchMessage): void => {
      if (!keyHasPrefix(data.key, prefix)) return;
      const versionstamp = data.versionstamp ?? generateVersionstamp();
      if (initializing) {
        startupKeys.add(keyToString(data.key));
      }
      queue.push({
        key: data.key,
        timestamp: new Date(data.timestamp),
        type: data.type,
        value: data.value as T | null,
        versionstamp,
      });
    };
    const release = await this.subscriptions.acquire(channel, messageHandler);
    try {
      for await (const entry of this.scanPrefix<T>(prefix)) {
        const keyStr = keyToString(entry.key);
        const versionstamp = entry.versionstamp ?? generateVersionstamp();
        // Buffered writes own this key's startup history. Yielding a newer
        // snapshot before that history would move the consumer backwards.
        if (startupKeys.has(keyStr)) continue;
        knownVersions.set(keyStr, versionstamp);
        if (!options?.skipInitial) {
          yield {
            key: entry.key,
            timestamp: new Date(),
            type: 'set',
            value: entry.value,
            versionstamp,
          };
        }
      }
      // skipInitial suppresses the baseline only, never a subscribed change.
      if (options?.skipInitial) {
        for (const key of startupKeys) knownVersions.delete(key);
      }
      initializing = false;
      startupKeys.clear();
      let nextScanAt = Date.now() + pollInterval;
      while (!options?.signal?.aborted) {
        const poll = new AbortController();
        const timeout = setTimeout(() => poll.abort(), Math.max(0, nextScanAt - Date.now()));
        let events: WatchEvent<T>[];
        try {
          const signal = options?.signal
            ? AbortSignal.any([options.signal, poll.signal])
            : poll.signal;
          // Discovery bounds the empty wait, not the debounce or queued events.
          // Drain notifications before scanning so a queued delete is not
          // first synthesized by the scan and then delivered a second time.
          events = await queue.next(options?.debounce, options?.signal, signal);
        } finally {
          clearTimeout(timeout);
        }
        for (const event of events) {
          if (options?.signal?.aborted) break;
          const keyStr = keyToString(event.key);
          if (knownVersions.get(keyStr) === event.versionstamp) continue;
          if (event.type === 'delete') knownVersions.delete(keyStr);
          else knownVersions.set(keyStr, event.versionstamp!);
          yield event;
        }

        if (options?.signal?.aborted) {
          break;
        }
        if (Date.now() < nextScanAt) continue;

        const seenKeys = new Set<string>();

        for await (const entry of this.scanPrefix<T>(prefix)) {
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
        nextScanAt = Date.now() + pollInterval;
      }
    } finally {
      await release();
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
