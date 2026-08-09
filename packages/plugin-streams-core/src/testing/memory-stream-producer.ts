import type { StreamProducerPort } from '../ports/stream-producer-port.ts';
import type {
  StreamProducerReadinessOptionsV1,
  StreamProducerStateSnapshotV1,
  StreamWriteReceiptV1,
} from '../domain/producer-contract-v1.ts';

/** Event recorded by {@link MemoryStreamProducer}. */
export interface MemoryStreamEvent {
  /** Collection or entity type affected by the event. */
  readonly entityType: string;
  /** Operation applied to the entity. */
  readonly operation: 'upsert' | 'delete';
  /** Entity primary key when known. */
  readonly key?: string;
  /** Entity value for upsert events. */
  readonly value?: Record<string, unknown>;
}

/**
 * In-memory stream producer for tests that should not open network sockets.
 *
 * @example
 * ```ts
 * import { MemoryStreamProducer } from "@netscript/plugin-streams-core/testing";
 *
 * const producer = new MemoryStreamProducer();
 * producer.upsert("execution", { id: "exec-1" });
 * ```
 */
export class MemoryStreamProducer implements StreamProducerPort {
  readonly #events: MemoryStreamEvent[] = [];
  #isClosed = false;
  #receiptId = 0;

  /** Current ready or stopped lifecycle snapshot. */
  get state(): StreamProducerStateSnapshotV1 {
    return {
      state: this.#isClosed ? 'stopped' : 'ready',
      attempt: 0,
      bufferedEvents: 0,
      bufferedBytes: 0,
    };
  }

  /** Memory writes are ready until shutdown. */
  get isReady(): boolean {
    return !this.#isClosed;
  }

  /** Whether shutdown prevents new memory writes. */
  get closed(): boolean {
    return this.#isClosed;
  }

  /** List recorded events in insertion order. */
  events(): readonly MemoryStreamEvent[] {
    return [...this.#events];
  }

  /** Upsert an entity into the in-memory event log. */
  upsert(entityType: string, value: Record<string, unknown>): StreamWriteReceiptV1 {
    if (this.#isClosed) {
      return this.#rejectedReceipt();
    }
    this.#events.push({
      entityType,
      operation: 'upsert',
      key: typeof value.id === 'string' ? value.id : undefined,
      value: { ...value },
    });
    return this.#deliveredReceipt();
  }

  /** Delete an entity from the in-memory event log. */
  delete(entityType: string, key: string): StreamWriteReceiptV1 {
    if (this.#isClosed) {
      return this.#rejectedReceipt();
    }
    this.#events.push({ entityType, operation: 'delete', key });
    return this.#deliveredReceipt();
  }

  /** Resolve immediately while the memory producer is ready. */
  waitUntilReady(options: StreamProducerReadinessOptionsV1 = {}): Promise<void> {
    if (options.signal?.aborted) {
      return Promise.reject(options.signal.reason);
    }
    return this.#isClosed ? Promise.reject(new Error('Producer is stopped')) : Promise.resolve();
  }

  /** Resolve immediately because memory writes are synchronous. */
  flush(): Promise<void> {
    return Promise.resolve();
  }

  /** Close the producer and ignore future writes. */
  close(): Promise<void> {
    this.#isClosed = true;
    return Promise.resolve();
  }

  /** Stop the memory producer without additional effects. */
  stop(): Promise<void> {
    return this.close();
  }

  #deliveredReceipt(): StreamWriteReceiptV1 {
    return {
      id: ++this.#receiptId,
      accepted: true,
      completion: Promise.resolve({ status: 'delivered', attempts: 1 }),
    };
  }

  #rejectedReceipt(): StreamWriteReceiptV1 {
    return {
      id: ++this.#receiptId,
      accepted: false,
      completion: Promise.resolve({ status: 'rejected', reason: 'producer-stopped' }),
    };
  }
}
