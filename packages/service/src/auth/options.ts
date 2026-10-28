/**
 * Auth middleware options for NetScript service builders.
 *
 * @example
 * ```ts
 * import type { AuthenticatorPort, AuthnOptions } from "@netscript/service/auth";
 *
 * declare const authenticator: AuthenticatorPort;
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

import type { InternalCallerPredicate } from './contract/contract-policy.ts';
import type { AuthenticatorPort, AuthorizerPort, MatchAwareAuthorizerPort } from './types.ts';

/**
 * One anonymous request with an uppercase method and byte-exact absolute path.
 *
 * GET does not admit HEAD. Descendants, encoded spellings and slash/case variants are not
 * admitted; query strings are ignored. OPTIONS is excluded: use `withCors()` for preflight.
 *
 * @example
 * ```ts
 * import type { AnonymousRequestMatch } from '@netscript/service/auth';
 * const health: readonly AnonymousRequestMatch[] = [
 *   { method: 'GET', path: '/health' },
 *   { method: 'GET', path: '/health/live' },
 *   { method: 'GET', path: '/health/ready' },
 *   { method: 'HEAD', path: '/health' },
 *   { method: 'HEAD', path: '/health/live' },
 *   { method: 'HEAD', path: '/health/ready' },
 * ];
 * ```
 */
export interface AnonymousRequestMatch {
  /** Exact request method; bodyless probes require an explicit HEAD entry. */
  readonly method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Absolute path without encoding, parameters, wildcards, query or fragment. */
  readonly path: string;
}

/** A legacy path prefix or one exact anonymous request. */
export type AnonymousRule = string | AnonymousRequestMatch;

/** Authentication middleware options for `withAuthn()` and `defineService({ auth })`. */
export interface AuthnOptions {
  /** Authenticator implementation. */
  readonly authenticator: AuthenticatorPort;
  /** Path prefixes the auth stage guards. Defaults to `["/api"]`. */
  readonly protect?: readonly string[];
  /**
   * Requests left public by both auth stages. Strings are method-blind path prefixes; objects
   * match one exact method/path. Omitted or empty retains the `/health` prefix default; a
   * nonempty list replaces it. Invalid objects throw TypeError when middleware is constructed,
   * before requests or listeners. Matched contract access declarations take precedence.
   */
  readonly allowAnonymous?: readonly AnonymousRule[];
}

/** Authorization middleware options for `withAuthz()` and `defineService({ auth })`. */
export interface AuthzOptions {
  /** Authorizer implementation. */
  readonly authorizer: AuthorizerPort;
  /** Fail closed when no decision is reachable. Defaults to `true`. */
  readonly denyByDefault?: boolean;
}

/**
 * Raw (non-contract) route declared to a contract-policy authorizer.
 *
 * A declared raw route always requires successful authentication; it is never a public bypass.
 * The path is matched exactly, so a declaration does not cover sibling or nested paths.
 */
export interface ContractAuthorizerRawRoute {
  /** Absolute mounted path, as passed to the builder's `route()`; no wildcards or parameters. */
  readonly path: string;
  /** Raw routes are authentication-only seams; public raw routes are not supported. */
  readonly authentication: 'required';
  /** Optional scope and role requirements, enforced like a procedure's declared authorization. */
  readonly authorization?: {
    /** Scopes required from the authenticated principal. */
    readonly scopes?: readonly string[];
    /** Roles required from the authenticated principal. */
    readonly roles?: readonly string[];
  };
}

/** Options for constructing the opt-in contract-policy authorizer. */
export interface ContractAuthorizerOptions {
  /** Match-aware legacy authorizer consulted only when matched procedure metadata is absent. */
  readonly fallback?: MatchAwareAuthorizerPort;
  /** Raw routes mounted beside the contract router; any other unmatched route stays denied. */
  readonly rawRoutes?: readonly ContractAuthorizerRawRoute[];
  /**
   * Decides which principals satisfy `access.audience: 'internal'`. Defaults to
   * `isInternalServicePrincipal`, which accepts only internal-credential principals.
   */
  readonly isInternalCaller?: InternalCallerPredicate;
}

/** Options for constructing the contract-overlay authorizer. */
export interface ContractOverlayAuthorizerOptions {
  /**
   * Authorizer applied to guarded requests that reach no access-marked procedure. When omitted,
   * an authenticated principal is sufficient, exactly as with authentication alone.
   */
  readonly fallback?: AuthorizerPort;
  /**
   * Decides which principals satisfy `access.audience: 'internal'`. Defaults to
   * `isInternalServicePrincipal`, which accepts only internal-credential principals.
   */
  readonly isInternalCaller?: InternalCallerPredicate;
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
