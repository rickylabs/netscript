import type { TriggerEvent, TriggerEventId, TriggerEventStatus, TriggerId } from '../domain/mod.ts';

/** Event store list filters. */
export type TriggerEventListOptions = Readonly<{
  triggerId?: TriggerId;
  status?: TriggerEventStatus;
  limit?: number;
}>;

/** Persistent trigger event store boundary. */
export interface TriggerEventStorePort {
  /** Persist a trigger event. */
  save(event: TriggerEvent): Promise<void>;
  /** Load a trigger event by id. */
  load(eventId: TriggerEventId): Promise<TriggerEvent | undefined>;
  /** Update the persisted status and metadata for a trigger event. */
  updateStatus(
    eventId: TriggerEventId,
    status: TriggerEventStatus,
    metadata?: Readonly<Record<string, unknown>>,
  ): Promise<void>;
  /** List trigger events matching the optional filters. */
  list(options?: TriggerEventListOptions): Promise<readonly TriggerEvent[]>;
}
