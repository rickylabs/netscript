/** Legal lifecycle states for a reconnecting durable stream producer. */
export const STREAM_PRODUCER_LIFECYCLE_STATES_V1 = [
  'connecting',
  'ready',
  'backoff',
  'reconnecting',
  'stopping',
  'stopped',
  'failed',
] as const;

/** One legal lifecycle state for a reconnecting durable stream producer. */
export type StreamProducerLifecycleStateV1 = (typeof STREAM_PRODUCER_LIFECYCLE_STATES_V1)[number];

/** Finite retry policy used for connection and delivery attempts. */
export interface StreamProducerReconnectPolicyV1 {
  /** Maximum total attempts for one connection or delivery operation. */
  readonly maxAttempts: number;
  /** Maximum wall time for one transport request before it becomes retryable. */
  readonly requestTimeoutMs: number;
  /** Delay before the second attempt. */
  readonly initialDelayMs: number;
  /** Exponential delay multiplier. */
  readonly multiplier: number;
  /** Maximum delay between attempts. */
  readonly maxDelayMs: number;
  /** Symmetric delay jitter ratio in the inclusive range 0 through 1. */
  readonly jitterRatio: number;
}

/** Default bounded reconnect policy. */
export const DEFAULT_STREAM_PRODUCER_RECONNECT_POLICY_V1: StreamProducerReconnectPolicyV1 = {
  maxAttempts: 8,
  requestTimeoutMs: 5_000,
  initialDelayMs: 100,
  multiplier: 2,
  maxDelayMs: 5_000,
  jitterRatio: 0.2,
};

/** Dual queue bounds for accepted durable stream writes. */
export interface StreamProducerBufferPolicyV1 {
  /** Maximum accepted events that may await acknowledgement. */
  readonly maxEvents: number;
  /** Maximum UTF-8 bytes that may await acknowledgement. */
  readonly maxBytes: number;
}

/** Default bounded producer buffer policy. */
export const DEFAULT_STREAM_PRODUCER_BUFFER_POLICY_V1: StreamProducerBufferPolicyV1 = {
  maxEvents: 256,
  maxBytes: 1_048_576,
};

/** Snapshot of producer readiness and buffered work. */
export interface StreamProducerStateSnapshotV1 {
  /** Current lifecycle state. */
  readonly state: StreamProducerLifecycleStateV1;
  /** Current one-based attempt number, or zero when idle. */
  readonly attempt: number;
  /** Accepted events that have not received acknowledgement. */
  readonly bufferedEvents: number;
  /** UTF-8 bytes retained for those events. */
  readonly bufferedBytes: number;
  /** Most recent failure message, when present. */
  readonly error?: string;
}

/** Reasons a producer rejects a write before accepting it. */
export type StreamWriteRejectionReasonV1 =
  | 'invalid-entity'
  | 'invalid-key'
  | 'serialization-failed'
  | 'buffer-count-exceeded'
  | 'buffer-bytes-exceeded'
  | 'producer-stopping'
  | 'producer-stopped'
  | 'producer-failed';

/** Reasons an accepted write is cancelled before its first delivery attempt. */
export type StreamWriteCancellationReasonV1 = 'producer-stopped' | 'producer-failed';

/** Reasons an attempted write cannot be reported as delivered or rejected. */
export type StreamWriteUnknownReasonV1 =
  | 'retry-exhausted'
  /** The transport positively refused the write with a non-retryable failure. */
  | 'transport-refused'
  | 'transport-aborted'
  | 'producer-stopped';

/** Terminal outcome of one durable stream write. */
export type StreamWriteOutcomeV1 =
  | Readonly<{ status: 'delivered'; attempts: number }>
  | Readonly<{ status: 'rejected'; reason: StreamWriteRejectionReasonV1 }>
  | Readonly<{ status: 'cancelled'; reason: StreamWriteCancellationReasonV1 }>
  | Readonly<{ status: 'delivery-unknown'; reason: StreamWriteUnknownReasonV1; error?: string }>;

/** Immediate acceptance plus eventual terminal outcome for one write. */
export interface StreamWriteReceiptV1 {
  /** Producer-local monotonically increasing write identity. */
  readonly id: number;
  /** Whether the write entered the bounded FIFO. */
  readonly accepted: boolean;
  /** Eventual terminal result; rejected writes expose an already-settled promise. */
  readonly completion: Promise<StreamWriteOutcomeV1>;
}

/** Options for waiting on the next ready transition. */
export interface StreamProducerReadinessOptionsV1 {
  /** Optional caller cancellation. */
  readonly signal?: AbortSignal;
}

/** Stable failure categories translated by the durable-stream transport adapter. */
export type StreamProducerTransportFailureKindV1 =
  | 'retryable'
  | 'stale-epoch'
  | 'sequence-gap'
  | 'stream-closed'
  | 'non-retryable'
  | 'aborted';

/** Transport failure understood by the application supervisor. */
export interface StreamProducerTransportFailureV1 {
  /** Stable failure category. */
  readonly kind: StreamProducerTransportFailureKindV1;
  /** Operator-safe failure message. */
  readonly message: string;
  /** Current server epoch supplied with a stale-epoch response. */
  readonly currentEpoch?: number;
}
