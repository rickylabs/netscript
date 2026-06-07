/**
 * Cron Types and Interfaces
 *
 * Core type definitions for the @netscript/cron package.
 * Provides a runtime-agnostic scheduling abstraction.
 *
 * @module
 */

/**
 * Cron expression string
 * Supports standard 5-field cron syntax: minute hour day month weekday
 *
 * @example
 * ```
 * '0 * * * *'     - Every hour
 * '*\/5 * * * *'  - Every 5 minutes
 * '0 0 * * *'     - Every day at midnight
 * '0 9 * * 1-5'   - Every weekday at 9am
 * ```
 */
export type CronExpression = string;

/**
 * Scheduled job metadata
 */
export interface ScheduledJob {
  /** Unique job identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Cron expression */
  schedule: CronExpression;
  /** Timezone for schedule interpretation */
  timezone: string;
  /** Whether the job is currently enabled */
  enabled: boolean;
  /** Next scheduled run time */
  nextRun: Date | null;
  /** Last run time */
  lastRun: Date | null;
  /** Number of times the job has run */
  runCount: number;
  /** Last error if any */
  lastError?: string;
  /** Job metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Backoff strategy for retry logic
 */
export type BackoffStrategy = {
  /** Type of backoff */
  type: 'fixed' | 'exponential' | 'linear';
  /** Initial delay in ms */
  initialDelay: number;
  /** Maximum delay in ms */
  maxDelay?: number;
  /** Multiplier for exponential backoff */
  multiplier?: number;
};

/**
 * Options for scheduling a job
 */
export interface ScheduleOptions {
  /** Timezone for schedule (default: 'UTC') */
  timezone?: string;
  /** Whether to run immediately on registration */
  runOnInit?: boolean;
  /** Whether the job starts enabled (default: true) */
  enabled?: boolean;
  /** Backoff strategy for retries */
  backoff?: {
    /** Type of backoff. */
    type: 'fixed' | 'exponential' | 'linear';
    /** Initial delay in ms. */
    initialDelay: number;
    /** Maximum delay in ms. */
    maxDelay?: number;
    /** Multiplier for exponential backoff. */
    multiplier?: number;
  };
  /** Maximum retries on failure */
  maxRetries?: number;
  /** Job metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Job handler function signature
 */
export type JobHandler = () => void | Promise<void>;

/**
 * Job execution context passed to handlers
 */
export interface JobContext {
  /** Job identifier */
  jobId: string;
  /** Scheduled run time */
  scheduledTime: Date;
  /** Actual run time */
  actualTime: Date;
  /** Run attempt number (0 = first attempt) */
  attempt: number;
  /** Abort signal for cancellation */
  signal: AbortSignal;
}

/**
 * Job handler with context
 */
export type ContextualJobHandler = (context: JobContext) => void | Promise<void>;

/**
 * Result of a job execution
 */
export interface JobExecutionResult {
  /** Whether execution was successful */
  success: boolean;
  /** Execution start time */
  startedAt: Date;
  /** Execution end time */
  completedAt: Date;
  /** Duration in milliseconds */
  duration: number;
  /** Error if failed */
  error?: Error;
  /** Attempt number */
  attempt: number;
}

/**
 * Event emitted when a job runs
 */
export interface JobRunEvent {
  /** Job identifier */
  jobId: string;
  /** Job name */
  name: string;
  /** Execution result */
  result: JobExecutionResult;
  /** Next scheduled run */
  nextRun: Date | null;
}

/** Event emitted when a job is scheduled or unscheduled. */
export interface JobLifecycleEvent {
  /** Job identifier */
  jobId: string;
  /** Job name */
  name: string;
  /** Scheduled job metadata */
  job: ScheduledJob;
}

/** Typed scheduler event payload map. */
export interface SchedulerEventMap {
  jobRun: JobRunEvent;
  jobError: JobRunEvent;
  jobScheduled: JobLifecycleEvent;
  jobUnscheduled: JobLifecycleEvent;
}

/**
 * Cron provider type
 */
export type KnownCronProvider = 'deno' | 'node' | 'memory' | 'temporal';

/** Cron provider identifier. Built-in providers are runtime-validated by createScheduler(). */
export type CronProvider = KnownCronProvider | (string & Record<never, never>);

/** Canonical provider identifier registry shape. */
export type CronProviderRegistry = Readonly<
  Record<'DENO' | 'NODE' | 'MEMORY' | 'TEMPORAL', KnownCronProvider>
>;

/** Canonical provider identifiers supported by the built-in factory. */
export const CronProviders: CronProviderRegistry = {
  DENO: 'deno',
  NODE: 'node',
  MEMORY: 'memory',
  TEMPORAL: 'temporal',
} as const satisfies Record<string, KnownCronProvider>;

/**
 * Common cron presets
 */
export const CronPresets = {
  /** Every minute */
  EVERY_MINUTE: '* * * * *',
  /** Every 5 minutes */
  EVERY_5_MINUTES: '*/5 * * * *',
  /** Every 15 minutes */
  EVERY_15_MINUTES: '*/15 * * * *',
  /** Every 30 minutes */
  EVERY_30_MINUTES: '*/30 * * * *',
  /** Every hour */
  EVERY_HOUR: '0 * * * *',
  /** Every day at midnight */
  EVERY_DAY: '0 0 * * *',
  /** Every day at noon */
  EVERY_DAY_NOON: '0 12 * * *',
  /** Every week (Sunday midnight) */
  EVERY_WEEK: '0 0 * * 0',
  /** Every month (1st at midnight) */
  EVERY_MONTH: '0 0 1 * *',
  /** Weekdays at 9am */
  WEEKDAYS_9AM: '0 9 * * 1-5',
  /** Weekdays at 6pm */
  WEEKDAYS_6PM: '0 18 * * 1-5',
  /** Weekends at noon */
  WEEKENDS_NOON: '0 12 * * 0,6',
} as const;

/**
 * Validate a cron expression
 * @param expression - Cron expression to validate
 * @returns True if valid, false otherwise
 */
export function isValidCronExpression(expression: string): boolean {
  // Basic validation: 5 space-separated fields
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    return false;
  }

  // Validate each field
  const patterns = [
    /^(\*|[0-5]?\d)(-[0-5]?\d)?(\/\d+)?(,(\*|[0-5]?\d)(-[0-5]?\d)?(\/\d+)?)*$/, // minute (0-59)
    /^(\*|[01]?\d|2[0-3])(-([01]?\d|2[0-3]))?(\/\d+)?(,(\*|[01]?\d|2[0-3])(-([01]?\d|2[0-3]))?(\/\d+)?)*$/, // hour (0-23)
    /^(\*|[1-9]|[12]\d|3[01])(-([1-9]|[12]\d|3[01]))?(\/\d+)?(,(\*|[1-9]|[12]\d|3[01])(-([1-9]|[12]\d|3[01]))?(\/\d+)?)*$/, // day (1-31)
    /^(\*|[1-9]|1[0-2])(-([1-9]|1[0-2]))?(\/\d+)?(,(\*|[1-9]|1[0-2])(-([1-9]|1[0-2]))?(\/\d+)?)*$/, // month (1-12)
    /^(\*|[0-6])(-[0-6])?(\/\d+)?(,(\*|[0-6])(-[0-6])?(\/\d+)?)*$/, // weekday (0-6)
  ];

  for (let i = 0; i < 5; i++) {
    if (!patterns[i].test(parts[i])) {
      return false;
    }
  }

  return true;
}

/**
 * Parse a cron expression into its component parts
 */
export interface ParsedCronExpression {
  /** Minute field from the cron expression. */
  minute: string;
  /** Hour field from the cron expression. */
  hour: string;
  /** Day-of-month field from the cron expression. */
  dayOfMonth: string;
  /** Month field from the cron expression. */
  month: string;
  /** Day-of-week field from the cron expression. */
  dayOfWeek: string;
}

/**
 * Parse a cron expression string
 * @param expression - Cron expression to parse
 * @returns Parsed expression or null if invalid
 */
export function parseCronExpression(expression: string): ParsedCronExpression | null {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    return null;
  }

  return {
    minute: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4],
  };
}
