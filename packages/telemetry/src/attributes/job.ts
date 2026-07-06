/**
 * Deprecated job attribute aliases used by existing scheduler and worker instrumentation.
 */
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

/**
 * Canonical NetScript job attribute names.
 */
export const NetScriptJobAttributes = {
  JOB_ID: 'netscript.job.id',
  JOB_NAME: 'netscript.job.name',
  JOB_ENTRYPOINT: 'netscript.job.entrypoint',
  JOB_TRIGGER: 'netscript.job.trigger',
  JOB_ATTEMPT: 'netscript.job.attempt',
  JOB_MAX_RETRIES: 'netscript.job.max_retries',
  JOB_TIMEOUT_MS: 'netscript.job.timeout_ms',
  JOB_STATUS: 'netscript.job.status',
  JOB_EXIT_CODE: 'netscript.job.exit_code',
  JOB_DURATION_MS: 'netscript.job.duration_ms',
  JOB_PRIORITY: 'netscript.job.priority',
  JOB_TAGS: 'netscript.job.tags',
  JOB_TIMEZONE: 'netscript.job.timezone',
} as const;

/**
 * Deprecated job aliases emitted during the beta.5 duplicate-key window.
 */
export const DeprecatedJobAttributeAliases: typeof JobAttributes = JobAttributes;

/**
 * Standard job trigger names.
 */
export const JobTriggers = {
  CRON: 'cron',
  MANUAL: 'manual',
  API: 'api',
  EVENT: 'event',
  RETRY: 'retry',
} as const;

/**
 * Standard job execution status names.
 */
export const JobStatuses = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled',
} as const;
