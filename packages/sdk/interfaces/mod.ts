/**
 * Public interface contracts for the NetScript SDK.
 *
 * @module
 */

export type { CachedEntry, CacheEntry } from '../src/interfaces/cache-entry.ts';
export { isCacheEntryStale, toCachedEntry } from '../src/interfaces/cache-entry.ts';
export type { CacheKey, CacheStore, CacheStoreEntry } from '../src/interfaces/cache-store.ts';
export type {
  HealthCheckResponse,
  PaginatedResponse,
  ServiceMetadata,
} from '../src/interfaces/metadata.ts';
export type {
  ActionMethod,
  CompositeQuery,
  FactoryConfig,
  ProcedureInput,
  ProcedureOutput,
  QueryFactory,
} from '../src/interfaces/query-factory.ts';
export type { QueryKey, QueryKeyPart } from '../src/interfaces/query-key.ts';
export { createActionQueryKey, serializeQueryKeyInput } from '../src/interfaces/query-key.ts';
export type { CacheQueryOptions, QueryParams } from '../src/interfaces/query-options.ts';
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
} from '../src/interfaces/service-client.ts';
export type { ServiceTransport } from '../src/interfaces/transport.ts';
