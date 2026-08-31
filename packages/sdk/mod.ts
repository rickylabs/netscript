/**
 * NetScript SDK root barrel.
 *
 * The root export is the high-level SDK entrypoint for service-aware
 * applications. It gathers the most common client, query, discovery,
 * telemetry, and OpenAPI surfaces while preserving focused subpaths for narrow
 * imports. Importing this module does not install a server cache provider.
 *
 * Use the root when an app wants the L3 composition preset:
 * `defineServices()`. That preset creates service clients, server-side query
 * factories, and TanStack Query utilities from one contract map. Its returned
 * values are the same L2 values exposed by the focused factories, so dropping
 * down a layer does not require replacing wiring.
 *
 * Use `@netscript/sdk/presets` when browser or shared code only needs
 * `defineServices()` and its package-owned type closure. That focused entry
 * avoids pulling unrelated root exports into the module graph.
 *
 * Use `@netscript/sdk/client` when a service or frontend only needs
 * `createServiceClient()` and the package-owned contract algebra.
 *
 * Use `@netscript/sdk/query` when server code needs cache-aware query
 * factories without a frontend query client.
 *
 * Use `@netscript/sdk/query-client` when browser or island code needs
 * TanStack Query integration, client key helpers, or the KV cache persister.
 *
 * Use `@netscript/sdk/cache` only from server-side code. Importing it is inert;
 * a custom server bootstrap must explicitly call
 * `setCacheProvider(cacheQuery)`. `defineFreshApp()` performs that registration
 * for NetScript-managed Fresh apps.
 *
 * Use `@netscript/sdk/discovery` for Aspire service URLs and database/KV
 * connection discovery. That subpath keeps Deno env access isolated from the
 * browser-oriented query-client surface.
 *
 * Use `@netscript/sdk/ports` for package-owned structural ports shared with
 * other NetScript packages. Ports stay upstream-type-free.
 *
 * Use `@netscript/sdk/auto-update` from Deno Desktop app bootstrap code to
 * configure native updates without depending on moving Deno global names. It
 * stays a focused subpath and is intentionally not re-exported here.
 *
 * Use `@netscript/sdk/desktop` inside a Deno Desktop webview to call an
 * existing service contract over the window's native bind channel. The
 * MessagePort shim and oRPC link stay a focused subpath and are intentionally
 * not re-exported here.
 *
 * @module
 */

export * from './src/client/mod.ts';
export * from './src/discovery/mod.ts';
export {
  type DefinedServiceClients,
  type DefinedServiceQueries,
  type DefinedServiceQueryUtils,
  type DefinedServices,
  type DefineServiceConfig,
  defineServices,
  type DefineServicesConfigMap,
} from './src/presets/define-services.ts';
export * from './src/openapi/helpers.ts';
export * from './src/query/mod.ts';
export * from './src/query-client/mod.ts';
export * from './src/telemetry/mod.ts';
export type {
  CachedEntry,
  CacheEntry,
  CacheInvalidationReport,
  CacheInvalidationTopologyReport,
  CacheKey,
  CacheLookupReport,
  CacheProviderDescriptor,
  CacheReadTopologyReport,
  CacheStore,
  CacheStoreEntry,
  CacheTopologyOutcome,
  CacheTopologyTier,
  CacheWriteReport,
  CacheWriteTopologyReport,
  QueryClientPort,
  ServiceClientContract,
  ServiceClientShape,
  ServiceQueryUtils,
} from './src/ports/mod.ts';
