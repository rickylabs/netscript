import type {
  StreamProducerBufferPolicyV1,
  StreamProducerTransportFailureV1,
  StreamWriteOutcomeV1,
  StreamWriteReceiptV1,
  StreamWriteRejectionReasonV1,
} from '../domain/producer-contract-v1.ts';
import type { StreamProducerIdentityV1 } from '../ports/stream-producer-transport-port.ts';
import type { StreamProducerWriteLifecycle } from './durable-stream-producer-supervisor-contract.ts';
import {
  createProducerDeferred,
  type ProducerDeferred,
  rejectedReceipt,
} from './durable-stream-producer-support.ts';

/** One accepted serialized write owned by the FIFO supervisor. */
export interface ProducerQueueEntry {
  readonly id: number;
  readonly body: string;
  readonly byteLength: number;
  readonly deferred: ProducerDeferred<StreamWriteOutcomeV1>;
  readonly lifecycle?: StreamProducerWriteLifecycle;
  attempted: boolean;
  settled: boolean;
  identity?: StreamProducerIdentityV1;
}

/** Bounded FIFO admission and exactly-once local receipt settlement. */
export class DurableStreamProducerQueue {
  readonly #policy: StreamProducerBufferPolicyV1;
  readonly #onBuffer?: (events: number, bytes: number) => void;
  readonly #entries: ProducerQueueEntry[] = [];
  #bufferedBytes = 0;
  #receiptId = 0;

  /** Create a queue under fixed dual bounds. */
  constructor(
    policy: StreamProducerBufferPolicyV1,
    onBuffer?: (events: number, bytes: number) => void,
  ) {
    this.#policy = policy;
    this.#onBuffer = onBuffer;
  }

  /** Current FIFO entries. */
  get entries(): readonly ProducerQueueEntry[] {
    return this.#entries;
  }

  /** Current event count. */
  get length(): number {
    return this.#entries.length;
  }

  /** Current serialized byte count. */
  get bytes(): number {
    return this.#bufferedBytes;
  }

  /** Admit one serialized write or reject newest with an explicit receipt. */
  enqueue(body: string, lifecycle?: StreamProducerWriteLifecycle): StreamWriteReceiptV1 {
    const id = ++this.#receiptId;
    const byteLength = new TextEncoder().encode(body).byteLength;
    if (this.#entries.length >= this.#policy.maxEvents) {
      return rejectedReceipt(id, 'buffer-count-exceeded', lifecycle);
    }
    if (
      byteLength > this.#policy.maxBytes ||
      this.#bufferedBytes + byteLength > this.#policy.maxBytes
    ) {
      return rejectedReceipt(id, 'buffer-bytes-exceeded', lifecycle);
    }
    const deferred = createProducerDeferred<StreamWriteOutcomeV1>();
    this.#entries.push({
      id,
      body,
      byteLength,
      deferred,
      lifecycle,
      attempted: false,
      settled: false,
    });
    this.#bufferedBytes += byteLength;
    this.#changed();
    lifecycle?.event('stream.producer.buffered', {
      'netscript.stream.producer.buffered.events': this.length,
      'netscript.stream.producer.buffered.bytes': this.bytes,
    });
    return { id, accepted: true, completion: deferred.promise };
  }

  /** Reject before queue admission. */
  reject(
    reason: StreamWriteRejectionReasonV1,
    lifecycle?: StreamProducerWriteLifecycle,
  ): StreamWriteReceiptV1 {
    return rejectedReceipt(++this.#receiptId, reason, lifecycle);
  }

  /** Settle and release one accepted entry exactly once. */
  settle(entry: ProducerQueueEntry, outcome: StreamWriteOutcomeV1): void {
    if (entry.settled) {
      return;
    }
    entry.settled = true;
    const index = this.#entries.indexOf(entry);
    if (index >= 0) {
      this.#entries.splice(index, 1);
      this.#bufferedBytes -= entry.byteLength;
      this.#changed();
    }
    entry.lifecycle?.finish(outcome);
    entry.deferred.resolve(outcome);
  }

  /** Add a retry event to every write waiting on initial connection. */
  notifyRetry(
    phase: 'connect' | 'append' | 'close',
    attempt: number,
    reason: StreamProducerTransportFailureV1['kind'],
  ): void {
    for (const entry of this.#entries) {
      entry.lifecycle?.event('stream.producer.retry', {
        'netscript.stream.producer.phase': phase,
        'netscript.stream.producer.attempt': attempt,
        'netscript.stream.producer.reason': reason,
      });
    }
  }

  /** Add a recovery event to every write that waited on initial connection. */
  notifyRecovery(phase: 'connect' | 'append' | 'close', attempt: number): void {
    for (const entry of this.#entries) {
      entry.lifecycle?.event('stream.producer.recovered', {
        'netscript.stream.producer.phase': phase,
        'netscript.stream.producer.attempt': attempt,
      });
    }
  }

  #changed(): void {
    this.#onBuffer?.(this.length, this.bytes);
  }
}
