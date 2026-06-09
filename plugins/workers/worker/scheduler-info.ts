import type { ScheduledJobInfo, WorkerCronScheduler } from './scheduler-options.ts';

type CronJobSnapshot = ReturnType<WorkerCronScheduler['list']>[number];

/** Convert a cron scheduler job snapshot into the public scheduled-job shape. */
export function toScheduledJobInfo(cronJob: CronJobSnapshot): ScheduledJobInfo {
  return {
    jobId: cronJob.id,
    schedule: cronJob.schedule,
    timezone: cronJob.timezone,
    enabled: cronJob.enabled,
    nextRun: cronJob.nextRun,
    lastRun: cronJob.lastRun,
    runCount: cronJob.runCount,
  };
}
