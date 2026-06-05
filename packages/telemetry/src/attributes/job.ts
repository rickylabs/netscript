export const JobAttributes = {
  JOB_ID: 'job.id',
  JOB_NAME: 'job.name',
  JOB_ENTRYPOINT: 'job.entrypoint',
  JOB_TRIGGER: 'job.trigger',
  JOB_ATTEMPT: 'job.attempt',
  JOB_MAX_RETRIES: 'job.max_retries',
  JOB_TIMEOUT_MS: 'job.timeout_ms',
  JOB_STATUS: 'job.status',
  JOB_EXIT_CODE: 'job.exit_code',
  JOB_DURATION_MS: 'job.duration_ms',
  JOB_PRIORITY: 'job.priority',
  JOB_TAGS: 'job.tags',
  JOB_TIMEZONE: 'job.timezone',
} as const;

export const JobTriggers = {
  CRON: 'cron',
  MANUAL: 'manual',
  API: 'api',
  EVENT: 'event',
  RETRY: 'retry',
} as const;

export const JobStatuses = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled',
} as const;
