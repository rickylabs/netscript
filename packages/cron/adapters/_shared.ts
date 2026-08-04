/**
 * Shared adapter helpers for cron scheduler implementations.
 *
 * @module
 */

import { delay } from '@std/async';
import type {
  BackoffStrategy,
  ContextualJobHandler,
  JobContext,
  JobExecutionResult,
  JobHandler,
  JobLifecycleEvent,
  JobRunEvent,
  ScheduledJob,
  ScheduleOptions,
  SchedulerEventMap,
} from '../ports/types.ts';
import type { JobEventListener, SchedulerEvent } from '../ports/scheduler.ts';

type ListenerMap = Map<SchedulerEvent, Set<JobEventListener<SchedulerEvent>>>;
export type RetryOptions = Pick<ScheduleOptions, 'backoff' | 'maxRetries'>;

type ExecutionOutcome =
  | { readonly success: true }
  | { readonly success: false; readonly error: unknown };

/** Snapshot the retry policy supplied when a job is registered. */
export function retainRetryOptions(options: ScheduleOptions | undefined): RetryOptions {
  return {
    maxRetries: options?.maxRetries,
    backoff: options?.backoff ? { ...options.backoff } : undefined,
  };
}

/**
 * Create a job execution context for a scheduler callback.
 *
 * @param jobId - Job identifier
 * @param signal - Abort signal for the running job
 * @param time - Scheduled and actual execution time
 * @param attempt - Zero-based handler attempt
 * @returns A job context object for contextual handlers
 */
export function createJobContext(
  jobId: string,
  signal: AbortSignal,
  time: Date,
  attempt = 0,
): JobContext {
  return {
    jobId,
    scheduledTime: time,
    actualTime: time,
    attempt,
    signal,
  };
}

/**
 * Execute a job handler and update scheduler metadata.
 *
 * @param job - Scheduled job metadata to update
 * @param handler - Job handler to invoke
 * @param signal - Abort signal for the running job
 * @param retryOptions - Retained retry policy for the registration
 * @param calculateNextRun - Function that computes the next run time
 * @param emit - Event emitter callback
 * @returns True when the job succeeds, false when it fails
 */
export async function executeScheduledJob(
  job: ScheduledJob,
  handler: JobHandler | ContextualJobHandler,
  signal: AbortSignal,
  retryOptions: RetryOptions,
  calculateNextRun: (expression: string) => Date | null,
  emit: <E extends SchedulerEvent>(event: E, data: SchedulerEventMap[E]) => Promise<void>,
): Promise<boolean> {
  const startedAt = new Date();
  const maxRetries = retryOptions.maxRetries ?? 0;
  let attempt = 0;
  let outcome: ExecutionOutcome | undefined;

  while (outcome === undefined) {
    const context = createJobContext(job.id, signal, startedAt, attempt);

    try {
      // Extra arguments are ignored by no-arg handlers, which avoids brittle arity checks.
      await (handler as ContextualJobHandler)(context);
      outcome = { success: true };
    } catch (error) {
      if (attempt >= maxRetries || signal.aborted) {
        outcome = { success: false, error };
        break;
      }

      if (retryOptions.backoff) {
        const retryNumber = attempt + 1;
        const waitMs = calculateBackoffDelay(retryOptions.backoff, retryNumber);

        try {
          await delay(waitMs, { signal });
        } catch (waitError) {
          outcome = { success: false, error: waitError };
          break;
        }
      }

      if (signal.aborted) {
        outcome = { success: false, error: signal.reason };
        break;
      }

      attempt++;
    }
  }

  const result = createExecutionResult(startedAt, attempt, outcome);
  updateJobMetadata(job, result, calculateNextRun);
  await emit(outcome.success ? 'jobRun' : 'jobError', createJobRunEvent(job, result));
  return outcome.success;
}

/**
 * Emit a scheduler event to registered listeners.
 *
 * Listener failures are ignored so that scheduler bookkeeping is not disrupted
 * by observer errors.
 *
 * @param listeners - Scheduler listener registry
 * @param event - Event type to emit
 * @param data - Event payload
 */
export async function emitSchedulerEvent(
  listeners: ListenerMap,
  event: SchedulerEvent,
  data: SchedulerEventMap[SchedulerEvent],
): Promise<void> {
  const registeredListeners = listeners.get(event);
  if (!registeredListeners) {
    return;
  }

  for (const listener of registeredListeners) {
    try {
      await listener(data);
    } catch {
      // Observer errors must not break scheduler execution.
    }
  }
}

/**
 * Create a synthetic lifecycle event for scheduler bookkeeping operations.
 *
 * @param job - Scheduled job metadata
 * @param nextRun - Next run value to expose on the event
 * @returns A lifecycle event payload
 */
export function createLifecycleEvent(
  job: ScheduledJob,
  _nextRun: Date | null,
): JobLifecycleEvent {
  return {
    jobId: job.id,
    name: job.name,
    job,
  };
}

function createExecutionResult(
  startedAt: Date,
  attempt: number,
  outcome: ExecutionOutcome,
): JobExecutionResult {
  const completedAt = new Date();

  if (outcome.success) {
    return {
      success: true,
      startedAt,
      completedAt,
      duration: completedAt.getTime() - startedAt.getTime(),
      attempt,
    };
  }

  return {
    success: false,
    startedAt,
    completedAt,
    duration: completedAt.getTime() - startedAt.getTime(),
    error: outcome.error instanceof Error ? outcome.error : new Error(String(outcome.error)),
    attempt,
  };
}

function calculateBackoffDelay(backoff: BackoffStrategy, retryNumber: number): number {
  let waitMs: number;

  switch (backoff.type) {
    case 'exponential':
      waitMs = backoff.initialDelay * (backoff.multiplier ?? 2) ** (retryNumber - 1);
      break;
    case 'linear':
      waitMs = backoff.initialDelay * retryNumber;
      break;
    case 'fixed':
      waitMs = backoff.initialDelay;
      break;
  }

  return backoff.maxDelay === undefined ? waitMs : Math.min(waitMs, backoff.maxDelay);
}

function updateJobMetadata(
  job: ScheduledJob,
  result: JobExecutionResult,
  calculateNextRun: (expression: string) => Date | null,
): void {
  job.runCount++;
  job.lastRun = result.completedAt;
  job.nextRun = calculateNextRun(job.schedule);
  job.lastError = result.error?.message;
}

function createJobRunEvent(
  job: ScheduledJob,
  result: JobExecutionResult,
): JobRunEvent {
  return {
    jobId: job.id,
    name: job.name,
    result,
    nextRun: job.nextRun,
  };
}
