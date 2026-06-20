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
  type BetterAuthInstance,
  type BetterAuthPrismaClient,
  type BetterAuthPrismaProvider,
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
  AuthBackendPort,
  AuthenticatorPort,
  AuthnRequest,
  AuthnResult,
  AuthProviderDescriptor,
  AuthSession,
  Principal,
} from '@netscript/plugin-auth-core';

export type {
  AuthenticatorPort as ServiceAuthenticatorPort,
  AuthnRequest as ServiceAuthnRequest,
  AuthnResult as ServiceAuthnResult,
  Principal as ServicePrincipal,
} from '@netscript/service/auth';
