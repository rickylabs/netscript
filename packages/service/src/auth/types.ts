/**
 * Authentication and authorization contracts for NetScript services.
 *
 * @example
 * ```ts
 * import type { AuthenticatorPort } from "@netscript/service/auth";
 *
 * const authenticator: AuthenticatorPort = {
 *   authenticate: () => ({
 *     ok: true,
 *     principal: {
 *       subject: "service:billing",
 *       scopes: ["orders:read"],
 *       roles: ["service"],
 *       scheme: "custom",
 *       claims: {
 *         organizationId: "org_123",
 *         sessionId: "sess_123",
 *       },
 *     },
 *   }),
 * };
 * ```
 *
 * @module
 */

/** Identity established for an authenticated request. */
export interface Principal {
  /** Stable subject identifier such as a user id, service id, or API-key id. */
  readonly subject: string;
  /** Granted scopes for RPC or REST operation permissions. */
  readonly scopes: readonly string[];
  /** Granted roles for role-based access checks. */
  readonly roles: readonly string[];
  /** Authentication scheme that established the principal. */
  readonly scheme: 'api-key' | 'bearer' | 'trusted-header' | 'custom';
  /**
   * Opaque verified claims for consumer-specific authorization.
   *
   * Adapter packages should use `scheme: "custom"` plus this claim bag for
   * provider-specific identity such as organization id, tenant id, session id,
   * provider permissions, or normalized WorkOS/better-auth session metadata.
   */
  readonly claims: Readonly<Record<string, unknown>>;
}

/** Result of an authentication attempt. */
export type AuthnResult =
  | {
    readonly ok: true;
    readonly principal: Principal;
    /** Response headers the authenticator wants written after successful auth. */
    readonly responseHeaders?: Readonly<Record<string, string>>;
    /** Set-Cookie header values emitted by refresh-on-read session authenticators. */
    readonly setCookies?: readonly string[];
  }
  | { readonly ok: false; readonly reason: string };

/** Input handed to an authenticator. */
export interface AuthnRequest {
  /** Reads a request header by lowercase or canonical name. */
  header(name: string): string | undefined;
  /** Returns the full request headers for provider SDKs that validate sessions from header sets. */
  headers(): Headers;
  /** Reads a cookie value by name from the Cookie header. */
  cookie(name: string): string | undefined;
  /** Request method. */
  readonly method: string;
  /** Request path. */
  readonly path: string;
}

/** Authentication boundary that turns a request into a principal or a rejection. */
export interface AuthenticatorPort {
  /** Authenticates a request and returns a principal or a rejection reason. */
  authenticate(request: AuthnRequest): Promise<AuthnResult> | AuthnResult;
}

/** Authorization decision input. */
export interface AuthzRequest {
  /** Authenticated principal being authorized. */
  readonly principal: Principal;
  /** Request method. */
  readonly method: string;
  /** Request path. */
  readonly path: string;
}

/** Authorization decision. */
export type AuthzDecision =
  | { readonly allow: true }
  | { readonly allow: false; readonly reason: string };

/** Authorization boundary that decides whether a principal may proceed. */
export interface AuthorizerPort {
  /** Authorizes a principal for a request path and method. */
  authorize(request: AuthzRequest): Promise<AuthzDecision> | AuthzDecision;
}
