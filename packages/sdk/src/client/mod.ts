/**
 * `@netscript/sdk/client` service client APIs.
 *
 * This subpath creates typed oRPC clients from NetScript service contracts and
 * Aspire service discovery. It also defines upstream-neutral, versioned request
 * contributions whose literal tuples infer per-call context, reserve HTTP header
 * ownership, declare response-cache safety, and fail with redacted SDK errors.
 *
 * Use `createServiceClient()` when code only needs direct service calls, and
 * `defineSdkClientContribution()` to add declared request headers without taking
 * ownership of transport, retry, fetch, or tracing. Use
 * the root `defineServices()` preset when the same contract should also create
 * query factories and frontend query utilities.
 *
 * @module
 */

export { createServiceClient } from './service-client.ts';
export { defineSdkClientContribution } from './sdk-client-contribution.ts';
export type { SdkClientContributionDefinition } from './sdk-client-contribution.ts';
export { createLocaleSdkClientContribution } from './locale-contribution.ts';
export type { LocaleSdkClientContext, LocaleSdkClientContribution } from './locale-contribution.ts';
export { isDefinedError, safe, SdkClientContributionError } from './errors.ts';
export type {
  DefinedError,
  SafeFailure,
  SafeResult,
  SafeSuccess,
  SdkClientContributionDiagnostic,
  SdkClientContributionErrorCode,
} from './errors.ts';
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
  SdkClientHttpMethod,
  SdkClientTransportPolicy,
  SdkClientTransportPolicyMethodOptions,
  ServiceClient,
  ServiceClientContext,
  ServiceClientContract,
  ServiceClientMethod,
  ServiceClientShape,
  ServiceRequestOptions,
  ServiceRequestRest,
} from '../ports/service-client.ts';
