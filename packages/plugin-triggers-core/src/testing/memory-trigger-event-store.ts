import type { TriggerEvent, TriggerEventId, TriggerEventStatus } from '../domain/mod.ts';
import type { TriggerEventListOptions, TriggerEventStorePort } from '../ports/mod.ts';

/** In-memory trigger event store for deterministic tests. */
export class MemoryTriggerEventStore implements TriggerEventStorePort {
  readonly #events = new Map<string, TriggerEvent>();
  readonly #order: string[] = [];
  readonly #now: () => Date;

  /** Create an in-memory event store with an optional clock hook. */
  constructor(options: Readonly<{ now?: () => Date }> = {}) {
    this.#now = options.now ?? (() => new Date());
  }

  /** Persist a trigger event in memory. */
  save(event: TriggerEvent): Promise<void> {
    if (!this.#events.has(event.id)) {
      this.#order.push(event.id);
    }
    this.#events.set(event.id, event);
    return Promise.resolve();
  }

  /** Load a trigger event by id. */
  load(eventId: TriggerEventId): Promise<TriggerEvent | undefined> {
    return Promise.resolve(this.#events.get(eventId));
  }

  /** Update the status and metadata for a stored trigger event. */
  updateStatus(
    eventId: TriggerEventId,
    status: TriggerEventStatus,
    metadata?: Readonly<Record<string, unknown>>,
  ): Promise<void> {
    const event = this.#events.get(eventId);
    if (event !== undefined) {
      this.#events.set(eventId, {
        ...event,
        status,
        updatedAt: this.#now().toISOString(),
        metadata: metadata ?? event.metadata,
      });
    }
    return Promise.resolve();
  }

  /** List stored trigger events matching optional filters. */
  list(options: TriggerEventListOptions = {}): Promise<readonly TriggerEvent[]> {
    const events = this.#order
      .map((id) => this.#events.get(id))
      .filter((event): event is TriggerEvent => event !== undefined)
      .filter((event) => matchesEvent(event, options));
    return Promise.resolve(options.limit === undefined ? events : events.slice(0, options.limit));
  }

  /** Clear all stored trigger events. */
  clear(): void {
    this.#events.clear();
    this.#order.splice(0);
  }
}

function matchesEvent(event: TriggerEvent, options: TriggerEventListOptions): boolean {
  return (options.triggerId === undefined || event.triggerId === options.triggerId) &&
    (options.status === undefined || event.status === options.status);
}
