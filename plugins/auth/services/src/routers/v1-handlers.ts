import { readBearerCredential } from '@netscript/plugin-auth-core/authenticator';
import { getParentContextFromHeaders } from '@netscript/telemetry/context';
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
  type AuthOperationInput,
  type AuthOperationRecorder,
  AuthOutcome,
  authOutcomeForReason,
  type AuthTelemetryOperation,
  createAuthTelemetry,
} from '@netscript/plugin-auth-core/telemetry';
import type { Context } from '@netscript/telemetry/context';
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
  requirePrincipal,
  requireRevokeScope,
  revokeSignoutSessions,
} from './v1-session-ownership.ts';
import { type AuthHandlers, router } from './router-context.ts';
import type { AuthSession, Principal } from '@netscript/plugin-auth-core/domain';
import type { AuthBackendPort, InteractiveFlowPort } from '@netscript/plugin-auth-core/ports';
import {
  emitOidcCompleted,
  emitSessionRevoked,
  emitSigninFailed,
  emitSigninStarted,
  emitTokenRefreshed,
} from '../../../streams/server.ts';

const FALLBACK_AUTH_TELEMETRY = createAuthTelemetry({ enabled: false });

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
      const { sessionId, revoked } = await revokeSignoutSessions(backend, principal, input);
      await endInteractiveSession(backend, context, revoked);
      await audit.setOutcome({
        outcome: AuthOutcome.SUCCESS,
        sessionId,
        subject: principal.subject,
      });
      await recordRevokedSessions(audit, revoked);
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
        const existing = await backend.sessions.getSession({ sessionId: input.sessionId });
        if (existing?.id !== input.sessionId) {
          await audit.setOutcome({ outcome: AuthOutcome.SUCCESS, sessionId: input.sessionId });
          return { revoked: false, sessionId: input.sessionId };
        }
        const revoked = await backend.sessions.revokeSession(input.sessionId);
        await audit.setOutcome({
          outcome: AuthOutcome.SUCCESS,
          sessionId: revoked.id,
          subject: principal.subject,
        });
        await recordRevokedSessions(audit, [revoked]);
        return { revoked: true, sessionId: revoked.id };
      } catch (error) {
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
        const request = toAuthnRequest(context.request, input?.sessionId);
        resolved = await backend.sessions.getSession({
          sessionId: input?.sessionId,
          token: readBearerCredential(request),
          request,
        });
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
      resolved = await backend.sessions.getSession({
        sessionId,
        request: toAuthnRequest(context.request, sessionId),
      });
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

async function requireAuditedPrincipal(
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

async function recordRevokedSessions(
  audit: AuthOperationRecorder,
  revoked: readonly AuthSession[],
): Promise<void> {
  for (const revokedSession of revoked) {
    await audit.recordSessionRevoked(revokedSession.id, revokedSession.subject);
    emitSessionRevoked(revokedSession, { traceContext: audit.traceContext() });
  }
}

/** Clears backend cookie state only when the request's own cookie session was just revoked. */
async function endInteractiveSession(
  backend: AuthBackendPort,
  context: AuthServiceContext,
  revoked: readonly AuthSession[],
): Promise<void> {
  if (!backend.interactive || !context.request) return;
  const request = toRequest(context.request, '/v1/auth/signout', new URLSearchParams());
  const cookieSessionId = await backend.interactive.getSessionId(request);
  if (cookieSessionId && revoked.some((session) => session.id === cookieSessionId)) {
    await backend.interactive.signOut(request, { revoke: false });
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

async function traceAuth<T>(
  context: AuthServiceContext,
  operation: AuthTelemetryOperation,
  backend: AuthBackendPort,
  providerId: string | undefined,
  sessionId: string | undefined,
  run: (audit: AuthOperationRecorder) => Promise<T>,
): Promise<T> {
  const telemetry = context.telemetry ?? FALLBACK_AUTH_TELEMETRY;
  const input: AuthOperationInput = {
    operation,
    backend: backend.name,
    method: context.request?.method ?? 'RPC',
    providerId,
    sessionId,
    parentContext: parentContextFromTraceHeaders(context.traceHeaders),
  };
  return await telemetry.traceOperation(input, run);
}

function parentContextFromTraceHeaders(
  traceHeaders: AuthServiceContext['traceHeaders'],
): Context | undefined {
  const traceparent = traceHeaders?.traceparent;
  const tracestate = traceHeaders?.tracestate;
  if (!traceparent && !tracestate) {
    return undefined;
  }
  const headers: Record<string, string> = {};
  if (traceparent) headers.traceparent = traceparent;
  if (tracestate) headers.tracestate = tracestate;
  return getParentContextFromHeaders(headers);
}

async function recordAuthFailure(
  audit: AuthOperationRecorder,
  reason: string,
): Promise<void> {
  await audit.setOutcome({
    outcome: authOutcomeForReason(reason),
    errorCode: authErrorCodeForReason(reason),
  });
}

function firstProviderId(backend: AuthBackendPort): string | undefined {
  const providers = backend.providers.listProviders();
  if (providers instanceof Promise) {
    return undefined;
  }
  return providers[0]?.id;
}
