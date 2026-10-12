import { createWatchHandle } from './watch-handle.ts';
import type {
  KvEntry,
  KvKey,
  KvListOptions,
  KvSetOptions,
  WatchableKv,
  WatchEvent,
  WatchOptions,
  WatchPrefixOptions,
  WatchStream,
} from '../types/mod.ts';
import { getKv, type SharedKvConfig } from './shared.ts';

class LazyKv implements WatchableKv {
  readonly supportsWatch = true;
  #kv: Promise<WatchableKv> | undefined;

  constructor(private readonly config?: SharedKvConfig) {}

  get<T = unknown>(key: KvKey): Promise<KvEntry<T> | null> {
    return this.resolve().then((kv) => kv.get<T>(key));
  }

  set(key: KvKey, value: unknown, options?: KvSetOptions): Promise<void> {
    return this.resolve().then((kv) => kv.set(key, value, options));
  }

  delete(key: KvKey): Promise<void> {
    return this.resolve().then((kv) => kv.delete(key));
  }

  has(key: KvKey): Promise<boolean> {
    return this.resolve().then((kv) => kv.has(key));
  }

  list<T = unknown>(options: KvListOptions): AsyncIterable<KvEntry<T>> {
    return this.listResolved<T>(options);
  }

  watch<T = unknown>(
    keys: KvKey[],
    options?: WatchOptions,
  ): WatchStream<T> {
    return createWatchHandle((ready) => this.watchResolved<T>(keys, options, ready));
  }

  watchPrefix<T = unknown>(
    prefix: KvKey,
    options?: WatchPrefixOptions,
  ): AsyncIterable<WatchEvent<T>> {
    return this.watchPrefixResolved<T>(prefix, options);
  }

  close(): Promise<void> {
    return this.resolve().then((kv) => kv.close());
  }

  [Symbol.asyncDispose](): Promise<void> {
    return this.close();
  }

  private resolve(): Promise<WatchableKv> {
    this.#kv ??= getKv(this.config);
    return this.#kv;
  }

  private async *listResolved<T>(options: KvListOptions): AsyncIterable<KvEntry<T>> {
    yield* (await this.resolve()).list<T>(options);
  }

  private async *watchResolved<T>(
    keys: KvKey[],
    options: WatchOptions | undefined,
    ready: () => void,
  ): AsyncIterable<WatchEvent<T>[]> {
    const handle = (await this.resolve()).watch<T>(keys, options);
    const iterator = handle[Symbol.asyncIterator]();
    try {
      let pending = iterator.next();
      if (handle.ready) {
        // Observe both failures even if readiness rejects before the first batch.
        void pending.catch(() => {});
        await handle.ready;
        ready();
      }
      while (true) {
        const result = await pending;
        if (result.done) break;
        if (!handle.ready && options?.initial) ready();
        yield result.value;
        pending = iterator.next();
      }
    } finally {
      await iterator.return?.();
    }
  }

  private async *watchPrefixResolved<T>(
    prefix: KvKey,
    options?: WatchPrefixOptions,
  ): AsyncIterable<WatchEvent<T>> {
    yield* (await this.resolve()).watchPrefix<T>(prefix, options);
  }
}

/**
 * Create a `WatchableKv` that resolves the shared adapter on first use.
 *
 * @param config - Optional initialization overrides applied on first use
 * @returns A lazy forwarding adapter backed by the shared KV lifecycle
 */
export function createLazyKv(config?: SharedKvConfig): WatchableKv {
  return new LazyKv(config);
}
