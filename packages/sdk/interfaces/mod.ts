/**
 * Public interface contracts for the NetScript SDK.
 *
 * @module
 */

export type { CachedEntry, CacheEntry } from './cache-entry.ts';
export { isCacheEntryStale, toCachedEntry } from './cache-entry.ts';
export type { CacheKey, CacheStore, CacheStoreEntry } from './cache-store.ts';
export type { HealthCheckResponse, PaginatedResponse, ServiceMetadata } from './metadata.ts';
export type {
  ActionMethod,
  CompositeQuery,
  FactoryConfig,
  ProcedureInput,
  ProcedureOutput,
  QueryFactory,
} from './query-factory.ts';
export type { QueryKey, QueryKeyPart } from './query-key.ts';
export { createActionQueryKey, serializeQueryKeyInput } from './query-key.ts';
export type { CacheQueryOptions, QueryParams } from './query-options.ts';
export type {
  ActionMutationOptions,
  ActionQueryOptions,
  MutationOptionsResult,
  QueryOptionsWithInitialData,
} from '../query-client/types.ts';
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
} from './service-client.ts';
export type { ServiceTransport } from './transport.ts';
