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
import { implement } from '@orpc/server';

type AuthRouteOptions<TInput> = Readonly<{
  input: TInput;
  errors: Record<string, (input: unknown) => Error>;
  context: AuthServiceContext;
}>;
type AuthRouteHandler<TInput> = Readonly<{
  handler<TOutput>(handler: (options: AuthRouteOptions<TInput>) => TOutput): TOutput;
}>;
type AuthImplementedContract = Readonly<{
  $context<TContext>(): {
    signin: AuthRouteHandler<SigninInput>;
    callback: AuthRouteHandler<CallbackInput>;
    signout: AuthRouteHandler<SignoutInput>;
    session: AuthRouteHandler<SessionInput | undefined>;
    me: AuthRouteHandler<undefined>;
  };
}>;

const implementedContract = implement(
  authContractV1 as unknown as Parameters<typeof implement>[0],
) as unknown as AuthImplementedContract;
const router = implementedContract.$context<AuthServiceContext>();

/** V1 auth contract handlers. */
export const authV1: Record<string, unknown> = {
  signin: router.signin.handler(async ({ input, context, errors }) => {
    try {
      return await signin(input, context);
    } catch (error) {
      throwContractError(error, errors);
    }
  }),
  callback: router.callback.handler(async ({ input, context, errors }) => {
    try {
      return await callback(input, context);
    } catch (error) {
      throwContractError(error, errors);
    }
  }),
  signout: router.signout.handler(async ({ input, context, errors }) => {
    try {
      return await signout(input, context);
    } catch (error) {
      throwContractError(error, errors);
    }
  }),
  session: router.session.handler(async ({ input, context, errors }) => {
    try {
      return await session(input, context);
    } catch (error) {
      throwContractError(error, errors);
    }
  }),
  me: router.me.handler(async ({ context, errors }) => {
    try {
      return await me(context);
    } catch (error) {
      throwContractError(error, errors);
    }
  }),
};

/** Start an auth flow against the single active backend. */
export async function signin(
  input: SigninInput,
  context: AuthServiceContext,
): Promise<SigninResponse> {
  const backend = context.registry.resolveBackend() as InteractiveAuthBackend;
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
    return {
      started: true,
      providerId: input.providerId ?? firstProviderId(backend),
      redirectUrl,
      state: redirectUrl ? new URL(redirectUrl).searchParams.get('state') ?? undefined : undefined,
    };
  } catch (error) {
    throw providerFailure(error, input.providerId ?? backend.name);
  }
}

/** Complete an auth flow against the single active backend. */
export async function callback(
  input: CallbackInput,
  context: AuthServiceContext,
): Promise<CallbackResponse> {
  const backend = context.registry.resolveBackend() as InteractiveAuthBackend;
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
    return {
      completed: true,
      sessionId: result.sessionId,
      redirectTo: input.redirectTo ?? responseLocation(result.response),
      subject: result.principal.subject,
    };
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
    if (sessionId) {
      await backend.sessions.revokeSession(sessionId);
    } else if (!backend.signOut) {
      throw new AuthServiceHandlerError('UNAUTHORIZED', 'No active auth session was found.');
    }
    if (backend.signOut) {
      await backend.signOut(toRequest(context.request, '/v1/auth/signout', new URLSearchParams()), {
        revoke: !sessionId,
      });
    }
    return {
      signedOut: true,
      sessionId,
      redirectTo: input.redirectTo,
    };
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
  const resolved = await backend.sessions.getSession({
    sessionId: input?.sessionId,
    request: toAuthnRequest(context.request, input?.sessionId),
  });
  if (!resolved || resolved.state !== 'active') {
    return { authenticated: false };
  }
  return {
    authenticated: true,
    session: mapSession(resolved),
  };
}

/** Resolve the current user and session through the active backend. */
export async function me(context: AuthServiceContext): Promise<MeResponse> {
  const backend = context.registry.resolveBackend();
  const authn = await backend.authenticate(toAuthnRequest(context.request));
  if (!authn.ok) {
    return { authenticated: false };
  }
  const sessionId = typeof authn.principal.claims.sessionId === 'string'
    ? authn.principal.claims.sessionId
    : undefined;
  const resolved = await backend.sessions.getSession({
    sessionId,
    request: toAuthnRequest(context.request, sessionId),
  });
  if (!resolved || resolved.state !== 'active') {
    return { authenticated: false };
  }
  return {
    authenticated: true,
    user: mapUserFromSession(resolved),
    session: mapSession(resolved),
  };
}

function firstProviderId(backend: InteractiveAuthBackend): string | undefined {
  const providers = backend.providers.listProviders();
  if (providers instanceof Promise) {
    return undefined;
  }
  return providers[0]?.id;
}

function throwContractError(
  error: unknown,
  errors: Record<string, (input: unknown) => Error>,
): never {
  const normalized = providerFailure(error);
  if (normalized.code === 'UNAUTHORIZED') {
    throw errors.UNAUTHORIZED({
      message: normalized.message,
      data: { reason: normalized.message },
    });
  }
  if (normalized.code === 'VALIDATION_ERROR') {
    throw errors.VALIDATION_ERROR({
      message: normalized.message,
      data: {
        formErrors: [...(normalized.formErrors ?? [normalized.message])],
        fieldErrors: normalized.fieldErrors ?? {},
      },
    });
  }
  throw errors.AUTH_PROVIDER_ERROR({
    message: normalized.message,
    data: {
      providerId: normalized.providerId,
      reason: normalized.message,
    },
  });
}
