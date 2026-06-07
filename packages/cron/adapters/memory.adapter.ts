/**
 * Memory Cron Adapter
 *
 * @internal Prefer `createScheduler({ provider: 'memory' })` from the root module.
 *
 * In-memory cron scheduler for testing and development.
 * Provides the same interface as DenoCronAdapter but uses setInterval.
 *
 * Features:
 * - Full CronScheduler implementation
 * - Immediate trigger support for testing
 * - Time manipulation for testing
 * - No external dependencies
 *
 * @module
 */

import { delay } from '@std/async';
import type {
  ContextualJobHandler,
  CronExpression,
  JobHandler,
  ScheduledJob,
  ScheduleOptions,
  SchedulerEventMap,
} from '../ports/types.ts';
import { isValidCronExpression, parseCronExpression } from '../ports/types.ts';
import type { CronScheduler, JobEventListener, SchedulerEvent } from '../ports/scheduler.ts';
import { createLifecycleEvent, emitSchedulerEvent, executeScheduledJob } from './_shared.ts';

/**
 * Internal job registration data
 */
interface RegisteredJob {
  job: ScheduledJob;
  handler: JobHandler | ContextualJobHandler;
  abortController: AbortController;
  timerId?: number;
}

/**
 * Memory Cron Adapter
 *
 * Uses setInterval to simulate cron scheduling in memory.
 * Ideal for testing and development environments.
 *
 * @example
 * ```ts
 * const scheduler = new MemoryCronAdapter();
 *
 * await scheduler.schedule('test-job', '* * * * *', async () => {
 *   console.log('Job ran!');
 * });
 *
 * // For testing: trigger immediately
 * await scheduler.trigger('test-job');
 *
 * // Cleanup
 * await scheduler.stop();
 * ```
 */
export class MemoryCronAdapter implements CronScheduler {
  private jobs = new Map<string, RegisteredJob>();
  private eventListeners = new Map<SchedulerEvent, Set<JobEventListener<SchedulerEvent>>>();
  private running = true;
  private tickInterval = 60000; // Default: check every minute

  /** Scheduler provider identifier. */
  readonly provider = 'memory';

  /** Whether the adapter is still accepting scheduled work. */
  get isRunning(): boolean {
    return this.running;
  }

  /**
   * Set the tick interval for testing
   * @param ms - Interval in milliseconds
   */
  setTickInterval(ms: number): void {
    this.tickInterval = ms;
  }

  /** Register a job with the in-memory scheduler. */
  async schedule(
    id: string,
    schedule: CronExpression,
    handler: JobHandler | ContextualJobHandler,
    options?: ScheduleOptions,
  ): Promise<ScheduledJob> {
    if (this.jobs.has(id)) {
      throw new Error(`Job with id '${id}' already exists`);
    }

    if (!this.isValid(schedule)) {
      throw new Error(`Invalid cron expression: ${schedule}`);
    }

    const abortController = new AbortController();
    const timezone = options?.timezone ?? 'UTC';
    const enabled = options?.enabled ?? true;

    const job: ScheduledJob = {
      id,
      name: id,
      schedule,
      timezone,
      enabled,
      nextRun: this.calculateNextRun(schedule),
      lastRun: null,
      runCount: 0,
      metadata: options?.metadata,
    };

    // Calculate interval from cron expression
    const intervalMs = this.cronToInterval(schedule);

    // Set up interval if enabled
    let timerId: number | undefined;
    if (enabled && intervalMs > 0) {
      timerId = setInterval(async () => {
        if (!this.running || !job.enabled) {
          return;
        }

        await this.executeJob(id);
      }, intervalMs) as unknown as number;
    }

    // Store job registration
    this.jobs.set(id, { job, handler, abortController, timerId });

    // Emit scheduled event
    await this.emit('jobScheduled', createLifecycleEvent(job, job.nextRun));

    // Run immediately if requested
    if (options?.runOnInit && enabled) {
      await this.trigger(id);
    }

    return job;
  }

  /** Remove a job from the scheduler. */
  async unschedule(id: string): Promise<boolean> {
    const registration = this.jobs.get(id);
    if (!registration) {
      return false;
    }

    // Clear the interval
    if (registration.timerId) {
      clearInterval(registration.timerId);
    }

    // Abort any running job
    registration.abortController.abort();
    this.jobs.delete(id);

    // Emit unscheduled event
    await this.emit('jobUnscheduled', createLifecycleEvent(registration.job, null));

    return true;
  }

  /** List all registered jobs. */
  list(): ScheduledJob[] {
    return Array.from(this.jobs.values()).map((r) => r.job);
  }

  /** Retrieve a registered job by identifier. */
  get(id: string): ScheduledJob | undefined {
    return this.jobs.get(id)?.job;
  }

  /** Check whether a job exists. */
  has(id: string): boolean {
    return this.jobs.has(id);
  }

  /** Enable a previously disabled job. */
  enable(id: string): Promise<boolean> {
    const registration = this.jobs.get(id);
    if (!registration) {
      return Promise.resolve(false);
    }

    if (registration.job.enabled) {
      return Promise.resolve(true);
    }

    registration.job.enabled = true;

    // Start the interval
    const intervalMs = this.cronToInterval(registration.job.schedule);
    if (intervalMs > 0) {
      registration.timerId = setInterval(async () => {
        if (!this.running || !registration.job.enabled) {
          return;
        }
        await this.executeJob(id);
      }, intervalMs) as unknown as number;
    }

    return Promise.resolve(true);
  }

  /** Disable a registered job without removing it. */
  disable(id: string): Promise<boolean> {
    const registration = this.jobs.get(id);
    if (!registration) {
      return Promise.resolve(false);
    }

    if (!registration.job.enabled) {
      return Promise.resolve(true);
    }

    registration.job.enabled = false;

    // Clear the interval
    if (registration.timerId) {
      clearInterval(registration.timerId);
      registration.timerId = undefined;
    }

    return Promise.resolve(true);
  }

  /** Trigger a job immediately outside its normal schedule. */
  trigger(id: string): Promise<boolean> {
    const registration = this.jobs.get(id);
    if (!registration) {
      return Promise.resolve(false);
    }

    return this.executeJob(id);
  }

  /** Validate a cron expression for this adapter. */
  isValid(expression: CronExpression): boolean {
    return isValidCronExpression(expression);
  }

  /** Register an event listener. */
  on<E extends SchedulerEvent>(event: E, listener: JobEventListener<E>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener as JobEventListener<SchedulerEvent>);
  }

  /** Remove a previously registered event listener. */
  off<E extends SchedulerEvent>(event: E, listener: JobEventListener<E>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener as JobEventListener<SchedulerEvent>);
    }
  }

  /** Stop the adapter and clear all in-memory timers. */
  stop(): Promise<void> {
    this.running = false;

    // Clear all intervals
    for (const [_, registration] of this.jobs) {
      if (registration.timerId) {
        clearInterval(registration.timerId);
      }
      registration.abortController.abort();
    }

    this.jobs.clear();
    this.eventListeners.clear();
    return Promise.resolve();
  }

  // ===========================================================================
  // Testing Helpers
  // ===========================================================================

  /**
   * Trigger all scheduled jobs (useful for testing)
   */
  async triggerAll(): Promise<void> {
    for (const [id, registration] of this.jobs) {
      if (registration.job.enabled) {
        await this.trigger(id);
      }
    }
  }

  /**
   * Wait for a job to complete N executions
   * @param id - Job identifier
   * @param count - Number of executions to wait for
   * @param timeoutMs - Maximum wait time
   */
  async waitForExecutions(id: string, count: number, timeoutMs = 10000): Promise<void> {
    const registration = this.jobs.get(id);
    if (!registration) {
      throw new Error(`Job '${id}' not found`);
    }

    const startCount = registration.job.runCount;
    const targetCount = startCount + count;
    const startTime = Date.now();

    while (registration.job.runCount < targetCount) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(
          `Timeout waiting for ${count} executions of job '${id}' ` +
            `(got ${registration.job.runCount - startCount})`,
        );
      }
      await delay(50);
    }
  }

  /**
   * Get the execution count for a job
   */
  getExecutionCount(id: string): number {
    return this.jobs.get(id)?.job.runCount ?? 0;
  }

  /**
   * Reset a job's execution count (for testing)
   */
  resetExecutionCount(id: string): void {
    const registration = this.jobs.get(id);
    if (registration) {
      registration.job.runCount = 0;
      registration.job.lastRun = null;
      registration.job.lastError = undefined;
    }
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * Execute a job by ID
   */
  private executeJob(id: string): Promise<boolean> {
    const registration = this.jobs.get(id);
    if (!registration) {
      return Promise.resolve(false);
    }

    const { job, handler, abortController } = registration;
    return executeScheduledJob(
      job,
      handler,
      abortController.signal,
      (expression) => this.calculateNextRun(expression),
      (event, data) => this.emit(event, data),
    );
  }

  /**
   * Emit an event to all listeners
   */
  private async emit<E extends SchedulerEvent>(
    event: E,
    data: SchedulerEventMap[E],
  ): Promise<void> {
    await emitSchedulerEvent(this.eventListeners, event, data);
  }

  /**
   * Convert a cron expression to an interval in milliseconds
   * This is a simplified implementation for common patterns
   */
  private cronToInterval(expression: string): number {
    const parsed = parseCronExpression(expression);
    if (!parsed) return this.tickInterval;

    const { minute, hour, dayOfMonth, month } = parsed;

    // Every minute: * * * * *
    if (minute === '*' && hour === '*' && dayOfMonth === '*') {
      return 60 * 1000;
    }

    // Every N minutes: */N * * * *
    if (minute.startsWith('*/') && hour === '*' && dayOfMonth === '*') {
      const n = parseInt(minute.slice(2));
      return n * 60 * 1000;
    }

    // Every hour: 0 * * * *
    if (minute !== '*' && hour === '*' && dayOfMonth === '*') {
      return 60 * 60 * 1000;
    }

    // Every day: 0 0 * * *
    if (minute !== '*' && hour !== '*' && dayOfMonth === '*' && month === '*') {
      return 24 * 60 * 60 * 1000;
    }

    // Default: tick interval
    return this.tickInterval;
  }

  /**
   * Calculate the next run time for a cron expression
   */
  private calculateNextRun(expression: CronExpression): Date | null {
    const intervalMs = this.cronToInterval(expression);
    const now = new Date();
    return new Date(now.getTime() + intervalMs);
  }
}
