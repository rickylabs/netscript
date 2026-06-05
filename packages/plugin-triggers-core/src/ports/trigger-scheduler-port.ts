import type { ScheduledTriggerSpec, TriggerEvent, TriggerId } from '../domain/mod.ts';

/** Scheduled trigger handle returned by scheduler adapters. */
export type ScheduledTriggerHandle = Readonly<{
  id: TriggerId;
  schedule: ScheduledTriggerSpec;
  persistent: boolean;
  nextFireAt?: string;
  paused: boolean;
}>;

/** Scheduler stop options. */
export type TriggerSchedulerStopOptions = Readonly<{
  drainTimeoutMs?: number;
}>;

/** Scheduler boundary for scheduled trigger definitions. */
export interface TriggerSchedulerPort {
  schedule(
    id: TriggerId,
    spec: ScheduledTriggerSpec,
    handler: (event: TriggerEvent<'scheduled'>) => Promise<void>,
  ): Promise<ScheduledTriggerHandle>;
  unschedule(id: TriggerId): Promise<boolean>;
  list(): Promise<readonly ScheduledTriggerHandle[]>;
  get(id: TriggerId): Promise<ScheduledTriggerHandle | undefined>;
  pause(id: TriggerId): Promise<boolean>;
  resume(id: TriggerId): Promise<boolean>;
  fireNow(id: TriggerId): Promise<boolean>;
  stop(options?: TriggerSchedulerStopOptions): Promise<void>;
}
