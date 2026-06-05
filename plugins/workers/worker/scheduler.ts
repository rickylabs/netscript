/** Scheduler process for the NetScript workers plugin. @module */

import { createScheduler, type CronScheduler } from '@netscript/cron';
import { createQueue } from '@netscript/queue';
import {
  DEFAULT_TOPIC,
  type JobDefinition,
  type JobMessage,
} from '@netscript/plugin-workers-core/runtime';
import type { KvExecutionState } from '@netscript/plugin-workers-core/state';
import type { KvJobRegistry } from '@netscript/plugin-workers-core/registry';
import {
  createJobScheduleSpan,
  endSchedulerSpan,
  logSchedulerTelemetryConfig,
  recordJobScheduled,
  recordSchedulerCronRun,
  recordSchedulerStarted,
  type Span,
  startSchedulerSpan,
  type TracedQueue,
  traceJobDispatch,
} from './scheduler-tracing.ts';
import type { ScheduledJobInfo, SchedulerOptions } from './scheduler-options.ts';

export type { ScheduledJobInfo, SchedulerOptions } from './scheduler-options.ts';

// ============================================================================
// SCHEDULER CLASS
// ============================================================================

/** Scheduler process that loads scheduled jobs and dispatches cron ticks. */
export class Scheduler {
  private queueName: string;
  private registry: KvJobRegistry;
  private executionState: KvExecutionState;
  private cronScheduler: CronScheduler;
  private queue: TracedQueue<JobMessage> | null = null;
  private running = false;
  private scheduledJobs = new Map<string, string>(); // jobId -> cronJobId

  private schedulerSpan: Span | null = null;

  constructor(options: SchedulerOptions) {
    this.queueName = options.queueName ?? 'jobs';
    this.registry = options.registry;
    this.executionState = options.executionState;
    this.cronScheduler = options.cronScheduler ?? createScheduler({
      provider: options.useMemoryScheduler ? 'memory' : undefined,
    });

    logSchedulerTelemetryConfig();
  }

  /**
   * Check if the scheduler is running
   */
  get isRunning(): boolean {
    return this.running;
  }

  /**
   * Get the number of scheduled jobs
   */
  get scheduledJobCount(): number {
    return this.scheduledJobs.size;
  }

  /**
   * Start the scheduler.
   *
   * Loads all scheduled jobs from the registry and sets up cron schedules.
   */
  async start(): Promise<void> {
    if (this.running) {
      console.warn('[Scheduler] Already running');
      return;
    }

    console.log('[Scheduler] Starting...');

    this.running = true;

    // Create the queue for enqueueing jobs
    // Auto-tracing is enabled so queue.enqueue creates child spans under scheduler.dispatch
    this.queue = createQueue<JobMessage>(this.queueName) as TracedQueue<JobMessage>;

    // Start scheduler span for tracing
    this.schedulerSpan = startSchedulerSpan();

    // Set up event listeners for cron jobs
    this.setupEventListeners();

    // Load and schedule all jobs from registry
    await this.loadScheduledJobs();

    // Update span with actual job count
    if (this.schedulerSpan) {
      recordSchedulerStarted(this.schedulerSpan, this.scheduledJobs.size);
    }

    console.log(`[Scheduler] Started with ${this.scheduledJobs.size} scheduled jobs`);
  }

  /**
   * Stop the scheduler.
   *
   * Stops all cron jobs and cleans up resources.
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    console.log('[Scheduler] Stopping...');

    // Stop the cron scheduler
    await this.cronScheduler.stop();

    // Clear tracked jobs
    this.scheduledJobs.clear();

    // Stop the queue
    if (this.queue) {
      await this.queue.stop();
      this.queue = null;
    }

    // End scheduler span
    if (this.schedulerSpan) {
      endSchedulerSpan(this.schedulerSpan);
      this.schedulerSpan = null;
    }

    this.running = false;
    console.log('[Scheduler] Stopped');
  }

  /**
   * Load all scheduled jobs from the registry.
   */
  private async loadScheduledJobs(): Promise<void> {
    const jobs = await this.registry.listScheduled();

    for (const job of jobs) {
      await this.scheduleJob(job);
    }
  }

  /**
   * Schedule a single job.
   */
  private async scheduleJob(job: JobDefinition): Promise<void> {
    if (!job.schedule) {
      return;
    }

    if (this.scheduledJobs.has(job.id)) {
      console.warn(`[Scheduler] Job '${job.id}' already scheduled`);
      return;
    }

    // Create span for scheduling the job
    const scheduleSpan = createJobScheduleSpan(job);

    try {
      const cronJob = await this.cronScheduler.schedule(
        job.id,
        job.schedule,
        async () => {
          // Create a scheduler tick span to group cron job executions
          await this.enqueueCronJob(job);
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

      this.scheduledJobs.set(job.id, cronJob.id);

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

  /**
   * Unschedule a job.
   *
   * @param jobId - Job identifier
   * @returns True if job was found and unscheduled
   */
  async unscheduleJob(jobId: string): Promise<boolean> {
    const cronJobId = this.scheduledJobs.get(jobId);
    if (!cronJobId) {
      return false;
    }

    const result = await this.cronScheduler.unschedule(cronJobId);
    if (result) {
      this.scheduledJobs.delete(jobId);
      console.log(`[Scheduler] Unscheduled job '${jobId}'`);
    }

    return result;
  }

  /**
   * Reschedule a job with a new schedule.
   *
   * @param jobId - Job identifier
   * @param schedule - New cron schedule
   */
  async rescheduleJob(jobId: string, schedule: string): Promise<void> {
    const job = await this.registry.get(jobId);
    if (!job) {
      throw new Error(`Job '${jobId}' not found`);
    }

    // Unschedule existing
    await this.unscheduleJob(jobId);

    // Update registry
    await this.registry.update(jobId, { schedule });

    // Reschedule with new schedule
    const updatedJob = await this.registry.get(jobId);
    if (updatedJob) {
      await this.scheduleJob(updatedJob);
    }
  }

  /**
   * Manually trigger a job to run immediately.
   *
   * @param jobId - Job identifier
   * @param payload - Optional payload data
   */
  async trigger(jobId: string, payload?: Record<string, unknown>): Promise<void> {
    const job = await this.registry.get(jobId);
    if (!job) {
      throw new Error(`Job '${jobId}' not found`);
    }

    await this.enqueueJob(job, 'manual', payload);
  }

  /**
   * Enqueue a job for processing.
   *
   * Uses traceJobDispatch to create a PRODUCER span and inject trace context
   * into the message headers for distributed tracing.
   */
  private async enqueueJob(
    job: JobDefinition,
    triggeredBy: 'cron' | 'manual' | 'api' | 'event' = 'cron',
    payload?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.queue) {
      console.error('[Scheduler] Queue not initialized');
      return;
    }

    // Get next run time for tracing
    const cronJob = this.cronScheduler.get(job.id);
    const nextRun = cronJob?.nextRun ?? undefined;

    // All jobs start their own trace with scheduler.dispatch as root
    // This creates the flow: scheduler.dispatch → queue.enqueue → queue.dequeue → job.execute
    await traceJobDispatch(
      {
        job: {
          id: job.id,
          name: job.name,
          schedule: job.schedule,
          timezone: job.timezone,
          enabled: job.enabled,
          entrypoint: job.entrypoint,
          timeout: job.timeout,
          maxRetries: job.maxRetries,
          tags: job.tags,
        },
        triggeredBy,
        queueName: this.queueName,
        priority: 50,
        payload: payload ?? job.metadata as Record<string, unknown>,
        nextRun,
      },
      async (headers) => {
        // Create the job message with trace context in headers
        const message: JobMessage = {
          jobId: job.id,
          topic: job.topic ?? DEFAULT_TOPIC,
          triggeredBy,
          triggeredAt: new Date().toISOString(),
          payload: payload ?? job.metadata as Record<string, unknown>,
          priority: 50,
        };

        // Enqueue with trace context headers
        await this.queue!.enqueue(message, { headers });
      },
      { root: true },
    );
  }

  /**
   * Enqueue a cron job.
   * Each cron job starts its own trace with scheduler.dispatch as root.
   */
  private async enqueueCronJob(job: JobDefinition): Promise<void> {
    await this.enqueueJob(job, 'cron');
  }

  /**
   * Set up event listeners for cron job events.
   */
  private setupEventListeners(): void {
    this.cronScheduler.on('jobRun', (event) => {
      // Record cron job run in scheduler span
      if (this.schedulerSpan) {
        recordSchedulerCronRun(
          this.schedulerSpan,
          event.jobId,
          event.result.duration,
          true,
        );
      }
    });

    this.cronScheduler.on('jobError', (event) => {
      console.error(
        `[Scheduler] Cron job '${event.jobId}' failed:`,
        event.result.error?.message,
      );

      // Record cron job error in scheduler span
      if (this.schedulerSpan) {
        recordSchedulerCronRun(
          this.schedulerSpan,
          event.jobId,
          event.result.duration,
          false,
          event.result.error?.message,
        );
      }
    });
  }

  /**
   * Get information about all scheduled jobs.
   */
  getScheduledJobs(): ScheduledJobInfo[] {
    const cronJobs = this.cronScheduler.list();
    const result: ScheduledJobInfo[] = [];

    for (const cronJob of cronJobs) {
      result.push({
        jobId: cronJob.id,
        schedule: cronJob.schedule,
        timezone: cronJob.timezone,
        enabled: cronJob.enabled,
        nextRun: cronJob.nextRun,
        lastRun: cronJob.lastRun,
        runCount: cronJob.runCount,
      });
    }

    return result;
  }

  /**
   * Get information about a specific scheduled job.
   *
   * @param jobId - Job identifier
   */
  getScheduledJob(jobId: string): ScheduledJobInfo | undefined {
    const cronJob = this.cronScheduler.get(jobId);
    if (!cronJob) {
      return undefined;
    }

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

  /**
   * Enable a scheduled job.
   *
   * @param jobId - Job identifier
   */
  async enableJob(jobId: string): Promise<boolean> {
    // Try to enable in the cron scheduler (works if job was previously scheduled)
    const result = await this.cronScheduler.enable(jobId);
    if (result) {
      await this.registry.enable(jobId);
      console.log(`[Scheduler] Enabled job '${jobId}'`);
      return true;
    }

    // Job was never added to cronScheduler (was disabled at startup via jobOverrides).
    // Look it up in the registry and schedule it fresh.
    const job = await this.registry.get(jobId);
    if (!job || !job.schedule) return false;

    await this.registry.enable(jobId);
    const enabledJob = await this.registry.get(jobId);
    if (enabledJob) {
      await this.scheduleJob(enabledJob);
      console.log(`[Scheduler] Enabled and scheduled job '${jobId}' with '${job.schedule}'`);
    }
    return true;
  }

  /**
   * Disable a scheduled job.
   *
   * @param jobId - Job identifier
   */
  async disableJob(jobId: string): Promise<boolean> {
    const result = await this.cronScheduler.disable(jobId);
    if (result) {
      await this.registry.disable(jobId);
      console.log(`[Scheduler] Disabled job '${jobId}'`);
    }
    return result;
  }

  /**
   * Reload all scheduled jobs from the registry.
   *
   * Useful when jobs have been added/modified externally.
   */
  async reload(): Promise<void> {
    console.log('[Scheduler] Reloading scheduled jobs...');

    // Unschedule all current jobs
    for (const [jobId, _] of this.scheduledJobs) {
      await this.cronScheduler.unschedule(jobId);
    }
    this.scheduledJobs.clear();

    // Reload from registry
    await this.loadScheduledJobs();

    console.log(`[Scheduler] Reloaded ${this.scheduledJobs.size} scheduled jobs`);
  }
}
