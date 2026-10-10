/**
 * WorkOS AuthKit authenticators for NetScript services.
 *
 * Supply the exported sealed-session client port. Direct WorkOS SDK compatibility is tracked in
 * {@link https://github.com/rickylabs/netscript/issues/2231 | issue #2231}.
 *
 * @example
 * ```ts
 * import { createWorkosBackend, type WorkosSessionClient } from '@netscript/auth-workos';
 *
 * // Supply the application's sealed-session client through the published port.
 * declare const workos: WorkosSessionClient;
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
  InteractiveCallbackResult,
  InteractiveFlowPort,
  Principal,
} from '@netscript/plugin-auth-core';
