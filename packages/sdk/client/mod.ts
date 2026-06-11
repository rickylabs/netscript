/**
 * Service-client and client-error APIs for the NetScript SDK.
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
  ServiceClientMethod,
  ServiceRequestOptions,
} from '../src/interfaces/service-client.ts';
