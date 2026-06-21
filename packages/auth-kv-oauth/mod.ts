/**
 * KV-backed OAuth2/OIDC relying-party backend for NetScript auth.
 *
 * @example
 * ```ts
 * import { createKvOAuthBackend, getRequiredEnv, providers } from "@netscript/auth-kv-oauth";
 *
 * const backend = await createKvOAuthBackend({
 *   provider: providers.google({
 *     clientId: getRequiredEnv("GOOGLE_CLIENT_ID"),
 *     clientSecret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
 *     redirectUri: "https://app.example.com/auth/callback",
 *   }),
 * });
 * ```
 *
 * @module
 */

export {
  type ClientAuthMethod,
  defineOAuthProvider,
  hasIssuerDiscovery,
  type OAuthEndpointProviderConfig,
  type OAuthIssuerProviderConfig,
  type OAuthProviderBaseConfig,
  type OAuthProviderClientAuthConfig,
  type OAuthProviderConfig,
  type OAuthProviderInput,
  type PresetOAuthProviderOptions,
  type TenantOAuthProviderOptions,
} from './src/providers.ts';
export { providers } from './src/providers.ts';

export {
  createKvOAuthStore,
  type KvOAuthEncryptedTokens,
  type KvOAuthSessionRecord,
  type KvOAuthStore,
  type KvOAuthStoreOptions,
  type KvOAuthTokenSet,
  type KvOAuthTxn,
} from './src/store.ts';

export {
  createKvOAuthCrypto,
  getRequiredEnv,
  type KvOAuthCrypto,
  type KvOAuthJsonValidator,
  type KvOAuthKeyMaterial,
} from './src/crypto.ts';

export {
  buildCookieHeader,
  clearCookieHeader,
  deriveHttps,
  type KvOAuthCookieOptions,
  parseCookieHeader,
} from './src/cookies.ts';

export {
  createKvOAuthFlow,
  type CreateKvOAuthFlowOptions,
  type KvOAuthCallbackResult,
  type KvOAuthFetch,
  type KvOAuthFlow,
  type KvOAuthPrincipal,
  type NormalizePrincipalContext,
  type OAuthCustomFetch,
  type OAuthTokenCustomFetch,
} from './src/flow.ts';

export {
  createKvOAuthBackend,
  type CreateKvOAuthBackendOptions,
  type KvOAuthBackend,
  type KvOAuthRefreshMode,
} from './src/backend.ts';

export { KvOAuthError, type KvOAuthErrorCode } from './src/errors.ts';

export { AUTH_SESSION_STATES } from '@netscript/plugin-auth-core';
export type {
  AuthBackendPort,
  AuthenticatorPort,
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
} from '@netscript/plugin-auth-core';
export type { AuthnRequest, AuthnResult, Principal } from '@netscript/service/auth';
export type {
  AtomicCheck,
  AtomicMutation,
  AtomicResult,
  KvEntry,
  KvKey,
  KvListOptions,
  KvSetOptions,
  KvStore,
  WatchableKv,
  WatchEvent,
  WatchOptions,
  WatchPrefixOptions,
} from '@netscript/kv';
