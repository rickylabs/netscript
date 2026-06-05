import {
  createScheduler,
  type CreateSchedulerOptions,
  type CronScheduler,
  type JobContext,
  type ScheduledJob,
} from '@netscript/cron';
import {
  type ScheduledTriggerPayload,
  type ScheduledTriggerSpec,
  type TriggerEvent,
  type TriggerEventId,
  type TriggerId,
  TriggersError,
} from '@netscript/plugin-triggers-core/domain';
import type {
  ScheduledTriggerHandle,
  TriggerSchedulerPort,
  TriggerSchedulerStopOptions,
} from '@netscript/plugin-triggers-core/ports';

type ScheduledHandler = (event: TriggerEvent<'scheduled'>) => Promise<void>;

type CronScheduleRecord = Readonly<{
  id: TriggerId;
  spec: ScheduledTriggerSpec;
  handler: ScheduledHandler;
}>;

export type CronTriggerErrorContext = Readonly<{
  id: TriggerId;
  schedule: ScheduledTriggerSpec;
}>;

export type CronTriggerSchedulerAdapterOptions = Readonly<{
  scheduler?: CronScheduler;
  schedulerOptions?: CreateSchedulerOptions;
  onError?: (error: unknown, context: CronTriggerErrorContext) => void | Promise<void>;
}>;

/** Scheduled-trigger adapter that wraps the standalone `@netscript/cron` primitive. */
export class CronTriggerSchedulerAdapter implements TriggerSchedulerPort {
  readonly #scheduler: CronScheduler;
  readonly #records = new Map<string, CronScheduleRecord>();
  readonly #inFlight = new Set<Promise<void>>();
  readonly #onError?: (error: unknown, context: CronTriggerErrorContext) => void | Promise<void>;
  #sequence = 0;

  constructor(options: CronTriggerSchedulerAdapterOptions = {}) {
    this.#scheduler = options.scheduler ?? createScheduler(options.schedulerOptions);
    this.#onError = options.onError;
  }

  async schedule(
    id: TriggerId,
    spec: ScheduledTriggerSpec,
    handler: ScheduledHandler,
  ): Promise<ScheduledTriggerHandle> {
    if (spec.persistent === true) {
      throw TriggersError.unsupportedOperation(
        'scheduled-trigger.persistent',
        'Persistent scheduled triggers are reserved until Deno persistent cron support lands.',
      );
    }

    await this.unschedule(id);

    const record: CronScheduleRecord = { id, spec, handler };
    const job = await this.#scheduler.schedule(
      id,
      spec.cron,
      (context) => this.#dispatch(record, context),
      {
        timezone: spec.timezone,
        enabled: true,
        metadata: {
          triggerId: id,
          persistent: false,
        },
      },
    );
    this.#records.set(id, record);
    return handleFromJob(record, job);
  }

  async unschedule(id: TriggerId): Promise<boolean> {
    this.#records.delete(id);
    return await this.#scheduler.unschedule(id);
  }

  list(): Promise<readonly ScheduledTriggerHandle[]> {
    return Promise.resolve(
      [...this.#records.values()]
        .map((record) => {
          const job = this.#scheduler.get(record.id);
          return job === undefined ? undefined : handleFromJob(record, job);
        })
        .filter((handle): handle is ScheduledTriggerHandle => handle !== undefined),
    );
  }

  get(id: TriggerId): Promise<ScheduledTriggerHandle | undefined> {
    const record = this.#records.get(id);
    const job = this.#scheduler.get(id);
    return Promise.resolve(
      record === undefined || job === undefined ? undefined : handleFromJob(record, job),
    );
  }

  pause(id: TriggerId): Promise<boolean> {
    return this.#scheduler.disable(id);
  }

  resume(id: TriggerId): Promise<boolean> {
    return this.#scheduler.enable(id);
  }

  fireNow(id: TriggerId): Promise<boolean> {
    return this.#scheduler.trigger(id);
  }

  async stop(options: TriggerSchedulerStopOptions = {}): Promise<void> {
    await this.#scheduler.stop();
    this.#records.clear();
    if (this.#inFlight.size === 0) {
      return;
    }
    await waitForInFlight(this.#inFlight, options.drainTimeoutMs);
  }

  #dispatch(record: CronScheduleRecord, context: JobContext): Promise<void> {
    const run = this.#runHandler(record, context);
    this.#inFlight.add(run);
    return run.finally(() => {
      this.#inFlight.delete(run);
    });
  }

  async #runHandler(record: CronScheduleRecord, context: JobContext): Promise<void> {
    try {
      await record.handler(this.#eventFor(record, context));
    } catch (error) {
      await this.#reportError(error, {
        id: record.id,
        schedule: record.spec,
      });
    }
  }

  async #reportError(error: unknown, context: CronTriggerErrorContext): Promise<void> {
    try {
      await this.#onError?.(error, context);
    } catch {
      // Scheduled callbacks must not reject back into the primitive scheduler.
    }
  }

  #eventFor(
    record: CronScheduleRecord,
    context: JobContext,
  ): TriggerEvent<'scheduled', ScheduledTriggerPayload> {
    this.#sequence += 1;
    const scheduledAt = context.scheduledTime.toISOString();
    const firedAt = context.actualTime.toISOString();
    return {
      id: `scheduled_${this.#sequence}` as TriggerEventId,
      triggerId: record.id,
      kind: 'scheduled',
      status: 'pending',
      payload: {
        scheduledAt,
        firedAt,
        cron: record.spec.cron,
        timezone: record.spec.timezone,
      },
      attempt: context.attempt,
      detectedAt: firedAt,
      updatedAt: firedAt,
    };
  }
}

function handleFromJob(
  record: CronScheduleRecord,
  job: ScheduledJob,
): ScheduledTriggerHandle {
  return {
    id: record.id,
    schedule: record.spec,
    persistent: false,
    nextFireAt: job.nextRun?.toISOString(),
    paused: !job.enabled,
  };
}

async function waitForInFlight(
  inFlight: Set<Promise<void>>,
  drainTimeoutMs?: number,
): Promise<void> {
  const drained = Promise.allSettled([...inFlight]).then(() => undefined);
  if (drainTimeoutMs === undefined) {
    await drained;
    return;
  }
  await Promise.race([
    drained,
    new Promise<void>((resolve) => setTimeout(resolve, drainTimeoutMs)),
  ]);
}
