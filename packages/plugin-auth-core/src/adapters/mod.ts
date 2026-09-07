/**
 * Native auth service credential adapters.
 * @module
 */
export { readBearerCredential } from './bearer-credential.ts';
export {
  type AuthServiceAuthenticatorOptions,
  createAuthServiceAuthenticator,
  REMOTE_SESSION_REJECTIONS,
  RemoteSessionVerificationError,
} from './auth-service-authenticator.ts';
export type {
  AuthenticatorPort,
  AuthnRequest,
  AuthnResult,
  Principal,
} from '@netscript/service/auth';
