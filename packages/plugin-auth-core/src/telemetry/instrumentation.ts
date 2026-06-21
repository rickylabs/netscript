/**
 * Auth telemetry instrumentation facade for service composition roots.
 *
 * @example
 * ```ts
 * import { createAuthTelemetry } from "@netscript/plugin-auth-core/telemetry";
 *
 * const telemetry = createAuthTelemetry({ subjectHashSalt: "deployment-owned-salt" });
 * const result = await telemetry.traceOperation(
 *   { operation: "session", backend: "kv-oauth", method: "GET" },
 *   async () => ({ authenticated: false }),
 * );
 * console.log(result.authenticated);
 * ```
 *
 * @module
 */

import {
  type Attributes,
  type Context,
  getTracer,
  type Span,
  SpanKind,
  type Tracer,
  withSpan,
} from '@netscript/telemetry/tracer';
import {
  resolveTraceContextFromSpan,
  type SerializedTraceContext,
} from '@netscript/telemetry/context';
import type { Principal } from '../domain/mod.ts';
import {
  AuthAttributes,
  AuthErrorCode,
  type AuthErrorCodeValue,
  AuthOutcome,
  type AuthOutcomeValue,
  AuthSpanEvents,
  type AuthSpanName,
  AuthSpanNames,
} from './attributes.ts';
import { hashSubject, redactAuthPrincipal, type RedactedAuthPrincipal } from './redaction.ts';

export { SpanKind, SpanStatusCode } from '@netscript/telemetry/tracer';
export type {
  Attributes,
  AttributeValue,
  Context,
  Exception,
  Link,
  Span,
  SpanContext,
  SpanOptions,
  SpanStatus,
  TimeInput,
  Tracer,
  TraceState,
} from '@netscript/telemetry/tracer';
export type { SerializedTraceContext } from '@netscript/telemetry/context';

/** Primitive value accepted by auth telemetry attributes. */
export type AuthTelemetryAttributeValue = string | number | boolean | undefined;
/** Attribute bag emitted by auth telemetry spans and audit events. */
export type AuthTelemetryAttributes = Readonly<Record<string, AuthTelemetryAttributeValue>>;
/** Auth operation names supported by the service instrumentation facade. */
export type AuthTelemetryOperation = 'signin' | 'callback' | 'signout' | 'session' | 'me';

/** Inputs shared by all auth operation spans. */
export type AuthOperationInput = Readonly<{
  operation: AuthTelemetryOperation;
  backend: string;
  method: string;
  providerId?: string;
  sessionId?: string;
  subject?: string;
  parentContext?: Context;
}>;

/** Result classification recorded when an auth operation completes. */
export type AuthOperationOutcome = Readonly<{
  outcome: AuthOutcomeValue;
  errorCode?: AuthErrorCodeValue;
  subject?: string;
  sessionId?: string;
  scopesCount?: number;
  rolesCount?: number;
}>;

/** Recorder passed to traced auth operation callbacks. */
export interface AuthOperationRecorder {
  /** Return serialized W3C trace context for the active auth child span. */
  traceContext(): SerializedTraceContext | undefined;
  /** Add audit-safe attributes to the active auth span. */
  setAttributes(attributes: AuthTelemetryAttributes): void;
  /** Emit the standardized auth audit event on the active auth span. */
  audit(attributes?: AuthTelemetryAttributes): void;
  /** Record a resolved principal without exposing raw subject or token-bearing claims. */
  recordPrincipal(principal: Principal): Promise<RedactedAuthPrincipal | undefined>;
  /** Record session-issued metadata. */
  recordSessionIssued(sessionId?: string, subject?: string): Promise<void>;
  /** Record session-revoked metadata. */
  recordSessionRevoked(sessionId?: string, subject?: string): Promise<void>;
  /** Mark the operation outcome. */
  setOutcome(outcome: AuthOperationOutcome): Promise<void>;
}

/** Dependencies used to create auth telemetry instrumentation. */
export type AuthTelemetryOptions = Readonly<{
  tracer?: Tracer;
  subjectHashSalt?: string;
  enabled?: boolean;
}>;

/** Auth telemetry facade used by service handlers. */
export interface AuthTelemetry {
  /** Execute an auth operation inside a child span when telemetry is configured. */
  traceOperation<T>(
    input: AuthOperationInput,
    run: (recorder: AuthOperationRecorder) => Promise<T> | T,
  ): Promise<T>;
  /** Hash a subject with the configured salt when available. */
  subjectHash(subject: string): Promise<string | undefined>;
  /** Return an audit-safe principal projection when hashing is configured. */
  redactPrincipal(principal: Principal): Promise<RedactedAuthPrincipal | undefined>;
}

const AUTH_TRACER_NAME = '@netscript/auth';
const AUTH_TRACER_VERSION = '0.0.1-alpha.0';
const NOOP_RECORDER: AuthOperationRecorder = Object.freeze({
  traceContext(): undefined {
    return undefined;
  },
  setAttributes(_attributes: AuthTelemetryAttributes): void {},
  audit(_attributes?: AuthTelemetryAttributes): void {},
  recordPrincipal(_principal: Principal): Promise<undefined> {
    return Promise.resolve(undefined);
  },
  recordSessionIssued(_sessionId?: string, _subject?: string): Promise<void> {
    return Promise.resolve();
  },
  recordSessionRevoked(_sessionId?: string, _subject?: string): Promise<void> {
    return Promise.resolve();
  },
  setOutcome(_outcome: AuthOperationOutcome): Promise<void> {
    return Promise.resolve();
  },
});

/** Create auth telemetry instrumentation with no-op-safe defaults. */
export function createAuthTelemetry(options: AuthTelemetryOptions = {}): AuthTelemetry {
  const salt = options.subjectHashSalt;
  const enabled = options.enabled ?? salt !== undefined;
  const tracer = options.tracer ?? getTracer(AUTH_TRACER_NAME, AUTH_TRACER_VERSION);

  async function subjectHash(subject: string): Promise<string | undefined> {
    if (!salt) return undefined;
    try {
      return await hashSubject(subject, salt);
    } catch {
      return undefined;
    }
  }

  async function redactPrincipal(
    principal: Principal,
  ): Promise<RedactedAuthPrincipal | undefined> {
    if (!salt) return undefined;
    try {
      return await redactAuthPrincipal(principal, salt);
    } catch {
      return undefined;
    }
  }

  return Object.freeze({
    async traceOperation<T>(
      input: AuthOperationInput,
      run: (recorder: AuthOperationRecorder) => Promise<T> | T,
    ): Promise<T> {
      if (!enabled) {
        return await run(NOOP_RECORDER);
      }
      let callbackStarted = false;
      try {
        return await withSpan(
          tracer,
          spanNameForOperation(input.operation),
          async (span) => {
            callbackStarted = true;
            const recorder = createRecorder(span, input, subjectHash, redactPrincipal);
            recorder.setAttributes(operationAttributes(input));
            recorder.audit();
            return await run(recorder);
          },
          {
            kind: SpanKind.INTERNAL,
            attributes: operationAttributes(input),
            parentContext: input.parentContext,
          },
        );
      } catch (error) {
        if (!callbackStarted) {
          return await run(NOOP_RECORDER);
        }
        throw error;
      }
    },
    subjectHash,
    redactPrincipal,
  });
}

function createRecorder(
  span: Span,
  input: AuthOperationInput,
  subjectHash: (subject: string) => Promise<string | undefined>,
  redactPrincipal: (principal: Principal) => Promise<RedactedAuthPrincipal | undefined>,
): AuthOperationRecorder {
  return Object.freeze({
    traceContext(): SerializedTraceContext | undefined {
      try {
        return resolveTraceContextFromSpan(span);
      } catch {
        return undefined;
      }
    },
    setAttributes(attributes: AuthTelemetryAttributes): void {
      try {
        span.setAttributes(toSpanAttributes(attributes));
      } catch {
        // Observability must not change auth behavior.
      }
    },
    audit(attributes: AuthTelemetryAttributes = {}): void {
      try {
        span.addEvent(
          AuthSpanEvents.AUDIT_LOG,
          toSpanAttributes({
            ...operationAttributes(input),
            ...attributes,
          }),
        );
      } catch {
        // Observability must not change auth behavior.
      }
    },
    async recordPrincipal(principal: Principal): Promise<RedactedAuthPrincipal | undefined> {
      const redacted = await redactPrincipal(principal);
      if (!redacted) return undefined;
      this.setAttributes({
        [AuthAttributes.SUBJECT_HASH]: redacted.subjectHash,
        [AuthAttributes.PRINCIPAL_SCOPES_COUNT]: redacted.scopesCount,
        [AuthAttributes.PRINCIPAL_ROLES_COUNT]: redacted.rolesCount,
      });
      try {
        span.addEvent(AuthSpanEvents.PRINCIPAL_RESOLVED, {
          [AuthAttributes.SUBJECT_HASH]: redacted.subjectHash,
          [AuthAttributes.PRINCIPAL_SCOPES_COUNT]: redacted.scopesCount,
          [AuthAttributes.PRINCIPAL_ROLES_COUNT]: redacted.rolesCount,
        });
      } catch {
        // Observability must not change auth behavior.
      }
      return redacted;
    },
    async recordSessionIssued(sessionId?: string, subject?: string): Promise<void> {
      await recordSessionEvent(
        span,
        AuthSpanEvents.SESSION_ISSUED,
        sessionId,
        subject,
        subjectHash,
      );
    },
    async recordSessionRevoked(sessionId?: string, subject?: string): Promise<void> {
      await recordSessionEvent(
        span,
        AuthSpanEvents.SESSION_REVOKED,
        sessionId,
        subject,
        subjectHash,
      );
    },
    async setOutcome(outcome: AuthOperationOutcome): Promise<void> {
      const attributes: Record<string, AuthTelemetryAttributeValue> = {
        [AuthAttributes.OUTCOME]: outcome.outcome,
        [AuthAttributes.ERROR_CODE]: outcome.errorCode,
        [AuthAttributes.SESSION_ID]: outcome.sessionId,
        [AuthAttributes.PRINCIPAL_SCOPES_COUNT]: outcome.scopesCount,
        [AuthAttributes.PRINCIPAL_ROLES_COUNT]: outcome.rolesCount,
      };
      if (outcome.subject) {
        attributes[AuthAttributes.SUBJECT_HASH] = await subjectHash(outcome.subject);
      }
      this.setAttributes(attributes);
      this.audit(attributes);
    },
  });
}

async function recordSessionEvent(
  span: Span,
  eventName: string,
  sessionId: string | undefined,
  subject: string | undefined,
  subjectHash: (subject: string) => Promise<string | undefined>,
): Promise<void> {
  try {
    span.addEvent(
      eventName,
      toSpanAttributes({
        [AuthAttributes.SESSION_ID]: sessionId,
        [AuthAttributes.SUBJECT_HASH]: subject ? await subjectHash(subject) : undefined,
      }),
    );
  } catch {
    // Observability must not change auth behavior.
  }
}

function operationAttributes(input: AuthOperationInput): AuthTelemetryAttributes {
  return {
    [AuthAttributes.PROVIDER]: input.providerId,
    [AuthAttributes.BACKEND]: input.backend,
    [AuthAttributes.METHOD]: input.method,
    [AuthAttributes.SESSION_ID]: input.sessionId,
  };
}

function toSpanAttributes(attributes: AuthTelemetryAttributes): Attributes {
  const output: Attributes = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined) {
      output[key] = value;
    }
  }
  return output;
}

function spanNameForOperation(operation: AuthTelemetryOperation): AuthSpanName {
  if (operation === 'signin') return AuthSpanNames.SIGNIN;
  if (operation === 'callback') return AuthSpanNames.CALLBACK;
  if (operation === 'signout') return AuthSpanNames.SIGNOUT;
  if (operation === 'session') return AuthSpanNames.SESSION;
  return AuthSpanNames.ME;
}

/** Map a backend string reason into the auth audit error taxonomy. */
export function authErrorCodeForReason(reason: string | undefined): AuthErrorCodeValue {
  const normalized = reason?.toLowerCase() ?? '';
  if (normalized.includes('credential') || normalized.includes('missing')) {
    return AuthErrorCode.INVALID_CREDENTIALS;
  }
  if (normalized.includes('expired') || normalized.includes('revoked')) {
    return AuthErrorCode.SESSION_EXPIRED;
  }
  if (
    normalized.includes('callback') || normalized.includes('state') || normalized.includes('code')
  ) {
    return AuthErrorCode.CALLBACK_INVALID;
  }
  return AuthErrorCode.PROVIDER_ERROR;
}

/** Map a backend string reason into the auth audit outcome taxonomy. */
export function authOutcomeForReason(reason: string | undefined): AuthOutcomeValue {
  const code = authErrorCodeForReason(reason);
  if (code === AuthErrorCode.INVALID_CREDENTIALS) return AuthOutcome.FAILED_BAD_CREDENTIALS;
  if (code === AuthErrorCode.SESSION_EXPIRED) return AuthOutcome.FAILED_SESSION_EXPIRED;
  if (code === AuthErrorCode.CALLBACK_INVALID) return AuthOutcome.FAILED_CALLBACK_INVALID;
  return AuthOutcome.FAILED_PROVIDER_ERROR;
}
