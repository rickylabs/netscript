/**
 * WorkOS AuthKit authenticators for NetScript services.
 *
 * Supply a configured WorkOS SDK client to authenticate AuthKit sealed sessions.
 *
 * @example
 * ```ts
 * import { WorkOS } from '@workos-inc/node';
 * import { createWorkosBackend } from '@netscript/auth-workos';
 *
 * const workos = new WorkOS(Deno.env.get('WORKOS_API_KEY')!, {
 *   clientId: Deno.env.get('WORKOS_CLIENT_ID')!,
 * });
 * const backend = createWorkosBackend({
 *   workos,
 *   cookiePassword: Deno.env.get('WORKOS_COOKIE_PASSWORD')!,
 * });
 * ```
 *
 * @module
 */

export {
  createWorkosAccessTokenAuthenticator,
  createWorkosAuthenticator,
  type WorkosAccessTokenAuthenticatorOptions,
  type WorkosAuthenticatorOptions,
  type WorkosCookieOptions,
  type WorkosCookieSession,
  type WorkosRefreshMode,
  type WorkosSessionAuthenticationFailure,
  type WorkosSessionAuthenticationResult,
  type WorkosSessionAuthenticationSuccess,
  type WorkosSessionClient,
  type WorkosSessionRefreshResult,
  type WorkosSessionRefreshSuccess,
} from './src/workos-authenticator.ts';

export {
  AuthBackendOperationUnsupportedError,
  createWorkosBackend,
  type WorkosBackendOptions,
  type WorkosProviderOptions,
} from './src/workos-backend.ts';

export type {
  AUTH_SESSION_STATES,
  AuthBackendPort,
  AuthenticatorPort,
  AuthnRequest,
  AuthnResult,
  AuthPrincipalMapperPort,
  AuthProviderCapability,
  AuthProviderDescriptor,
  AuthProviderRegistryPort,
  AuthSession,
  AuthSessionCreateInput,
  AuthSessionCryptoPort,
  AuthSessionLookup,
  AuthSessionPrincipalMapping,
  AuthSessionState,
  AuthSessionStorePort,
  AuthSubjectRevocation,
  AuthSubjectRevocationInput,
  InteractiveCallbackResult,
  InteractiveFlowPort,
  Principal,
} from '@netscript/plugin-auth-core';
