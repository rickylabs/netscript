import type { TriggerEvent, TriggerEventId, TriggerId } from '../domain/mod.ts';

/** Dead-letter entry recorded after trigger retry exhaustion. */
export type TriggerDlqEntry = Readonly<{
  id: TriggerEventId;
  triggerId: TriggerId;
  event: TriggerEvent;
  reason: string;
  failedAt: string;
  attempts: number;
}>;

/** Dead-letter list filters. */
export type TriggerDlqListOptions = Readonly<{
  triggerId?: TriggerId;
  since?: Date;
}>;

/** Dead-letter queue boundary for exhausted trigger events. */
export interface TriggerDlqPort {
  enqueue(entry: TriggerDlqEntry): Promise<void>;
  list(options?: TriggerDlqListOptions): Promise<readonly TriggerDlqEntry[]>;
  replay(eventId: TriggerEventId): Promise<void>;
}
