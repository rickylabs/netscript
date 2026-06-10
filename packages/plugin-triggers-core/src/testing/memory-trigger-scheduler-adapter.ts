import type {
  ScheduledTriggerPayload,
  ScheduledTriggerSpec,
  TriggerEvent,
  TriggerEventId,
  TriggerId,
} from '../domain/mod.ts';
import type { ScheduledTriggerHandle, TriggerSchedulerPort } from '../ports/mod.ts';

/** Handler invoked by the in-memory scheduled trigger adapter. */
export type ScheduledHandler = (event: TriggerEvent<'scheduled'>) => Promise<void>;
type ScheduleRecord = ScheduledTriggerHandle & Readonly<{ handler: ScheduledHandler }>;

/** In-memory scheduler adapter for scheduled trigger tests. */
export class MemoryTriggerSchedulerAdapter implements TriggerSchedulerPort {
  readonly #records = new Map<string, ScheduleRecord>();
  readonly #now: () => Date;
  #sequence = 0;

  /** Create an in-memory scheduler with an optional clock hook. */
  constructor(options: Readonly<{ now?: () => Date }> = {}) {
    this.#now = options.now ?? (() => new Date());
  }

  /** Register a scheduled trigger and handler. */
  schedule(
    id: TriggerId,
    spec: ScheduledTriggerSpec,
    handler: ScheduledHandler,
  ): Promise<ScheduledTriggerHandle> {
    const handle: ScheduleRecord = {
      id,
      schedule: spec,
      persistent: spec.persistent ?? false,
      nextFireAt: this.#now().toISOString(),
      paused: false,
      handler,
    };
    this.#records.set(id, handle);
    return Promise.resolve(stripHandler(handle));
  }

  /** Remove a scheduled trigger by id. */
  unschedule(id: TriggerId): Promise<boolean> {
    return Promise.resolve(this.#records.delete(id));
  }

  /** List scheduled trigger handles. */
  list(): Promise<readonly ScheduledTriggerHandle[]> {
    return Promise.resolve([...this.#records.values()].map(stripHandler));
  }

  /** Get a scheduled trigger handle by id. */
  get(id: TriggerId): Promise<ScheduledTriggerHandle | undefined> {
    const record = this.#records.get(id);
    return Promise.resolve(record === undefined ? undefined : stripHandler(record));
  }

  /** Pause a scheduled trigger. */
  pause(id: TriggerId): Promise<boolean> {
    return Promise.resolve(this.#setPaused(id, true));
  }

  /** Resume a scheduled trigger. */
  resume(id: TriggerId): Promise<boolean> {
    return Promise.resolve(this.#setPaused(id, false));
  }

  /** Fire a scheduled trigger immediately. */
  async fireNow(id: TriggerId): Promise<boolean> {
    const record = this.#records.get(id);
    if (record === undefined || record.paused) {
      return false;
    }
    await record.handler(this.#eventFor(record));
    return true;
  }

  /** Stop all scheduled trigger handles. */
  stop(): Promise<void> {
    this.#records.clear();
    return Promise.resolve();
  }

  #setPaused(id: TriggerId, paused: boolean): boolean {
    const record = this.#records.get(id);
    if (record === undefined) {
      return false;
    }
    this.#records.set(id, { ...record, paused });
    return true;
  }

  #eventFor(record: ScheduleRecord): TriggerEvent<'scheduled', ScheduledTriggerPayload> {
    const now = this.#now().toISOString();
    this.#sequence += 1;
    return {
      id: `scheduled_${this.#sequence}` as TriggerEventId,
      triggerId: record.id,
      kind: 'scheduled',
      status: 'pending',
      payload: {
        scheduledAt: now,
        firedAt: now,
        cron: record.schedule.cron,
        timezone: record.schedule.timezone,
      },
      attempt: 0,
      detectedAt: now,
      updatedAt: now,
    };
  }
}

function stripHandler(record: ScheduleRecord): ScheduledTriggerHandle {
  return {
    id: record.id,
    schedule: record.schedule,
    persistent: record.persistent,
    nextFireAt: record.nextFireAt,
    paused: record.paused,
  };
}
