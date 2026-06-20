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
  type BetterAuthPrismaProvider,
  createBetterAuthAuthenticator,
  createNetscriptBetterAuth,
  type NetscriptBetterAuthOptions,
} from './src/better-auth.ts';
