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

export { createServiceClient } from '../src/client/service-client.ts';
export { isDefinedError, safe } from '../src/client/errors.ts';
export type { DefinedError, SafeFailure, SafeResult, SafeSuccess } from '../src/client/errors.ts';
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
  ServiceClientContract,
  ServiceClientMethod,
  ServiceClientShape,
  ServiceRequestOptions,
} from '../src/ports/service-client.ts';
