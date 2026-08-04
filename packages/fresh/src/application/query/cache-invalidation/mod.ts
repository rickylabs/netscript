/**
 * Browser-to-server query-cache invalidation contract.
 *
 * @module
 */

/** Default path of the framework-owned server query-cache invalidation endpoint. */
export const DEFAULT_QUERY_CACHE_INVALIDATION_PATH = '/_netscript/query-cache/invalidate';

/** JSON-safe segment accepted by the server query-cache invalidation endpoint. */
export type ServerQueryCacheKeyPart = string | number | boolean | null;

/** Exact SDK query key or prefix sent to the server cache tier. */
export type ServerQueryCacheKey = readonly ServerQueryCacheKeyPart[];

/** Options for browser-to-server query-cache invalidation. */
export interface InvalidateServerQueryCacheOptions {
  /** Override the endpoint path configured by `defineFreshApp`. */
  endpoint?: string;
  /** Fetch-compatible adapter used to send the request. */
  fetcher?: (
    input: string | URL | Request,
    init?: RequestInit,
  ) => Promise<Response>;
}

/**
 * Invalidate an exact query key or prefix in the server cache tier.
 *
 * Await this after a mutation commits and before invalidating the matching
 * island QueryClient entry. A subsequent navigation or reload will then read
 * through the same server cache entry that generated query options use.
 */
export async function invalidateServerQueryCache(
  queryKey: ServerQueryCacheKey,
  options: InvalidateServerQueryCacheOptions = {},
): Promise<void> {
  const response = await (options.fetcher ?? fetch)(
    options.endpoint ?? DEFAULT_QUERY_CACHE_INVALIDATION_PATH,
    {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ queryKey }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Server query-cache invalidation failed with status ${response.status}`,
    );
  }
}
