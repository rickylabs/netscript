/**
 * `@netscript/sdk/query-client` — TanStack Query integration for the SDK.
 *
 * This subpath provides:
 * - `createServiceQueryUtils()` — oRPC → TanStack Query bridge
 * - `createNetScriptQueryClient()` — QueryClient factory with sensible defaults
 * - `createKvCachePersister()` — TanStack Query ↔ Deno KV persistence
 * - `toClientKeyPrefix()` / `bridgeInvalidation()` — server ↔ client key mapping
 * - Type definitions for ActionMethod TanStack extensions
 *
 * @module
 */

// oRPC → TanStack bridge
export {
  createServiceQueryUtils,
  type CreateServiceQueryUtilsOptions,
} from './create-service-query-utils.ts';

// QueryClient factory
export {
  createNetScriptQueryClient,
  DEFAULT_GC_TIME,
  DEFAULT_STALE_TIME,
  type NetScriptQueryClientOptions,
} from './query-client-factory.ts';

// Key bridge
export { bridgeInvalidation, toClientKeyPrefix } from './key-bridge.ts';

// KV cache persister
export {
  createKvCachePersister,
  type KvCachePersisterOptions,
  type KvCachePersisterStorage,
} from './kv-cache-persister.ts';

// Types
export type {
  ActionMutationOptions,
  ActionQueryOptions,
  MutationOptionsResult,
  QueryOptionsWithInitialData,
} from './types.ts';
