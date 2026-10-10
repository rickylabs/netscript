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
import type { AuthnRequest, AuthSession, Principal } from '@netscript/plugin-auth-core/domain';
import type { AuthBackendPort } from '@netscript/plugin-auth-core/ports';
import { type AuthOperationRecorder, AuthOutcome } from '@netscript/plugin-auth-core/telemetry';
import { emitSessionRevoked } from '../../../streams/server.ts';
import { toRequest } from './v1-helpers.ts';
import { type AuthServiceContext, AuthServiceHandlerError } from './v1-types.ts';

/** Refusal shared by unknown and foreign session ids; the wording must never tell them apart. */
export const SESSION_NOT_OWNED_REASON =
  'No session of the authenticated principal matches the requested session.';

const AUTHENTICATION_REQUIRED_REASON = 'Authentication required.';
const NO_ACTIVE_SESSION_REASON = 'No active auth session was found.';

/** Outcome of a signout: the id it reports back and what it revoked. */
export type SignoutRevocation = Readonly<{
  sessionId?: string;
  /** Sessions known to this request that are now revoked (audited and streamed one by one). */
  revoked: readonly AuthSession[];
  /** Set by `everywhere`: every session of the subject issued up to this instant is revoked. */
  subjectRevokedAt?: string;
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

/** Returns the guard-authenticated principal and records it, or audits the refusal. */
export async function requireAuditedPrincipal(
  context: AuthServiceContext,
  audit: AuthOperationRecorder,
): Promise<Principal> {
  try {
    const principal = requirePrincipal(context);
    await audit.recordPrincipal(principal);
    return principal;
  } catch (error) {
    await audit.setOutcome({ outcome: AuthOutcome.UNAUTHENTICATED });
    throw error;
  }
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
 * the presented credential. With `everywhere`, the backend revokes the whole subject in one bounded
 * operation through the caller's own `request` credential. A caller-supplied id is checked for
 * ownership before any write, so a refused call leaves every session untouched.
 */
export async function revokeSignoutSessions(
  backend: AuthBackendPort,
  principal: Principal,
  selection: SignoutSelection,
  request?: AuthnRequest,
): Promise<SignoutRevocation> {
  const selected = selection.sessionId === undefined
    ? undefined
    : await requireOwnedSession(backend, principal, selection.sessionId);
  const sessionId = selection.sessionId ?? credentialSessionId(principal);
  if (selection.everywhere) {
    // Resolve the caller's session before the subject is revoked, for its audit and stream event;
    // a backend that cannot look sessions up by id simply contributes none.
    const current = selected ?? await ownSessionOrUndefined(backend, principal, sessionId);
    const { revokedAt } = await backend.sessions.revokeSubjectSessions({
      subject: principal.subject,
      request,
    });
    return {
      sessionId,
      revoked: current ? [{ ...current, state: 'revoked', revokedAt }] : [],
      subjectRevokedAt: revokedAt,
    };
  }
  if (sessionId === undefined) {
    throw new AuthServiceHandlerError('UNAUTHORIZED', NO_ACTIVE_SESSION_REASON);
  }
  const owned = selected ?? await requireOwnedSession(backend, principal, sessionId);
  return { sessionId, revoked: [await backend.sessions.revokeSession(owned.id)] };
}

async function requireOwnedSession(
  backend: AuthBackendPort,
  principal: Principal,
  sessionId: string,
): Promise<AuthSession> {
  const found = await ownSessionOrUndefined(backend, principal, sessionId);
  if (!found) {
    throw new AuthServiceHandlerError('UNAUTHORIZED', SESSION_NOT_OWNED_REASON);
  }
  return found;
}

async function ownSessionOrUndefined(
  backend: AuthBackendPort,
  principal: Principal,
  sessionId: string | undefined,
): Promise<AuthSession | undefined> {
  if (sessionId === undefined) return undefined;
  const found = await backend.sessions.getSession({ sessionId });
  return found?.id === sessionId && found.subject === principal.subject ? found : undefined;
}

function credentialSessionId(principal: Principal): string | undefined {
  const sessionId = principal.claims.sessionId;
  return typeof sessionId === 'string' && sessionId.length > 0 ? sessionId : undefined;
}

/**
 * Records the audit event and the durable `session.revoked` stream event for each revocation.
 *
 * A subject-wide revocation that resolved no individual session still records one audit event for
 * the subject, so global logout is never silent.
 */
export async function recordRevokedSessions(
  audit: AuthOperationRecorder,
  revocation: Pick<SignoutRevocation, 'revoked' | 'sessionId' | 'subjectRevokedAt'>,
  subject?: string,
): Promise<void> {
  for (const revokedSession of revocation.revoked) {
    await audit.recordSessionRevoked(revokedSession.id, revokedSession.subject);
    emitSessionRevoked(revokedSession, { traceContext: audit.traceContext() });
  }
  if (revocation.subjectRevokedAt !== undefined && revocation.revoked.length === 0) {
    await audit.recordSessionRevoked(revocation.sessionId, subject);
  }
}

/**
 * Clears backend cookie state only when the request's own cookie session was just revoked.
 * Subject-wide revocation also covers an owned cookie session issued by the revocation instant,
 * even when an explicit sibling selector supplied the individual audit/stream session.
 *
 * Returns the backend sign-out response, whose cookie-clearing `Set-Cookie` headers the handler
 * propagates to the caller; `undefined` when no interactive sign-out ran.
 */
export async function endInteractiveSession(
  backend: AuthBackendPort,
  context: AuthServiceContext,
  revocation: SignoutRevocation,
  principal: Principal,
): Promise<Response | undefined> {
  if (!backend.interactive || !context.request) return undefined;
  const request = toRequest(context.request, '/v1/auth/signout', new URLSearchParams());
  const cookieSessionId = await backend.interactive.getSessionId(request);
  if (!cookieSessionId) return undefined;
  if (revocation.revoked.some((session) => session.id === cookieSessionId)) {
    return await backend.interactive.signOut(request, { revoke: false });
  }
  if (revocation.subjectRevokedAt !== undefined) {
    // One lookup, independent of session count. The cookie may belong to another subject when
    // authentication used a bearer credential, or name a session issued after global logout.
    const cookieSession = await ownSessionOrUndefined(backend, principal, cookieSessionId);
    if (
      cookieSession &&
      Date.parse(cookieSession.issuedAt) <= Date.parse(revocation.subjectRevokedAt)
    ) {
      return await backend.interactive.signOut(request, { revoke: false });
    }
  }
  return undefined;
}
