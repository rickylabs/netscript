/**
 * better-auth integration helpers for NetScript services.
 *
 * @example
 * ```ts
 * import { createBetterAuthBackend, createNetscriptBetterAuth } from '@netscript/auth-better-auth';
 *
 * const auth = createNetscriptBetterAuth({
 *   prisma,
 *   provider: 'postgresql',
 *   secret: Deno.env.get('BETTER_AUTH_SECRET')!,
 * });
 * const backend = createBetterAuthBackend({
 *   auth,
 *   sessionTokenSecret: Deno.env.get('BETTER_AUTH_SECRET')!,
 * });
 * ```
 *
 * @module
 */

export {
  type BetterAuthAuthenticatorOptions,
  type BetterAuthGetSessionInput,
  type BetterAuthInstance,
  type BetterAuthPrismaClient,
  type BetterAuthPrismaProvider,
  type BetterAuthSessionLookupResponse,
  type BetterAuthSessionPayload,
  createBetterAuthAuthenticator,
  createNetscriptBetterAuth,
  type NetscriptBetterAuthOptions,
} from './src/better-auth.ts';

export {
  AuthBackendOperationUnsupportedError,
  type BetterAuthBackendOptions,
  type BetterAuthProviderOptions,
  createBetterAuthBackend,
} from './src/better-auth-backend.ts';

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
