import type {
  StreamProducerBufferPolicyV1,
  StreamProducerReconnectPolicyV1,
  StreamProducerStateSnapshotV1,
  StreamProducerTransportFailureV1,
  StreamWriteOutcomeV1,
} from '../domain/producer-contract-v1.ts';
import type { StreamProducerClockPort } from '../ports/stream-producer-clock-port.ts';
import type { StreamProducerRandomPort } from '../ports/stream-producer-random-port.ts';
import type { StreamProducerTransportPort } from '../ports/stream-producer-transport-port.ts';

/** Per-write telemetry lifecycle retained until receipt settlement. */
export interface StreamProducerWriteLifecycle {
  /** Record one bounded lifecycle event on the write span. */
  event(name: string, attributes?: Readonly<Record<string, string | number>>): void;
  /** End the write span with its exact terminal outcome. */
  finish(outcome: StreamWriteOutcomeV1): void;
}

/** Dependencies and policy accepted by the producer application supervisor. */
export interface DurableStreamProducerSupervisorOptions {
  /** Durable stream URL. */
  readonly url: string;
  /** Request headers, including authorization. */
  readonly headers: Readonly<Record<string, string>>;
  /** Stable producer identity. */
  readonly producerId: string;
  /** Protocol transport adapter. */
  readonly transport: StreamProducerTransportPort;
  /** Backoff clock adapter. */
  readonly clock: StreamProducerClockPort;
  /** Backoff jitter adapter. */
  readonly random: StreamProducerRandomPort;
  /** Optional finite retry overrides. */
  readonly reconnectPolicy?: Partial<StreamProducerReconnectPolicyV1>;
  /** Optional dual buffer overrides. */
  readonly bufferPolicy?: Partial<StreamProducerBufferPolicyV1>;
  /** Optional lifecycle cancellation. */
  readonly signal?: AbortSignal;
  /** Called after local or acknowledged terminal shutdown. */
  readonly onStopped?: () => void;
  /** Observe lifecycle state transitions without affecting policy. */
  readonly onState?: (snapshot: StreamProducerStateSnapshotV1) => void;
  /** Observe current bounded-buffer values. */
  readonly onBuffer?: (events: number, bytes: number) => void;
  /** Observe a retry that consumes another bounded attempt. */
  readonly onRetry?: (
    phase: 'connect' | 'append' | 'close',
    attempt: number,
    reason: StreamProducerTransportFailureV1['kind'],
  ) => void;
  /** Observe successful recovery after retry. */
  readonly onRecovery?: (
    phase: 'connect' | 'append' | 'close',
    attempt: number,
  ) => void;
}
