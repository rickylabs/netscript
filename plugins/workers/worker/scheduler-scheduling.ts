import type { JobDefinition } from '@netscript/plugin-workers-core/runtime';
import { createJobScheduleSpan, recordJobScheduled } from './scheduler-tracing.ts';
import type { WorkerCronScheduler } from './scheduler-options.ts';

/** Dependencies needed to register a job with the cron scheduler. */
export interface ScheduleRegistryJobOptions {
  /** Job definition to schedule. */
  readonly job: JobDefinition;
  /** Map of worker job ids to cron scheduler job ids. */
  readonly scheduledJobs: Map<string, string>;
  /** Cron scheduler adapter. */
  readonly cronScheduler: WorkerCronScheduler;
  /** Callback invoked when the cron adapter fires. */
  readonly enqueueCronJob: (job: JobDefinition) => Promise<void>;
}

/** Schedule a single registry job with telemetry around cron registration. */
export async function scheduleRegistryJob(
  options: ScheduleRegistryJobOptions,
): Promise<void> {
  const { job, scheduledJobs, cronScheduler, enqueueCronJob } = options;
  if (!job.schedule) {
    return;
  }

  if (scheduledJobs.has(job.id)) {
    console.warn(`[Scheduler] Job '${job.id}' already scheduled`);
    return;
  }

  const scheduleSpan = createJobScheduleSpan(job);

  try {
    const cronJob = await cronScheduler.schedule(
      job.id,
      job.schedule,
      async () => {
        await enqueueCronJob(job);
      },
      {
        timezone: job.timezone,
        enabled: job.enabled,
        metadata: {
          jobId: job.id,
          entrypoint: job.entrypoint,
        },
      },
    );

    scheduledJobs.set(job.id, cronJob.id);
    recordJobScheduled(scheduleSpan, job);

    console.log(
      `[Scheduler] Scheduled job '${job.id}' with schedule '${job.schedule}'`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    scheduleSpan.recordException(error instanceof Error ? error : new Error(message));
    console.error(`[Scheduler] Failed to schedule job '${job.id}':`, error);
  } finally {
    scheduleSpan.end();
  }
}
