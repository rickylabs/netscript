/**
 * Browser-safe SDK composition presets.
 *
 * Import `defineServices()` from this focused entry when shared or browser
 * modules do not need the SDK root's discovery, telemetry, and OpenAPI exports.
 * The entry is load-time pure and exposes only the preset plus its explicit
 * package-owned type closure.
 *
 * @module
 */

export {
  type DefinedServiceClients,
  type DefinedServiceQueries,
  type DefinedServiceQueryUtils,
  type DefinedServices,
  type DefineServiceConfig,
  defineServices,
  type DefineServicesConfigMap,
} from './define-services.ts';
export type { CachedEntry, CacheEntry } from '../ports/cache-entry.ts';
export type { CacheKey, CacheStore, CacheStoreEntry } from '../ports/cache-store.ts';
export type {
  CacheInvalidationReport,
  CacheInvalidationTopologyReport,
  CacheLookupReport,
  CacheProviderDescriptor,
  CacheReadTopologyReport,
  CacheTopologyOutcome,
  CacheTopologyTier,
  CacheWriteReport,
  CacheWriteTopologyReport,
} from '../ports/cache-topology.ts';
export type {
  ActionMethod,
  CompositeQuery,
  FactoryConfig,
  ProcedureInput,
  ProcedureMeta,
  ProcedureOutput,
  QueryFactory,
} from '../ports/query-factory.ts';
export type {
  ActionQueryKey,
  QueryKey,
  QueryKeyPart,
  SdkClientServerKeySuffix,
} from '../ports/query-key.ts';
export type { CacheQueryOptions, QueryParams } from '../ports/query-options.ts';
export type {
  SdkClientCachePartitionOptions,
  SdkClientContextDeclaration,
  SdkClientContribution,
  SdkClientContributionContext,
  SdkClientContributionId,
  SdkClientContributionProtocol,
  SdkClientPrepareOptions,
  SdkClientProcedureDescriptor,
  SdkClientRequestPatch,
  SdkClientResponseCache,
  SdkClientTransportDescriptor,
  ValidateSdkClientContributions,
} from '../ports/sdk-client-contribution.ts';
export type {
  QueryClientFetchOptions,
  QueryClientFilters,
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
  ProcedureMetaFromNode,
  ProcedureOutputFromNode,
  ServiceClient,
  ServiceClientContext,
  ServiceClientContract,
  ServiceClientMethod,
  ServiceClientShape,
  ServiceRequestOptions,
  ServiceRequestRest,
} from '../ports/service-client.ts';
