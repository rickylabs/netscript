import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { buildAuthSession } from '@netscript/plugin-auth-core/testing';
import { createAuthTelemetry } from '@netscript/plugin-auth-core/telemetry';
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
import {
  AuthStreamEventSchema,
  AuthStreamSessionSchema,
} from '@netscript/plugin-auth-core/streams';
import { MemoryStreamProducer } from '@netscript/plugin-streams-core/testing';
import { emitOidcCompleted, emitSessionRevoked, emitTokenRefreshed } from '../../streams/server.ts';
import type { AuthSession, AuthStreamEvent } from '../../streams/mod.ts';

Deno.test('auth stream emit helpers project authSession lifecycle state', () => {
  const producer = new MemoryStreamProducer();
  const events: AuthStreamEvent[] = [];
  const now = () => new Date('2026-01-01T12:00:00.000Z');

  const session = buildAuthSession({
    id: 'sess_stream',
    userId: 'user_stream',
    providerId: 'oidc',
    subject: 'user:user_stream',
  });
  const completed = emitOidcCompleted(session, {
    producer,
    sink: (event) => events.push(event),
    now,
  });
  const refreshedSession = {
    ...session,
    refreshedAt: '2026-01-01T12:30:00.000Z',
  };
  const refreshed = emitTokenRefreshed(refreshedSession, {
    producer,
    sink: (event) => events.push(event),
    now,
  });
  const revoked = emitSessionRevoked(refreshedSession, {
    producer,
    sink: (event) => events.push(event),
    now,
  });

  assertEquals(completed.type, 'auth.oidc.completed');
  assertEquals(refreshed.type, 'auth.token.refreshed');
  assertEquals(revoked.type, 'auth.session.revoked');
  assertEquals(events.map((event) => event.type), [
    'auth.oidc.completed',
    'auth.token.refreshed',
    'auth.session.revoked',
  ]);

  const projection = new Map<string, AuthSession>();
  const states: string[] = [];
  for (const event of producer.events()) {
    if (event.operation === 'upsert' && event.entityType === 'authSession' && event.value) {
      const sessionEntity = AuthStreamSessionSchema.parse(event.value);
      projection.set(sessionEntity.id, sessionEntity);
      states.push(sessionEntity.state);
    }
  }

  assertEquals(states, ['active', 'active', 'revoked']);
  assertEquals(projection.get('sess_stream')?.refreshedAt, '2026-01-01T12:30:00.000Z');
  assertEquals(projection.get('sess_stream')?.state, 'revoked');
  assertEquals(projection.get('sess_stream')?.revokedAt, '2026-01-01T12:00:00.000Z');
});

Deno.test('auth stream emit helpers return AuthStreamEvent payloads', () => {
  const producer = new MemoryStreamProducer();
  const session = buildAuthSession({ id: 'sess_shape', providerId: 'oidc' });

  for (
    const event of [
      emitOidcCompleted(session, { producer }),
      emitTokenRefreshed({ ...session, refreshedAt: '2026-01-01T12:30:00.000Z' }, { producer }),
      emitSessionRevoked(session, { producer }),
    ]
  ) {
    const parsed = AuthStreamEventSchema.safeParse(event);
    assertEquals(parsed.success, true);
    assertEquals(parsed.success ? parsed.data.type : undefined, event.type);
  }
});

Deno.test('auth stream emit helpers isolate producer failures from callers', () => {
  const failingProducer = {
    upsert() {
      throw new Error('stream unavailable');
    },
    delete() {
      throw new Error('stream unavailable');
    },
    flush: () => Promise.resolve(),
    close: () => Promise.resolve(),
  };
  const warnings: unknown[][] = [];
  const previousWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };

  try {
    const event = emitOidcCompleted(buildAuthSession({ id: 'sess_fail' }), {
      producer: failingProducer,
    });

    assertEquals(event.type, 'auth.oidc.completed');
    assertEquals(warnings.length, 1);
  } finally {
    console.warn = previousWarn;
  }
});

Deno.test('auth stream emit helpers persist active span trace context', async () => {
  const producer = new MemoryStreamProducer();
  const telemetry = createAuthTelemetry({
    tracer: new TraceContextRecordingTracer(
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'bbbbbbbbbbbbbbbb',
    ),
    subjectHashSalt: 'deployment_salt',
  });

  const session = buildAuthSession({
    id: 'sess_trace',
    userId: 'user_trace',
    providerId: 'oidc',
    subject: 'user:trace',
  });
  let event: AuthStreamEvent | undefined;
  await telemetry.traceOperation(
    { operation: 'callback', backend: 'kv-oauth', method: 'GET', providerId: 'oidc' },
    (recorder) => {
      event = emitOidcCompleted(session, { producer, traceContext: recorder.traceContext() });
    },
  );

  assert(event);
  assertEquals(event.traceparent?.slice(3, 35), 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  assertEquals(event.data?.headers, {
    traceparent: '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01',
  });

  const persisted = producer.events().find((entry) => entry.operation === 'upsert')?.value;
  const parsed = AuthStreamSessionSchema.parse(persisted);
  assertEquals(parsed.traceparent, event.traceparent);
});

class TraceContextRecordingTracer implements Tracer {
  constructor(
    private readonly traceId: string,
    private readonly spanId: string,
  ) {}

  startSpan(name: string, options: SpanOptions = {}, _context?: Context): Span {
    return new TraceContextRecordingSpan(name, options.attributes ?? {}, this.traceId, this.spanId);
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

class TraceContextRecordingSpan implements Span {
  private readonly attributes: Attributes = {};
  private readonly links: Link[] = [];

  constructor(
    private spanName: string,
    attributes: Attributes,
    private readonly traceId: string,
    private readonly spanId: string,
  ) {
    this.setAttributes(attributes);
  }

  spanContext(): SpanContext {
    return {
      traceId: this.traceId,
      spanId: this.spanId,
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

  setStatus(_status: SpanStatus): this {
    return this;
  }

  updateName(name: string): this {
    this.spanName = name;
    return this;
  }

  isRecording(): boolean {
    return true;
  }

  recordException(_exception: Exception, _time?: TimeInput): void {}

  end(_endTime?: TimeInput): void {}
}
