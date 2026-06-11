/**
 * TanStack Query ↔ Deno KV persistence bridge.
 *
 * Uses `@tanstack/query-persist-client-core`'s experimental persister API
 * to store TanStack Query results in Deno KV via the SDK `CacheStore`
 * interface. This enables warm client caches on subsequent page loads.
 *
 * @module
 */

import type { CacheStore } from '../interfaces/cache-store.ts';

/** KV key prefix for persisted TanStack Query cache entries. */
const PERSISTER_KEY_PREFIX = 'tanstack_query_cache';

/** Default TTL matching TanStack Query gcTime (5 minutes). */
const DEFAULT_EXPIRE_IN = 300_000;

/**
 * Options for `createKvCachePersister`.
 */
export interface KvCachePersisterOptions {
  /** KV cache store instance (typically `KvCacheStore`). */
  store: CacheStore;
  /** TTL in ms for persisted entries. Default: 300 000 (5 min). */
  expireIn?: number;
}

/**
 * Async storage adapter conforming to the shape expected by
 * `@tanstack/query-persist-client-core`'s `experimental_createPersister`.
 *
 * Applications pass this to TanStack Query's persister layer. The persister
 * calls `getItem` / `setItem` / `removeItem` automatically.
 */
export interface KvCachePersisterStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

/**
 * Create a KV-backed async storage adapter for TanStack Query persistence.
 *
 * @example
 * ```ts
 * import { KvCacheStore } from '@netscript/sdk/adapters';
 * import { createKvCachePersister } from '@netscript/sdk/query-client';
 *
 * const store = new KvCacheStore();
 * const persisterStorage = createKvCachePersister({ store });
 *
 * // Use with @tanstack/query-persist-client-core:
 * // experimental_createPersister({ storage: persisterStorage })
 * ```
 */
export function createKvCachePersister(
  options: KvCachePersisterOptions,
): KvCachePersisterStorage {
  const { store, expireIn = DEFAULT_EXPIRE_IN } = options;

  return {
    getItem: async (key: string): Promise<string | null> => {
      const entry = await store.get<string>([PERSISTER_KEY_PREFIX, key]);
      return entry.value ?? null;
    },

    setItem: async (key: string, value: string): Promise<void> => {
      await store.set([PERSISTER_KEY_PREFIX, key], value, {
        expireIn,
      });
    },

    removeItem: async (key: string): Promise<void> => {
      await store.delete([PERSISTER_KEY_PREFIX, key]);
    },
  };
}
