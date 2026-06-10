import { createScheduler } from '@netscript/cron';
import type { CreateSchedulerOptions } from '@netscript/cron';
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

/** Cron provider selector accepted by the runtime adapter. */
export type RuntimeCronProvider =
  | 'deno'
  | 'memory'
  | 'node'
  | 'temporal'
  | (string & Record<never, never>);

/** Minimal scheduler options consumed by the runtime adapter. */
export type RuntimeCronSchedulerOptions = Readonly<{
  provider?: RuntimeCronProvider;
  tickInterval?: number;
}>;

/** Context supplied to runtime cron callbacks. */
export type RuntimeCronJobContext = Readonly<{
  scheduledTime: Date;
  actualTime: Date;
  attempt: number;
}>;

/** Minimal scheduled job handle consumed by the runtime adapter. */
export type RuntimeCronScheduledJob = Readonly<{
  nextRun?: Date;
  enabled: boolean;
}>;

/** Minimal cron scheduler surface consumed by the runtime adapter. */
export type RuntimeCronScheduler = Readonly<{
  schedule(
    id: string,
    cron: string,
    handler: (context: RuntimeCronJobContext) => void | Promise<void>,
    options?: Readonly<Record<string, unknown>>,
  ): Promise<RuntimeCronScheduledJob>;
  unschedule(id: string): Promise<boolean>;
  get(id: string): RuntimeCronScheduledJob | undefined;
  disable(id: string): Promise<boolean>;
  enable(id: string): Promise<boolean>;
  trigger(id: string): Promise<boolean>;
  stop(): Promise<void>;
}>;

/** Handler invoked when a scheduled trigger fires. */
export type ScheduledHandler = (event: TriggerEvent<'scheduled'>) => Promise<void>;

type CronScheduleRecord = Readonly<{
  id: TriggerId;
  spec: ScheduledTriggerSpec;
  handler: ScheduledHandler;
}>;

/** Error context emitted when a scheduled trigger callback fails. */
export type CronTriggerErrorContext = Readonly<{
  id: TriggerId;
  schedule: ScheduledTriggerSpec;
}>;

/** Options for constructing a cron-backed trigger scheduler adapter. */
export type CronTriggerSchedulerAdapterOptions = Readonly<{
  scheduler?: RuntimeCronScheduler;
  schedulerOptions?: RuntimeCronSchedulerOptions;
  onError?: (error: unknown, context: CronTriggerErrorContext) => void | Promise<void>;
}>;

/** Scheduled-trigger adapter that wraps the standalone `@netscript/cron` primitive. */
export class CronTriggerSchedulerAdapter implements TriggerSchedulerPort {
  readonly #scheduler: RuntimeCronScheduler;
  readonly #records = new Map<string, CronScheduleRecord>();
  readonly #inFlight = new Set<Promise<void>>();
  readonly #onError?: (error: unknown, context: CronTriggerErrorContext) => void | Promise<void>;
  #sequence = 0;

  /** Create a scheduler adapter with an optional injected cron scheduler. */
  constructor(options: CronTriggerSchedulerAdapterOptions = {}) {
    this.#scheduler = options.scheduler ??
      (createScheduler(
        options.schedulerOptions as CreateSchedulerOptions | undefined,
      ) as RuntimeCronScheduler);
    this.#onError = options.onError;
  }

  /** Register a scheduled trigger and return its runtime handle. */
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

  /** Remove a scheduled trigger if it exists. */
  async unschedule(id: TriggerId): Promise<boolean> {
    this.#records.delete(id);
    return await this.#scheduler.unschedule(id);
  }

  /** List handles for every active scheduled trigger. */
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

  /** Resolve a scheduled trigger handle by id. */
  get(id: TriggerId): Promise<ScheduledTriggerHandle | undefined> {
    const record = this.#records.get(id);
    const job = this.#scheduler.get(id);
    return Promise.resolve(
      record === undefined || job === undefined ? undefined : handleFromJob(record, job),
    );
  }

  /** Pause a scheduled trigger without removing it. */
  pause(id: TriggerId): Promise<boolean> {
    return this.#scheduler.disable(id);
  }

  /** Resume a paused scheduled trigger. */
  resume(id: TriggerId): Promise<boolean> {
    return this.#scheduler.enable(id);
  }

  /** Fire a scheduled trigger immediately. */
  fireNow(id: TriggerId): Promise<boolean> {
    return this.#scheduler.trigger(id);
  }

  /** Stop the scheduler and optionally drain in-flight handlers. */
  async stop(options: TriggerSchedulerStopOptions = {}): Promise<void> {
    await this.#scheduler.stop();
    this.#records.clear();
    if (this.#inFlight.size === 0) {
      return;
    }
    await waitForInFlight(this.#inFlight, options.drainTimeoutMs);
  }

  #dispatch(record: CronScheduleRecord, context: RuntimeCronJobContext): Promise<void> {
    const run = this.#runHandler(record, context);
    this.#inFlight.add(run);
    return run.finally(() => {
      this.#inFlight.delete(run);
    });
  }

  async #runHandler(record: CronScheduleRecord, context: RuntimeCronJobContext): Promise<void> {
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
    context: RuntimeCronJobContext,
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
  job: RuntimeCronScheduledJob,
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
