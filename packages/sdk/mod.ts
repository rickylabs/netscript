/**
 * NetScript SDK
 *
 * Framework-owned service discovery, oRPC clients, cache/query primitives, and
 * OpenAPI/telemetry helpers used across NetScript services and frontend
 * packages.
 *
 * Prefer the focused subpaths for narrow imports:
 * `@netscript/sdk/client`, `@netscript/sdk/cache`, `@netscript/sdk/query`,
 * `@netscript/sdk/discovery`, `@netscript/sdk/openapi`, and
 * `@netscript/sdk/telemetry`.
 *
 * @module
 */

export * from './cache/mod.ts';
export * from './client/mod.ts';
export * from './discovery/mod.ts';
export * from './openapi/mod.ts';
export * from './query/mod.ts';
export * from './query-client/mod.ts';
export * from './telemetry/mod.ts';
export { KvCacheStore } from './adapters/mod.ts';
export type {
  CacheKey,
  CacheStore,
  CacheStoreEntry,
  HealthCheckResponse,
  PaginatedResponse,
  ServiceMetadata,
  ServiceTransport,
} from './ports/mod.ts';
