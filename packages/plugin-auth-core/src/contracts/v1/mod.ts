/**
 * Version 1 auth API schemas and contract route types.
 *
 * @module
 */

export {
  AUTH_SESSION_STATES,
  AUTH_SESSIONS_REVOKE_SCOPE,
  authContract,
  authContractV1,
  AuthSessionResponseSchema,
  AuthUserResponseSchema,
  CallbackInputSchema,
  CallbackResponseSchema,
  MeResponseSchema,
  RevokeSessionInputSchema,
  RevokeSessionResponseSchema,
  SessionInputSchema,
  SessionResponseSchema,
  SigninInputSchema,
  SigninResponseSchema,
  SignoutInputSchema,
  SignoutResponseSchema,
} from './auth.contract.ts';
export type {
  AuthCapabilities,
  AuthContract,
  AuthContractDefinition,
  AuthContractV1,
  AuthRouter,
  AuthSchema,
  AuthSchemaResult,
  AuthSessionResponse,
  AuthUserResponse,
  CallbackInput,
  CallbackResponse,
  MeResponse,
  RevokeSessionInput,
  RevokeSessionResponse,
  SessionInput,
  SessionResponse,
  SigninInput,
  SigninResponse,
  SignoutInput,
  SignoutResponse,
  ValidationErrorData,
} from './auth.contract.ts';
