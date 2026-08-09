import type {
  StreamSchemaIssue,
  StreamSchemaValidationOptions,
  StreamSchemaValidationResult,
} from './stream-schema.ts';
import type { Operation } from './stream-event.ts';

/** Version identifier for the first NetScript stream SSE consumer contract. */
export const STREAM_SSE_PROTOCOL_VERSION_V1 = '1' as const;

/** Actual event names emitted by the durable-stream SSE wire protocol. */
export const STREAM_SSE_WIRE_EVENT_NAMES_V1: readonly ['data', 'control'] = [
  'data',
  'control',
];

/** Validated outcomes delivered by the NetScript SSE consumer binding. */
export const STREAM_SSE_CONSUMER_EVENT_NAMES_V1: readonly [
  'data',
  'control',
  'heartbeat',
  'error',
] = ['data', 'control', 'heartbeat', 'error'];

/** A server-owned replay token. It is opaque and must never be parsed or incremented. */
export type StreamSseOffsetV1 = string;

/** Actual event names accepted from the durable-stream SSE wire. */
export type StreamSseWireEventNameV1 = (typeof STREAM_SSE_WIRE_EVENT_NAMES_V1)[number];

/** Exhaustive event names emitted to a validated consumer. */
export type StreamSseConsumerEventNameV1 = (typeof STREAM_SSE_CONSUMER_EVENT_NAMES_V1)[number];

/** Required correlation and W3C propagation headers on each data change. */
export interface StreamSseChangeHeadersV1 extends Readonly<Record<string, unknown>> {
  /** State Protocol mutation kind. */
  readonly operation: Operation;
  /** Explicit write correlation identity, or the entity key when the producer receives none. */
  readonly correlationId: string;
  /** Valid W3C trace context captured at publish time and preserved verbatim on replay. */
  readonly traceparent: string;
  /** Optional W3C vendor trace state captured and preserved with `traceparent`. */
  readonly tracestate?: string;
}

/** One validated State Protocol entity change. */
export interface StreamSseChangeV1<T = unknown> {
  /** Collection/type discriminator. */
  readonly type: string;
  /** Entity primary key. */
  readonly key: string;
  /** Mutation, correlation, and W3C propagation metadata. */
  readonly headers: StreamSseChangeHeadersV1;
  /** Entity state. Delete changes omit this property. */
  readonly value?: T;
}

/** A non-empty, wire-ordered batch of entity changes. */
export type StreamSseDataPayloadV1<T = unknown> = readonly [
  StreamSseChangeV1<T>,
  ...StreamSseChangeV1<T>[],
];

/** Offset and lifecycle frame emitted as the named `control` SSE event. */
export interface StreamSseControlPayloadV1 {
  /** Next opaque offset to use after this frame is processed successfully. */
  readonly streamNextOffset: StreamSseOffsetV1;
  /** Optional server cursor observed with this offset; not currently a resume input. */
  readonly streamCursor?: string;
  /** Whether the stream was caught up when the control frame was emitted. */
  readonly upToDate?: boolean;
  /** Whether the durable stream is terminal. */
  readonly streamClosed?: boolean;
}

/** An up-to-date control frame received without pending data. */
export interface StreamSseHeartbeatPayloadV1 extends StreamSseControlPayloadV1 {
  /** Heartbeats are derived from up-to-date controls, not a third wire event. */
  readonly upToDate: true;
  /** A terminal control is surfaced as `control`, never as a heartbeat. */
  readonly streamClosed?: false;
}

/** Stable error categories emitted by the v1 consumer. */
export type StreamSseErrorCodeV1 =
  | 'malformed-frame'
  | 'unsupported-event'
  | 'transport-error';

/** A normalized parsing or transport failure that never advances replay state. */
export interface StreamSseErrorPayloadV1 {
  /** Stable machine-readable failure category. */
  readonly code: StreamSseErrorCodeV1;
  /** Wire event name associated with the failure. */
  readonly eventName: string;
  /** Human-readable diagnostic. */
  readonly message: string;
  /** Whether reconnect policy may retry the transport operation. */
  readonly retryable: boolean;
  /** Last successfully committed opaque offset, when one exists. */
  readonly lastCommittedOffset?: StreamSseOffsetV1;
}

/** A parsed, schema-valid wire frame. */
export type StreamSseWireFrameV1<T = unknown> =
  | Readonly<{ event: 'data'; payload: StreamSseDataPayloadV1<T> }>
  | Readonly<{ event: 'control'; payload: StreamSseControlPayloadV1 }>;

/** A validated event delivered to a NetScript SSE consumer. */
export type StreamSseConsumerEventV1<T = unknown> =
  | Readonly<{ event: 'data'; payload: StreamSseDataPayloadV1<T> }>
  | Readonly<{ event: 'control'; payload: StreamSseControlPayloadV1 }>
  | Readonly<{ event: 'heartbeat'; payload: StreamSseHeartbeatPayloadV1 }>
  | Readonly<{ event: 'error'; payload: StreamSseErrorPayloadV1 }>;

/** Standard-Schema-compatible synchronous validator owned by this package. */
export interface StreamSseSchemaV1<T> {
  /** Standard Schema metadata and synchronous validator. */
  readonly '~standard': {
    /** Standard Schema version marker. */
    readonly version: 1;
    /** Schema provider identifier. */
    readonly vendor: '@netscript/plugin-streams-core';
    /** Validate an unknown value without exposing a private validator type. */
    readonly validate: (
      value: unknown,
      options?: StreamSchemaValidationOptions,
    ) => StreamSchemaValidationResult<T>;
  };
}

/** Runtime schemas and exhaustive names that define the v1 contract. */
export interface StreamSseContractV1 {
  /** Contract version. This version is operational rather than an added wire field. */
  readonly version: '1';
  /** Exact event names accepted from the upstream SSE protocol. */
  readonly wireEventNames: readonly ['data', 'control'];
  /** Exact normalized event names delivered to consumers. */
  readonly consumerEventNames: readonly ['data', 'control', 'heartbeat', 'error'];
  /** Package-owned runtime schemas for every payload kind. */
  readonly schemas: {
    /** Non-empty entity change batch schema. */
    readonly data: StreamSseSchemaV1<StreamSseDataPayloadV1>;
    /** Offset/lifecycle control schema. */
    readonly control: StreamSseSchemaV1<StreamSseControlPayloadV1>;
    /** Derived keepalive outcome schema. */
    readonly heartbeat: StreamSseSchemaV1<StreamSseHeartbeatPayloadV1>;
    /** Normalized failure schema. */
    readonly error: StreamSseSchemaV1<StreamSseErrorPayloadV1>;
  };
}

const OPERATIONS: readonly Operation[] = ['insert', 'update', 'delete', 'upsert'];
const TRACEPARENT_PATTERN = /^[\da-f]{2}-[\da-f]{32}-[\da-f]{16}-[\da-f]{2}$/i;

function issue(message: string): StreamSchemaValidationResult<never> {
  const issues: readonly StreamSchemaIssue[] = [{ message }];
  return { issues };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isOperation(value: unknown): value is Operation {
  return value === OPERATIONS[0] || value === OPERATIONS[1] || value === OPERATIONS[2] ||
    value === OPERATIONS[3];
}

function isChange(value: unknown): value is StreamSseChangeV1 {
  if (!isRecord(value) || !isNonEmptyString(value.type) || !isNonEmptyString(value.key)) {
    return false;
  }
  const headers = value.headers;
  if (
    !isRecord(headers) || !isOperation(headers.operation) ||
    !isNonEmptyString(headers.correlationId) ||
    typeof headers.traceparent !== 'string' || !TRACEPARENT_PATTERN.test(headers.traceparent) ||
    (headers.tracestate !== undefined && !isNonEmptyString(headers.tracestate))
  ) {
    return false;
  }
  const hasValue = Object.hasOwn(value, 'value');
  return headers.operation === 'delete' ? !hasValue : hasValue;
}

function isDataPayload(value: unknown): value is StreamSseDataPayloadV1 {
  return Array.isArray(value) && value.length > 0 && value.every(isChange);
}

function isControlPayload(value: unknown): value is StreamSseControlPayloadV1 {
  return isRecord(value) && isNonEmptyString(value.streamNextOffset) &&
    (value.streamCursor === undefined || typeof value.streamCursor === 'string') &&
    (value.upToDate === undefined || typeof value.upToDate === 'boolean') &&
    (value.streamClosed === undefined || typeof value.streamClosed === 'boolean');
}

function isHeartbeatPayload(value: unknown): value is StreamSseHeartbeatPayloadV1 {
  return isControlPayload(value) && value.upToDate === true && value.streamClosed !== true;
}

function isErrorPayload(value: unknown): value is StreamSseErrorPayloadV1 {
  return isRecord(value) &&
    (value.code === 'malformed-frame' || value.code === 'unsupported-event' ||
      value.code === 'transport-error') &&
    typeof value.eventName === 'string' && isNonEmptyString(value.message) &&
    typeof value.retryable === 'boolean' &&
    (value.lastCommittedOffset === undefined || isNonEmptyString(value.lastCommittedOffset));
}

function createSchema<T>(
  label: string,
  predicate: (value: unknown) => value is T,
): StreamSseSchemaV1<T> {
  return {
    '~standard': {
      version: 1,
      vendor: '@netscript/plugin-streams-core',
      validate: (value: unknown): StreamSchemaValidationResult<T> =>
        predicate(value) ? { value } : issue(`Invalid ${label} payload`),
    },
  };
}

/** Single runtime authority for NetScript's versioned stream SSE envelope. */
export const STREAM_SSE_CONTRACT_V1: StreamSseContractV1 = {
  version: STREAM_SSE_PROTOCOL_VERSION_V1,
  wireEventNames: STREAM_SSE_WIRE_EVENT_NAMES_V1,
  consumerEventNames: STREAM_SSE_CONSUMER_EVENT_NAMES_V1,
  schemas: {
    data: createSchema('data', isDataPayload),
    control: createSchema('control', isControlPayload),
    heartbeat: createSchema('heartbeat', isHeartbeatPayload),
    error: createSchema('error', isErrorPayload),
  },
};
