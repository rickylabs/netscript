/**
 * Remote session verification through the native auth service.
 *
 * @module @netscript/plugin-auth/authenticator
 */
export {
  type AuthServiceAuthenticatorOptions,
  createAuthServiceAuthenticator,
  readBearerCredential,
  REMOTE_SESSION_REJECTIONS,
  RemoteSessionVerificationError,
} from '@netscript/plugin-auth-core/authenticator';
