/**
 * better-auth integration helpers for NetScript services.
 *
 * @example
 * ```ts
 * import { createBetterAuthAuthenticator, createNetscriptBetterAuth } from '@netscript/auth-better-auth';
 *
 * const auth = createNetscriptBetterAuth({
 *   prisma,
 *   provider: 'postgresql',
 *   secret: Deno.env.get('BETTER_AUTH_SECRET')!,
 * });
 * const authenticator = createBetterAuthAuthenticator({ auth });
 * ```
 *
 * @module
 */

export {
  type BetterAuthAuthenticatorOptions,
  type BetterAuthInstance,
  type BetterAuthMountOptions,
  type BetterAuthPrismaProvider,
  createBetterAuthAuthenticator,
  createNetscriptBetterAuth,
  mountBetterAuthHandler,
  type NetscriptBetterAuthOptions,
} from './src/better-auth.ts';
