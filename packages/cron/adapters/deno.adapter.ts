/**
 * Deno Cron Adapter
 *
 * @internal Prefer `createScheduler({ provider: 'deno' })` from the root module.
 *
 * Native Deno.cron implementation for the @netscript/cron package.
 * Provides efficient, built-in scheduling using Deno Deploy's cron system.
 *
 * Features:
 * - Native Deno.cron integration
 * - Timezone support
 * - Automatic cleanup on stop
 * - Event emission for job runs
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
} from '../ports/types.ts';
import { isValidCronExpression } from '../ports/types.ts';
import { calculateNextDenoRun } from '../internal/next-run.ts';
import { translateDenoCronExpression } from '../internal/deno-expression.ts';
import type { CronScheduler, JobEventListener, SchedulerEvent } from '../ports/scheduler.ts';
import {
  createLifecycleEvent,
  emitSchedulerEvent,
  executeScheduledJob,
  retainRetryOptions,
  type RetryOptions,
} from './_shared.ts';

/**
 * Internal job registration data
 */
interface RegisteredJob {
  job: ScheduledJob;
  handler: JobHandler | ContextualJobHandler;
  abortController: AbortController;
  retryOptions: RetryOptions;
}

/**
 * Deno Cron Adapter
 *
 * Uses Deno's native cron functionality for efficient scheduling.
 * Works on Deno Deploy and local Deno runtime.
 *
 * @example
 * ```ts
 * declare function cleanupOldRecords(): Promise<void>;
 *
 * const scheduler = new DenoCronAdapter();
 *
 * await scheduler.schedule('cleanup', '0 0 * * *', async () => {
 *   await cleanupOldRecords();
 * });
 *
 * // Later
 * await scheduler.stop();
 * ```
 */
export class DenoCronAdapter implements CronScheduler {
  private jobs = new Map<string, RegisteredJob>();
  private eventListeners = new Map<SchedulerEvent, Set<JobEventListener<SchedulerEvent>>>();
  private running = true;

  /** Scheduler provider identifier. */
  readonly provider = 'deno';

  /** Whether the adapter is still accepting scheduled work. */
  get isRunning(): boolean {
    return this.running;
  }

  /** Register a job with the native Deno cron runtime. */
  async schedule(
    id: string,
    schedule: CronExpression,
    handler: JobHandler | ContextualJobHandler,
    options?: ScheduleOptions,
  ): Promise<ScheduledJob> {
    if (this.jobs.has(id)) {
      throw new Error(`Job with id '${id}' already exists`);
    }

    const denoSchedule = translateDenoCronExpression(schedule);

    if (!this.isValid(schedule)) {
      throw new Error(`Invalid cron expression: ${schedule}`);
    }

    const abortController = new AbortController();
    const timezone = options?.timezone ?? 'UTC';
    const enabled = options?.enabled ?? true;
    const retryOptions = retainRetryOptions(options);

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

    // Register with Deno.cron
    Deno.cron(
      id,
      denoSchedule,
      { signal: abortController.signal },
      async () => {
        if (!this.running || !job.enabled) {
          return;
        }

        await executeScheduledJob(
          job,
          handler,
          abortController.signal,
          retryOptions,
          (expression) => this.calculateNextRun(expression),
          (event, data) => this.emit(event, data),
        );
      },
    );

    // Store job registration
    this.jobs.set(id, { job, handler, abortController, retryOptions });

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

    // Abort the cron job
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

    registration.job.enabled = true;
    return Promise.resolve(true);
  }

  /** Disable a registered job without removing it. */
  disable(id: string): Promise<boolean> {
    const registration = this.jobs.get(id);
    if (!registration) {
      return Promise.resolve(false);
    }

    registration.job.enabled = false;
    return Promise.resolve(true);
  }

  /** Trigger a job immediately outside its normal schedule. */
  trigger(id: string): Promise<boolean> {
    const registration = this.jobs.get(id);
    if (!registration) {
      return Promise.resolve(false);
    }

    const { job, handler, abortController, retryOptions } = registration;
    return executeScheduledJob(
      job,
      handler,
      abortController.signal,
      retryOptions,
      (expression) => this.calculateNextRun(expression),
      (event, data) => this.emit(event, data),
    );
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

  /** Stop the adapter and abort all registered jobs. */
  stop(): Promise<void> {
    this.running = false;

    // Abort all cron jobs
    for (const [_id, registration] of this.jobs) {
      registration.abortController.abort();
    }

    this.jobs.clear();
    this.eventListeners.clear();
    return Promise.resolve();
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

  /** Calculate the next UTC occurrence; unsupported expressions have no diagnostic next run. */
  private calculateNextRun(expression: CronExpression): Date | null {
    return calculateNextDenoRun(expression, new Date());
  }
}
