import type { CacheKey, CacheStore, CacheStoreEntry } from '../src/ports/cache-store.ts';

function serializeKey(key: CacheKey): string {
  return JSON.stringify(key);
}

/**
 * In-memory CacheStore used by SDK unit tests.
 */
export class MemoryCacheStore implements CacheStore {
  readonly values: Map<string, unknown> = new Map<string, unknown>();
  lastSetOptions?: { expireIn?: number };

  get<T>(key: CacheKey): Promise<CacheStoreEntry<T>> {
    return Promise.resolve({
      value: (this.values.get(serializeKey(key)) as T | undefined) ?? null,
    });
  }

  set(key: CacheKey, value: unknown, options?: { expireIn?: number }): Promise<void> {
    this.values.set(serializeKey(key), value);
    this.lastSetOptions = options;
    return Promise.resolve();
  }

  delete(key: CacheKey): Promise<void> {
    this.values.delete(serializeKey(key));
    return Promise.resolve();
  }

  async *list(options: { prefix: CacheKey }): AsyncIterable<{ key: CacheKey }> {
    for (const rawKey of this.values.keys()) {
      const key = JSON.parse(rawKey) as CacheKey;
      if (options.prefix.every((segment, index) => Object.is(segment, key[index]))) {
        yield { key };
      }
    }
  }

  close(): Promise<void> {
    this.values.clear();
    return Promise.resolve();
  }

  setRaw(key: CacheKey, value: unknown): void {
    this.values.set(serializeKey(key), value);
  }
}

/**
 * Assert strict equality in tests without an external assertion dependency.
 */
export function assertEquals(actual: unknown, expected: unknown): void {
  if (!Object.is(actual, expected)) {
    throw new Error(`Expected ${String(expected)}, got ${String(actual)}`);
  }
}

/**
 * Assert a condition in tests without an external assertion dependency.
 */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Wait for queued microtasks and short background work to run.
 */
export function nextTurn(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
