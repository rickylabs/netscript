/**
 * Input, output and capability types of the auth v1 contract.
 *
 * @module
 */

import type { AUTH_SESSION_STATES } from '../../domain/mod.ts';

/** Input accepted by the signin endpoint. */
export type SigninInput = Readonly<{
  providerId?: string;
  redirectTo?: string;
  loginHint?: string;
  scopes?: string[];
  state?: string;
}>;

/** Response returned by the signin endpoint. */
export type SigninResponse = Readonly<{
  started: boolean;
  providerId?: string;
  redirectUrl?: string;
  state?: string;
}>;

/** Input accepted by the callback endpoint. */
export type CallbackInput = Readonly<{
  providerId?: string;
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
  redirectTo?: string;
}>;

/** Response returned by the callback endpoint. */
export type CallbackResponse = Readonly<{
  completed: boolean;
  sessionId?: string;
  redirectTo?: string;
  subject?: string;
}>;

/**
 * Input accepted by the signout endpoint.
 *
 * Signout always acts for the authenticated principal. `sessionId` selects one of the principal's
 * own sessions (default: the session behind the presented credential); a session id that is
 * unknown or owned by another subject is refused with the same `UNAUTHORIZED` error.
 * `everywhere: true` revokes every session owned by the principal's subject and no other.
 */
export type SignoutInput = Readonly<{
  /** Same-subject session selector; defaults to the session behind the presented credential. */
  sessionId?: string;
  /** Revoke every session owned by the authenticated subject. */
  everywhere?: boolean;
  /** Post-signout redirect target echoed in the response. */
  redirectTo?: string;
}>;

/** Response returned by the signout endpoint. */
export type SignoutResponse = Readonly<{
  signedOut: boolean;
  sessionId?: string;
  redirectTo?: string;
}>;

/** Scope an operator principal needs to revoke any session through `revokeSession`. */
export const AUTH_SESSIONS_REVOKE_SCOPE = 'auth:sessions:revoke';

/** Input accepted by the operator `revokeSession` endpoint. */
export type RevokeSessionInput = Readonly<{
  /** Session to revoke, regardless of its owner. */
  sessionId: string;
}>;

/** Response returned by the operator `revokeSession` endpoint. */
export type RevokeSessionResponse = Readonly<{
  revoked: boolean;
  sessionId: string;
}>;

/** Input accepted by the session endpoint. */
export type SessionInput = Readonly<{
  sessionId?: string;
}>;

/** Public auth session response returned by v1 endpoints. */
export type AuthSessionResponse = Readonly<{
  id: string;
  userId: string;
  providerId?: string;
  state: (typeof AUTH_SESSION_STATES)[keyof typeof AUTH_SESSION_STATES];
  subject: string;
  scopes: string[];
  roles: string[];
  claims: Record<string, unknown>;
  issuedAt: string;
  expiresAt: string;
  refreshedAt?: string;
  revokedAt?: string;
}>;

/** Response returned by the session endpoint. */
export type SessionResponse = Readonly<{
  authenticated: boolean;
  session?: AuthSessionResponse;
}>;

/** Public user response returned by the me endpoint. */
export type AuthUserResponse = Readonly<{
  id: string;
  displayName?: string;
  email?: string;
  emailVerified?: boolean;
  imageUrl?: string;
  claims?: Record<string, unknown>;
}>;

/** Response returned by the me endpoint. */
export type MeResponse = Readonly<{
  authenticated: boolean;
  user?: AuthUserResponse;
  session?: AuthSessionResponse;
}>;

/** Validation error payload returned by auth contract errors. */
export type ValidationErrorData = Readonly<{
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
}>;

/**
 * Public, capability-document shape returned by the mandatory `describe` route.
 */
export interface AuthCapabilities {
  /** Canonical plugin package name, for example `@netscript/plugin-auth`. */
  readonly pluginName: string;
  /** Contract version identifiers served by the plugin. */
  readonly contractVersions: readonly string[];
  /** Route group names exposed by the plugin. */
  readonly routeGroups: readonly string[];
  /** Capability tags advertised by the plugin. */
  readonly capabilities: readonly string[];
}
