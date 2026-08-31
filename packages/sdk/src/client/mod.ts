/**
 * `@netscript/sdk/client` service client APIs.
 *
 * This subpath creates typed oRPC clients from NetScript service contracts and
 * Aspire service discovery. It also exports the package-owned contract algebra
 * used by query factories, query utils, and type fixtures.
 *
 * Use `createServiceClient()` when code only needs direct service calls. Use
 * the root `defineServices()` preset when the same contract should also create
 * query factories and frontend query utilities.
 *
 * @module
 */

export { createServiceClient } from './service-client.ts';
export { defineSdkClientContribution } from './sdk-client-contribution.ts';
export type { SdkClientContributionDefinition } from './sdk-client-contribution.ts';
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
  ServiceClient,
  ServiceClientContext,
  ServiceClientContract,
  ServiceClientMethod,
  ServiceClientShape,
  ServiceRequestOptions,
  ServiceRequestRest,
} from '../ports/service-client.ts';
