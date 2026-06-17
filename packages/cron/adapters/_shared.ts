/**
 * Shared adapter helpers for cron scheduler implementations.
 *
 * @module
 */

import type {
  ContextualJobHandler,
  JobContext,
  JobExecutionResult,
  JobHandler,
  JobLifecycleEvent,
  JobRunEvent,
  ScheduledJob,
  SchedulerEventMap,
} from '../ports/types.ts';
import type { JobEventListener, SchedulerEvent } from '../ports/scheduler.ts';

type ListenerMap = Map<SchedulerEvent, Set<JobEventListener<SchedulerEvent>>>;

/**
 * Create a job execution context for a scheduler callback.
 *
 * @param jobId - Job identifier
 * @param signal - Abort signal for the running job
 * @param time - Scheduled and actual execution time
 * @returns A job context object for contextual handlers
 */
export function createJobContext(
  jobId: string,
  signal: AbortSignal,
  time: Date,
): JobContext {
  return {
    jobId,
    scheduledTime: time,
    actualTime: time,
    attempt: 0,
    signal,
  };
}

/**
 * Execute a job handler and update scheduler metadata.
 *
 * @param job - Scheduled job metadata to update
 * @param handler - Job handler to invoke
 * @param signal - Abort signal for the running job
 * @param calculateNextRun - Function that computes the next run time
 * @param emit - Event emitter callback
 * @returns True when the job succeeds, false when it fails
 */
export async function executeScheduledJob(
  job: ScheduledJob,
  handler: JobHandler | ContextualJobHandler,
  signal: AbortSignal,
  calculateNextRun: (expression: string) => Date | null,
  emit: <E extends SchedulerEvent>(event: E, data: SchedulerEventMap[E]) => Promise<void>,
): Promise<boolean> {
  const startedAt = new Date();
  const context = createJobContext(job.id, signal, startedAt);

  try {
    // Extra arguments are ignored by no-arg handlers, which avoids brittle arity checks.
    await (handler as ContextualJobHandler)(context);

    const result = createExecutionResult(startedAt);
    updateJobMetadata(job, result, calculateNextRun);
    await emit('jobRun', createJobRunEvent(job, result));
    return true;
  } catch (error) {
    const result = createExecutionResult(startedAt, error);
    updateJobMetadata(job, result, calculateNextRun);
    await emit('jobError', createJobRunEvent(job, result));
    return false;
  }
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
  error?: unknown,
): JobExecutionResult {
  const completedAt = new Date();

  if (error === undefined) {
    return {
      success: true,
      startedAt,
      completedAt,
      duration: completedAt.getTime() - startedAt.getTime(),
      attempt: 0,
    };
  }

  return {
    success: false,
    startedAt,
    completedAt,
    duration: completedAt.getTime() - startedAt.getTime(),
    error: error instanceof Error ? error : new Error(String(error)),
    attempt: 0,
  };
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
