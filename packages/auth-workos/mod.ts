/**
 * WorkOS AuthKit authenticators for NetScript services.
 *
 * @example
 * ```ts
 * import { WorkOS } from '@workos-inc/node';
 * import { createWorkosAuthenticator } from '@netscript/auth-workos';
 *
 * const workos = new WorkOS('sk_test_123', { clientId: 'client_123' });
 * const authenticator = createWorkosAuthenticator({
 *   workos,
 *   cookiePassword: Deno.env.get('WORKOS_COOKIE_PASSWORD')!,
 * });
 * ```
 *
 * @module
 */

export {
  createWorkosAuthenticator,
  type WorkosAuthenticatorOptions,
  type WorkosCookieOptions,
  type WorkosCookieSession,
  type WorkosRefreshMode,
  type WorkosSessionClient,
} from './src/workos-authenticator.ts';
