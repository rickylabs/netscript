import { authContractV1 } from '@netscript/plugin-auth-core/contracts/v1';
import { getParentContextFromHeaders } from '@netscript/telemetry/context';
import type {
  CallbackInput,
  CallbackResponse,
  MeResponse,
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
import type { AuthSession } from '@netscript/plugin-auth-core/domain';
import type { AuthBackendPort, InteractiveFlowPort } from '@netscript/plugin-auth-core/ports';
import {
  emitOidcCompleted,
  emitSessionRevoked,
  emitSigninFailed,
  emitSigninStarted,
  emitTokenRefreshed,
} from '../../../streams/server.ts';

const router = authContractV1.$context<AuthServiceContext>();
const FALLBACK_AUTH_TELEMETRY = createAuthTelemetry({ enabled: false });

/** V1 auth contract handlers. */
export const authV1: Record<string, unknown> = {
  signin: router.signin.handler(async ({ input, context }) => await signin(input, context)),
  callback: router.callback.handler(async ({ input, context }) => await callback(input, context)),
  signout: router.signout.handler(async ({ input, context }) => await signout(input, context)),
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

/** Revoke the active session where the backend supports direct revocation. */
export async function signout(
  input: SignoutInput,
  context: AuthServiceContext,
): Promise<SignoutResponse> {
  const backend = context.registry.resolveBackend();
  return await traceAuth(context, 'signout', backend, undefined, input.sessionId, async (audit) => {
    const sessionId = input.sessionId ?? await backend.interactive?.getSessionId(
      toRequest(context.request, '/v1/auth/signout', new URLSearchParams()),
    );

    try {
      let revokedSession: AuthSession | undefined;
      if (sessionId) {
        revokedSession = await backend.sessions.revokeSession(sessionId);
      } else if (!backend.interactive) {
        throw new AuthServiceHandlerError('UNAUTHORIZED', 'No active auth session was found.');
      }
      if (backend.interactive) {
        await backend.interactive.signOut(
          toRequest(context.request, '/v1/auth/signout', new URLSearchParams()),
          {
            revoke: !sessionId,
          },
        );
      }
      const output = {
        signedOut: true,
        sessionId,
        redirectTo: input.redirectTo,
      };
      await audit.setOutcome({
        outcome: AuthOutcome.SUCCESS,
        sessionId,
        subject: revokedSession?.subject,
      });
      await audit.recordSessionRevoked(sessionId, revokedSession?.subject);
      if (revokedSession) {
        emitSessionRevoked(revokedSession, { traceContext: audit.traceContext() });
      }
      return output;
    } catch (error) {
      const authError = providerFailure(error, backend.name);
      await recordAuthFailure(audit, authError.message);
      throw authError;
    }
  });
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
        resolved = await backend.sessions.getSession({
          sessionId: input?.sessionId,
          request: toAuthnRequest(context.request, input?.sessionId),
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
