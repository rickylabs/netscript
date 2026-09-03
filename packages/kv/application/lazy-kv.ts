import type {
  KvEntry,
  KvKey,
  KvListOptions,
  KvSetOptions,
  WatchableKv,
  WatchEvent,
  WatchOptions,
  WatchPrefixOptions,
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
  ): AsyncIterable<WatchEvent<T>[]> {
    return this.watchResolved<T>(keys, options);
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
    options?: WatchOptions,
  ): AsyncIterable<WatchEvent<T>[]> {
    yield* (await this.resolve()).watch<T>(keys, options);
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
