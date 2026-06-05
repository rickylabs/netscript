/**
 * Service-client and client-error APIs for the NetScript SDK.
 *
 * @module
 */

export { createServiceClient } from './service-client.ts';
export { isDefinedError, safe } from './errors.ts';
export type { DefinedError, SafeFailure, SafeResult, SafeSuccess } from './errors.ts';
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
} from '../interfaces/service-client.ts';
