/**
 * In-memory `WatchableKv` implementation for tests and local development.
 *
 * @module
 */

import { delay } from '@std/async';
import { BinaryHeap } from '@std/data-structures';
import { KvClosedError } from '../core/errors.ts';
import { compareKeys, generateVersionstamp, keyHasPrefix, keyToString } from '../core/keys.ts';
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

interface StorageEntry<T = unknown> {
  key: KvKey;
  value: T;
  versionstamp: string;
  expiresAt?: number;
}

/** Heap entry for TTL-based key expiration. */
interface ExpirationEntry {
  /** When the key should expire (epoch ms). */
  expiresAt: number;
  /** Serialized key string for Map lookup. */
  keyStr: string;
}

/**
 * Volatile adapter that keeps all data in process memory.
 */
export class MemoryKvAdapter implements WatchableKv {
  private readonly storage = new Map<string, StorageEntry>();
  private readonly watchers = new Map<string, Set<(event: WatchEvent) => void>>();
  private readonly prefixWatchers = new Map<string, {
    prefix: KvKey;
    handlers: Set<(event: WatchEvent) => void>;
  }>();
  private readonly expirationHeap = new BinaryHeap<ExpirationEntry>(
    (a, b) => a.expiresAt - b.expiresAt,
  );
  private closed = false;
  private expirationTimer?: number;

  /**
   * The memory adapter supports watch operations.
   */
  readonly supportsWatch: boolean = true;

  /**
   * Create a new in-memory adapter.
   */
  constructor() {
    this.startExpirationChecker();
  }

  /**
   * Read a value by key.
   *
   * @param key - Key to resolve
   * @returns Stored entry or `null`
   */
  get<T = unknown>(key: KvKey): Promise<KvEntry<T> | null> {
    this.assertOpen();
    const keyStr = keyToString(key);
    const entry = this.storage.get(keyStr) as StorageEntry<T> | undefined;

    if (!entry) {
      return Promise.resolve(null);
    }

    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.storage.delete(keyStr);
      return Promise.resolve(null);
    }

    return Promise.resolve({
      key: entry.key,
      value: entry.value,
      versionstamp: entry.versionstamp,
    });
  }

  /**
   * Store a value.
   *
   * @param key - Key to write
   * @param value - Value to store
   * @param options - Optional TTL settings
   */
  set(key: KvKey, value: unknown, options?: KvSetOptions): Promise<void> {
    this.assertOpen();
    const keyStr = keyToString(key);
    const existing = this.storage.get(keyStr);
    const entry: StorageEntry = {
      expiresAt: options?.expireIn ? Date.now() + options.expireIn : undefined,
      key,
      value,
      versionstamp: generateVersionstamp(),
    };

    this.storage.set(keyStr, entry);

    if (entry.expiresAt) {
      this.expirationHeap.push({ expiresAt: entry.expiresAt, keyStr });
    }

    this.notifyWatchers(key, value, existing?.value ?? null, 'set');
    return Promise.resolve();
  }

  /**
   * Delete a value by key.
   *
   * @param key - Key to remove
   */
  delete(key: KvKey): Promise<void> {
    this.assertOpen();
    const keyStr = keyToString(key);
    const existing = this.storage.get(keyStr);
    if (!existing) {
      return Promise.resolve();
    }

    this.storage.delete(keyStr);
    this.notifyWatchers(key, null, existing.value, 'delete');
    return Promise.resolve();
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
    this.assertOpen();
    const now = Date.now();
    const entries: StorageEntry<T>[] = [];

    for (const entry of this.storage.values()) {
      if (entry.expiresAt && entry.expiresAt <= now) {
        continue;
      }

      if (!keyHasPrefix(entry.key, options.prefix)) {
        continue;
      }

      if (options.start && compareKeys(entry.key, options.start) <= 0) {
        continue;
      }

      if (options.end && compareKeys(entry.key, options.end) >= 0) {
        continue;
      }

      entries.push(entry as StorageEntry<T>);
    }

    entries.sort((left, right) => {
      const result = compareKeys(left.key, right.key);
      return options.reverse ? -result : result;
    });

    const limit = options.limit ?? entries.length;
    for (const entry of entries.slice(0, limit)) {
      yield {
        key: entry.key,
        value: entry.value,
        versionstamp: entry.versionstamp,
      };
    }
  }

  /**
   * Execute an in-memory atomic mutation batch.
   *
   * @param checks - Version checks that must succeed
   * @param mutations - Mutations to apply
   * @returns Atomic operation result
   */
  async atomic(
    checks: AtomicCheck[],
    mutations: AtomicMutation[],
  ): Promise<AtomicResult> {
    this.assertOpen();

    for (const check of checks) {
      const currentVersionstamp = this.storage.get(keyToString(check.key))?.versionstamp ?? null;
      if (currentVersionstamp !== check.versionstamp) {
        return { ok: false };
      }
    }

    for (const mutation of mutations) {
      const keyStr = keyToString(mutation.key);

      switch (mutation.type) {
        case 'set':
          await this.set(mutation.key, mutation.value, { expireIn: mutation.expireIn });
          break;
        case 'delete':
          await this.delete(mutation.key);
          break;
        case 'sum': {
          const current = typeof this.storage.get(keyStr)?.value === 'bigint'
            ? this.storage.get(keyStr)!.value as bigint
            : 0n;
          await this.set(mutation.key, current + mutation.value);
          break;
        }
        case 'min': {
          const existing = this.storage.get(keyStr)?.value;
          const current = typeof existing === 'bigint' ? existing : mutation.value;
          await this.set(mutation.key, current < mutation.value ? current : mutation.value);
          break;
        }
        case 'max': {
          const existing = this.storage.get(keyStr)?.value;
          const current = typeof existing === 'bigint' ? existing : mutation.value;
          await this.set(mutation.key, current > mutation.value ? current : mutation.value);
          break;
        }
      }
    }

    return { ok: true, versionstamp: generateVersionstamp() };
  }

  /**
   * Close the adapter and clear all in-memory state.
   */
  close(): Promise<void> {
    if (this.closed) {
      return Promise.resolve();
    }

    this.closed = true;

    if (this.expirationTimer) {
      clearInterval(this.expirationTimer);
    }

    this.storage.clear();
    this.expirationHeap.clear();
    this.watchers.clear();
    this.prefixWatchers.clear();
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
    this.assertOpen();
    const eventQueue: WatchEvent<T>[] = [];
    let resolveNext: (() => void) | null = null;

    const handler = (event: WatchEvent): void => {
      eventQueue.push(event as WatchEvent<T>);
      resolveNext?.();
      resolveNext = null;
    };

    for (const key of keys) {
      const keyStr = keyToString(key);
      if (!this.watchers.has(keyStr)) {
        this.watchers.set(keyStr, new Set());
      }
      this.watchers.get(keyStr)!.add(handler);
    }

    try {
      while (!options?.signal?.aborted && !this.closed) {
        if (eventQueue.length === 0) {
          let timeoutId: number | undefined;
          await Promise.race([
            new Promise<void>((resolve) => {
              resolveNext = resolve;
            }),
            new Promise<void>((resolve) => {
              timeoutId = setTimeout(resolve, 1000) as unknown as number;
            }),
          ]);
          if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
          }
        }

        if (eventQueue.length === 0) {
          continue;
        }

        const events = [...eventQueue];
        eventQueue.length = 0;

        if (options?.debounce) {
          await delay(options.debounce);
        }

        yield events;
      }
    } finally {
      for (const key of keys) {
        const keyStr = keyToString(key);
        const keyWatchers = this.watchers.get(keyStr);
        if (!keyWatchers) {
          continue;
        }

        keyWatchers.delete(handler);
        if (keyWatchers.size === 0) {
          this.watchers.delete(keyStr);
        }
      }
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
    this.assertOpen();

    if (!options?.skipInitial) {
      for await (const entry of this.list<T>({ prefix })) {
        yield {
          key: entry.key,
          timestamp: new Date(),
          type: 'set',
          value: entry.value,
          versionstamp: entry.versionstamp,
        };
      }
    }

    const prefixStr = keyToString(prefix);
    const eventQueue: WatchEvent<T>[] = [];
    let resolveNext: (() => void) | null = null;

    const handler = (event: WatchEvent): void => {
      eventQueue.push(event as WatchEvent<T>);
      resolveNext?.();
      resolveNext = null;
    };

    if (!this.prefixWatchers.has(prefixStr)) {
      this.prefixWatchers.set(prefixStr, { prefix, handlers: new Set() });
    }
    this.prefixWatchers.get(prefixStr)!.handlers.add(handler);

    try {
      while (!options?.signal?.aborted && !this.closed) {
        if (eventQueue.length === 0) {
          let timeoutId: number | undefined;
          await Promise.race([
            new Promise<void>((resolve) => {
              resolveNext = resolve;
            }),
            new Promise<void>((resolve) => {
              timeoutId = setTimeout(resolve, options?.pollInterval ?? 1000) as unknown as number;
            }),
          ]);
          if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
          }
        }

        while (eventQueue.length > 0) {
          const event = eventQueue.shift()!;
          if (options?.debounce) {
            await delay(options.debounce);
          }
          yield event;
        }
      }
    } finally {
      const entry = this.prefixWatchers.get(prefixStr);
      if (entry) {
        entry.handlers.delete(handler);
        if (entry.handlers.size === 0) {
          this.prefixWatchers.delete(prefixStr);
        }
      }
    }
  }

  /**
   * Clear all entries from the in-memory store.
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * Get the current number of stored entries.
   */
  get size(): number {
    return this.storage.size;
  }

  /**
   * Get every stored key.
   *
   * @returns Snapshot of all keys in the adapter
   */
  keys(): KvKey[] {
    return Array.from(this.storage.values(), (entry) => entry.key);
  }

  /**
   * Ensure the adapter has not been closed.
   */
  private assertOpen(): void {
    if (this.closed) {
      throw new KvClosedError('MemoryKvAdapter is closed.');
    }
  }

  /**
   * Start the periodic expiration sweep.
   */
  private startExpirationChecker(): void {
    this.expirationTimer = setInterval(() => {
      const now = Date.now();

      while (this.expirationHeap.length > 0) {
        const top = this.expirationHeap.peek()!;
        if (top.expiresAt > now) break;
        this.expirationHeap.pop();

        // Verify the entry still exists and hasn't been overwritten with a new TTL
        const entry = this.storage.get(top.keyStr);
        if (!entry || !entry.expiresAt || entry.expiresAt > now) continue;

        this.storage.delete(top.keyStr);
        this.notifyWatchers(entry.key, null, entry.value, 'delete');
      }
    }, 1000) as unknown as number;
  }

  /**
   * Notify key and prefix watchers about a mutation.
   *
   * @param key - Changed key
   * @param value - New value
   * @param previousValue - Previous value
   * @param type - Mutation type
   */
  private notifyWatchers<T>(
    key: KvKey,
    value: T | null,
    previousValue: T | null,
    type: 'set' | 'delete',
  ): void {
    const event: WatchEvent<T> = {
      key,
      previousValue,
      timestamp: new Date(),
      type,
      value,
      versionstamp: generateVersionstamp(),
    };

    const keyWatchers = this.watchers.get(keyToString(key));
    if (keyWatchers) {
      for (const watcher of keyWatchers) {
        try {
          watcher(event);
        } catch {
          // Ignore watcher failures to avoid breaking the adapter.
        }
      }
    }

    for (const [, { prefix, handlers }] of this.prefixWatchers) {
      if (!keyHasPrefix(key, prefix)) {
        continue;
      }

      for (const watcher of handlers) {
        try {
          watcher(event);
        } catch {
          // Ignore watcher failures to avoid breaking the adapter.
        }
      }
    }
  }
}
