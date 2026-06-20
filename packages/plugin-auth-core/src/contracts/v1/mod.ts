/**
 * Version 1 auth API schemas and contract route types.
 *
 * @module
 */

export {
  authContract,
  authContractV1,
  AuthSessionResponseSchema,
  AuthUserResponseSchema,
  CallbackInputSchema,
  CallbackResponseSchema,
  MeResponseSchema,
  SessionInputSchema,
  SessionResponseSchema,
  SigninInputSchema,
  SigninResponseSchema,
  SignoutInputSchema,
  SignoutResponseSchema,
} from './auth.contract.ts';
export type {
  AuthContractDefinition,
  AuthContractProcedureLike,
  AuthContractSchema,
  AuthContractSchemaResult,
  AuthSessionResponse,
  AuthUserResponse,
  CallbackInput,
  CallbackResponse,
  MeResponse,
  SessionInput,
  SessionResponse,
  SigninInput,
  SigninResponse,
  SignoutInput,
  SignoutResponse,
  StandardSchemaLike,
} from './auth.contract.ts';
