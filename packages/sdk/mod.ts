/**
 * NetScript SDK root barrel.
 *
 * The root export is the high-level SDK entrypoint for service-aware
 * applications. It gathers the most common client, query, discovery,
 * telemetry, OpenAPI, and cache surfaces while preserving focused subpaths for
 * narrow imports.
 *
 * Use the root when an app wants the L3 composition preset:
 * `defineServices()`. That preset creates service clients, server-side query
 * factories, and TanStack Query utilities from one contract map. Its returned
 * values are the same L2 values exposed by the focused factories, so dropping
 * down a layer does not require replacing wiring.
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
 * Use `@netscript/sdk/cache` only from server-side code. Importing it
 * auto-registers the shared KV-backed cache provider for query factories.
 *
 * Use `@netscript/sdk/discovery` for Aspire service URLs and database/KV
 * connection discovery. That subpath keeps Deno env access isolated from the
 * browser-oriented query-client surface.
 *
 * Use `@netscript/sdk/ports` for package-owned structural ports shared with
 * other NetScript packages. Ports stay upstream-type-free.
 *
 * @module
 */

export * from './cache/mod.ts';
export * from './client/mod.ts';
export * from './discovery/mod.ts';
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
export * from './query/mod.ts';
export * from './query-client/mod.ts';
export * from './telemetry/mod.ts';
export type {
  CacheKey,
  CacheStore,
  CacheStoreEntry,
  HealthCheckResponse,
  PaginatedResponse,
  QueryClientPort,
  ServiceMetadata,
  ServiceQueryUtils,
  ServiceTransport,
} from './ports/mod.ts';
