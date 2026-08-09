import type {
  StreamProducerBufferPolicyV1,
  StreamProducerReadinessOptionsV1,
  StreamProducerReconnectPolicyV1,
  StreamProducerStateSnapshotV1,
  StreamWriteReceiptV1,
  StreamWriteRejectionReasonV1,
} from '../domain/producer-contract-v1.ts';
import type { StateSchema, StreamStateDefinition } from '../domain/stream-schema.ts';
import type { StreamProducerClockPort } from '../ports/stream-producer-clock-port.ts';
import type { StreamProducerPort, StreamWriteContextV1 } from '../ports/stream-producer-port.ts';
import type { StreamProducerRandomPort } from '../ports/stream-producer-random-port.ts';
import type { StreamProducerTransportPort } from '../ports/stream-producer-transport-port.ts';
import { DurableStreamProducerTransport } from '../adapters/durable-stream-producer-transport.ts';
import { SystemStreamProducerClock } from '../adapters/system-stream-producer-clock.ts';
import { SystemStreamProducerRandom } from '../adapters/system-stream-producer-random.ts';
import { DurableStreamProducerSupervisor } from './durable-stream-producer-supervisor.ts';
import {
  createStreamsInstrumentation,
  type StreamsInstrumentation,
  type StreamsPublishOperation,
} from '../telemetry/instrumentation.ts';
import { buildStreamUrl, getStreamsAuth } from './stream-url-resolver.ts';

export type { StateSchema, StreamStateDefinition } from '../domain/stream-schema.ts';
export type { StreamProducerPort, StreamWriteContextV1 } from '../ports/stream-producer-port.ts';

/** Options accepted by {@link DurableStreamProducer}. */
export interface DurableStreamProducerOptions<TDef extends StreamStateDefinition> {
  /** Stream path relative to the base URL, for example `/workers/executions`. */
  readonly streamPath: string;
  /** State schema produced by {@link defineStreamSchema}. */
  readonly schema: StateSchema<TDef>;
  /** Stable producer identity for idempotent delivery. */
  readonly producerId: string;
  /** Optional finite reconnect policy overrides. */
  readonly reconnectPolicy?: Partial<StreamProducerReconnectPolicyV1>;
  /** Optional dual buffer policy overrides. */
  readonly bufferPolicy?: Partial<StreamProducerBufferPolicyV1>;
  /** Optional stream instrumentation; defaults to real NetScript telemetry. */
  readonly instrumentation?: StreamsInstrumentation;
  /** Optional protocol transport adapter. */
  readonly transport?: StreamProducerTransportPort;
  /** Optional backoff clock adapter. */
  readonly clock?: StreamProducerClockPort;
  /** Optional reconnect jitter adapter. */
  readonly random?: StreamProducerRandomPort;
  /** Optional lifecycle abort signal. */
  readonly signal?: AbortSignal;
}

/** Server-side writer for a named durable stream. */
export class DurableStreamProducer<TDef extends StreamStateDefinition>
  implements StreamProducerPort {
  /** Stream path owned by this producer. */
  readonly streamPath: string;
  /** Stable fingerprint used to reject incompatible singleton reuse. */
  readonly configurationFingerprint: string;

  readonly #schema: StateSchema<TDef>;
  readonly #producerId: string;
  readonly #instrumentation: StreamsInstrumentation;
  readonly #supervisor: DurableStreamProducerSupervisor;

  /** Create a producer and begin connecting under the finite retry policy. */
  constructor(options: DurableStreamProducerOptions<TDef>) {
    this.streamPath = options.streamPath;
    this.configurationFingerprint = producerFingerprint(options);
    this.#schema = options.schema;
    this.#producerId = options.producerId;
    this.#instrumentation = options.instrumentation ?? createStreamsInstrumentation();
    this.#supervisor = new DurableStreamProducerSupervisor({
      url: resolveRequiredStreamUrl(this.streamPath),
      headers: getStreamsAuth(),
      producerId: options.producerId,
      transport: options.transport ?? new DurableStreamProducerTransport(),
      clock: options.clock ?? new SystemStreamProducerClock(),
      random: options.random ?? new SystemStreamProducerRandom(),
      reconnectPolicy: options.reconnectPolicy,
      bufferPolicy: options.bufferPolicy,
      signal: options.signal,
      onStopped: () => removeProducer(this.streamPath, this),
      onState: (snapshot) =>
        this.#instrumentation.recordState(this.streamPath, this.#producerId, snapshot),
      onBuffer: (events, bytes) =>
        this.#instrumentation.recordBuffer(this.streamPath, this.#producerId, events, bytes),
      onRetry: (phase, attempt, reason) =>
        this.#instrumentation.recordRetry(
          this.streamPath,
          this.#producerId,
          phase,
          attempt,
          reason,
        ),
      onRecovery: (phase, attempt) =>
        this.#instrumentation.recordRecovery(
          this.streamPath,
          this.#producerId,
          phase,
          attempt,
        ),
    });
  }

  /** Current lifecycle and buffer snapshot. */
  get state(): StreamProducerStateSnapshotV1 {
    return this.#supervisor.state;
  }

  /** Whether writes can currently be attempted without reconnecting first. */
  get isReady(): boolean {
    return this.#supervisor.isReady;
  }

  /** Whether shutdown or terminal failure prevents new writes. */
  get closed(): boolean {
    return this.#supervisor.closed;
  }

  /** Resolve on the current or next ready transition. */
  waitUntilReady(options: StreamProducerReadinessOptionsV1 = {}): Promise<void> {
    return this.#supervisor.waitUntilReady(options);
  }

  /** Upsert an entity into a stream collection. */
  upsert<K extends keyof TDef & string>(
    entityType: K,
    value: Record<string, unknown>,
    context?: StreamWriteContextV1,
  ): StreamWriteReceiptV1 {
    if (this.closed) {
      return this.#reject(stateRejection(this.state.state));
    }
    const definition = this.#schema[entityType];
    if (!definition) {
      return this.#reject('invalid-entity');
    }
    const rawKey = value[definition.primaryKey];
    const key = rawKey === undefined || rawKey === null ? '' : String(rawKey);
    if (key === '') {
      return this.#reject('invalid-key');
    }
    return this.#serializeAndEnqueue({
      entityType,
      operation: 'upsert',
      key,
      value,
      context,
      type: definition.type ?? entityType,
    });
  }

  /** Delete an entity from a stream collection by primary key. */
  delete<K extends keyof TDef & string>(
    entityType: K,
    key: string,
    context?: StreamWriteContextV1,
  ): StreamWriteReceiptV1 {
    if (this.closed) {
      return this.#reject(stateRejection(this.state.state));
    }
    const definition = this.#schema[entityType];
    if (!definition) {
      return this.#reject('invalid-entity');
    }
    if (key === '') {
      return this.#reject('invalid-key');
    }
    return this.#serializeAndEnqueue({
      entityType,
      operation: 'delete',
      key,
      context,
      type: definition.type ?? entityType,
    });
  }

  /** Wait for writes accepted before this call. */
  flush(): Promise<void> {
    return this.#supervisor.flush();
  }

  /** Stop local work without sending durable EOF. */
  stop(): Promise<void> {
    return this.#supervisor.stop();
  }

  /** Drain accepted writes, acknowledge durable EOF, and stop. */
  close(): Promise<void> {
    return this.#supervisor.close();
  }

  #serializeAndEnqueue(
    input: Readonly<{
      entityType: string;
      operation: 'upsert' | 'delete';
      type: string;
      key: string;
      value?: Record<string, unknown>;
      context?: StreamWriteContextV1;
    }>,
  ): StreamWriteReceiptV1 {
    const publish = this.#startPublish(
      input.entityType,
      input.operation,
      input.key,
      input.context,
    );
    try {
      const event = JSON.stringify({
        type: input.type,
        key: input.key,
        ...(input.value ? { value: input.value } : {}),
        headers: publish.headers,
      });
      return this.#supervisor.enqueue(event, publish);
    } catch {
      return this.#supervisor.reject('serialization-failed', publish);
    }
  }

  #startPublish(
    entityType: string,
    operation: 'upsert' | 'delete',
    key: string,
    context?: StreamWriteContextV1,
  ): StreamsPublishOperation {
    const correlationId = context?.correlationId?.trim() || key;
    const messageId = context?.messageId?.trim() || key;
    const publish = this.#instrumentation.startPublish({
      streamPath: this.streamPath,
      collection: entityType,
      operation,
      producerId: this.#producerId,
      messageId,
      correlationId,
    });
    return {
      headers: { operation, correlationId, ...publish.headers },
      event: (name, attributes) => publish.event(name, attributes),
      finish: (outcome) => publish.finish(outcome),
    };
  }

  #reject(reason: StreamWriteRejectionReasonV1): StreamWriteReceiptV1 {
    this.#instrumentation.recordRejected(this.streamPath, this.#producerId, reason);
    return this.#supervisor.reject(reason);
  }
}

function stateRejection(
  state: StreamProducerStateSnapshotV1['state'],
): StreamWriteRejectionReasonV1 {
  if (state === 'stopping') {
    return 'producer-stopping';
  }
  if (state === 'stopped') {
    return 'producer-stopped';
  }
  return 'producer-failed';
}

function resolveRequiredStreamUrl(streamPath: string): string {
  try {
    return buildStreamUrl(streamPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `[DurableStreamProducer] Missing plugin reference "streams" for stream "${streamPath}". ` +
        'Install the streams plugin, then run `netscript service generate` to regenerate Aspire wiring. ' +
        message,
    );
  }
}

function producerFingerprint<TDef extends StreamStateDefinition>(
  options: DurableStreamProducerOptions<TDef>,
): string {
  return JSON.stringify({
    producerId: options.producerId,
    reconnectPolicy: options.reconnectPolicy ?? {},
    bufferPolicy: options.bufferPolicy ?? {},
  });
}

const producers = new Map<string, DurableStreamProducer<StreamStateDefinition>>();

function removeProducer(
  streamPath: string,
  producer: DurableStreamProducer<StreamStateDefinition>,
): void {
  if (producers.get(streamPath) === producer) {
    producers.delete(streamPath);
  }
}

/** Create or reuse a compatible durable stream producer for one stream path. */
export function createDurableStream<TDef extends StreamStateDefinition>(
  options: DurableStreamProducerOptions<TDef>,
): DurableStreamProducer<TDef> {
  const existing = producers.get(options.streamPath);
  if (existing && !existing.closed) {
    const fingerprint = producerFingerprint(options);
    if (existing.configurationFingerprint !== fingerprint) {
      throw new Error(`Incompatible durable stream producer options for "${options.streamPath}"`);
    }
    return existing as DurableStreamProducer<TDef>;
  }
  if (existing?.closed) {
    producers.delete(options.streamPath);
  }

  const producer = new DurableStreamProducer(options);
  producers.set(options.streamPath, producer as DurableStreamProducer<StreamStateDefinition>);
  return producer;
}
