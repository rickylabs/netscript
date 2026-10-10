import { readBearerCredential } from '@netscript/plugin-auth-core/authenticator';
import { KvOAuthError } from '@netscript/auth-kv-oauth';
import { captureAuthResponseCookies } from '../request-context.ts';
import type { PluginCapabilities } from '@netscript/plugin/contract-base';
import type {
  CallbackInput,
  CallbackResponse,
  MeResponse,
  RevokeSessionInput,
  RevokeSessionResponse,
  SessionInput,
  SessionResponse,
  SigninInput,
  SigninResponse,
  SignoutInput,
  SignoutResponse,
} from '@netscript/plugin-auth-core/contracts/v1';
import {
  AuthErrorCode,
  authErrorCodeForReason,
  type AuthOperationRecorder,
  AuthOutcome,
  authOutcomeForReason,
} from '@netscript/plugin-auth-core/telemetry';
import {
  mapSession,
  mapUserFromSession,
  providerFailure,
  responseLocation,
  toAuthnRequest,
  toRequest,
  unsupportedOperation,
} from './v1-helpers.ts';
import { type AuthServiceContext, AuthServiceHandlerError } from './v1-types.ts';
import {
  endInteractiveSession,
  recordRevokedSessions,
  requireAuditedPrincipal,
  requireRevokeScope,
  revokeSignoutSessions,
} from './v1-session-ownership.ts';
import { recordAuthFailure, traceAuth } from './v1-telemetry.ts';
import { type AuthHandlers, router } from './router-context.ts';
import type { AuthSession } from '@netscript/plugin-auth-core/domain';
import type { AuthBackendPort, InteractiveFlowPort } from '@netscript/plugin-auth-core/ports';
import {
  emitOidcCompleted,
  emitSigninFailed,
  emitSigninStarted,
  emitTokenRefreshed,
} from '../../../streams/server.ts';

/**
 * Capabilities document advertised by the running auth service.
 *
 * Grounded in auth ground truth: the published plugin package name, the served
 * contract versions, the v1 contract route groups, and the plugin's advertised
 * capability tags.
 */
const authCapabilities: PluginCapabilities = {
  pluginName: '@netscript/plugin-auth',
  contractVersions: ['v1'],
  routeGroups: ['signin', 'callback', 'signout', 'revokeSession', 'session', 'me'],
  capabilities: [
    'interactive-signin',
    'oidc-callback',
    'session-management',
    'principal-introspection',
    'multi-backend',
  ],
};

/** Every v1 route key the auth contract exposes (incl. the base `describe`). */
type AuthV1RouteKey =
  | 'describe'
  | 'signin'
  | 'callback'
  | 'signout'
  | 'revokeSession'
  | 'session'
  | 'me';

/** V1 auth contract handlers, contract-bound and precisely typed per route. */
export const authV1: AuthHandlers<AuthV1RouteKey> = {
  /** Mandatory base seam `describe` route. */
  describe: router.describe.handler(() => authCapabilities),
  signin: router.signin.handler(async ({ input, context }) => await signin(input, context)),
  callback: router.callback.handler(async ({ input, context }) => await callback(input, context)),
  signout: router.signout.handler(async ({ input, context }) => await signout(input, context)),
  revokeSession: router.revokeSession.handler(async ({ input, context }) =>
    await revokeSession(input, context)
  ),
  session: router.session.handler(async ({ input, context }) => await session(input, context)),
  me: router.me.handler(async ({ context }) => await me(context)),
};

/** Start an auth flow against the single active backend. */
export async function signin(
  input: SigninInput,
  context: AuthServiceContext,
): Promise<SigninResponse> {
  const backend = context.registry.resolveBackend();
  return await traceAuth(context, 'signin', backend, input.providerId, undefined, async (audit) => {
    const interactive = requireInteractive(backend, 'signin');
    try {
      const params = new URLSearchParams();
      if (input.providerId) params.set('providerId', input.providerId);
      if (input.loginHint) params.set('loginHint', input.loginHint);
      if (input.state) params.set('state', input.state);
      const response = await interactive.signIn(
        toRequest(context.request, '/v1/auth/signin', params),
        { returnTo: input.redirectTo },
      );
      const redirectUrl = responseLocation(response);
      const output = {
        started: true,
        providerId: input.providerId ?? firstProviderId(backend),
        redirectUrl,
        state: redirectUrl
          ? new URL(redirectUrl).searchParams.get('state') ?? undefined
          : undefined,
      };
      await audit.setOutcome({ outcome: AuthOutcome.SUCCESS });
      emitSigninStarted({
        providerId: output.providerId,
        state: output.state,
      }, {
        traceContext: audit.traceContext(),
      });
      captureAuthResponseCookies(response);
      return output;
    } catch (error) {
      const authError = providerFailure(error, input.providerId ?? backend.name);
      await recordAuthFailure(audit, authError.message);
      emitSigninFailed({
        providerId: input.providerId ?? backend.name,
        reason: authError.message,
      }, {
        traceContext: audit.traceContext(),
      });
      throw authError;
    }
  });
}

/** Complete an auth flow against the single active backend. */
export async function callback(
  input: CallbackInput,
  context: AuthServiceContext,
): Promise<CallbackResponse> {
  const backend = context.registry.resolveBackend();
  return await traceAuth(
    context,
    'callback',
    backend,
    input.providerId,
    undefined,
    async (audit) => {
      if (input.error) {
        const reason = input.errorDescription ?? input.error;
        await audit.setOutcome({
          outcome: AuthOutcome.FAILED_CALLBACK_INVALID,
          errorCode: AuthErrorCode.CALLBACK_INVALID,
        });
        throw new AuthServiceHandlerError(
          'AUTH_PROVIDER_ERROR',
          reason,
          { providerId: input.providerId ?? backend.name },
        );
      }
      const interactive = requireInteractive(backend, 'callback');

      try {
        const params = new URLSearchParams();
        if (input.providerId) params.set('providerId', input.providerId);
        if (input.code) params.set('code', input.code);
        if (input.state) params.set('state', input.state);
        if (input.txn) params.set('txn', input.txn);
        const result = await interactive.handleCallback(
          toRequest(context.request, '/v1/auth/callback', params),
        );
        const output = {
          completed: true,
          sessionId: result.sessionId,
          redirectTo: input.redirectTo ?? responseLocation(result.response),
          subject: result.principal.subject,
        };
        await audit.setOutcome({
          outcome: AuthOutcome.SUCCESS,
          subject: result.principal.subject,
          sessionId: result.sessionId,
        });
        await audit.recordSessionIssued(result.sessionId, result.principal.subject);
        void emitCallbackSessionCompleted(backend, result.sessionId, audit.traceContext());
        captureAuthResponseCookies(result.response);
        return output;
      } catch (error) {
        const authError = providerFailure(error, input.providerId ?? backend.name);
        await recordAuthFailure(audit, authError.message);
        throw authError;
      }
    },
  );
}

/**
 * Sign the authenticated principal out of its own session, or of every session with `everywhere`.
 *
 * A refused call revokes nothing and records no `session.revoked` audit event.
 */
export async function signout(
  input: SignoutInput,
  context: AuthServiceContext,
): Promise<SignoutResponse> {
  const backend = context.registry.resolveBackend();
  return await traceAuth(context, 'signout', backend, undefined, input.sessionId, async (audit) => {
    const principal = await requireAuditedPrincipal(context, audit);
    try {
      const revocation = await revokeSignoutSessions(
        backend,
        principal,
        input,
        context.request
          ? toAuthnRequest(context.request, undefined, context.cookieName)
          : undefined,
      );
      const { sessionId } = revocation;
      const signOutResponse = await endInteractiveSession(backend, context, revocation, principal);
      await audit.setOutcome({
        outcome: AuthOutcome.SUCCESS,
        sessionId,
        subject: principal.subject,
      });
      await recordRevokedSessions(audit, revocation, principal.subject);
      if (signOutResponse) captureAuthResponseCookies(signOutResponse);
      return { signedOut: true, sessionId, redirectTo: input.redirectTo };
    } catch (error) {
      const authError = providerFailure(error, backend.name);
      await recordAuthFailure(audit, authError.message);
      throw authError;
    }
  });
}

/** Revoke any session on behalf of an operator holding the session-revocation scope. */
export async function revokeSession(
  input: RevokeSessionInput,
  context: AuthServiceContext,
): Promise<RevokeSessionResponse> {
  const backend = context.registry.resolveBackend();
  return await traceAuth(
    context,
    'revokeSession',
    backend,
    undefined,
    input.sessionId,
    async (audit) => {
      const principal = await requireAuditedPrincipal(context, audit);
      try {
        requireRevokeScope(principal);
      } catch (error) {
        await audit.setOutcome({
          outcome: AuthOutcome.FAILED_FORBIDDEN,
          errorCode: AuthErrorCode.FORBIDDEN,
          subject: principal.subject,
        });
        throw error;
      }
      try {
        const revoked = await backend.sessions.revokeSession(input.sessionId);
        await audit.setOutcome({
          outcome: AuthOutcome.SUCCESS,
          sessionId: revoked.id,
          subject: principal.subject,
        });
        await recordRevokedSessions(audit, { revoked: [revoked] });
        return { revoked: true, sessionId: revoked.id };
      } catch (error) {
        if (error instanceof KvOAuthError && error.code === 'session_not_found') {
          await audit.setOutcome({ outcome: AuthOutcome.SUCCESS, sessionId: input.sessionId });
          return { revoked: false, sessionId: input.sessionId };
        }
        const authError = providerFailure(error, backend.name);
        await recordAuthFailure(audit, authError.message);
        throw authError;
      }
    },
  );
}

/** Resolve the current session through the active backend. */
export async function session(
  input: SessionInput | undefined,
  context: AuthServiceContext,
): Promise<SessionResponse> {
  const backend = context.registry.resolveBackend();
  return await traceAuth(
    context,
    'session',
    backend,
    undefined,
    input?.sessionId,
    async (audit) => {
      let resolved: AuthSession | undefined;
      try {
        resolved = await lookupSession(
          backend,
          context.request,
          input?.sessionId,
          context.cookieName,
        );
      } catch (error) {
        const authError = providerFailure(error, backend.name);
        await recordAuthFailure(audit, authError.message);
        throw authError;
      }
      if (!resolved || resolved.state !== 'active') {
        await audit.setOutcome({
          outcome: resolved ? AuthOutcome.FAILED_SESSION_EXPIRED : AuthOutcome.UNAUTHENTICATED,
          errorCode: resolved ? AuthErrorCode.SESSION_EXPIRED : undefined,
          sessionId: input?.sessionId,
          subject: resolved?.subject,
        });
        return { authenticated: false };
      }
      const output = {
        authenticated: true,
        session: mapSession(resolved),
      };
      await audit.setOutcome({
        outcome: AuthOutcome.SUCCESS,
        subject: resolved.subject,
        sessionId: resolved.id,
        scopesCount: resolved.scopes.length,
        rolesCount: resolved.roles.length,
      });
      emitObservedRefresh(resolved, audit.traceContext());
      return output;
    },
  );
}

/** Resolve the current user and session through the active backend. */
export async function me(context: AuthServiceContext): Promise<MeResponse> {
  const backend = context.registry.resolveBackend();
  return await traceAuth(context, 'me', backend, undefined, undefined, async (audit) => {
    let authn;
    try {
      authn = await backend.authenticate(toAuthnRequest(context.request));
    } catch (error) {
      const authError = providerFailure(error, backend.name);
      await recordAuthFailure(audit, authError.message);
      throw authError;
    }
    if (!authn.ok) {
      await audit.setOutcome({
        outcome: authOutcomeForReason(authn.reason),
        errorCode: authErrorCodeForReason(authn.reason),
      });
      return { authenticated: false };
    }
    await audit.recordPrincipal(authn.principal);
    const sessionId = typeof authn.principal.claims.sessionId === 'string'
      ? authn.principal.claims.sessionId
      : undefined;
    let resolved: AuthSession | undefined;
    try {
      resolved = await lookupSession(backend, context.request, sessionId, context.cookieName);
    } catch (error) {
      const authError = providerFailure(error, backend.name);
      await recordAuthFailure(audit, authError.message);
      throw authError;
    }
    if (!resolved || resolved.state !== 'active') {
      await audit.setOutcome({
        outcome: resolved ? AuthOutcome.FAILED_SESSION_EXPIRED : AuthOutcome.UNAUTHENTICATED,
        errorCode: resolved ? AuthErrorCode.SESSION_EXPIRED : undefined,
        sessionId,
        subject: resolved?.subject ?? authn.principal.subject,
      });
      return { authenticated: false };
    }
    const output = {
      authenticated: true,
      user: mapUserFromSession(resolved),
      session: mapSession(resolved),
    };
    await audit.setOutcome({
      outcome: AuthOutcome.SUCCESS,
      subject: resolved.subject,
      sessionId: resolved.id,
      scopesCount: resolved.scopes.length,
      rolesCount: resolved.roles.length,
    });
    emitObservedRefresh(resolved, audit.traceContext());
    return output;
  });
}

/**
 * Look a session up from the request credential, as every credential-reading operation must.
 *
 * `session` and `me` share this one lookup so a bearer credential, the session cookie, and an
 * explicit session id resolve identically for browsers and service identities.
 */
async function lookupSession(
  backend: AuthBackendPort,
  serviceRequest: AuthServiceContext['request'],
  sessionId: string | undefined,
  cookieName: AuthServiceContext['cookieName'],
): Promise<AuthSession | undefined> {
  const request = toAuthnRequest(serviceRequest, sessionId, cookieName);
  return await backend.sessions.getSession({
    sessionId,
    token: readBearerCredential(request),
    request,
  });
}

async function emitCallbackSessionCompleted(
  backend: AuthBackendPort,
  sessionId: string,
  traceContext: ReturnType<AuthOperationRecorder['traceContext']>,
): Promise<void> {
  try {
    const authSession = await backend.sessions.getSession({ sessionId });
    if (authSession) {
      emitOidcCompleted(authSession, { traceContext });
    }
  } catch (error) {
    console.warn('[Auth Stream] Callback completion stream emit skipped:', error);
  }
}

function requireInteractive(backend: AuthBackendPort, operation: string): InteractiveFlowPort {
  if (!backend.interactive) {
    unsupportedOperation(backend.name, operation);
  }
  return backend.interactive;
}

function emitObservedRefresh(
  authSession: AuthSession,
  traceContext: ReturnType<AuthOperationRecorder['traceContext']>,
): void {
  if (authSession.refreshedAt) {
    emitTokenRefreshed(authSession, { traceContext });
  }
}

function firstProviderId(backend: AuthBackendPort): string | undefined {
  const providers = backend.providers.listProviders();
  if (providers instanceof Promise) {
    return undefined;
  }
  return providers[0]?.id;
}
