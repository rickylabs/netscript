/**
 * Session ownership rules shared by the signout and operator revocation handlers.
 *
 * Signout acts only for the principal the service guard authenticated: a caller-supplied session
 * id is a same-subject selector, and a session that is unknown or owned by another subject is
 * refused with one indistinguishable error so the endpoint is never an enumeration oracle.
 *
 * @module
 */

import { AUTH_SESSIONS_REVOKE_SCOPE } from '@netscript/plugin-auth-core/contracts/v1';
import type { AuthSession, Principal } from '@netscript/plugin-auth-core/domain';
import type { AuthBackendPort } from '@netscript/plugin-auth-core/ports';
import { type AuthServiceContext, AuthServiceHandlerError } from './v1-types.ts';

/** Refusal shared by unknown and foreign session ids; the wording must never tell them apart. */
export const SESSION_NOT_OWNED_REASON =
  'No session of the authenticated principal matches the requested session.';

const AUTHENTICATION_REQUIRED_REASON = 'Authentication required.';
const NO_ACTIVE_SESSION_REASON = 'No active auth session was found.';

/** Sessions a signout request resolved to, plus the id it reports back. */
export type SignoutRevocation = Readonly<{
  sessionId?: string;
  revoked: readonly AuthSession[];
}>;

/** Signout selection after contract validation. */
export type SignoutSelection = Readonly<{
  sessionId?: string;
  everywhere?: boolean;
}>;

/** Returns the guard-authenticated principal or refuses the call as unauthenticated. */
export function requirePrincipal(context: AuthServiceContext): Principal {
  if (!context.principal) {
    throw new AuthServiceHandlerError('UNAUTHORIZED', AUTHENTICATION_REQUIRED_REASON);
  }
  return context.principal;
}

/** Refuses an operator call whose principal lacks the session-revocation scope. */
export function requireRevokeScope(principal: Principal): void {
  if (!principal.scopes.includes(AUTH_SESSIONS_REVOKE_SCOPE)) {
    throw new AuthServiceHandlerError(
      'FORBIDDEN',
      `The ${AUTH_SESSIONS_REVOKE_SCOPE} scope is required to revoke another session.`,
    );
  }
}

/**
 * Revokes the sessions a signout selects for `principal`.
 *
 * Without `everywhere`, exactly one owned session is revoked: the selected id or the session behind
 * the presented credential. With `everywhere`, every session of the principal's subject is revoked.
 * Ownership is checked before any write, so a refused call leaves every session untouched.
 */
export async function revokeSignoutSessions(
  backend: AuthBackendPort,
  principal: Principal,
  selection: SignoutSelection,
): Promise<SignoutRevocation> {
  const sessionId = selection.sessionId ?? credentialSessionId(principal);
  if (sessionId !== undefined) {
    await requireOwnedSession(backend, principal, sessionId);
  }
  if (selection.everywhere) {
    return {
      sessionId,
      revoked: await backend.sessions.revokeSubjectSessions(principal.subject),
    };
  }
  if (sessionId === undefined) {
    throw new AuthServiceHandlerError('UNAUTHORIZED', NO_ACTIVE_SESSION_REASON);
  }
  return { sessionId, revoked: [await backend.sessions.revokeSession(sessionId)] };
}

async function requireOwnedSession(
  backend: AuthBackendPort,
  principal: Principal,
  sessionId: string,
): Promise<void> {
  const found = await backend.sessions.getSession({ sessionId });
  if (found?.id !== sessionId || found.subject !== principal.subject) {
    throw new AuthServiceHandlerError('UNAUTHORIZED', SESSION_NOT_OWNED_REASON);
  }
}

function credentialSessionId(principal: Principal): string | undefined {
  const sessionId = principal.claims.sessionId;
  return typeof sessionId === 'string' && sessionId.length > 0 ? sessionId : undefined;
}
