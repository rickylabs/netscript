import type { DeferAction, TriggerEvent, TriggerId } from '../domain/mod.ts';

/** Durable record for one deferred trigger replay. */
export type TriggerDeferRecord = Readonly<{
  id: string;
  triggerId: TriggerId;
  event: TriggerEvent;
  until: string;
  createdAt: string;
}>;

/** Input persisted when a handler emits a defer action. */
export type TriggerDeferScheduleInput = Readonly<{
  action: DeferAction;
  event: TriggerEvent;
}>;

/** Outcome of attempting one due replay. */
export type TriggerDeferReplayResult = Readonly<{
  record: TriggerDeferRecord;
  status: 'replayed' | 'failed';
  error?: string;
}>;

/** Options for the scheduler wake loop. */
export type TriggerDeferRunOptions = Readonly<{
  signal?: AbortSignal;
  pollIntervalMs?: number;
}>;

/** Durable one-shot scheduling boundary for deferred trigger events. */
export interface TriggerDeferSchedulerPort {
  /** Persist one trigger event for replay at the action's due time. */
  schedule(input: TriggerDeferScheduleInput): Promise<TriggerDeferRecord>;
  /** Cancel a pending replay by record id. */
  cancel(id: string): Promise<boolean>;
  /** List pending replay records. */
  list(): Promise<readonly TriggerDeferRecord[]>;
  /** Replay every record due at the scheduler clock's current time. */
  replayDue(
    replay: (record: TriggerDeferRecord) => Promise<void>,
  ): Promise<readonly TriggerDeferReplayResult[]>;
  /** Run the wake loop until aborted. */
  run(
    replay: (record: TriggerDeferRecord) => Promise<void>,
    options?: TriggerDeferRunOptions,
  ): Promise<void>;
}
