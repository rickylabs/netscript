/**
 * Deno KV-backed `WatchableKv` implementation.
 *
 * @module
 */

import { delay } from '@std/async';
import { chunk } from '@std/collections/chunk';
import { KvClosedError } from '../application/errors.ts';
import { keyToString } from '../application/keys.ts';
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

const MAX_WATCH_KEYS = 10;
const WATCH_BATCH_TIMEOUT_MS = 100;

/**
 * Deno-native adapter for `@netscript/kv`.
 *
 * @example
 * ```ts
 * const kv = await Deno.openKv();
 * const adapter = new DenoKvAdapter(kv);
 * ```
 */
export class DenoKvAdapter implements WatchableKv {
  private kv: Deno.Kv | null = null;
  private kvPromise: Promise<Deno.Kv> | null = null;
  private closed = false;

  /**
   * Deno KV supports native watch operations.
   */
  readonly supportsWatch: boolean = true;

  /**
   * Create a Deno KV adapter.
   *
   * @param kv - Existing Deno KV instance
   * @param path - Optional path or URL used when lazily opening Deno KV
   */
  constructor(kv?: Deno.Kv, private readonly path?: string) {
    if (kv) {
      this.kv = kv;
      this.kvPromise = Promise.resolve(kv);
    }
  }

  /**
   * Get the underlying Deno KV instance.
   *
   * @returns The backing Deno KV connection
   */
  async getRawKv(): Promise<Deno.Kv> {
    return await this.ensureOpen();
  }

  /**
   * Read a value by key.
   *
   * @param key - Key to resolve
   * @returns Stored entry or `null`
   */
  async get<T = unknown>(key: KvKey): Promise<KvEntry<T> | null> {
    const kv = await this.ensureOpen();
    const result = await kv.get<T>(key);

    if (result.value === null) {
      return null;
    }

    return {
      key: result.key as KvKey,
      value: result.value,
      versionstamp: result.versionstamp,
    };
  }

  /**
   * Store a value.
   *
   * @param key - Key to write
   * @param value - Value to store
   * @param options - Optional TTL settings
   */
  async set(key: KvKey, value: unknown, options?: KvSetOptions): Promise<void> {
    const kv = await this.ensureOpen();
    await kv.set(key, value, { expireIn: options?.expireIn });
  }

  /**
   * Delete a key.
   *
   * @param key - Key to remove
   */
  async delete(key: KvKey): Promise<void> {
    const kv = await this.ensureOpen();
    await kv.delete(key);
  }

  /**
   * Check whether a key exists.
   *
   * @param key - Key to inspect
   * @returns `true` when the key exists
   */
  async has(key: KvKey): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  /**
   * List entries under a prefix or range.
   *
   * @param options - Selector and pagination options
   * @returns Async iterable of matching entries
   */
  async *list<T = unknown>(options: KvListOptions): AsyncIterable<KvEntry<T>> {
    const kv = await this.ensureOpen();
    const selector: Deno.KvListSelector = { prefix: options.prefix };

    if (options.start) {
      (selector as Deno.KvListSelector & { start: KvKey }).start = options.start;
    }

    if (options.end) {
      (selector as Deno.KvListSelector & { end: KvKey }).end = options.end;
    }

    for await (
      const entry of kv.list<T>(selector, {
        consistency: options.consistency,
        limit: options.limit,
        reverse: options.reverse,
      })
    ) {
      yield {
        key: entry.key as KvKey,
        value: entry.value,
        versionstamp: entry.versionstamp,
      };
    }
  }

  /**
   * Execute a Deno KV atomic operation.
   *
   * @param checks - Version checks that must succeed
   * @param mutations - Mutations to apply
   * @returns Atomic operation result
   */
  async atomic(
    checks: AtomicCheck[],
    mutations: AtomicMutation[],
  ): Promise<AtomicResult> {
    const kv = await this.ensureOpen();
    let atomic = kv.atomic();

    for (const check of checks) {
      atomic = atomic.check({ key: check.key, versionstamp: check.versionstamp });
    }

    for (const mutation of mutations) {
      switch (mutation.type) {
        case 'set':
          atomic = atomic.set(mutation.key, mutation.value, { expireIn: mutation.expireIn });
          break;
        case 'delete':
          atomic = atomic.delete(mutation.key);
          break;
        case 'sum':
          atomic = atomic.sum(mutation.key, mutation.value);
          break;
        case 'min':
          atomic = atomic.min(mutation.key, mutation.value);
          break;
        case 'max':
          atomic = atomic.max(mutation.key, mutation.value);
          break;
      }
    }

    const result = await atomic.commit();
    return result.ok ? { ok: true, versionstamp: result.versionstamp } : { ok: false };
  }

  /**
   * Close the adapter and its underlying Deno KV connection.
   */
  close(): Promise<void> {
    if (this.closed) {
      return Promise.resolve();
    }

    this.closed = true;

    if (this.kv) {
      this.kv.close();
      this.kv = null;
    }

    return Promise.resolve();
  }

  /**
   * Enable `await using` explicit resource management.
   *
   * @returns Result of {@linkcode close}
   */
  [Symbol.asyncDispose](): Promise<void> {
    return this.close();
  }

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
    const kv = await this.ensureOpen();
    const previousValues = new Map<string, T | null>();
    const reader = kv.watch<T[]>(keys, { raw: options?.raw }).getReader();

    for (const key of keys) {
      const entry = await kv.get<T>(key);
      previousValues.set(keyToString(key), entry.value);
    }

    try {
      while (true) {
        const { done, value: entries } = await reader.read();
        if (done || !entries) {
          break;
        }

        if (options?.signal?.aborted) {
          break;
        }

        const events: WatchEvent<T>[] = [];
        for (let index = 0; index < entries.length; index += 1) {
          const entry = entries[index];
          const key = keys[index];
          const keyStr = keyToString(key);
          const previousValue = previousValues.get(keyStr) ?? null;

          if (previousValue === entry.value) {
            continue;
          }

          events.push({
            key,
            previousValue,
            timestamp: new Date(),
            type: entry.value === null ? 'delete' : 'set',
            value: entry.value,
            versionstamp: entry.versionstamp,
          });
          previousValues.set(keyStr, entry.value);
        }

        if (events.length === 0) {
          continue;
        }

        if (options?.debounce) {
          await delay(options.debounce);
        }

        yield events;
      }
    } finally {
      reader.releaseLock();
    }
  }

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
    const kv = await this.ensureOpen();
    const pollInterval = options?.pollInterval ?? 1000;

    if (options?.skipInitial) {
      yield* this.watchPrefixLightweight<T>(kv, prefix, pollInterval, options);
      return;
    }

    const knownKeys = new Map<
      string,
      { key: KvKey; value: T | null; versionstamp: string | null }
    >();

    for await (const entry of kv.list<T>({ prefix })) {
      const key = entry.key as KvKey;
      knownKeys.set(keyToString(key), {
        key,
        value: entry.value,
        versionstamp: entry.versionstamp,
      });
    }

    for (const { key, value, versionstamp } of knownKeys.values()) {
      yield {
        key,
        timestamp: new Date(),
        type: 'set',
        value,
        versionstamp,
      };
    }

    let lastPollTime = Date.now();

    while (!options?.signal?.aborted) {
      const keysToWatch = Array.from(knownKeys.values(), ({ key }) => key);

      if (keysToWatch.length > 0) {
        const batches = chunk(keysToWatch, MAX_WATCH_KEYS);
        const result = await Promise.race([
          Promise.all(
            batches.map((batch) => this.watchKnownKeysOnce<T>(kv, batch, knownKeys, options)),
          ).then((eventArrays) => ({
            type: 'events' as const,
            events: eventArrays.flat(),
          })),
          delay(Math.min(pollInterval, 500)).then(() => ({ type: 'timeout' as const })),
        ]);

        if (result.type === 'events') {
          for (const event of result.events) {
            yield event;
          }
        }
      } else {
        await delay(pollInterval);
      }

      if (Date.now() - lastPollTime < pollInterval) {
        continue;
      }

      lastPollTime = Date.now();
      yield* this.pollPrefixChanges<T>(kv, prefix, knownKeys);
    }
  }

  /**
   * Resolve the backing Deno KV connection.
   *
   * @returns Open Deno KV instance
   */
  private async ensureOpen(): Promise<Deno.Kv> {
    if (this.closed) {
      throw new KvClosedError('DenoKvAdapter is closed.');
    }

    if (this.kv) {
      return this.kv;
    }

    if (!this.kvPromise) {
      this.kvPromise = Deno.openKv(this.path);
    }

    this.kv = await this.kvPromise;
    return this.kv;
  }

  /**
   * Poll for new, changed, or deleted keys under a prefix.
   *
   * @param kv - Open Deno KV instance
   * @param prefix - Prefix being observed
   * @param knownKeys - Previously seen key state
   * @returns Async iterable of discovered changes
   */
  private async *pollPrefixChanges<T>(
    kv: Deno.Kv,
    prefix: KvKey,
    knownKeys: Map<string, { key: KvKey; value: T | null; versionstamp: string | null }>,
  ): AsyncIterable<WatchEvent<T>> {
    for await (const entry of kv.list<T>({ prefix })) {
      const key = entry.key as KvKey;
      const keyStr = keyToString(key);
      const existing = knownKeys.get(keyStr);

      if (!existing) {
        knownKeys.set(keyStr, { key, value: entry.value, versionstamp: entry.versionstamp });
        yield {
          key,
          timestamp: new Date(),
          type: 'set',
          value: entry.value,
          versionstamp: entry.versionstamp,
        };
        continue;
      }

      if (existing.versionstamp === entry.versionstamp) {
        continue;
      }

      knownKeys.set(keyStr, { key, value: entry.value, versionstamp: entry.versionstamp });
      yield {
        key,
        previousValue: existing.value,
        timestamp: new Date(),
        type: entry.value === null ? 'delete' : 'set',
        value: entry.value,
        versionstamp: entry.versionstamp,
      };
    }

    for (const [keyStr, data] of knownKeys) {
      const entry = await kv.get<T>(data.key);
      if (entry.value !== null || data.value === null) {
        continue;
      }

      knownKeys.delete(keyStr);
      yield {
        key: data.key,
        previousValue: data.value,
        timestamp: new Date(),
        type: 'delete',
        value: null,
        versionstamp: entry.versionstamp,
      };
    }
  }

  /**
   * Poll a prefix without emitting initial state.
   *
   * @param kv - Open Deno KV instance
   * @param prefix - Prefix being observed
   * @param pollInterval - Poll cadence in milliseconds
   * @param options - Prefix watch options
   * @returns Async iterable of discovered changes
   */
  private async *watchPrefixLightweight<T>(
    kv: Deno.Kv,
    prefix: KvKey,
    pollInterval: number,
    options?: WatchPrefixOptions,
  ): AsyncIterable<WatchEvent<T>> {
    const knownVersions = new Map<string, string | null>();

    for await (const entry of kv.list<T>({ prefix })) {
      knownVersions.set(keyToString(entry.key as KvKey), entry.versionstamp);
    }

    while (!options?.signal?.aborted) {
      await delay(pollInterval);

      if (options?.signal?.aborted) {
        break;
      }

      const seenKeys = new Set<string>();

      for await (const entry of kv.list<T>({ prefix })) {
        const key = entry.key as KvKey;
        const keyStr = keyToString(key);
        seenKeys.add(keyStr);

        const existingVersion = knownVersions.get(keyStr);
        if (existingVersion === entry.versionstamp) {
          continue;
        }

        knownVersions.set(keyStr, entry.versionstamp);
        yield {
          key,
          timestamp: new Date(),
          type: 'set',
          value: entry.value,
          versionstamp: entry.versionstamp,
        };
      }

      for (const keyStr of knownVersions.keys()) {
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
  }

  /**
   * Perform a single bounded watch read for a known batch of keys.
   *
   * @param kv - Open Deno KV instance
   * @param keys - Keys to watch
   * @param knownKeys - Previously seen key state
   * @param options - Watch stream options
   * @returns Collected events for the batch
   */
  private async watchKnownKeysOnce<T>(
    kv: Deno.Kv,
    keys: KvKey[],
    knownKeys: Map<string, { key: KvKey; value: T | null; versionstamp: string | null }>,
    options?: WatchOptions,
  ): Promise<WatchEvent<T>[]> {
    const events: WatchEvent<T>[] = [];
    const controller = new AbortController();
    const reader = kv.watch<T[]>(keys, { raw: options?.raw }).getReader();

    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const timeout = setTimeout(() => controller.abort(), WATCH_BATCH_TIMEOUT_MS);

    try {
      const result = await Promise.race([
        reader.read(),
        new Promise<{ done: true; value: undefined }>((resolve) =>
          controller.signal.addEventListener(
            'abort',
            () => resolve({ done: true, value: undefined }),
            { once: true },
          )
        ),
      ]);

      if (result.done || !result.value) {
        return events;
      }

      for (let index = 0; index < result.value.length; index += 1) {
        const entry = result.value[index];
        const key = keys[index];
        const keyStr = keyToString(key);
        const existing = knownKeys.get(keyStr);

        if (!existing || existing.versionstamp === entry.versionstamp) {
          continue;
        }

        knownKeys.set(keyStr, { key, value: entry.value, versionstamp: entry.versionstamp });
        events.push({
          key,
          previousValue: existing.value,
          timestamp: new Date(),
          type: entry.value === null ? 'delete' : 'set',
          value: entry.value,
          versionstamp: entry.versionstamp,
        });
      }

      return events;
    } finally {
      clearTimeout(timeout);
      controller.abort();
      reader.releaseLock();
    }
  }
}
