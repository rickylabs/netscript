/**
 * Auth middleware options for NetScript service builders.
 *
 * @example
 * ```ts
 * import type { AuthnOptions } from "@netscript/service/auth";
 *
 * const authn: AuthnOptions = {
 *   authenticator,
 *   protect: ["/api"],
 *   allowAnonymous: ["/health"],
 * };
 * ```
 *
 * @module
 */

import type { AuthenticatorPort, AuthorizerPort } from './types.ts';

/** Authentication middleware options for `withAuthn()` and `defineService({ auth })`. */
export interface AuthnOptions {
  /** Authenticator implementation. */
  readonly authenticator: AuthenticatorPort;
  /** Path prefixes the auth stage guards. Defaults to `["/api"]`. */
  readonly protect?: readonly string[];
  /** Path prefixes always left public even under a guarded prefix. Defaults to `["/health"]`. */
  readonly allowAnonymous?: readonly string[];
}

/** Authorization middleware options for `withAuthz()` and `defineService({ auth })`. */
export interface AuthzOptions {
  /** Authorizer implementation. */
  readonly authorizer: AuthorizerPort;
  /** Fail closed when no decision is reachable. Defaults to `true`. */
  readonly denyByDefault?: boolean;
}
