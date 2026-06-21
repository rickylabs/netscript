/**
 * Version 1 auth API schemas and contract route types.
 *
 * @module
 */

export {
  AUTH_SESSION_STATES,
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
  AuthContractErrorFactory,
  AuthContractErrors,
  AuthContractV1,
  AuthRouteHandler,
  AuthRouteHandlerOptions,
  AuthRouter,
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
  ValidationErrorData,
} from './auth.contract.ts';
