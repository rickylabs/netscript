import { assert, assertEquals, assertFalse } from '@std/assert';
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
  AuthAttributes,
  AuthOutcome,
  AuthSpanEvents,
  AuthSpanNames,
  createAuthTelemetry,
  hashSubject,
  redactAuthPrincipal,
} from './mod.ts';
import type { Principal } from '../domain/mod.ts';

Deno.test('hashSubject returns a stable salted HMAC without raw subject material', async () => {
  const first = await hashSubject('user_subject_test', 'deployment_salt');
  const second = await hashSubject('user_subject_test', 'deployment_salt');
  const otherSalt = await hashSubject('user_subject_test', 'other_salt');

  assertEquals(first, second);
  assertEquals(first.length, 64);
  assertFalse(first.includes('user_subject_test'));
  assertFalse(first === otherSalt);
});

Deno.test('redactAuthPrincipal hashes subject and removes token-bearing claims', async () => {
  const principal: Principal = {
    subject: 'user_subject_test',
    scopes: ['profile', 'email'],
    roles: ['admin'],
    scheme: 'custom',
    claims: {
      email: 'user@example.test',
      accessToken: 'access_secret_test',
      nested: { refresh_token: 'refresh_secret_test', displayName: 'User Test' },
    },
  };

  const redacted = await redactAuthPrincipal(principal, 'deployment_salt');
  const serialized = JSON.stringify(redacted);

  assertEquals(redacted.scopesCount, 2);
  assertEquals(redacted.rolesCount, 1);
  assertFalse(serialized.includes('user_subject_test'));
  assertFalse(serialized.includes('access_secret_test'));
  assertFalse(serialized.includes('refresh_secret_test'));
  assert(serialized.includes('user@example.test'));
});

Deno.test('createAuthTelemetry records audit-safe auth attributes and events', async () => {
  const tracer = new RecordingTracer();
  const telemetry = createAuthTelemetry({
    tracer,
    subjectHashSalt: 'deployment_salt',
  });

  await telemetry.traceOperation(
    {
      operation: 'me',
      backend: 'kv-oauth',
      method: 'GET',
      providerId: 'oidc',
    },
    async (recorder) => {
      await recorder.recordPrincipal({
        subject: 'user_subject_test',
        scopes: ['profile'],
        roles: ['admin'],
        scheme: 'custom',
        claims: { accessToken: 'access_secret_test' },
      });
      await recorder.setOutcome({
        outcome: AuthOutcome.SUCCESS,
        subject: 'user_subject_test',
        scopesCount: 1,
        rolesCount: 1,
      });
      return true;
    },
  );

  const span = tracer.spans[0];
  assert(span);
  assertEquals(span.name, AuthSpanNames.ME);
  assertEquals(span.attributes[AuthAttributes.BACKEND], 'kv-oauth');
  assertEquals(span.attributes[AuthAttributes.PROVIDER], 'oidc');
  assertEquals(span.attributes[AuthAttributes.METHOD], 'GET');
  assertEquals(span.attributes[AuthAttributes.OUTCOME], AuthOutcome.SUCCESS);
  assertEquals(span.attributes[AuthAttributes.PRINCIPAL_SCOPES_COUNT], 1);
  assertEquals(span.attributes[AuthAttributes.PRINCIPAL_ROLES_COUNT], 1);
  assertEquals(typeof span.attributes[AuthAttributes.SUBJECT_HASH], 'string');
  assert(span.events.some((event) => event.name === AuthSpanEvents.AUDIT_LOG));
  assert(span.events.some((event) => event.name === AuthSpanEvents.PRINCIPAL_RESOLVED));

  const serialized = JSON.stringify(span);
  assertFalse(serialized.includes('user_subject_test'));
  assertFalse(serialized.includes('access_secret_test'));
});

class RecordingTracer implements Tracer {
  readonly spans: RecordingSpan[] = [];

  startSpan(name: string, options: SpanOptions = {}, _context?: Context): Span {
    const span = new RecordingSpan(name, options.attributes ?? {});
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

class RecordingSpan implements Span {
  readonly attributes: Attributes = {};
  readonly events: { readonly name: string; readonly attributes?: Attributes | TimeInput }[] = [];
  readonly links: Link[] = [];
  status: SpanStatus | undefined;
  ended = false;

  constructor(
    public name: string,
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

  addEvent(name: string, attributesOrStartTime?: Attributes | TimeInput): this {
    this.events.push({ name, attributes: attributesOrStartTime });
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

  updateName(name: string): this {
    this.name = name;
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
