import type { TriggerEvent, TriggerEventId, TriggerEventStatus } from '../domain/mod.ts';
import type { TriggerEventListOptions, TriggerEventStorePort } from '../ports/mod.ts';

/** Deno KV-backed trigger event store for integration tests. */
export class KvTriggerEventStore implements TriggerEventStorePort {
  readonly #kv: Deno.Kv;
  readonly #prefix: readonly Deno.KvKeyPart[];
  readonly #now: () => Date;

  /** Create a Deno KV event store for integration tests. */
  constructor(
    options: Readonly<{
      kv: Deno.Kv;
      prefix?: readonly Deno.KvKeyPart[];
      now?: () => Date;
    }>,
  ) {
    this.#kv = options.kv;
    this.#prefix = options.prefix ?? ['triggers'];
    this.#now = options.now ?? (() => new Date());
  }

  /** Persist a trigger event in Deno KV. */
  async save(event: TriggerEvent): Promise<void> {
    await this.#kv.atomic()
      .set(this.#eventKey(event.id), event)
      .set(this.#triggerEventKey(event.triggerId, event.id), event.id)
      .commit();
  }

  /** Load a trigger event from Deno KV by id. */
  async load(eventId: TriggerEventId): Promise<TriggerEvent | undefined> {
    const entry = await this.#kv.get<TriggerEvent>(this.#eventKey(eventId));
    return entry.value ?? undefined;
  }

  /** Update the status and metadata for a persisted trigger event. */
  async updateStatus(
    eventId: TriggerEventId,
    status: TriggerEventStatus,
    metadata?: Readonly<Record<string, unknown>>,
  ): Promise<void> {
    const event = await this.load(eventId);
    if (event === undefined) {
      return;
    }
    await this.save({
      ...event,
      status,
      updatedAt: this.#now().toISOString(),
      metadata: metadata ?? event.metadata,
    });
  }

  /** List trigger events from Deno KV matching optional filters. */
  async list(options: TriggerEventListOptions = {}): Promise<readonly TriggerEvent[]> {
    const events: TriggerEvent[] = [];
    for await (const entry of this.#kv.list<TriggerEvent>({ prefix: this.#eventsPrefix() })) {
      if (matchesEvent(entry.value, options)) {
        events.push(entry.value);
      }
      if (options.limit !== undefined && events.length >= options.limit) {
        break;
      }
    }
    return events;
  }

  #eventsPrefix(): Deno.KvKey {
    return [...this.#prefix, 'events'];
  }

  #eventKey(eventId: TriggerEventId): Deno.KvKey {
    return [...this.#eventsPrefix(), eventId];
  }

  #triggerEventKey(triggerId: string, eventId: TriggerEventId): Deno.KvKey {
    return [...this.#prefix, 'by-trigger', triggerId, eventId];
  }
}

function matchesEvent(event: TriggerEvent, options: TriggerEventListOptions): boolean {
  return (options.triggerId === undefined || event.triggerId === options.triggerId) &&
    (options.status === undefined || event.status === options.status);
}
