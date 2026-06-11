/**
 * Public structural ports for the NetScript SDK.
 *
 * @module
 */

export type { CachedEntry, CacheEntry } from '../src/ports/cache-entry.ts';
export { isCacheEntryStale, toCachedEntry } from '../src/ports/cache-entry.ts';
export type { CacheKey, CacheStore, CacheStoreEntry } from '../src/ports/cache-store.ts';
export type {
  HealthCheckResponse,
  PaginatedResponse,
  ServiceMetadata,
} from '../src/ports/metadata.ts';
export type {
  ActionMethod,
  CompositeQuery,
  FactoryConfig,
  ProcedureInput,
  ProcedureOutput,
  QueryFactory,
} from '../src/ports/query-factory.ts';
export type { QueryKey, QueryKeyPart } from '../src/ports/query-key.ts';
export { createActionQueryKey, serializeQueryKeyInput } from '../src/ports/query-key.ts';
export type { CacheQueryOptions, QueryParams } from '../src/ports/query-options.ts';
export type {
  QueryClientFetchOptions,
  QueryClientFilters,
  QueryClientPort,
  QueryClientPredicate,
  QueryClientSetOptions,
} from '../src/ports/query-client.ts';
export type {
  ActionMutationOptions,
  ActionQueryOptions,
  MutationOptionsResult,
  QueryOptionsWithInitialData,
} from '../src/query-client/types.ts';
export type {
  ContractLike,
  ContractProcedureLike,
  ContractProcedureMetadata,
  ContractProcedureNames,
  ContractSchema,
  ContractSchemaInput,
  ContractSchemaOutput,
  CreateServiceClientOptions,
  ProcedureInputFromNode,
  ProcedureOutputFromNode,
  ServiceClient,
  ServiceClientContext,
  ServiceClientMethod,
  ServiceRequestOptions,
} from '../src/ports/service-client.ts';
export type { ServiceTransport } from '../src/ports/transport.ts';
