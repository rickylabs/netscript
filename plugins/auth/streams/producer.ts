import { createDurableStream, type DurableStreamProducer } from '@netscript/plugin-streams-core';
import { injectContext } from '@netscript/telemetry/context';
import { type AuthSession, type AuthStreamEvent, authStreamSchema } from './schema.ts';

export type { DurableStreamProducer, StreamProducerPort } from '@netscript/plugin-streams-core';
export type {
  AuthSession,
  AuthSessionState,
  AuthStreamDefinition,
  AuthStreamEvent,
  AuthStreamSchema,
  AuthStreamSchemaResult,
  StateSchema,
  StreamStateDefinition,
} from './schema.ts';

/** Serialized W3C trace context persisted with auth stream events. */
export interface SerializedTraceContext {
  /** W3C traceparent header value. */
  readonly traceparent: string;
  /** Optional W3C tracestate header value. */
  readonly tracestate?: string;
}

const STREAM_PATH = '/auth/sessions';
const PRODUCER_ID = 'auth-service';

let producer: DurableStreamProducer<typeof authStreamSchema> | undefined;

/** Producer-compatible surface accepted by auth stream emit helpers. */
export type AuthStreamProducerPort = Pick<
  DurableStreamProducer<typeof authStreamSchema>,
  'upsert' | 'delete' | 'flush' | 'close'
>;

/** Optional sink used by tests or callers that also want the typed lifecycle event. */
export type AuthStreamEventSink = (event: AuthStreamEvent) => void;

/** Options accepted by auth stream lifecycle emit helpers. */
export interface AuthStreamEmitOptions {
  /** Stream producer override. Defaults to the module singleton. */
  readonly producer?: AuthStreamProducerPort;
  /** Optional typed event sink called after best-effort stream projection. */
  readonly sink?: AuthStreamEventSink;
  /** Clock override for deterministic tests. */
  readonly now?: () => Date;
  /** Trace context to persist on the auth stream event and session record. */
  readonly traceContext?: SerializedTraceContext;
}

/** Input accepted by the sign-in started lifecycle helper. */
export type AuthSigninStartedInput = Readonly<{
  providerId?: string;
  subject?: string;
  state?: string;
}>;

/** Input accepted by the sign-in failed lifecycle helper. */
export type AuthSigninFailedInput = Readonly<{
  providerId?: string;
  subject?: string;
  reason?: string;
}>;

/** Input accepted by the session revoked lifecycle helper. */
export type AuthSessionRevokedInput =
  & AuthSession
  & Readonly<{
    reason?: string;
    revokedAt?: string;
  }>;

/** Get or create the auth session stream producer. */
export function getAuthStreamProducer(): DurableStreamProducer<typeof authStreamSchema> {
  if (!producer) {
    producer = createDurableStream({
      streamPath: STREAM_PATH,
      schema: authStreamSchema,
      producerId: PRODUCER_ID,
    });
  }
  return producer;
}

/** Publish an OIDC completion as an active auth session projection. */
export function emitOidcCompleted(
  session: AuthSession,
  options: AuthStreamEmitOptions = {},
): AuthStreamEvent {
  const traceContext = resolveAuthTraceContext(options);
  const activeSession: AuthSession = withSessionTraceContext(
    { ...session, state: 'active' },
    traceContext,
  );
  const event = authEvent('auth.oidc.completed', activeSession, options);
  publishAuthSession(activeSession, event, options);
  return event;
}

/** Publish a token refresh as an updated auth session projection. */
export function emitTokenRefreshed(
  session: AuthSession,
  options: AuthStreamEmitOptions = {},
): AuthStreamEvent {
  const refreshedAt = session.refreshedAt ?? timestamp(options);
  const traceContext = resolveAuthTraceContext(options);
  const refreshedSession: AuthSession = withSessionTraceContext(
    { ...session, state: 'active', refreshedAt },
    traceContext,
  );
  const event = authEvent('auth.token.refreshed', refreshedSession, options);
  publishAuthSession(refreshedSession, event, options);
  return event;
}

/** Publish a revoked terminal auth session projection. */
export function emitSessionRevoked(
  session: AuthSessionRevokedInput,
  options: AuthStreamEmitOptions = {},
): AuthStreamEvent {
  const revokedAt = session.revokedAt ?? timestamp(options);
  const traceContext = resolveAuthTraceContext(options);
  const revokedSession: AuthSession = withSessionTraceContext(
    { ...session, state: 'revoked', revokedAt },
    traceContext,
  );
  const event = authEvent('auth.session.revoked', revokedSession, options, session.reason);
  publishAuthSession(revokedSession, event, options);
  return event;
}

/** Produce a typed sign-in started event without mutating the auth session projection. */
export function emitSigninStarted(
  input: AuthSigninStartedInput = {},
  options: AuthStreamEmitOptions = {},
): AuthStreamEvent {
  const traceContext = resolveAuthTraceContext(options);
  const event = {
    type: 'auth.signin.started',
    timestamp: timestamp(options),
    providerId: input.providerId,
    subject: input.subject,
    traceparent: traceContext?.traceparent,
    tracestate: traceContext?.tracestate,
    data: eventDataWithTrace(input.state ? { state: input.state } : undefined, traceContext),
  } satisfies AuthStreamEvent;
  publishEvent(event, options);
  return event;
}

/** Produce a typed sign-in failed event without mutating the auth session projection. */
export function emitSigninFailed(
  input: AuthSigninFailedInput = {},
  options: AuthStreamEmitOptions = {},
): AuthStreamEvent {
  const traceContext = resolveAuthTraceContext(options);
  const event = {
    type: 'auth.signin.failed',
    timestamp: timestamp(options),
    providerId: input.providerId,
    subject: input.subject,
    reason: input.reason,
    traceparent: traceContext?.traceparent,
    tracestate: traceContext?.tracestate,
    data: eventDataWithTrace(undefined, traceContext),
  } satisfies AuthStreamEvent;
  publishEvent(event, options);
  return event;
}

function publishAuthSession(
  session: AuthSession,
  event: AuthStreamEvent,
  options: AuthStreamEmitOptions,
): void {
  try {
    const streamProducer = options.producer ?? resolveConfiguredProducer();
    if (!streamProducer) {
      return;
    }
    streamProducer.upsert('authSession', session);
  } catch (error) {
    console.warn('[Auth Stream] Durable stream emit skipped:', error);
  } finally {
    publishEvent(event, options);
  }
}

function publishEvent(event: AuthStreamEvent, options: AuthStreamEmitOptions): void {
  try {
    options.sink?.(event);
  } catch (error) {
    console.warn('[Auth Stream] Event sink skipped:', error);
  }
}

function authEvent(
  type: AuthStreamEvent['type'],
  session: AuthSession,
  options: AuthStreamEmitOptions,
  reason?: string,
): AuthStreamEvent {
  const traceContext = resolveAuthTraceContext(options);
  return {
    type,
    timestamp: timestamp(options),
    sessionId: session.id,
    userId: session.userId,
    providerId: session.providerId,
    subject: session.subject,
    reason,
    traceparent: traceContext?.traceparent,
    tracestate: traceContext?.tracestate,
    data: eventDataWithTrace(undefined, traceContext),
  };
}

function resolveAuthTraceContext(
  options: AuthStreamEmitOptions,
): SerializedTraceContext | undefined {
  if (options.traceContext) {
    return options.traceContext;
  }
  const headers = injectContext({});
  const traceparent = headers.traceparent;
  if (!traceparent) {
    return undefined;
  }
  return {
    traceparent,
    tracestate: headers.tracestate,
  };
}

function withSessionTraceContext(
  session: AuthSession,
  traceContext: SerializedTraceContext | undefined,
): AuthSession {
  if (!traceContext) {
    return session;
  }
  return {
    ...session,
    traceparent: traceContext.traceparent,
    tracestate: traceContext.tracestate,
  };
}

function eventDataWithTrace(
  data: Readonly<Record<string, unknown>> | undefined,
  traceContext: SerializedTraceContext | undefined,
): Readonly<Record<string, unknown>> | undefined {
  if (!traceContext) {
    return data;
  }
  return Object.freeze({
    ...(data ?? {}),
    headers: Object.freeze({
      traceparent: traceContext.traceparent,
      ...(traceContext.tracestate ? { tracestate: traceContext.tracestate } : {}),
    }),
  });
}

function timestamp(options: AuthStreamEmitOptions): string {
  return (options.now?.() ?? new Date()).toISOString();
}

function resolveConfiguredProducer(): AuthStreamProducerPort | undefined {
  if (!hasConfiguredStreamUrl()) {
    console.warn(
      '[Auth Stream] Durable stream emit skipped: streams URL is not configured.',
    );
    return undefined;
  }
  return getAuthStreamProducer();
}

function hasConfiguredStreamUrl(): boolean {
  try {
    return Boolean(
      Deno.env.get('DURABLE_STREAMS_URL') ??
        Deno.env.get('services__streams__http__0') ??
        Deno.env.get('VITE_services__streams__http__0'),
    );
  } catch {
    return false;
  }
}
