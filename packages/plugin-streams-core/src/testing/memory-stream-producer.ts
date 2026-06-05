import type { StreamProducerPort } from '../ports/stream-producer-port.ts';

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
  #closed = false;

  /** List recorded events in insertion order. */
  events(): readonly MemoryStreamEvent[] {
    return [...this.#events];
  }

  /** Upsert an entity into the in-memory event log. */
  upsert(entityType: string, value: Record<string, unknown>): void {
    if (this.#closed) {
      return;
    }
    this.#events.push({
      entityType,
      operation: 'upsert',
      key: typeof value.id === 'string' ? value.id : undefined,
      value: { ...value },
    });
  }

  /** Delete an entity from the in-memory event log. */
  delete(entityType: string, key: string): void {
    if (this.#closed) {
      return;
    }
    this.#events.push({ entityType, operation: 'delete', key });
  }

  /** Resolve immediately because memory writes are synchronous. */
  flush(): Promise<void> {
    return Promise.resolve();
  }

  /** Close the producer and ignore future writes. */
  close(): Promise<void> {
    this.#closed = true;
    return Promise.resolve();
  }
}
