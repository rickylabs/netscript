/**
 * Semantic scheduler attribute names used by scheduler instrumentation.
 */
export const SchedulerAttributes = {
  SCHEDULER_ID: 'netscript.scheduler.id',
  SCHEDULER_CRON: 'netscript.scheduler.cron',
  SCHEDULER_NEXT_RUN: 'netscript.scheduler.next_run',
  SCHEDULER_LAST_RUN: 'netscript.scheduler.last_run',
  SCHEDULER_JOB_COUNT: 'netscript.scheduler.job_count',
  SCHEDULER_ENABLED: 'netscript.scheduler.enabled',
  SCHEDULER_DUE_JOBS: 'netscript.scheduler.due_jobs',
  SCHEDULER_DUE_JOB_IDS: 'netscript.scheduler.due_job_ids',
  SCHEDULER_TICK_TIME: 'netscript.scheduler.tick_time',
  SCHEDULER_PREVIOUS_JOB_COUNT: 'netscript.scheduler.previous_job_count',
  SCHEDULER_NEW_JOB_COUNT: 'netscript.scheduler.new_job_count',
} as const;
