/**
 * Cache provider registry — dependency injection seam for the SDK.
 *
 * This module holds a module-scoped reference to the cache-query engine.
 * It contains **zero** server-only imports (no @netscript/kv, no
 * @netscript/logger, no node:async_hooks) so it is safe to import from
 * client-side code.
 *
 * Server bootstrap calls {@link setCacheProvider} once at startup to wire
 * the KV-backed cache engine. Client code never calls it — cache methods
 * on query factories will throw a clear error if invoked without a provider.
 *
 * @module
 */

import type { CachedEntry } from '../ports/cache-entry.ts';
import type { QueryKey } from '../ports/query-key.ts';
import type { CacheQueryOptions } from '../ports/query-options.ts';
import type { CacheProviderDescriptor } from '../ports/cache-topology.ts';
import { CacheOperations } from '@netscript/telemetry/attributes';
import { cacheTelemetryOwner, ownsCacheTelemetry } from './cache-provider-marker.ts';
import {
  admitCacheNamespace,
  CacheEvents,
  type CacheNamespaceAdmission,
  type CacheTelemetry,
  createCacheSpanAttributes,
  createDefaultCacheTelemetry,
  recordCacheExecutionState,
  recordCacheProviderError,
  recordCacheProviderTopologyUnknown,
  recordCacheSpanPrologue,
} from './cache-telemetry.ts';

/**
 * Minimal interface that the query-factory layer needs from the cache engine.
 * Matches the public surface of {@link CacheQuery} without importing it.
 */
export interface CacheProvider {
  /** Stable provider identity and fallback tier for telemetry. */
  readonly descriptor: CacheProviderDescriptor;
  /** Execute a query through the registered cache engine. */
  query<TData>(queryKey: QueryKey, options: CacheQueryOptions<TData>): Promise<TData>;
  /** Prefetch a query through the registered cache engine. */
  prefetch<TData>(queryKey: QueryKey, options: CacheQueryOptions<TData>): Promise<void>;
  /** Read cached data for a query key without fetching. */
  getCachedData<TData>(queryKey: QueryKey, operationId?: string): Promise<TData | null>;
  /** Read cached data and timestamp metadata for a query key. */
  getCachedEntry<TData>(
    queryKey: QueryKey,
    operationId?: string,
  ): Promise<CachedEntry<TData> | null>;
  /** Invalidate all cached entries under a query-key prefix. */
  invalidateQueries(prefix: QueryKey, operationId?: string): Promise<void>;
}

let _provider: CacheProvider | null = null;

/** Create the mandatory telemetry boundary around a registered provider. */
export function createProviderBoundary(
  provider: CacheProvider,
  telemetry: CacheTelemetry = createDefaultCacheTelemetry(),
): CacheProvider {
  if (ownsCacheTelemetry(provider)) {
    const boundary = {
      get descriptor(): CacheProviderDescriptor {
        return provider.descriptor;
      },
      query: <TData>(queryKey: QueryKey, options: CacheQueryOptions<TData>): Promise<TData> =>
        provider.query(queryKey, options),
      prefetch: <TData>(queryKey: QueryKey, options: CacheQueryOptions<TData>): Promise<void> =>
        provider.prefetch(queryKey, options),
      getCachedData: <TData>(queryKey: QueryKey, operationId?: string): Promise<TData | null> =>
        provider.getCachedData(queryKey, operationId),
      getCachedEntry: <TData>(
        queryKey: QueryKey,
        operationId?: string,
      ): Promise<CachedEntry<TData> | null> => provider.getCachedEntry(queryKey, operationId),
      invalidateQueries: (prefix: QueryKey, operationId?: string): Promise<void> =>
        provider.invalidateQueries(prefix, operationId),
    };
    Object.defineProperty(boundary, cacheTelemetryOwner, { value: true });
    return boundary;
  }

  const traceUnsupported = async <T>(
    operation: typeof CacheOperations[keyof typeof CacheOperations],
    admission: CacheNamespaceAdmission,
    event: string,
    callback: (markBackendExecuted: () => void) => Promise<T>,
  ): Promise<T> => {
    const { namespace } = admission;
    const descriptor = provider.descriptor;
    return await telemetry.withSpan(
      operation,
      createCacheSpanAttributes(operation, namespace, descriptor),
      async (span) => {
        recordCacheSpanPrologue(span, operation, admission, descriptor, event);
        const markBackendExecuted = (): void =>
          recordCacheExecutionState(
            span,
            operation,
            namespace,
            descriptor,
            true,
            false,
          );
        try {
          const result = await callback(markBackendExecuted);
          recordCacheProviderTopologyUnknown(
            span,
            operation,
            namespace,
            descriptor,
            event,
          );
          return result;
        } catch (error) {
          recordCacheProviderError(span, operation, namespace, descriptor, event);
          throw error;
        }
      },
    );
  };

  return {
    get descriptor(): CacheProviderDescriptor {
      return provider.descriptor;
    },
    query: <TData>(queryKey: QueryKey, options: CacheQueryOptions<TData>): Promise<TData> => {
      const admission = admitCacheNamespace(options.operationId);
      return traceUnsupported(
        CacheOperations.READ,
        admission,
        CacheEvents.LOOKUP,
        (markBackend) =>
          provider.query(queryKey, {
            ...options,
            queryFn: () => {
              markBackend();
              return options.queryFn();
            },
          }),
      );
    },
    prefetch: <TData>(queryKey: QueryKey, options: CacheQueryOptions<TData>): Promise<void> => {
      const admission = admitCacheNamespace(options.operationId);
      return traceUnsupported(
        CacheOperations.READ,
        admission,
        CacheEvents.LOOKUP,
        (markBackend) =>
          provider.prefetch(queryKey, {
            ...options,
            queryFn: () => {
              markBackend();
              return options.queryFn();
            },
          }),
      );
    },
    getCachedData: <TData>(queryKey: QueryKey, operationId?: string): Promise<TData | null> =>
      traceUnsupported(
        CacheOperations.READ,
        admitCacheNamespace(operationId, 'cache.cached-data'),
        CacheEvents.LOOKUP,
        () => provider.getCachedData(queryKey, operationId),
      ),
    getCachedEntry: <TData>(
      queryKey: QueryKey,
      operationId?: string,
    ): Promise<CachedEntry<TData> | null> =>
      traceUnsupported(
        CacheOperations.READ,
        admitCacheNamespace(operationId, 'cache.cached-entry'),
        CacheEvents.LOOKUP,
        () => provider.getCachedEntry(queryKey, operationId),
      ),
    invalidateQueries: (prefix: QueryKey, operationId?: string): Promise<void> =>
      traceUnsupported(
        CacheOperations.INVALIDATE,
        admitCacheNamespace(operationId, 'cache.invalidate-prefix'),
        CacheEvents.INVALIDATE,
        () => provider.invalidateQueries(prefix, operationId),
      ),
  };
}

/**
 * Register the cache engine. Call once during server bootstrap.
 *
 * @example
 * ```ts
 * import { cacheQuery } from '@netscript/sdk/cache';
 * import { setCacheProvider } from '@netscript/sdk/query';
 *
 * setCacheProvider(cacheQuery);
 * ```
 */
export function setCacheProvider(provider: CacheProvider): void {
  _provider = createProviderBoundary(provider);
}

/**
 * Retrieve the registered cache provider.
 *
 * @throws {Error} If called before {@link setCacheProvider}.
 */
export function getCacheProvider(): CacheProvider {
  if (!_provider) {
    throw new Error(
      '[NetScript SDK] Cache provider not initialized. ' +
        "Add `import '@netscript/sdk/cache';` to your server entrypoint to register it, " +
        'or call setCacheProvider(cacheQuery) during server bootstrap. ' +
        'If you see this in the browser, a server-only cache method ' +
        '(query, prefetch, getCachedData, getCachedEntry, invalidate) ' +
        'was called from client-side code — use queryOptions/mutationOptions/clientKey instead.',
    );
  }
  return _provider;
}

/**
 * Check whether a cache provider has been registered.
 */
export function hasCacheProvider(): boolean {
  return _provider !== null;
}

/**
 * Reset the cache provider. Primarily for testing.
 */
export function resetCacheProvider(): void {
  _provider = null;
}
