/**
 * HTTP-boundary proof for #1384: signout acts only for the authenticated principal, on every
 * transport the auth service mounts (OpenAPI REST, namespaced RPC, and the flat RPC compatibility
 * route), and operator revocation is a separate scope-gated procedure.
 *
 * Imports only fixture and backend surfaces, so the file also runs as a negative control against a
 * tree without the ownership change.
 */

import { assert, assertEquals, assertNotEquals } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import {
  AuthAttributes,
  AuthOutcome,
  AuthSpanEvents,
  AuthSpanNames,
  createAuthTelemetry,
} from '@netscript/plugin-auth-core/telemetry';
import type {
  Attributes,
  Exception,
  Link,
  Span,
  SpanContext,
  SpanOptions,
  SpanStatus,
  TimeInput,
  Tracer,
} from '@netscript/telemetry/tracer';
import {
  type AuthTestRegistry,
  createKvOAuthTestRegistry,
  serveAuthTestService,
} from '../testing/auth-service-fixture.ts';

const REVOKE_SCOPE = 'auth:sessions:revoke';

type Transport = Readonly<{
  name: string;
  path: string;
  encode(input: unknown): unknown;
  decode(body: unknown): unknown;
}>;

const rest = (path: string): Transport => ({
  name: `REST ${path}`,
  path,
  encode: (input) => input,
  decode: (body) => body,
});
const rpc = (path: string): Transport => ({
  name: `RPC ${path}`,
  path,
  encode: (input) => ({ json: input }),
  decode: (body) => (body as { json?: unknown }).json,
});

const SIGNOUT_TRANSPORTS: readonly Transport[] = [
  rest('/api/v1/auth/signout'),
  rpc('/api/rpc/v1/auth/signout'),
  rpc('/api/rpc/v1/signout'),
];

const REVOKE_TRANSPORTS: readonly Transport[] = [
  rest('/api/v1/auth/sessions/revoke'),
  rpc('/api/rpc/v1/auth/revokeSession'),
  rpc('/api/rpc/v1/revokeSession'),
];

type Call = Readonly<{ status: number; body: unknown }>;

async function call(
  baseUrl: string,
  transport: Transport,
  input: unknown,
  bearer?: string,
): Promise<Call> {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (bearer) headers.set('authorization', `Bearer ${bearer}`);
  const response = await fetch(`${baseUrl}${transport.path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(transport.encode(input)),
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : undefined;
  return {
    status: response.status,
    body: response.ok ? transport.decode(json) : json,
  };
}

type Harness = Readonly<{
  kv: MemoryKvAdapter;
  registry: AuthTestRegistry;
  baseUrl: string;
  tracer: RecordingTracer;
  create(subject: string, scopes?: readonly string[]): Promise<string>;
  stateOf(sessionId: string): Promise<string | undefined>;
}>;

async function withService(run: (harness: Harness) => Promise<void>): Promise<void> {
  await using kv = new MemoryKvAdapter();
  const registry = await createKvOAuthTestRegistry(kv);
  const tracer = new RecordingTracer();
  const telemetry = createAuthTelemetry({ tracer, subjectHashSalt: 'test_salt' });
  await using service = await serveAuthTestService(registry, telemetry);
  const backend = registry.resolveBackend();
  await run({
    kv,
    registry,
    baseUrl: service.baseUrl,
    tracer,
    async create(subject, scopes = []) {
      // For kv-oauth the bearer credential is the session id itself.
      const session = await backend.sessions.createSession({
        userId: subject,
        subject,
        scopes,
        expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
      });
      return session.id;
    },
    async stateOf(sessionId) {
      return (await backend.sessions.getSession({ sessionId }))?.state;
    },
  });
}

Deno.test('unauthenticated signout of a valid foreign session returns 401 on every transport and the session stays active', async () => {
  await withService(async ({ baseUrl, create, stateOf }) => {
    const victim = await create('user-victim');
    for (const transport of SIGNOUT_TRANSPORTS) {
      const result = await call(baseUrl, transport, { sessionId: victim });
      assertEquals(result.status, 401, transport.name);
      assertEquals(await stateOf(victim), 'active', transport.name);
      const everywhere = await call(baseUrl, transport, { sessionId: victim, everywhere: true });
      assertEquals(everywhere.status, 401, transport.name);
      assertEquals(await stateOf(victim), 'active', transport.name);
    }
  });
});

Deno.test('authenticated signout naming a foreign session is refused and revokes nothing', async () => {
  await withService(async ({ baseUrl, create, stateOf }) => {
    const attacker = await create('user-attacker');
    const victim = await create('user-victim');
    for (const transport of SIGNOUT_TRANSPORTS) {
      const result = await call(baseUrl, transport, { sessionId: victim }, attacker);
      assertEquals(result.status, 401, transport.name);
      assertEquals(await stateOf(victim), 'active', transport.name);
      assertEquals(await stateOf(attacker), 'active', transport.name);
      const everywhere = await call(
        baseUrl,
        transport,
        { sessionId: victim, everywhere: true },
        attacker,
      );
      assertEquals(everywhere.status, 401, transport.name);
      assertEquals(await stateOf(victim), 'active', transport.name);
      assertEquals(await stateOf(attacker), 'active', transport.name);
    }
  });
});

Deno.test('unknown and foreign session ids produce the same status and response body', async () => {
  await withService(async ({ baseUrl, create }) => {
    const attacker = await create('user-attacker');
    const victim = await create('user-victim');
    for (const transport of SIGNOUT_TRANSPORTS) {
      const foreign = await call(baseUrl, transport, { sessionId: victim }, attacker);
      const unknown = await call(baseUrl, transport, { sessionId: 'sess_unknown' }, attacker);
      assertEquals(foreign.status, 401, transport.name);
      assertEquals(unknown, foreign, transport.name);
    }
  });
});

Deno.test('signout revokes only the caller-owned session it selects', async () => {
  await withService(async ({ baseUrl, create, stateOf }) => {
    for (const transport of SIGNOUT_TRANSPORTS) {
      const current = await create('user-a');
      const sibling = await create('user-a');
      const other = await create('user-b');

      const signedOut = await call(baseUrl, transport, {}, current);
      assertEquals(signedOut.status, 200, transport.name);
      assertEquals(signedOut.body, { signedOut: true, sessionId: current }, transport.name);
      assertEquals(await stateOf(current), 'revoked', transport.name);
      assertEquals(await stateOf(sibling), 'active', transport.name);

      const selector = await create('user-a');
      const selected = await call(baseUrl, transport, { sessionId: sibling }, selector);
      assertEquals(selected.status, 200, transport.name);
      assertEquals(await stateOf(sibling), 'revoked', transport.name);
      assertEquals(await stateOf(selector), 'active', transport.name);
      assertEquals(await stateOf(other), 'active', transport.name);
    }
  });
});

Deno.test('browser signout authenticates with the session cookie and revokes that session', async () => {
  await withService(async ({ baseUrl, create, stateOf }) => {
    for (const transport of SIGNOUT_TRANSPORTS) {
      const browser = await create('user-browser');
      const victim = await create('user-victim');
      const send = async (input: unknown) =>
        await fetch(`${baseUrl}${transport.path}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: `__Host-ns_session=${browser}` },
          body: JSON.stringify(transport.encode(input)),
        });

      const foreign = await send({ sessionId: victim });
      await foreign.body?.cancel();
      assertEquals(foreign.status, 401, transport.name);
      assertEquals(await stateOf(victim), 'active', transport.name);

      const own = await send({});
      await own.body?.cancel();
      assertEquals(own.status, 200, transport.name);
      assertEquals(await stateOf(browser), undefined, transport.name);
      assertEquals(await stateOf(victim), 'active', transport.name);
    }
  });
});

Deno.test('everywhere revokes every session of the subject and no one else', async () => {
  await withService(async ({ baseUrl, create, stateOf }) => {
    for (const transport of SIGNOUT_TRANSPORTS) {
      const subject = `user-${crypto.randomUUID()}`;
      const own = [await create(subject), await create(subject), await create(subject)];
      const others = [await create('user-b'), await create(`${subject}-suffix`)];

      const result = await call(baseUrl, transport, { everywhere: true }, own[0]);
      assertEquals(result.status, 200, transport.name);
      for (const id of own) assertEquals(await stateOf(id), 'revoked', transport.name);
      for (const id of others) assertEquals(await stateOf(id), 'active', transport.name);
    }
  });
});

Deno.test('everywhere also revokes a session persisted before the upgrade', async () => {
  await withService(async ({ kv, baseUrl, create, stateOf }) => {
    for (const transport of SIGNOUT_TRANSPORTS) {
      const subject = `user-${crypto.randomUUID()}`;
      // Pre-upgrade layout: the bare kv-oauth session record, with no subject-level bookkeeping.
      const legacyId = `sess_legacy_${crypto.randomUUID().replaceAll('-', '')}`;
      await kv.set(['auth-kv-oauth', 'session', legacyId], {
        session: {
          id: legacyId,
          userId: subject,
          state: 'active',
          subject,
          scopes: [],
          roles: [],
          claims: {},
          issuedAt: new Date(Date.now() - 60_000).toISOString(),
          expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
        },
        tokens: { keyId: 'legacy', sealed: 'legacy' },
      });
      const current = await create(subject);
      assertEquals(await stateOf(legacyId), 'active', transport.name);

      const result = await call(baseUrl, transport, { everywhere: true }, current);
      assertEquals(result.status, 200, transport.name);
      assertEquals(await stateOf(legacyId), 'revoked', transport.name);
      // The legacy credential no longer authenticates anything.
      assertEquals((await call(baseUrl, transport, {}, legacyId)).status, 401, transport.name);
    }
  });
});

Deno.test('a rejected signout records no session.revoked audit event and no success outcome', async () => {
  await withService(async ({ baseUrl, create, tracer }) => {
    const attacker = await create('user-attacker');
    const victim = await create('user-victim');
    for (const transport of SIGNOUT_TRANSPORTS) {
      tracer.spans.length = 0;
      await call(baseUrl, transport, { sessionId: victim });
      await call(baseUrl, transport, { sessionId: victim }, attacker);
      await call(baseUrl, transport, { sessionId: 'sess_unknown' }, attacker);
      const signoutSpans = tracer.spans.filter((span) => span.name === AuthSpanNames.SIGNOUT);
      // The two authenticated refusals reach the handler; the anonymous one stops at the guard.
      assertEquals(signoutSpans.length, 2, transport.name);
      for (const span of signoutSpans) {
        assertNotEquals(
          span.attributes[AuthAttributes.OUTCOME],
          AuthOutcome.SUCCESS,
          transport.name,
        );
      }
      assertEquals(
        tracer.spans.flatMap((span) => span.events).filter((name) =>
          name === AuthSpanEvents.SESSION_REVOKED
        ),
        [],
        transport.name,
      );
    }

    // Positive control: the same recorder does observe an accepted signout.
    tracer.spans.length = 0;
    const own = await create('user-owner');
    assertEquals((await call(baseUrl, SIGNOUT_TRANSPORTS[0], {}, own)).status, 200);
    const accepted = tracer.spans.find((span) => span.name === AuthSpanNames.SIGNOUT);
    assert(accepted);
    assertEquals(accepted.attributes[AuthAttributes.OUTCOME], AuthOutcome.SUCCESS);
    assert(accepted.events.includes(AuthSpanEvents.SESSION_REVOKED));
  });
});

Deno.test('operator revokeSession requires authentication and the auth:sessions:revoke scope', async () => {
  await withService(async ({ baseUrl, create, stateOf }) => {
    const plain = await create('user-plain');
    const operator = await create('svc-operator', [REVOKE_SCOPE]);
    for (const transport of REVOKE_TRANSPORTS) {
      const target = await create('user-target');

      assertEquals((await call(baseUrl, transport, { sessionId: target })).status, 401);
      assertEquals(await stateOf(target), 'active', transport.name);

      const forbidden = await call(baseUrl, transport, { sessionId: target }, plain);
      assertEquals(forbidden.status, 403, transport.name);
      assertEquals(await stateOf(target), 'active', transport.name);

      const revoked = await call(baseUrl, transport, { sessionId: target }, operator);
      assertEquals(revoked.status, 200, transport.name);
      assertEquals(revoked.body, { revoked: true, sessionId: target }, transport.name);
      assertEquals(await stateOf(target), 'revoked', transport.name);

      const unknown = await call(baseUrl, transport, { sessionId: 'sess_unknown' }, operator);
      assertEquals(unknown.body, { revoked: false, sessionId: 'sess_unknown' }, transport.name);
    }
    assertEquals(await stateOf(operator), 'active');
    assertEquals(await stateOf(plain), 'active');
  });
});

class RecordingTracer implements Tracer {
  readonly spans: RecordingSpan[] = [];

  startSpan(name: string, options: SpanOptions = {}): Span {
    const span = new RecordingSpan(name, options.attributes ?? {});
    this.spans.push(span);
    return span;
  }

  startActiveSpan<T>(name: string, fn: (span: Span) => T): T;
  startActiveSpan<T>(name: string, options: SpanOptions, fn: (span: Span) => T): T;
  startActiveSpan<T>(
    name: string,
    options: SpanOptions,
    context: unknown,
    fn: (span: Span) => T,
  ): T;
  startActiveSpan<T>(
    name: string,
    optionsOrFn: SpanOptions | ((span: Span) => T),
    contextOrFn?: unknown,
    fn?: (span: Span) => T,
  ): T {
    if (typeof optionsOrFn === 'function') return optionsOrFn(this.startSpan(name));
    if (typeof contextOrFn === 'function') {
      return (contextOrFn as (span: Span) => T)(this.startSpan(name, optionsOrFn));
    }
    if (fn) return fn(this.startSpan(name, optionsOrFn));
    throw new TypeError('startActiveSpan requires a callback.');
  }
}

class RecordingSpan implements Span {
  readonly attributes: Attributes = {};
  readonly events: string[] = [];

  constructor(readonly name: string, attributes: Attributes) {
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
      if (value !== undefined) this.attributes[key] = value;
    }
    return this;
  }

  addEvent(name: string, _attributesOrStartTime?: Attributes | TimeInput): this {
    this.events.push(name);
    return this;
  }

  addLink(_link: Link): this {
    return this;
  }

  addLinks(_links: Link[]): this {
    return this;
  }

  setStatus(_status: SpanStatus): this {
    return this;
  }

  updateName(_name: string): this {
    return this;
  }

  isRecording(): boolean {
    return true;
  }

  recordException(_exception: Exception, _time?: TimeInput): void {}

  end(_endTime?: TimeInput): void {}
}
