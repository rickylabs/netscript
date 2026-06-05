import type { TriggerEvent, TriggerEventId, TriggerEventStatus, TriggerId } from '../domain/mod.ts';

/** Event store list filters. */
export type TriggerEventListOptions = Readonly<{
  triggerId?: TriggerId;
  status?: TriggerEventStatus;
  limit?: number;
}>;

/** Persistent trigger event store boundary. */
export interface TriggerEventStorePort {
  save(event: TriggerEvent): Promise<void>;
  load(eventId: TriggerEventId): Promise<TriggerEvent | undefined>;
  updateStatus(
    eventId: TriggerEventId,
    status: TriggerEventStatus,
    metadata?: Readonly<Record<string, unknown>>,
  ): Promise<void>;
  list(options?: TriggerEventListOptions): Promise<readonly TriggerEvent[]>;
}
