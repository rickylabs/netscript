import { authContractV1 } from '@netscript/plugin-auth-core/contracts/v1';
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
  mapSession,
  mapUserFromSession,
  providerFailure,
  responseLocation,
  toAuthnRequest,
  toRequest,
  unsupportedOperation,
} from './v1-helpers.ts';
import { type AuthServiceContext, AuthServiceHandlerError } from './v1-types.ts';
import type { InteractiveAuthBackend } from './v1-types.ts';
import type { AuthSession } from '@netscript/plugin-auth-core/domain';
import {
  emitOidcCompleted,
  emitSessionRevoked,
  emitSigninFailed,
  emitSigninStarted,
  emitTokenRefreshed,
} from '../../../streams/server.ts';

const router = authContractV1.$context<AuthServiceContext>();

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
  const backend: InteractiveAuthBackend = context.registry.resolveBackend();
  if (!backend.signIn) {
    unsupportedOperation(backend.name, 'signin');
  }

  try {
    const params = new URLSearchParams();
    if (input.providerId) params.set('providerId', input.providerId);
    if (input.loginHint) params.set('loginHint', input.loginHint);
    if (input.state) params.set('state', input.state);
    const response = await backend.signIn(
      toRequest(context.request, '/v1/auth/signin', params),
      { returnTo: input.redirectTo },
    );
    const redirectUrl = responseLocation(response);
    const output = {
      started: true,
      providerId: input.providerId ?? firstProviderId(backend),
      redirectUrl,
      state: redirectUrl ? new URL(redirectUrl).searchParams.get('state') ?? undefined : undefined,
    };
    emitSigninStarted({
      providerId: output.providerId,
      state: output.state,
    });
    return output;
  } catch (error) {
    emitSigninFailed({
      providerId: input.providerId ?? backend.name,
      reason: error instanceof Error ? error.message : undefined,
    });
    throw providerFailure(error, input.providerId ?? backend.name);
  }
}

/** Complete an auth flow against the single active backend. */
export async function callback(
  input: CallbackInput,
  context: AuthServiceContext,
): Promise<CallbackResponse> {
  const backend: InteractiveAuthBackend = context.registry.resolveBackend();
  if (input.error) {
    throw new AuthServiceHandlerError(
      'AUTH_PROVIDER_ERROR',
      input.errorDescription ?? input.error,
      { providerId: input.providerId ?? backend.name },
    );
  }
  if (!backend.handleCallback) {
    unsupportedOperation(backend.name, 'callback');
  }

  try {
    const params = new URLSearchParams();
    if (input.providerId) params.set('providerId', input.providerId);
    if (input.code) params.set('code', input.code);
    if (input.state) params.set('state', input.state);
    const result = await backend.handleCallback(
      toRequest(context.request, '/v1/auth/callback', params),
    );
    const output = {
      completed: true,
      sessionId: result.sessionId,
      redirectTo: input.redirectTo ?? responseLocation(result.response),
      subject: result.principal.subject,
    };
    void emitCallbackSessionCompleted(backend, result.sessionId);
    return output;
  } catch (error) {
    throw providerFailure(error, input.providerId ?? backend.name);
  }
}

/** Revoke the active session where the backend supports direct revocation. */
export async function signout(
  input: SignoutInput,
  context: AuthServiceContext,
): Promise<SignoutResponse> {
  const backend = context.registry.resolveBackend() as InteractiveAuthBackend;
  const sessionId = input.sessionId ?? await backend.getSessionId?.(
    toRequest(context.request, '/v1/auth/signout', new URLSearchParams()),
  );

  try {
    let revokedSession: AuthSession | undefined;
    if (sessionId) {
      revokedSession = await backend.sessions.revokeSession(sessionId);
    } else if (!backend.signOut) {
      throw new AuthServiceHandlerError('UNAUTHORIZED', 'No active auth session was found.');
    }
    if (backend.signOut) {
      await backend.signOut(toRequest(context.request, '/v1/auth/signout', new URLSearchParams()), {
        revoke: !sessionId,
      });
    }
    const output = {
      signedOut: true,
      sessionId,
      redirectTo: input.redirectTo,
    };
    if (revokedSession) {
      emitSessionRevoked(revokedSession);
    }
    return output;
  } catch (error) {
    throw providerFailure(error, backend.name);
  }
}

/** Resolve the current session through the active backend. */
export async function session(
  input: SessionInput | undefined,
  context: AuthServiceContext,
): Promise<SessionResponse> {
  const backend = context.registry.resolveBackend();
  let resolved: AuthSession | undefined;
  try {
    resolved = await backend.sessions.getSession({
      sessionId: input?.sessionId,
      request: toAuthnRequest(context.request, input?.sessionId),
    });
  } catch (error) {
    throw providerFailure(error, backend.name);
  }
  if (!resolved || resolved.state !== 'active') {
    return { authenticated: false };
  }
  const output = {
    authenticated: true,
    session: mapSession(resolved),
  };
  emitObservedRefresh(resolved);
  return output;
}

/** Resolve the current user and session through the active backend. */
export async function me(context: AuthServiceContext): Promise<MeResponse> {
  const backend = context.registry.resolveBackend();
  let authn;
  try {
    authn = await backend.authenticate(toAuthnRequest(context.request));
  } catch (error) {
    throw providerFailure(error, backend.name);
  }
  if (!authn.ok) {
    return { authenticated: false };
  }
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
    throw providerFailure(error, backend.name);
  }
  if (!resolved || resolved.state !== 'active') {
    return { authenticated: false };
  }
  const output = {
    authenticated: true,
    user: mapUserFromSession(resolved),
    session: mapSession(resolved),
  };
  emitObservedRefresh(resolved);
  return output;
}

async function emitCallbackSessionCompleted(
  backend: InteractiveAuthBackend,
  sessionId: string,
): Promise<void> {
  try {
    const authSession = await backend.sessions.getSession({ sessionId });
    if (authSession) {
      emitOidcCompleted(authSession);
    }
  } catch (error) {
    console.warn('[Auth Stream] Callback completion stream emit skipped:', error);
  }
}

function emitObservedRefresh(authSession: AuthSession): void {
  if (authSession.refreshedAt) {
    emitTokenRefreshed(authSession);
  }
}

function firstProviderId(backend: InteractiveAuthBackend): string | undefined {
  const providers = backend.providers.listProviders();
  if (providers instanceof Promise) {
    return undefined;
  }
  return providers[0]?.id;
}
