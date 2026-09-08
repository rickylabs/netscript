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

import type { AuthenticatorPort, AuthorizerPort, MatchAwareAuthorizerPort } from './types.ts';

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

/** Options for constructing the opt-in contract-policy authorizer. */
export interface ContractAuthorizerOptions {
  /** Match-aware legacy authorizer consulted only when matched procedure metadata is absent. */
  readonly fallback?: MatchAwareAuthorizerPort;
}

/** Explicit service posture using the native authentication and authorization stages. */
export interface ServiceGuardedAuthPolicy {
  /** Authentication options passed unchanged to the service builder. */
  readonly authn: AuthnOptions;
  /** Optional authorization options passed unchanged to the service builder. */
  readonly authz?: AuthzOptions;
  /** Public and guarded postures cannot be combined. */
  readonly public?: never;
  /** A public opt-out reason is not valid on a guarded posture. */
  readonly reason?: never;
}

/** Deliberate public service posture with an auditable, nonblank reason. */
export interface ServicePublicAuthPolicy {
  /** Explicitly opts out of service authentication and authorization. */
  readonly public: true;
  /** Explains why the service is public; whitespace-only reasons are rejected. */
  readonly reason: string;
  /** Authentication cannot accompany a public opt-out. */
  readonly authn?: never;
  /** Authorization cannot accompany a public opt-out. */
  readonly authz?: never;
}

/** A service must choose either native guards or a recorded public opt-out. */
export type ServiceAuthPolicy = ServiceGuardedAuthPolicy | ServicePublicAuthPolicy;
