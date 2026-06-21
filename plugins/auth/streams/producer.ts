import { createDurableStream, type DurableStreamProducer } from '@netscript/plugin-streams-core';
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
  const activeSession: AuthSession = { ...session, state: 'active' };
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
  const refreshedSession: AuthSession = { ...session, state: 'active', refreshedAt };
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
  const revokedSession: AuthSession = { ...session, state: 'revoked', revokedAt };
  const event = authEvent('auth.session.revoked', revokedSession, options, session.reason);
  publishAuthSession(revokedSession, event, options);
  return event;
}

/** Produce a typed sign-in started event without mutating the auth session projection. */
export function emitSigninStarted(
  input: AuthSigninStartedInput = {},
  options: AuthStreamEmitOptions = {},
): AuthStreamEvent {
  const event = {
    type: 'auth.signin.started',
    timestamp: timestamp(options),
    providerId: input.providerId,
    subject: input.subject,
    data: input.state ? { state: input.state } : undefined,
  } satisfies AuthStreamEvent;
  publishEvent(event, options);
  return event;
}

/** Produce a typed sign-in failed event without mutating the auth session projection. */
export function emitSigninFailed(
  input: AuthSigninFailedInput = {},
  options: AuthStreamEmitOptions = {},
): AuthStreamEvent {
  const event = {
    type: 'auth.signin.failed',
    timestamp: timestamp(options),
    providerId: input.providerId,
    subject: input.subject,
    reason: input.reason,
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
  return {
    type,
    timestamp: timestamp(options),
    sessionId: session.id,
    userId: session.userId,
    providerId: session.providerId,
    subject: session.subject,
    reason,
  };
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
