/**
 * Internal cache-query implementation.
 *
 * @module
 */

import { CacheOperations, CacheOutcomes } from '@netscript/telemetry/attributes';
import { DEFAULT_QUERY_CACHE_TIME, DEFAULT_QUERY_STALE_TIME } from './defaults.ts';
import { cacheTelemetryOwner } from './cache-provider-marker.ts';
import {
  admitCacheNamespace,
  CacheEvents,
  type CacheTelemetry,
  type CacheTelemetrySpan,
  createCacheSpanAttributes,
  createDefaultCacheTelemetry,
  recordCacheExecutionState,
  recordCacheInvalidation,
  recordCacheLookup,
  recordCacheProviderError,
  recordCacheSpanPrologue as spanPrologue,
  recordCacheWrite,
} from './cache-telemetry.ts';
import { KvCacheStore } from './kv-cache-store.ts';
import type { CachedEntry, CacheEntry } from '../ports/cache-entry.ts';
import { toCachedEntry } from '../ports/cache-entry.ts';
import type { CacheStore } from '../ports/cache-store.ts';
import type {
  CacheInvalidationTopologyReport,
  CacheProviderDescriptor,
  CacheWriteTopologyReport,
} from '../ports/cache-topology.ts';
import type { QueryKey } from '../ports/query-key.ts';
import type { CacheQueryOptions } from '../ports/query-options.ts';

/** Root prefix for all SDK cache keys in the KV store. */
const CACHE_PREFIX = 'cache_query' as const;

function getInflightKey(queryKey: QueryKey): string {
  return JSON.stringify(queryKey);
}

function toCacheStoreKey(queryKey: QueryKey): Deno.KvKey {
  return [CACHE_PREFIX, ...queryKey.map((segment) => String(segment))];
}

/**
 * Query cache engine with stale-while-revalidate semantics.
 */
export class CacheQuery {
  private readonly store: CacheStore;
  private readonly inflightRequests: Map<string, Promise<unknown>>;
  private readonly telemetry: CacheTelemetry;

  /** Stable provider identity and fallback tier for the registered boundary. */
  get descriptor(): CacheProviderDescriptor {
    return this.store.descriptor;
  }

  /**
   * Create a cache-query engine.
   *
   * @param store - Optional custom cache store. Defaults to `KvCacheStore`.
   * @param inflightRequests - Optional per-engine map for in-flight dedupe.
   * @param telemetry - Optional telemetry collaborator for testing or custom export.
   */
  constructor(
    store?: CacheStore,
    inflightRequests: Map<string, Promise<unknown>> = new Map<string, Promise<unknown>>(),
    telemetry: CacheTelemetry = createDefaultCacheTelemetry(),
  ) {
    Object.defineProperty(this, cacheTelemetryOwner, { value: true });
    this.store = store ?? new KvCacheStore();
    this.inflightRequests = inflightRequests;
    this.telemetry = telemetry;
  }

  /**
   * Execute a cache-aware query.
   *
   * @param queryKey - Canonical query key.
   * @param options - Cache policy and fetcher.
   * @returns Resolved query data.
   */
  query<TData>(queryKey: QueryKey, options: CacheQueryOptions<TData>): Promise<TData> {
    const admission = admitCacheNamespace(options.operationId);
    const { namespace } = admission;
    return this.telemetry.withSpan(
      CacheOperations.READ,
      createCacheSpanAttributes(CacheOperations.READ, namespace, this.descriptor),
      async (span) => {
        spanPrologue(span, CacheOperations.READ, admission, this.descriptor, CacheEvents.LOOKUP);
        return await this.queryInsideSpan(queryKey, options, namespace, span);
      },
    );
  }

  /** Execute the cache policy while the logical read span is active. */
  private async queryInsideSpan<TData>(
    queryKey: QueryKey,
    options: CacheQueryOptions<TData>,
    namespace: string,
    span: CacheTelemetrySpan,
  ): Promise<TData> {
    const {
      staleTime = DEFAULT_QUERY_STALE_TIME,
      cacheTime = DEFAULT_QUERY_CACHE_TIME,
      revalidateOnStale = true,
      preferFreshOnStale = false,
      queryFn,
    } = options;
    const key = toCacheStoreKey(queryKey);
    const inflightKey = getInflightKey(queryKey);
    let backendExecuted = false;

    const measuredQueryFn = (): Promise<TData> => {
      backendExecuted = true;
      recordCacheExecutionState(
        span,
        CacheOperations.READ,
        namespace,
        this.descriptor,
        true,
        false,
      );
      return queryFn();
    };
    const joinInflight = (inflight: Promise<TData>): Promise<TData> => {
      recordCacheExecutionState(
        span,
        CacheOperations.READ,
        namespace,
        this.descriptor,
        backendExecuted,
        true,
      );
      return inflight;
    };

    let cached;
    try {
      cached = await this.store.get<CacheEntry<TData>>(key);
    } catch (error) {
      recordCacheProviderError(
        span,
        CacheOperations.READ,
        namespace,
        this.descriptor,
        CacheEvents.LOOKUP,
      );
      throw error;
    }

    if (cached.value) {
      const age = Math.max(0, Date.now() - cached.value.timestamp);
      const isFresh = age < staleTime;
      const isExpired = age > cacheTime;
      const outcome = isFresh ? CacheOutcomes.HIT : CacheOutcomes.STALE;
      recordCacheLookup(span, namespace, this.descriptor, cached.report, {
        authoritativeOutcome: outcome,
        entryAgeMs: age,
        ttlMs: cacheTime,
      });

      if (isExpired || (!isFresh && preferFreshOnStale)) {
        return await this.fetchAndCacheOnce(
          measuredQueryFn,
          key,
          inflightKey,
          cacheTime,
          namespace,
          span,
          joinInflight,
        );
      }

      if (isFresh) {
        return cached.value.data;
      }

      if (revalidateOnStale) {
        this.revalidateInBackground(
          measuredQueryFn,
          key,
          inflightKey,
          cacheTime,
          namespace,
          joinInflight,
        );
      }
      return cached.value.data;
    }

    recordCacheLookup(span, namespace, this.descriptor, cached.report, { ttlMs: cacheTime });
    return await this.fetchAndCacheOnce(
      measuredQueryFn,
      key,
      inflightKey,
      cacheTime,
      namespace,
      span,
      joinInflight,
    );
  }

  /** Return an existing in-flight fetch for this query key. */
  private getInflight<TData>(inflightKey: string): Promise<TData> | undefined {
    return this.inflightRequests.get(inflightKey) as Promise<TData> | undefined;
  }

  /** Recheck in-flight state before starting a cache refresh. */
  private fetchAndCacheOnce<TData>(
    queryFn: () => Promise<TData>,
    cacheKey: Deno.KvKey,
    inflightKey: string,
    cacheTime: number,
    namespace: string,
    span: CacheTelemetrySpan,
    joinInflight: (inflight: Promise<TData>) => Promise<TData>,
  ): Promise<TData> {
    const inflight = this.getInflight<TData>(inflightKey);
    if (inflight) {
      return joinInflight(inflight);
    }
    return this.startInflight(
      inflightKey,
      () => this.fetchAndCache(queryFn, cacheKey, cacheTime, namespace, span),
    );
  }

  /** Enter the measured loader and record its resulting cache write. */
  private async fetchAndCache<TData>(
    queryFn: () => Promise<TData>,
    cacheKey: Deno.KvKey,
    cacheTime: number,
    namespace: string,
    span: CacheTelemetrySpan,
    operation: typeof CacheOperations.READ | typeof CacheOperations.WRITE = CacheOperations.READ,
  ): Promise<TData> {
    const data = await queryFn();
    let report: CacheWriteTopologyReport;
    try {
      report = await this.store.set(
        cacheKey,
        { data, timestamp: Date.now() } satisfies CacheEntry<TData>,
        { expireIn: cacheTime },
      );
    } catch {
      recordCacheProviderError(span, operation, namespace, this.descriptor, CacheEvents.WRITE);
      return data;
    }
    recordCacheWrite(span, operation, namespace, this.descriptor, report);
    return data;
  }

  /** Register one fetch-and-persist lifecycle before its asynchronous work begins. */
  private startInflight<T>(key: string, run: () => Promise<T>): Promise<T> {
    const operation = Promise.resolve().then(run).finally(() => {
      if (this.inflightRequests.get(key) === operation) {
        this.inflightRequests.delete(key);
      }
    });
    this.inflightRequests.set(key, operation);
    return operation;
  }

  /** Continue stale refresh work under an explicitly captured read context. */
  private revalidateInBackground<TData>(
    queryFn: () => Promise<TData>,
    cacheKey: Deno.KvKey,
    inflightKey: string,
    cacheTime: number,
    namespace: string,
    joinInflight: (inflight: Promise<TData>) => Promise<TData>,
  ): void {
    const inflight = this.getInflight<TData>(inflightKey);
    if (inflight) {
      void joinInflight(inflight);
      return;
    }
    const parent = this.telemetry.captureParent();
    const operation = this.startInflight(
      inflightKey,
      () =>
        parent.run(() =>
          this.telemetry.withSpan(
            CacheOperations.WRITE,
            createCacheSpanAttributes(CacheOperations.WRITE, namespace, this.descriptor),
            (span) => {
              spanPrologue(
                span,
                CacheOperations.WRITE,
                { namespace },
                this.descriptor,
                CacheEvents.WRITE,
              );
              recordCacheExecutionState(
                span,
                CacheOperations.WRITE,
                namespace,
                this.descriptor,
                true,
                false,
              );
              return this.fetchAndCache(
                queryFn,
                cacheKey,
                cacheTime,
                namespace,
                span,
                CacheOperations.WRITE,
              ).catch((error) => {
                recordCacheProviderError(
                  span,
                  CacheOperations.WRITE,
                  namespace,
                  this.descriptor,
                  CacheEvents.WRITE,
                );
                throw error;
              });
            },
          )
        ),
    );
    void operation.catch(() => {
      // The write span records failures; keep them detached from the stale-data caller.
    });
  }

  /** Invalidate a single query key. */
  invalidate(queryKey: QueryKey, operationId?: string): Promise<void> {
    const admission = admitCacheNamespace(operationId, 'cache.invalidate');
    const { namespace } = admission;
    return this.telemetry.withSpan(
      CacheOperations.INVALIDATE,
      createCacheSpanAttributes(CacheOperations.INVALIDATE, namespace, this.descriptor),
      async (span) => {
        spanPrologue(
          span,
          CacheOperations.INVALIDATE,
          admission,
          this.descriptor,
          CacheEvents.INVALIDATE,
        );
        try {
          const report = await this.store.delete(toCacheStoreKey(queryKey));
          recordCacheInvalidation(span, namespace, this.descriptor, [report]);
        } catch (error) {
          recordCacheProviderError(
            span,
            CacheOperations.INVALIDATE,
            namespace,
            this.descriptor,
            CacheEvents.INVALIDATE,
          );
          throw error;
        }
      },
    );
  }

  /** Invalidate all cached entries sharing a query-key prefix. */
  invalidateQueries(queryKeyPrefix: QueryKey, operationId?: string): Promise<void> {
    const admission = admitCacheNamespace(operationId, 'cache.invalidate-prefix');
    const { namespace } = admission;
    return this.telemetry.withSpan(
      CacheOperations.INVALIDATE,
      createCacheSpanAttributes(CacheOperations.INVALIDATE, namespace, this.descriptor),
      async (span) => {
        spanPrologue(
          span,
          CacheOperations.INVALIDATE,
          admission,
          this.descriptor,
          CacheEvents.INVALIDATE,
        );
        const reports: CacheInvalidationTopologyReport[] = [];
        try {
          for await (const entry of this.store.list({ prefix: toCacheStoreKey(queryKeyPrefix) })) {
            reports.push(await this.store.delete(entry.key));
          }
          recordCacheInvalidation(span, namespace, this.descriptor, reports);
        } catch (error) {
          recordCacheProviderError(
            span,
            CacheOperations.INVALIDATE,
            namespace,
            this.descriptor,
            CacheEvents.INVALIDATE,
          );
          throw error;
        }
      },
    );
  }

  /** Prefetch data using the standard cache-query path. */
  async prefetch<TData>(queryKey: QueryKey, options: CacheQueryOptions<TData>): Promise<void> {
    await this.query(queryKey, options).catch(() => undefined);
  }

  /** Read a cache entry without applying fetch or stale policy. */
  private readCachedEntry<TData>(
    queryKey: QueryKey,
    operationId: string | undefined,
    fallbackNamespace: string,
  ): Promise<CacheEntry<TData> | null> {
    const admission = admitCacheNamespace(operationId, fallbackNamespace);
    const { namespace } = admission;
    return this.telemetry.withSpan(
      CacheOperations.READ,
      createCacheSpanAttributes(CacheOperations.READ, namespace, this.descriptor),
      async (span) => {
        spanPrologue(span, CacheOperations.READ, admission, this.descriptor, CacheEvents.LOOKUP);
        try {
          const cached = await this.store.get<CacheEntry<TData>>(toCacheStoreKey(queryKey));
          recordCacheLookup(span, namespace, this.descriptor, cached.report);
          return cached.value;
        } catch (error) {
          recordCacheProviderError(
            span,
            CacheOperations.READ,
            namespace,
            this.descriptor,
            CacheEvents.LOOKUP,
          );
          throw error;
        }
      },
    );
  }

  /** Return cached data without fetching. */
  getCachedData<TData>(queryKey: QueryKey, operationId?: string): Promise<TData | null> {
    return this.readCachedEntry<TData>(queryKey, operationId, 'cache.cached-data').then(
      (cached) => cached?.data ?? null,
    );
  }

  /** Return cached data together with its cache timestamp. */
  getCachedEntry<TData>(
    queryKey: QueryKey,
    operationId?: string,
  ): Promise<CachedEntry<TData> | null> {
    return this.readCachedEntry<TData>(queryKey, operationId, 'cache.cached-entry').then(
      (cached) => cached ? toCachedEntry(cached) : null,
    );
  }

  /** Set cached data directly. */
  setCachedData<TData>(
    queryKey: QueryKey,
    data: TData,
    cacheTime: number = DEFAULT_QUERY_CACHE_TIME,
  ): Promise<void> {
    const namespace = 'cache.set-data';
    return this.telemetry.withSpan(
      CacheOperations.WRITE,
      createCacheSpanAttributes(CacheOperations.WRITE, namespace, this.descriptor),
      async (span) => {
        spanPrologue(
          span,
          CacheOperations.WRITE,
          { namespace },
          this.descriptor,
          CacheEvents.WRITE,
        );
        try {
          const report = await this.store.set(
            toCacheStoreKey(queryKey),
            { data, timestamp: Date.now() } satisfies CacheEntry<TData>,
            { expireIn: cacheTime },
          );
          recordCacheWrite(span, CacheOperations.WRITE, namespace, this.descriptor, report);
        } catch (error) {
          recordCacheProviderError(
            span,
            CacheOperations.WRITE,
            namespace,
            this.descriptor,
            CacheEvents.WRITE,
          );
          throw error;
        }
      },
    );
  }

  /** Close the underlying cache store. */
  async close(): Promise<void> {
    await this.store.close();
  }
}

/** Shared cache-query singleton. */
export const cacheQuery: CacheQuery = new CacheQuery();
