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
} from '../src/query-client/create-service-query-utils.ts';

// QueryClient factory
export {
  createNetScriptQueryClient,
  DEFAULT_GC_TIME,
  DEFAULT_STALE_TIME,
  type NetScriptQueryClientOptions,
} from '../src/query-client/query-client-factory.ts';
export type {
  QueryClientFetchOptions,
  QueryClientFilters,
  QueryClientPort,
  QueryClientPredicate,
  QueryClientSetOptions,
} from '../src/ports/query-client.ts';
export type {
  ServiceOperationKey,
  ServiceOperationKeyOptions,
  ServiceOperationType,
  ServiceOptionalInputRest,
  ServicePartialInput,
  ServiceProcedureInfiniteOptions,
  ServiceProcedureInfiniteResult,
  ServiceProcedureLiveResult,
  ServiceProcedureMutationOptions,
  ServiceProcedureMutationResult,
  ServiceProcedureQueryOptions,
  ServiceProcedureQueryResult,
  ServiceProcedureQueryUtils,
  ServiceProcedureStreamedOptions,
  ServiceProcedureStreamedResult,
  ServiceQueryClientContext,
  ServiceQueryKeyOptions,
  ServiceQueryUtils,
  ServiceStreamedKeyOptions,
} from '../src/ports/service-query-utils.ts';

// Key bridge
export { bridgeInvalidation, toClientKeyPrefix } from '../src/query-client/key-bridge.ts';

// KV cache persister
export {
  createKvCachePersister,
  type KvCachePersisterOptions,
  type KvCachePersisterStorage,
} from '../src/query-client/kv-cache-persister.ts';

// Types
export type {
  ActionMutationOptions,
  ActionQueryOptions,
  MutationOptionsResult,
  QueryOptionsWithInitialData,
} from '../src/query-client/types.ts';
