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
  /** Register a scheduled trigger and event handler. */
  schedule(
    id: TriggerId,
    spec: ScheduledTriggerSpec,
    handler: (event: TriggerEvent<'scheduled'>) => Promise<void>,
  ): Promise<ScheduledTriggerHandle>;
  /** Remove a scheduled trigger by id. */
  unschedule(id: TriggerId): Promise<boolean>;
  /** List active scheduled triggers. */
  list(): Promise<readonly ScheduledTriggerHandle[]>;
  /** Get an active scheduled trigger by id. */
  get(id: TriggerId): Promise<ScheduledTriggerHandle | undefined>;
  /** Pause dispatch for a scheduled trigger. */
  pause(id: TriggerId): Promise<boolean>;
  /** Resume dispatch for a scheduled trigger. */
  resume(id: TriggerId): Promise<boolean>;
  /** Fire a scheduled trigger immediately. */
  fireNow(id: TriggerId): Promise<boolean>;
  /** Stop scheduler resources, optionally draining in-flight work. */
  stop(options?: TriggerSchedulerStopOptions): Promise<void>;
}
