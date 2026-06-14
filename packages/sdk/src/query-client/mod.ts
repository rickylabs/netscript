/**
 * `@netscript/sdk/query-client` TanStack Query integration.
 *
 * This subpath bridges typed SDK service clients into frontend query utilities.
 * It provides `createServiceQueryUtils()` for oRPC/TanStack options,
 * `createNetScriptQueryClient()` for NetScript-aligned QueryClient defaults,
 * `createKvCachePersister()` for persisted query cache storage, and key helpers
 * that map server invalidation keys to client query prefixes.
 *
 * The public `QueryClientPort` and `ServiceQueryUtils<TContract>` types are
 * package-owned structural mirrors. They preserve contract inference while
 * keeping upstream TanStack and oRPC helper types behind internal boundaries.
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
export type {
  QueryClientFetchOptions,
  QueryClientFilters,
  QueryClientPort,
  QueryClientPredicate,
  QueryClientSetOptions,
} from '../ports/query-client.ts';
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
} from '../ports/service-query-utils.ts';

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
