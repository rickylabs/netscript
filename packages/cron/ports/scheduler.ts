/**
 * CronScheduler Interface
 *
 * Core scheduling abstraction for the @netscript/cron package.
 * Provides a runtime-agnostic interface for job scheduling.
 *
 * @module
 */

import type {
  ContextualJobHandler,
  CronExpression,
  JobHandler,
  ScheduledJob,
  ScheduleOptions,
  SchedulerEventMap,
} from './types.ts';

/**
 * Scheduler event types
 */
export type SchedulerEvent = keyof SchedulerEventMap;

/**
 * Event listener for scheduler events
 */
export type JobEventListener<E extends SchedulerEvent = SchedulerEvent> = (
  event: SchedulerEventMap[E],
) => void | Promise<void>;

/**
 * CronScheduler Interface
 *
 * Runtime-agnostic scheduling abstraction that works with Deno.cron,
 * node-cron, or in-memory scheduling for tests.
 *
 * @example
 * ```ts
 * const scheduler = createScheduler();
 *
 * // Schedule a job
 * await scheduler.schedule('cleanup', '0 0 * * *', async () => {
 *   await cleanupOldRecords();
 * });
 *
 * // Schedule with options
 * await scheduler.schedule('reports', '0 9 * * 1-5', async () => {
 *   await generateDailyReport();
 * }, {
 *   timezone: 'America/New_York',
 *   runOnInit: true,
 * });
 *
 * // List scheduled jobs
 * const jobs = scheduler.list();
 *
 * // Stop a specific job
 * await scheduler.unschedule('cleanup');
 *
 * // Stop all jobs
 * await scheduler.stop();
 * ```
 */
export interface CronScheduler {
  /**
   * Schedule a new job.
   *
   * @param id - Unique job identifier
   * @param schedule - Cron expression or preset
   * @param handler - Function to execute
   * @param options - Optional scheduling options
   * @returns The scheduled job metadata
   * @throws If job with same ID already exists
   *
   * @example
   * ```ts
   * await scheduler.schedule('daily-backup', '0 2 * * *', async () => {
   *   await backupDatabase();
   * }, { timezone: 'UTC' });
   * ```
   */
  schedule(
    id: string,
    schedule: CronExpression,
    handler: JobHandler | ContextualJobHandler,
    options?: ScheduleOptions,
  ): Promise<ScheduledJob>;

  /**
   * Unschedule a job by ID.
   *
   * @param id - Job identifier to unschedule
   * @returns True if job was found and unscheduled
   *
   * @example
   * ```ts
   * const removed = await scheduler.unschedule('daily-backup');
   * ```
   */
  unschedule(id: string): Promise<boolean>;

  /**
   * Get all scheduled jobs.
   *
   * @returns Array of scheduled job metadata
   */
  list(): ScheduledJob[];

  /**
   * Get a specific job by ID.
   *
   * @param id - Job identifier
   * @returns Job metadata or undefined if not found
   */
  get(id: string): ScheduledJob | undefined;

  /**
   * Check if a job exists.
   *
   * @param id - Job identifier
   * @returns True if job exists
   */
  has(id: string): boolean;

  /**
   * Enable a disabled job.
   *
   * @param id - Job identifier
   * @returns True if job was found and enabled
   */
  enable(id: string): Promise<boolean>;

  /**
   * Disable a job without removing it.
   *
   * @param id - Job identifier
   * @returns True if job was found and disabled
   */
  disable(id: string): Promise<boolean>;

  /**
   * Trigger a job to run immediately (outside of schedule).
   *
   * @param id - Job identifier
   * @returns True if job was found and triggered
   */
  trigger(id: string): Promise<boolean>;

  /**
   * Validate a cron expression.
   *
   * @param expression - Cron expression to validate
   * @returns True if the expression is valid
   */
  isValid(expression: CronExpression): boolean;

  /**
   * Add an event listener for scheduler events.
   *
   * @param event - Event type to listen for
   * @param listener - Callback function
   */
  on<E extends SchedulerEvent>(event: E, listener: JobEventListener<E>): void;

  /**
   * Remove an event listener.
   *
   * @param event - Event type
   * @param listener - Callback function to remove
   */
  off<E extends SchedulerEvent>(event: E, listener: JobEventListener<E>): void;

  /**
   * Stop all scheduled jobs and cleanup.
   * Should be called when shutting down.
   */
  stop(): Promise<void>;

  /**
   * Provider name for this scheduler.
   */
  readonly provider: string;

  /**
   * Whether the scheduler is currently running.
   */
  readonly isRunning: boolean;
}
