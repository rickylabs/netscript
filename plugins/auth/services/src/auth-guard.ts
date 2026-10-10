/**
 * Guarded service posture for the auth service.
 *
 * The auth service cannot call the remote session authenticator on itself, so its guard
 * authenticates in-process against the active backend. Only the session-ending procedures are
 * guarded; signin, callback, session and me stay public introspection.
 *
 * @module
 */

import { readBearerCredential } from '@netscript/plugin-auth-core/authenticator';
import type {
  AuthenticatorPort,
  AuthnRequest,
  AuthnResult,
  ResolvedAuthBackendRegistry,
} from '@netscript/plugin-auth-core/ports';
import type { ServiceGuardedAuthPolicy } from '@netscript/service/auth';

/**
 * Every mounted path of the guarded procedures: the OpenAPI route, the namespaced RPC route, and
 * the flat `/api/rpc/v1/<procedure>` compatibility route `createPluginService` still serves.
 */
export const AUTH_GUARDED_PATHS: readonly string[] = Object.freeze([
  '/api/v1/auth/signout',
  '/api/rpc/v1/auth/signout',
  '/api/rpc/v1/signout',
  '/api/v1/auth/sessions/revoke',
  '/api/rpc/v1/auth/revokeSession',
  '/api/rpc/v1/revokeSession',
]);

const SESSION_NOT_ACTIVE = 'auth_session_not_active';

/**
 * Authenticates a request against the active backend without a network hop.
 *
 * A bearer credential is resolved through the backend session store, exactly as the `session`
 * procedure verifies it for remote services; without one, the backend's own cookie authentication
 * applies.
 */
export function createInProcessAuthenticator(
  registry: ResolvedAuthBackendRegistry,
): AuthenticatorPort {
  return {
    async authenticate(request: AuthnRequest): Promise<AuthnResult> {
      const backend = registry.resolveBackend();
      const token = readBearerCredential(request);
      if (token === undefined) {
        return await backend.authenticate(request);
      }
      const session = await backend.sessions.getSession({ token, request });
      if (
        !session || session.state !== 'active' || Date.parse(session.expiresAt) <= Date.now()
      ) {
        return { ok: false, reason: SESSION_NOT_ACTIVE };
      }
      return {
        ok: true,
        principal: backend.principalMapper.mapSessionToPrincipal(session).principal,
      };
    },
  };
}

/** Guarded auth posture protecting only {@link AUTH_GUARDED_PATHS}. */
export function createAuthServiceGuard(
  registry: ResolvedAuthBackendRegistry,
): ServiceGuardedAuthPolicy {
  return {
    authn: {
      authenticator: createInProcessAuthenticator(registry),
      protect: AUTH_GUARDED_PATHS,
    },
  };
}
