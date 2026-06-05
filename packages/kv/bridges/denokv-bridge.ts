/**
 * Bridge adapter that implements the kvdex `DenoKv` interface on top of
 * `@netscript/kv`'s {@linkcode WatchableKv}.
 *
 * This enables kvdex collections to work transparently over Redis/Garnet
 * backends that are already supported by `@netscript/kv` adapters, without
 * requiring a native `Deno.Kv` instance.
 *
 * @module
 */

import { createPackageLogger } from '@netscript/logger';
import { generateVersionstamp } from '../core/keys.ts';
import type { WatchableKv } from '../types/watchable-kv.ts';
import type { AtomicCheck, KvKey, KvListOptions } from '../types/common.ts';
import type { AtomicMutation } from '../types/kv-store.ts';

const logger = createPackageLogger('kv:bridge');

// ---------------------------------------------------------------------------
// kvdex-compatible types
//
// These mirror the shapes kvdex expects from its `DenoKv` parameter.
// Defined locally to avoid coupling to kvdex's internal type module —
// structural typing ensures compatibility.
// ---------------------------------------------------------------------------

/** Key part types accepted by kvdex. */
export type DenoKvKeyPart = string | number | bigint | boolean | Uint8Array;

/** Strict key type — a readonly tuple of key parts. */
export type DenoKvStrictKey = readonly DenoKvKeyPart[];

/** Entry shape returned by `get()` / `getMany()` / `list()`. */
export interface DenoKvEntryMaybe<T = unknown> {
  /** The key of the entry. */
  key: DenoKvStrictKey;
  /** The value, or `null` if the key does not exist. */
  value: T | null;
  /** Optimistic-concurrency stamp, or `null` for missing entries. */
  versionstamp: string | null;
}

/** Selector variants for `list()`. */
export type DenoKvListSelector =
  | { prefix: DenoKvStrictKey }
  | { prefix: DenoKvStrictKey; start: DenoKvStrictKey }
  | { prefix: DenoKvStrictKey; end: DenoKvStrictKey }
  | { start: DenoKvStrictKey; end: DenoKvStrictKey };

/** Options for `list()`. */
export interface DenoKvListOptions {
  /** Maximum number of entries to return. */
  limit?: number;
  /** Opaque cursor to resume iteration from. */
  cursor?: string;
  /** When `true`, iterate in reverse lexicographic key order. */
  reverse?: boolean;
  /** Consistency level hint (ignored for Redis backends). */
  consistency?: 'strong' | 'eventual';
  /** Hint for the number of entries to fetch per underlying batch. */
  batchSize?: number;
}

/** The async-iterable list iterator with a `cursor` property. */
export interface DenoKvListIterator<T = unknown>
  extends AsyncIterableIterator<DenoKvEntryMaybe<T>> {
  /** Opaque cursor representing the current position in the iteration. */
  cursor: string;
}

/** Options for `set()`. */
export interface DenoKvSetOptions {
  /** Time-to-live in milliseconds. */
  expireIn?: number;
}

/** Options for `get()`. */
export interface DenoKvGetOptions {
  /** Consistency level hint (ignored for Redis backends). */
  consistency?: 'strong' | 'eventual';
}

/** Options for `enqueue()`. */
export interface DenoKvEnqueueOptions {
  /** Delay in milliseconds before delivery. */
  delay?: number;
  /** Keys to write the value to if delivery fails. */
  keysIfUndelivered?: DenoKvStrictKey[];
}

/** Options for `watch()`. */
export interface DenoKvWatchOptions {
  /** When `true`, emit raw entries without transformation. */
  raw?: boolean;
}

/** Commit result on success. */
export interface DenoKvCommitResult {
  /** Discriminant — always `true` for a successful commit. */
  ok: true;
  /** Versionstamp assigned to the committed mutations. */
  versionstamp: string;
}

/** Commit result on failure. */
export interface DenoKvCommitError {
  /** Discriminant — always `false` for a failed commit. */
  ok: false;
}

/** Version check for atomic operations. */
export interface DenoAtomicCheck {
  /** Key to check. */
  key: DenoKvStrictKey;
  /** Expected versionstamp (`null` means the key must not exist). */
  versionstamp: string | null;
}

// ---------------------------------------------------------------------------
// DenoAtomicOperation — chain builder for atomic transactions
// ---------------------------------------------------------------------------

/**
 * Atomic operation builder that buffers mutations and delegates to
 * {@linkcode WatchableKv.atomic} on {@linkcode commit}.
 *
 * kvdex only uses `set`, `delete`, and `check` internally for index
 * maintenance. `sum`/`min`/`max` are passed through with a warning since the
 * Redis adapter falls back to plain `set` semantics for these.
 */
export interface DenoAtomicOperation {
  /** Add version checks that must pass for the commit to succeed. */
  check(...checks: DenoAtomicCheck[]): this;
  /** Execute all buffered mutations as a single atomic transaction. */
  commit(): Promise<DenoKvCommitResult | DenoKvCommitError>;
  /** Buffer a delete mutation. */
  delete(key: DenoKvStrictKey): this;
  /** Buffer an enqueue mutation (stub — not used). */
  enqueue(value: unknown, options?: DenoKvEnqueueOptions): this;
  /** Buffer a max mutation (falls back to set on Redis). */
  max(key: DenoKvStrictKey, n: bigint): this;
  /** Buffer a min mutation (falls back to set on Redis). */
  min(key: DenoKvStrictKey, n: bigint): this;
  /** Buffer a set mutation. */
  set(key: DenoKvStrictKey, value: unknown, options?: DenoKvSetOptions): this;
  /** Buffer a sum mutation (falls back to set on Redis). */
  sum(key: DenoKvStrictKey, n: bigint): this;
}

/** Buffered operation descriptor. */
type BufferedOp =
  | { type: 'set'; key: DenoKvStrictKey; value: unknown; expireIn?: number }
  | { type: 'delete'; key: DenoKvStrictKey }
  | { type: 'sum'; key: DenoKvStrictKey; value: bigint }
  | { type: 'min'; key: DenoKvStrictKey; value: bigint }
  | { type: 'max'; key: DenoKvStrictKey; value: bigint };

class RedisAtomicOperation implements DenoAtomicOperation {
  readonly #kv: WatchableKv;
  readonly #ops: BufferedOp[] = [];
  readonly #checks: DenoAtomicCheck[] = [];

  constructor(kv: WatchableKv) {
    this.#kv = kv;
  }

  check(...checks: DenoAtomicCheck[]): this {
    this.#checks.push(...checks);
    return this;
  }

  set(key: DenoKvStrictKey, value: unknown, options?: DenoKvSetOptions): this {
    this.#ops.push({ type: 'set', key, value, expireIn: options?.expireIn });
    return this;
  }

  delete(key: DenoKvStrictKey): this {
    this.#ops.push({ type: 'delete', key });
    return this;
  }

  sum(key: DenoKvStrictKey, n: bigint): this {
    logger.warn('Bridge atomic sum() falls back to set semantics on Redis');
    this.#ops.push({ type: 'sum', key, value: n });
    return this;
  }

  min(key: DenoKvStrictKey, n: bigint): this {
    logger.warn('Bridge atomic min() falls back to set semantics on Redis');
    this.#ops.push({ type: 'min', key, value: n });
    return this;
  }

  max(key: DenoKvStrictKey, n: bigint): this {
    logger.warn('Bridge atomic max() falls back to set semantics on Redis');
    this.#ops.push({ type: 'max', key, value: n });
    return this;
  }

  enqueue(_value: unknown, _options?: DenoKvEnqueueOptions): this {
    // No-op — we use @netscript/queue, not kvdex queue system
    return this;
  }

  async commit(): Promise<DenoKvCommitResult | DenoKvCommitError> {
    const kv = this.#kv;

    // If the underlying KvStore doesn't support atomic(), fall back to
    // sequential operations (no transactional guarantees).
    if (!kv.atomic) {
      return this.#commitSequential();
    }

    const checks: AtomicCheck[] = this.#checks.map((c) => ({
      key: c.key as KvKey,
      versionstamp: c.versionstamp,
    }));

    const mutations: AtomicMutation[] = this.#ops.map((op): AtomicMutation => {
      switch (op.type) {
        case 'set':
          return { type: 'set', key: op.key as KvKey, value: op.value, expireIn: op.expireIn };
        case 'delete':
          return { type: 'delete', key: op.key as KvKey };
        case 'sum':
          return { type: 'sum', key: op.key as KvKey, value: op.value };
        case 'min':
          return { type: 'min', key: op.key as KvKey, value: op.value };
        case 'max':
          return { type: 'max', key: op.key as KvKey, value: op.value };
      }
    });

    const result = await kv.atomic(checks, mutations);

    if (!result.ok) {
      return { ok: false };
    }

    return {
      ok: true as const,
      versionstamp: result.versionstamp ?? generateVersionstamp(),
    };
  }

  /**
   * Fallback for stores that don't implement `atomic()` (e.g. MemoryKvAdapter).
   * Runs operations sequentially without transactional guarantees.
   */
  async #commitSequential(): Promise<DenoKvCommitResult | DenoKvCommitError> {
    const kv = this.#kv;

    // Check versionstamps first
    for (const check of this.#checks) {
      const entry = await kv.get(check.key as KvKey);
      const currentVs = entry?.versionstamp ?? null;
      if (currentVs !== check.versionstamp) {
        return { ok: false };
      }
    }

    // Apply mutations
    const versionstamp = generateVersionstamp();
    for (const op of this.#ops) {
      switch (op.type) {
        case 'set':
          await kv.set(op.key as KvKey, op.value, { expireIn: op.expireIn });
          break;
        case 'delete':
          await kv.delete(op.key as KvKey);
          break;
        case 'sum':
        case 'min':
        case 'max':
          // Fall through to set — same as Redis adapter behavior
          await kv.set(op.key as KvKey, op.value);
          break;
      }
    }

    return { ok: true as const, versionstamp };
  }
}

// ---------------------------------------------------------------------------
// WatchableKvBridge — the main bridge class
// ---------------------------------------------------------------------------

/**
 * Adapts a {@linkcode WatchableKv} instance to the `DenoKv` interface expected
 * by kvdex.
 *
 * This bridge enables kvdex collections, secondary indexes, and atomic
 * operations to work transparently over any `@netscript/kv` backend
 * (Redis/Garnet, Memory, or future adapters).
 *
 * ### Design decisions
 *
 * - **`get()` never returns null** — kvdex expects `{ key, value: null,
 *   versionstamp: null }` for missing keys.
 * - **`list()` uses a streaming async generator** wrapping
 *   `WatchableKv.list()`, exposing a `.cursor` property on the iterator.
 * - **`atomic()` delegates to `WatchableKv.atomic()`** — the Redis adapter
 *   already implements MULTI/EXEC with WATCH-based CAS.
 * - **`watch()` returns a `ReadableStream`** — adapts from the WatchableKv
 *   event-based watch to the stream-based interface kvdex expects.
 * - **`enqueue`/`listenQueue` are stubs** — we use `@netscript/queue`.
 *
 * @example
 * ```ts
 * import { getKv } from '@netscript/kv';
 * import { WatchableKvBridge } from './denokv-bridge.ts';
 * import { kvdex, collection, model } from '@olli/kvdex';
 *
 * const watchableKv = await getKv();
 * const bridge = new WatchableKvBridge(watchableKv);
 * const db = kvdex({
 *   kv: bridge,
 *   schema: {
 *     items: collection(model<{ name: string }>()),
 *   },
 * });
 * ```
 */
export class WatchableKvBridge {
  readonly #kv: WatchableKv;

  /**
   * Create a new bridge wrapping an existing `WatchableKv` instance.
   *
   * @param kv - The `WatchableKv` adapter to delegate operations to.
   */
  constructor(kv: WatchableKv) {
    this.#kv = kv;
  }

  // -------------------------------------------------------------------------
  // get / getMany
  // -------------------------------------------------------------------------

  /**
   * Get a single entry. Returns `{ key, value: null, versionstamp: null }` for
   * missing keys — **never** returns null directly.
   */
  async get<T = unknown>(
    key: DenoKvStrictKey,
    _options?: DenoKvGetOptions,
  ): Promise<DenoKvEntryMaybe<T>> {
    const entry = await this.#kv.get<T>(key as KvKey);
    if (!entry) {
      return { key, value: null, versionstamp: null };
    }
    return {
      key: entry.key as DenoKvStrictKey,
      value: entry.value,
      versionstamp: entry.versionstamp,
    };
  }

  /**
   * Get multiple entries in parallel.
   *
   * kvdex's internal `kvGetMany` already batches in groups of 10, so the
   * parallel fan-out here is bounded.
   */
  getMany<T = unknown>(
    keys: DenoKvStrictKey[],
    _options?: DenoKvGetOptions,
  ): Promise<DenoKvEntryMaybe<T>[]> {
    return Promise.all(keys.map((key) => this.get<T>(key)));
  }

  // -------------------------------------------------------------------------
  // set / delete
  // -------------------------------------------------------------------------

  /**
   * Set a key-value pair. Returns a commit result with a versionstamp.
   */
  async set(
    key: DenoKvStrictKey,
    value: unknown,
    options?: DenoKvSetOptions,
  ): Promise<DenoKvCommitResult> {
    await this.#kv.set(key as KvKey, value, { expireIn: options?.expireIn });
    return { ok: true as const, versionstamp: generateVersionstamp() };
  }

  /**
   * Delete a key.
   */
  async delete(key: DenoKvStrictKey): Promise<void> {
    await this.#kv.delete(key as KvKey);
  }

  // -------------------------------------------------------------------------
  // list — streaming implementation with cursor
  // -------------------------------------------------------------------------

  /**
   * List entries matching a selector. Returns a `DenoKvListIterator` — an
   * async iterable iterator with a mutable `.cursor` property.
   *
   * ### Strategy
   *
   * - Wraps `WatchableKv.list()` in a streaming async generator.
   * - For `reverse: true` queries, collects all matching entries and sorts
   *   them in reverse lexicographic key order (Redis SCAN has no ordering).
   * - For forward queries, streams entries directly.
   * - The `.cursor` property is updated as iteration progresses.
   */
  list<T = unknown>(
    selector: DenoKvListSelector,
    options?: DenoKvListOptions,
  ): DenoKvListIterator<T> {
    // deno-lint-ignore no-this-alias
    const bridge = this;
    const reverse = options?.reverse ?? false;
    const limit = options?.limit;
    const cursor = options?.cursor;

    // Extract selector components
    const prefix = 'prefix' in selector ? selector.prefix : undefined;
    const start = 'start' in selector ? selector.start : undefined;
    const end = 'end' in selector ? selector.end : undefined;

    // Build KvListOptions for WatchableKv.list()
    const kvListOpts: KvListOptions = {
      prefix: (prefix ?? start ?? end)! as KvKey,
      reverse,
    };

    if (start) kvListOpts.start = start as KvKey;
    if (end) kvListOpts.end = end as KvKey;

    // The underlying RedisKvAdapter.list() now handles reverse queries
    // correctly via a two-phase approach (SCAN all keys → global reverse
    // sort → MGET only the tail), so we can safely pass `limit` through
    // for both forward and reverse queries. For cursor-based pagination
    // we still omit limit since the cursor filter may skip entries.
    if (limit && !cursor) {
      kvListOpts.limit = limit;
    }

    // State shared between the generator and the iterator wrapper
    let currentCursor = cursor ?? '';

    async function* generate(): AsyncGenerator<DenoKvEntryMaybe<T>> {
      let count = 0;

      if (reverse) {
        // The adapter now returns globally-sorted reverse results (via
        // two-phase SCAN-all-keys → reverse sort → MGET-tail), so we
        // can stream entries directly without collecting and re-sorting.
        //
        // When a cursor is active, entries at or after the cursor are
        // skipped (reverse iteration moves toward smaller keys).
        for await (const entry of bridge.#kv.list<T>(kvListOpts)) {
          if (limit && count >= limit) break;

          const mapped: DenoKvEntryMaybe<T> = {
            key: entry.key as DenoKvStrictKey,
            value: entry.value,
            versionstamp: entry.versionstamp ?? generateVersionstamp(),
          };

          // Apply cursor filter if resuming
          if (cursor) {
            const keyStr = JSON.stringify(entry.key);
            // In reverse mode, cursor means "entries before this cursor"
            if (keyStr >= cursor) continue;
          }

          currentCursor = JSON.stringify(entry.key);
          yield mapped;
          count++;
        }
      } else {
        // Forward streaming — yield entries as they come
        for await (const entry of bridge.#kv.list<T>(kvListOpts)) {
          if (limit && count >= limit) break;

          const keyStr = JSON.stringify(entry.key);

          // Skip entries at or before cursor
          if (cursor && keyStr <= cursor) continue;

          const mapped: DenoKvEntryMaybe<T> = {
            key: entry.key as DenoKvStrictKey,
            value: entry.value,
            versionstamp: entry.versionstamp ?? generateVersionstamp(),
          };

          currentCursor = keyStr;
          yield mapped;
          count++;
        }
      }
    }

    // Wrap the generator so we can attach the `.cursor` property
    const gen = generate();
    const iterator: DenoKvListIterator<T> = {
      get cursor() {
        return currentCursor;
      },
      set cursor(value: string) {
        currentCursor = value;
      },
      next(): Promise<IteratorResult<DenoKvEntryMaybe<T>>> {
        return gen.next();
      },
      return(value?: unknown): Promise<IteratorResult<DenoKvEntryMaybe<T>>> {
        return gen.return(value as DenoKvEntryMaybe<T>);
      },
      throw(e?: unknown): Promise<IteratorResult<DenoKvEntryMaybe<T>>> {
        return gen.throw(e);
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };

    return iterator;
  }

  // -------------------------------------------------------------------------
  // atomic
  // -------------------------------------------------------------------------

  /**
   * Create an atomic operation builder. Buffers operations and delegates to
   * `WatchableKv.atomic()` on commit.
   */
  atomic(): DenoAtomicOperation {
    return new RedisAtomicOperation(this.#kv);
  }

  // -------------------------------------------------------------------------
  // watch — ReadableStream adapter
  // -------------------------------------------------------------------------

  /**
   * Watch keys for changes. Returns a `ReadableStream<DenoKvEntryMaybe[]>`
   * that emits the current values whenever any watched key changes.
   *
   * kvdex's `createWatcher` reads from this stream via `.getReader()`.
   */
  watch<T = unknown>(
    keys: DenoKvStrictKey[],
    _options?: DenoKvWatchOptions,
  ): ReadableStream<DenoKvEntryMaybe<T>[]> {
    // deno-lint-ignore no-this-alias
    const bridge = this;
    let abortController: AbortController | null = null;
    let watchIterator: AsyncIterator<unknown[]> | null = null;

    return new ReadableStream<DenoKvEntryMaybe<T>[]>({
      async start(controller) {
        // Emit initial state
        try {
          const initial = await Promise.all(
            keys.map((k) => bridge.get<T>(k)),
          );
          controller.enqueue(initial);
        } catch (err) {
          logger.error('Bridge watch initial read failed', { error: String(err) });
          controller.error(err);
          return;
        }

        // Subscribe to changes via WatchableKv.watch()
        abortController = new AbortController();
        try {
          const kvKeys = keys as unknown as KvKey[];
          const iterable = bridge.#kv.watch<T>(kvKeys, {
            signal: abortController.signal,
          });
          watchIterator = iterable[Symbol.asyncIterator]() as AsyncIterator<unknown[]>;

          // Pump events from the watch iterator into the stream
          (async () => {
            try {
              while (true) {
                const { value, done } = await watchIterator!.next();
                if (done) break;

                // Re-fetch current values for all watched keys to get the
                // DenoKvEntryMaybe shape that kvdex expects
                const current = await Promise.all(
                  keys.map((k) => bridge.get<T>(k)),
                );
                controller.enqueue(current);

                // Suppress unused variable warning — value is consumed
                void value;
              }
              controller.close();
            } catch (err) {
              // AbortError is expected on cancel
              if (err instanceof DOMException && err.name === 'AbortError') {
                controller.close();
              } else if (abortController && !abortController.signal.aborted) {
                controller.error(err);
              }
            }
          })();
        } catch (err) {
          logger.error('Bridge watch subscription failed', { error: String(err) });
          controller.error(err);
        }
      },

      cancel() {
        abortController?.abort();
        watchIterator = null;
      },
    });
  }

  // -------------------------------------------------------------------------
  // close
  // -------------------------------------------------------------------------

  /**
   * Close the underlying KV connection.
   */
  async close(): Promise<void> {
    await this.#kv.close();
  }

  // -------------------------------------------------------------------------
  // enqueue / listenQueue — stubs
  // -------------------------------------------------------------------------

  /**
   * Stub — we use `@netscript/queue`, not kvdex's built-in queue system.
   */
  enqueue(
    _value: unknown,
    _options?: DenoKvEnqueueOptions,
  ): Promise<DenoKvCommitResult> {
    throw new Error(
      'Queue operations are not supported via the bridge — use @netscript/queue instead.',
    );
  }

  /**
   * No-op listener — kvdex only invokes this when user code explicitly calls
   * `collection.listenQueue()`. Since we never do, this resolves immediately.
   */
  async listenQueue(_handler: (value: unknown) => unknown): Promise<void> {
    // Intentional no-op
  }

  // -------------------------------------------------------------------------
  // Symbol.asyncDispose — required by KvStore contract
  // -------------------------------------------------------------------------

  /** Alias for {@linkcode close} — enables the `await using` pattern. */
  async [Symbol.asyncDispose](): Promise<void> {
    await this.close();
  }
}
