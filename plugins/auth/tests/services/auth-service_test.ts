import { ORPCError } from '@orpc/contract';
import { assert, assertEquals, assertRejects, assertThrows } from 'jsr:@std/assert@^1';
import {
  ErrorHandlingPlugin,
  type GenericHandlerOptions,
} from '../../../../packages/telemetry/src/orpc/mod.ts';
import {
  AuthBackendNotFoundError,
  type AuthBackendPort,
  createAuthBackendRegistry,
} from '@netscript/plugin-auth-core/ports';
import {
  AuthAttributes,
  AuthOutcome,
  AuthSpanNames,
  createAuthTelemetry,
} from '@netscript/plugin-auth-core/telemetry';
import type {
  Attributes,
  Context,
  Exception,
  Link,
  Span,
  SpanContext,
  SpanOptions,
  SpanStatus,
  TimeInput,
  Tracer,
} from '@netscript/telemetry/tracer';
import { buildAuthSession } from '@netscript/plugin-auth-core/testing';
import type { AuthnRequest, AuthnResult } from '@netscript/service/auth';
import {
  createAuthServiceBackendRegistry,
  createInMemoryKvOAuthRegistry,
  resolveActiveBackendName,
} from '../../services/src/backend-registry.ts';
import { MemoryKvAdapter } from '@netscript/kv';
import { callback, me, session, signin, signout } from '../../services/src/routers/v1-handlers.ts';
import { AuthServiceHandlerError } from '../../services/src/routers/v1-types.ts';
import { authTestUrl } from '../testing/auth-fixtures.ts';

Deno.test('kv-oauth handlers complete signin callback session me signout round-trip', async () => {
  const registry = await createInMemoryKvOAuthRegistry({
    fetch: () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: 'access_test',
            refresh_token: 'refresh_test',
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'profile email',
          }),
          { headers: { 'content-type': 'application/json' } },
        ),
      ),
  });

  const started = await signin({ redirectTo: '/dashboard' }, {
    registry,
    request: {
      url: authTestUrl('/v1/auth/signin'),
      headers: new Headers({ 'x-forwarded-proto': 'https' }),
    },
  });
  assertEquals(started.started, true);
  assert(started.redirectUrl);
  const redirect = new URL(started.redirectUrl!);

  const completed = await callback({
    code: 'code_test',
    state: redirect.searchParams.get('state') ?? undefined,
  }, {
    registry,
    request: {
      url: authTestUrl(`/v1/auth/callback?txn=${redirect.searchParams.get('txn')}`),
      headers: new Headers({ 'x-forwarded-proto': 'https' }),
    },
  });
  assertEquals(completed.completed, true);
  assert(completed.sessionId);
  assertEquals(completed.subject, completed.sessionId);

  const activeSession = await session({ sessionId: completed.sessionId }, { registry });
  assertEquals(activeSession.authenticated, true);
  assertEquals(activeSession.session?.id, completed.sessionId);

  const currentUser = await me({
    registry,
    request: {
      url: authTestUrl('/v1/auth/me'),
      headers: new Headers({ cookie: `__Host-ns_session=${completed.sessionId}` }),
    },
  });
  assertEquals(currentUser.authenticated, true);
  assertEquals(currentUser.session?.id, completed.sessionId);
  assertEquals(currentUser.user?.id, completed.sessionId);

  const signedOut = await signout({ sessionId: completed.sessionId }, {
    registry,
    request: {
      url: authTestUrl('/v1/auth/signout'),
      headers: new Headers({ cookie: `__Host-ns_session=${completed.sessionId}` }),
    },
  });
  assertEquals(signedOut.signedOut, true);
  assertEquals(signedOut.sessionId, completed.sessionId);

  const afterSignout = await session({ sessionId: completed.sessionId }, { registry });
  assertEquals(afterSignout.authenticated, false);
});

Deno.test('auth handlers emit audit-safe telemetry attributes per operation', async () => {
  const tracer = new AuthHandlerRecordingTracer();
  const telemetry = createAuthTelemetry({
    tracer,
    subjectHashSalt: 'deployment_salt',
  });
  const registry = await createInMemoryKvOAuthRegistry({
    fetch: () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: 'access_test',
            refresh_token: 'refresh_test',
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'profile email',
          }),
          { headers: { 'content-type': 'application/json' } },
        ),
      ),
  });
  const baseContext = {
    registry,
    telemetry,
    request: {
      url: authTestUrl('/v1/auth/signin'),
      method: 'GET',
      headers: new Headers({ 'x-forwarded-proto': 'https' }),
    },
  };

  const started = await signin({ redirectTo: '/dashboard' }, baseContext);
  const redirect = new URL(started.redirectUrl!);
  const completed = await callback({
    code: 'code_test',
    state: redirect.searchParams.get('state') ?? undefined,
  }, {
    ...baseContext,
    request: {
      url: authTestUrl(`/v1/auth/callback?txn=${redirect.searchParams.get('txn')}`),
      method: 'GET',
      headers: new Headers({ 'x-forwarded-proto': 'https' }),
    },
  });
  await session({ sessionId: completed.sessionId }, { registry, telemetry });
  await me({
    registry,
    telemetry,
    request: {
      url: authTestUrl('/v1/auth/me'),
      method: 'GET',
      headers: new Headers({ cookie: `__Host-ns_session=${completed.sessionId}` }),
    },
  });
  await signout({ sessionId: completed.sessionId }, {
    registry,
    telemetry,
    request: {
      url: authTestUrl('/v1/auth/signout'),
      method: 'GET',
      headers: new Headers({ cookie: `__Host-ns_session=${completed.sessionId}` }),
    },
  });

  assertEquals(tracer.spans.map((span) => span.name), [
    AuthSpanNames.SIGNIN,
    AuthSpanNames.CALLBACK,
    AuthSpanNames.SESSION,
    AuthSpanNames.ME,
    AuthSpanNames.SIGNOUT,
  ]);
  for (const span of tracer.spans) {
    assertEquals(span.attributes[AuthAttributes.BACKEND], 'kv-oauth');
    assert(span.attributes[AuthAttributes.METHOD]);
    assert(span.attributes[AuthAttributes.OUTCOME]);
  }
  for (const span of tracer.spans.slice(1)) {
    assertEquals(typeof span.attributes[AuthAttributes.SUBJECT_HASH], 'string');
    assert(span.attributes[AuthAttributes.SUBJECT_HASH] !== completed.sessionId);
  }
  assertEquals(tracer.spans[0]?.attributes[AuthAttributes.OUTCOME], AuthOutcome.SUCCESS);
  assertEquals(tracer.spans[3]?.attributes[AuthAttributes.PRINCIPAL_SCOPES_COUNT], 2);

  const serialized = JSON.stringify(tracer.spans);
  assert(!serialized.includes('access_test'));
  assert(!serialized.includes('refresh_test'));
});

Deno.test('backend selection reads NETSCRIPT_AUTH_BACKEND and reports unknown names as backend errors', () => {
  assertEquals(resolveActiveBackendName({ NETSCRIPT_AUTH_BACKEND: 'kv-oauth' }), 'kv-oauth');
  assertEquals(resolveActiveBackendName({ NETSCRIPT_AUTH_BACKEND: 'workos' }), 'workos');
  assertEquals(resolveActiveBackendName({ NETSCRIPT_AUTH_BACKEND: 'better-auth' }), 'better-auth');

  assertThrows(
    () => {
      const registry = createAuthBackendRegistry(
        new Map([['kv-oauth', fakeBackend()]]),
        'kv-oauth',
      );
      registry.resolveBackend('missing');
    },
    AuthBackendNotFoundError,
  );
});

Deno.test('kv-oauth backend registry requires a configured encryption key for real stores', async () => {
  await assertRejects(
    () =>
      createAuthServiceBackendRegistry({
        kv: new MemoryKvAdapter(),
        env: {
          NETSCRIPT_AUTH_BACKEND: 'kv-oauth',
          NETSCRIPT_AUTH_CLIENT_ID: 'client_test',
          NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT: 'https://issuer.example.test/oauth/authorize',
          NETSCRIPT_AUTH_TOKEN_ENDPOINT: 'https://issuer.example.test/oauth/token',
          NETSCRIPT_AUTH_REDIRECT_URI: authTestUrl('/api/v1/auth/callback'),
        },
      }),
    Error,
    'NETSCRIPT_AUTH_KV_OAUTH_KEY',
  );
});

Deno.test('in-memory kv-oauth test registry supplies its deterministic fixture key', async () => {
  const registry = await createInMemoryKvOAuthRegistry();
  assertEquals(registry.resolveBackend().name, 'kv-oauth');
});

Deno.test('unsupported interactive backend operation maps to typed auth service error', async () => {
  const registry = createAuthBackendRegistry(
    new Map([['workos', fakeBackend('workos')]]),
    'workos',
  );
  await assertRejects(
    () => signin({}, { registry }),
    AuthServiceHandlerError,
    'interactive signin',
  );
});

Deno.test('signin routes through the typed interactive backend sub-port', async () => {
  let signInCalls = 0;
  const backend: AuthBackendPort = {
    ...fakeBackend('kv-oauth'),
    interactive: {
      signIn(): Promise<Response> {
        signInCalls += 1;
        return Promise.resolve(
          Response.redirect('https://issuer.example.test/authorize?state=state_test'),
        );
      },
      handleCallback(): Promise<{
        readonly response: Response;
        readonly sessionId: string;
        readonly principal: { readonly subject: string };
      }> {
        return Promise.resolve({
          response: Response.redirect('https://app.example.test/dashboard'),
          sessionId: 'sess_test',
          principal: { subject: 'user_test' },
        });
      },
      getSessionId: () => Promise.resolve(undefined),
      signOut(): Promise<Response> {
        return Promise.resolve(new Response(null, { status: 204 }));
      },
    },
  };
  const registry = createAuthBackendRegistry(new Map([['kv-oauth', backend]]), 'kv-oauth');

  const started = await signin({}, {
    registry,
    request: { url: authTestUrl('/v1/auth/signin') },
  });

  assertEquals(signInCalls, 1);
  assertEquals(started.redirectUrl, 'https://issuer.example.test/authorize?state=state_test');
  assertEquals(started.state, 'state_test');
});

Deno.test('auth handler errors keep observable central oRPC envelopes', async () => {
  await assertProcedureEnvelope(
    'signin',
    () =>
      signin({}, {
        registry: createAuthBackendRegistry(
          new Map([['workos', fakeBackend('workos')]]),
          'workos',
        ),
      }),
    {
      code: 'AUTH_PROVIDER_ERROR',
      status: 502,
      data: {
        providerId: 'workos',
        reason: 'workos does not expose an interactive signin flow through its AS2 backend port.',
      },
    },
  );
  await assertProcedureEnvelope(
    'callback',
    () =>
      callback({ error: 'access_denied', providerId: 'kv-oauth' }, {
        registry: createAuthBackendRegistry(
          new Map([['kv-oauth', fakeBackend('kv-oauth')]]),
          'kv-oauth',
        ),
      }),
    {
      code: 'AUTH_PROVIDER_ERROR',
      status: 502,
      data: { providerId: 'kv-oauth', reason: 'access_denied' },
    },
  );
  await assertProcedureEnvelope(
    'signout',
    () =>
      signout({}, {
        registry: createAuthBackendRegistry(
          new Map([['kv-oauth', fakeBackend('kv-oauth')]]),
          'kv-oauth',
        ),
      }),
    {
      code: 'UNAUTHORIZED',
      status: 401,
      data: { reason: 'No active auth session was found.' },
    },
  );
  await assertProcedureEnvelope(
    'session',
    () =>
      session(undefined, {
        registry: createAuthBackendRegistry(
          new Map([['kv-oauth', sessionThrowingBackend('kv-oauth')]]),
          'kv-oauth',
        ),
      }),
    {
      code: 'AUTH_PROVIDER_ERROR',
      status: 502,
      data: { providerId: 'kv-oauth', reason: 'session store unavailable' },
    },
  );
  await assertProcedureEnvelope(
    'me',
    () =>
      me({
        registry: createAuthBackendRegistry(
          new Map([['kv-oauth', authenticateThrowingBackend('kv-oauth')]]),
          'kv-oauth',
        ),
      }),
    {
      code: 'AUTH_PROVIDER_ERROR',
      status: 502,
      data: { providerId: 'kv-oauth', reason: 'authenticate unavailable' },
    },
  );
});

async function assertProcedureEnvelope(
  procedure: string,
  run: () => Promise<unknown>,
  expected: {
    readonly code: AuthServiceHandlerError['code'];
    readonly status: AuthServiceHandlerError['status'];
    readonly data: AuthServiceHandlerError['data'];
  },
): Promise<void> {
  const error = await assertRejects(run, AuthServiceHandlerError);
  assertEquals(error.code, expected.code);
  assertEquals(error.status, expected.status);
  assertEquals(error.data, expected.data);

  const handlerOptions: GenericHandlerOptions = {};
  const logs: unknown[] = [];
  new ErrorHandlingPlugin({
    serviceName: 'auth',
    exposeInternalErrors: true,
    logger: {
      error: (context) => logs.push(context),
      warn: (context) => logs.push(context),
    },
  }).init(handlerOptions);
  const interceptor = handlerOptions.clientInterceptors?.[0];
  assert(interceptor);

  const mapped = await assertRejects(
    () =>
      interceptor({
        path: ['v1', 'auth', procedure],
        input: {},
        next: () => {
          throw error;
        },
      }),
    ORPCError,
    error.message,
  );
  assertEquals(mapped.code, expected.code);
  assertEquals(mapped.status, expected.status);
  assertEquals(mapped.data, expected.data);
  assertEquals(logs.length, 1);
}

function fakeBackend(name = 'kv-oauth'): AuthBackendPort {
  const stored = new Map<string, ReturnType<typeof buildAuthSession>>();
  return {
    name,
    providers: {
      listProviders:
        () => [{ id: name, displayName: name, kind: 'custom', capabilities: ['session'] }],
      getProvider: (providerId) =>
        providerId === name
          ? { id: name, displayName: name, kind: 'custom', capabilities: ['session'] }
          : undefined,
    },
    sessions: {
      getSession: ({ sessionId }) => sessionId ? stored.get(sessionId) : undefined,
      createSession: (input) => {
        const authSession = buildAuthSession({
          id: `sess_${stored.size + 1}`,
          userId: input.userId,
          providerId: input.providerId,
          subject: input.subject,
          scopes: input.scopes,
          roles: input.roles,
          claims: input.claims,
          expiresAt: input.expiresAt,
        });
        stored.set(authSession.id, authSession);
        return authSession;
      },
      refreshSession: (sessionId) => stored.get(sessionId) ?? buildAuthSession({ id: sessionId }),
      revokeSession: (sessionId) => {
        const current = stored.get(sessionId) ?? buildAuthSession({ id: sessionId });
        const revokedState: ReturnType<typeof buildAuthSession>['state'] = 'revoked';
        const revoked = {
          ...current,
          state: revokedState,
          revokedAt: new Date().toISOString(),
        };
        stored.set(sessionId, revoked);
        return revoked;
      },
    },
    crypto: {
      sealSessionToken: (authSession) => `sealed:${authSession.id}`,
      openSessionToken: (token) => token.replace(/^sealed:/, ''),
    },
    principalMapper: {
      mapSessionToPrincipal: (authSession) => ({
        session: authSession,
        principal: {
          subject: authSession.subject,
          scopes: authSession.scopes,
          roles: authSession.roles,
          scheme: 'custom',
          claims: { ...authSession.claims, sessionId: authSession.id },
        },
      }),
    },
    authenticate(request: AuthnRequest): AuthnResult {
      const sessionId = request.cookie('__Host-ns_session');
      const current = sessionId ? stored.get(sessionId) : undefined;
      if (!current) {
        return { ok: false, reason: 'missing' };
      }
      return {
        ok: true,
        principal: {
          subject: current.subject,
          scopes: current.scopes,
          roles: current.roles,
          scheme: 'custom',
          claims: { sessionId: current.id },
        },
      };
    },
  };
}

function sessionThrowingBackend(name = 'kv-oauth'): AuthBackendPort {
  const backend = fakeBackend(name);
  return {
    ...backend,
    sessions: {
      ...backend.sessions,
      getSession: () => {
        throw new Error('session store unavailable');
      },
    },
  };
}

function authenticateThrowingBackend(name = 'kv-oauth'): AuthBackendPort {
  const backend = fakeBackend(name);
  return {
    ...backend,
    authenticate: () => {
      throw new Error('authenticate unavailable');
    },
  };
}

class AuthHandlerRecordingTracer implements Tracer {
  readonly spans: AuthHandlerRecordingSpan[] = [];

  startSpan(name: string, options: SpanOptions = {}, _context?: Context): Span {
    const span = new AuthHandlerRecordingSpan(name, options.attributes ?? {});
    this.spans.push(span);
    return span;
  }

  startActiveSpan<T>(name: string, fn: (span: Span) => T): T;
  startActiveSpan<T>(name: string, options: SpanOptions, fn: (span: Span) => T): T;
  startActiveSpan<T>(
    name: string,
    options: SpanOptions,
    context: Context,
    fn: (span: Span) => T,
  ): T;
  startActiveSpan<T>(
    name: string,
    optionsOrFn: SpanOptions | ((span: Span) => T),
    contextOrFn?: Context | ((span: Span) => T),
    fn?: (span: Span) => T,
  ): T {
    if (typeof optionsOrFn === 'function') {
      return optionsOrFn(this.startSpan(name));
    }
    if (typeof contextOrFn === 'function') {
      return contextOrFn(this.startSpan(name, optionsOrFn));
    }
    if (fn) {
      return fn(this.startSpan(name, optionsOrFn, contextOrFn));
    }
    throw new TypeError('startActiveSpan requires a callback.');
  }
}

class AuthHandlerRecordingSpan implements Span {
  readonly attributes: Attributes = {};
  readonly links: Link[] = [];
  status: SpanStatus | undefined;
  ended = false;

  constructor(
    readonly name: string,
    attributes: Attributes,
  ) {
    this.setAttributes(attributes);
  }

  spanContext(): SpanContext {
    return {
      traceId: '11111111111111111111111111111111',
      spanId: '2222222222222222',
      traceFlags: 1,
    };
  }

  setAttribute(key: string, value: Exclude<Attributes[string], undefined>): this {
    this.attributes[key] = value;
    return this;
  }

  setAttributes(attributes: Attributes): this {
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined) {
        this.attributes[key] = value;
      }
    }
    return this;
  }

  addEvent(_name: string, _attributesOrStartTime?: Attributes | TimeInput): this {
    return this;
  }

  addLink(link: Link): this {
    this.links.push(link);
    return this;
  }

  addLinks(links: Link[]): this {
    this.links.push(...links);
    return this;
  }

  setStatus(status: SpanStatus): this {
    this.status = status;
    return this;
  }

  updateName(_name: string): this {
    return this;
  }

  isRecording(): boolean {
    return true;
  }

  recordException(_exception: Exception, _time?: TimeInput): void {}

  end(_endTime?: TimeInput): void {
    this.ended = true;
  }
}
