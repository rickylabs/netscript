import {
  DEFAULT_TOPIC,
  type JobDefinition,
  type JobMessage,
} from '@netscript/plugin-workers-core/runtime';
import type { TracedQueue } from './scheduler-tracing.ts';
import { traceJobDispatch } from './scheduler-tracing.ts';
import type { WorkerCronScheduler } from './scheduler-options.ts';

/** Trigger source recorded on scheduler-dispatched job messages. */
export type SchedulerJobTrigger = 'cron' | 'manual' | 'api' | 'event';

/** Dependencies needed to enqueue a scheduler job. */
export interface SchedulerDispatchOptions {
  /** Queue name used for trace attributes. */
  readonly queueName: string;
  /** Queue that receives the job message. */
  readonly queue: TracedQueue<JobMessage> | null;
  /** Cron scheduler used to inspect the next run timestamp. */
  readonly cronScheduler: WorkerCronScheduler;
  /** Job definition to enqueue. */
  readonly job: JobDefinition;
  /** Trigger source for the job message. */
  readonly triggeredBy?: SchedulerJobTrigger;
  /** Optional payload override for the job message. */
  readonly payload?: Record<string, unknown>;
}

/** Enqueue a job with scheduler tracing metadata and message headers. */
export async function enqueueSchedulerJob(options: SchedulerDispatchOptions): Promise<void> {
  if (!options.queue) {
    console.error('[Scheduler] Queue not initialized');
    return;
  }

  const triggeredBy = options.triggeredBy ?? 'cron';
  const cronJob = options.cronScheduler.get(options.job.id);
  const nextRun = cronJob?.nextRun ?? undefined;
  const payload = options.payload ?? options.job.metadata as Record<string, unknown>;

  await traceJobDispatch(
    {
      job: {
        id: options.job.id,
        name: options.job.name,
        schedule: options.job.schedule,
        timezone: options.job.timezone,
        enabled: options.job.enabled,
        entrypoint: options.job.entrypoint,
        timeout: options.job.timeout,
        maxRetries: options.job.maxRetries,
        tags: options.job.tags,
      },
      triggeredBy,
      queueName: options.queueName,
      priority: 50,
      payload,
      nextRun,
    },
    async (headers) => {
      const message: JobMessage = {
        jobId: options.job.id,
        topic: options.job.topic ?? DEFAULT_TOPIC,
        triggeredBy,
        triggeredAt: new Date().toISOString(),
        payload,
        priority: 50,
      };

      await options.queue!.enqueue(message, { headers });
    },
    { root: true },
  );
}
