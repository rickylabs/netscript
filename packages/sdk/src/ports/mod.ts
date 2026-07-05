/**
 * `@netscript/sdk/ports` package-owned structural contracts.
 *
 * Ports define the SDK's public type vocabulary without re-exporting upstream
 * implementation types. They cover cache stores and entries, service-client
 * contract inference, query factories, TanStack Query client width,
 * service-query utils, discovery metadata, and the transport seam.
 *
 * Import this subpath when another NetScript package needs to accept or return
 * SDK-compatible shapes without depending on concrete adapters. Runtime
 * factories live in the focused `client`, `query`, `query-client`, `cache`, and
 * `collections` subpaths.
 *
 * @module
 */

export type { CachedEntry, CacheEntry } from './cache-entry.ts';
export { isCacheEntryStale, toCachedEntry } from './cache-entry.ts';
export type { CacheKey, CacheStore, CacheStoreEntry } from './cache-store.ts';
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
  QueryClientFetchOptions,
  QueryClientFilters,
  QueryClientPort,
  QueryClientPredicate,
  QueryClientSetOptions,
} from './query-client.ts';
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
} from './service-query-utils.ts';
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
  NetScriptProcedureSchemas,
  ProcedureInputFromNode,
  ProcedureOutputFromNode,
  ServiceClient,
  ServiceClientContext,
  ServiceClientContract,
  ServiceClientMethod,
  ServiceClientShape,
  ServiceRequestOptions,
} from './service-client.ts';
