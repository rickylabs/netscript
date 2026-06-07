/**
 * Scheduler Instrumentation
 *
 * Provides tracing helpers for scheduler operations.
 * Creates spans for job dispatching and cron tick events.
 *
 * @module
 */

import {
  context as otelContext,
  ROOT_CONTEXT,
  type Span as OtelSpan,
  trace,
} from '@opentelemetry/api';
import {
  addSpanEvent,
  type Attributes,
  type Context,
  createSpan,
  getSchedulerTracer,
  setSpanError,
  setSpanOk,
  type Span,
  SpanKind,
  withSpan,
} from '../core/mod.ts';
import { injectContext, type PropagationHeaders } from '../context/mod.ts';
import {
  createJobAttributes,
  JobAttributes,
  SchedulerAttributes,
  SpanNames,
} from '../attributes/mod.ts';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Job definition for scheduler tracing
 */
export interface ScheduledJobDefinition {
  /** Job identifier. */
  id: string;
  /** Human-readable job name. */
  name?: string;
  /** Cron expression or schedule descriptor. */
  schedule?: string;
  /** Time zone used to evaluate the schedule. */
  timezone?: string;
  /** Whether the job is enabled. */
  enabled?: boolean;
  /** Script or command entrypoint. */
  entrypoint?: string;
  /** Execution timeout in milliseconds. */
  timeout?: number;
  /** Maximum retry attempts. */
  maxRetries?: number;
  /** Scheduling or routing tags. */
  tags?: string[];
}

/**
 * Scheduler tick context
 */
export interface SchedulerTickContext {
  /** Scheduler identifier */
  schedulerId?: string;

  /** Total number of scheduled jobs */
  totalJobs: number;

  /** Jobs that are due to run */
  dueJobs: string[];

  /** Current tick timestamp */
  tickTime: Date;
}

/**
 * Job dispatch context
 */
export interface JobDispatchContext {
  /** Job being dispatched */
  job: ScheduledJobDefinition;

  /** How the job was triggered */
  triggeredBy: 'cron' | 'manual' | 'api' | 'event';

  /** Queue name for dispatch */
  queueName: string;

  /** Optional delay in milliseconds */
  delay?: number;

  /** Optional priority */
  priority?: number;

  /** Optional payload */
  payload?: Record<string, unknown>;

  /** Next scheduled run time */
  nextRun?: Date;
}

/**
 * Options for traced job dispatch
 */
export interface TracedDispatchOptions {
  /** Whether to include trace context in message headers */
  propagateContext?: boolean;

  /** Additional headers to include */
  headers?: PropagationHeaders;

  /** Additional span attributes */
  attributes?: Attributes;

  /**
   * Whether to create a root span with no parent.
   * Set to true for cron-triggered jobs to prevent inheriting context
   * from other operations running in the same process.
   */
  root?: boolean;
}

// ============================================================================
// SCHEDULER TICK TRACING
// ============================================================================

/**
 * Create a span for a scheduler tick.
 *
 * A "tick" represents the scheduler checking which jobs are due to run.
 *
 * @param context - Tick context
 * @returns Span for the tick
 *
 * @example
 * ```ts
 * const span = startSchedulerTickSpan({
 *   totalJobs: 5,
 *   dueJobs: ['job-1', 'job-2'],
 *   tickTime: new Date(),
 * });
 *
 * try {
 *   for (const jobId of dueJobs) {
 *     await dispatchJob(jobId);
 *   }
 *   setSpanOk(span);
 * } finally {
 *   span.end();
 * }
 * ```
 */
export function startSchedulerTickSpan(context: SchedulerTickContext): Span {
  const tracer = getSchedulerTracer();

  const span = createSpan(tracer, SpanNames.SCHEDULER_TICK, {
    kind: SpanKind.INTERNAL,
    attributes: {
      [SchedulerAttributes.SCHEDULER_JOB_COUNT]: context.totalJobs,
      'scheduler.due_jobs': context.dueJobs.length,
      'scheduler.due_job_ids': context.dueJobs.join(','),
      'scheduler.tick_time': context.tickTime.toISOString(),
    },
  });

  if (context.schedulerId) {
    span.setAttribute('scheduler.id', context.schedulerId);
  }

  addSpanEvent(span, 'scheduler.tick', {
    'tick.due_jobs': context.dueJobs.length,
  });

  return span;
}

/**
 * Execute a scheduler tick with tracing.
 *
 * @param context - Tick context
 * @param fn - Function to execute during the tick
 * @returns Result of the function
 */
export async function traceSchedulerTick<T>(
  context: SchedulerTickContext,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const tracer = getSchedulerTracer();

  return await withSpan(
    tracer,
    SpanNames.SCHEDULER_TICK,
    async (span) => {
      span.setAttributes({
        [SchedulerAttributes.SCHEDULER_JOB_COUNT]: context.totalJobs,
        'scheduler.due_jobs': context.dueJobs.length,
        'scheduler.tick_time': context.tickTime.toISOString(),
      });

      if (context.schedulerId) {
        span.setAttribute('scheduler.id', context.schedulerId);
      }

      addSpanEvent(span, 'tick.started', {
        'due_jobs': context.dueJobs.join(','),
      });

      return await fn(span);
    },
    { kind: SpanKind.INTERNAL },
  );
}

// ============================================================================
// JOB DISPATCH TRACING
// ============================================================================

/**
 * Create a span for dispatching a job to the queue.
 *
 * This is a PRODUCER span that will be linked to the worker's CONSUMER span.
 *
 * @param context - Dispatch context
 * @param options - Tracing options
 * @returns Span and headers for the message
 *
 * @example
 * ```ts
 * const { span, headers } = startJobDispatchSpan({
 *   job: jobDef,
 *   triggeredBy: 'cron',
 *   queueName: 'jobs',
 * });
 *
 * try {
 *   await queue.enqueue(message, { headers });
 *   setSpanOk(span);
 * } catch (error) {
 *   setSpanError(span, error.message);
 *   throw error;
 * } finally {
 *   span.end();
 * }
 * ```
 */
export function startJobDispatchSpan(
  context: JobDispatchContext,
  options: TracedDispatchOptions = {},
): { span: Span; headers: PropagationHeaders } {
  const tracer = getSchedulerTracer();

  // Build span attributes
  const attributes: Attributes = {
    ...createJobAttributes(context.job),
    [JobAttributes.JOB_TRIGGER]: context.triggeredBy,
    'messaging.destination.name': context.queueName,
    'messaging.operation': 'publish',
  };

  if (context.job.schedule) {
    attributes[SchedulerAttributes.SCHEDULER_CRON] = context.job.schedule;
  }
  if (context.job.timezone) {
    attributes[JobAttributes.JOB_TIMEZONE] = context.job.timezone;
  }
  if (context.job.enabled !== undefined) {
    attributes[SchedulerAttributes.SCHEDULER_ENABLED] = context.job.enabled;
  }
  if (context.delay) {
    attributes['messaging.message.delay_ms'] = context.delay;
  }
  if (context.priority) {
    attributes[JobAttributes.JOB_PRIORITY] = context.priority;
  }
  if (context.nextRun) {
    attributes[SchedulerAttributes.SCHEDULER_NEXT_RUN] = context.nextRun.toISOString();
  }
  if (options.attributes) {
    Object.assign(attributes, options.attributes);
  }

  // Determine parent context for the span
  // If root option is set, use ROOT_CONTEXT to create a new trace
  // This prevents cron jobs from inheriting context from other operations
  const parentContext = options.root ? ROOT_CONTEXT : otelContext.active();

  // Create the dispatch span
  const span = createSpan(tracer, SpanNames.SCHEDULER_DISPATCH, {
    kind: SpanKind.PRODUCER,
    attributes,
    parentContext,
  });

  // Create headers with trace context from the NEW span
  // IMPORTANT: We must create a context that includes the span we just created,
  // then inject THAT context into headers. Otherwise, the headers would contain
  // the parent context (or ROOT_CONTEXT), and the worker's job.execute span
  // would skip over this dispatch span entirely.
  let headers = options.headers ?? {};
  if (options.propagateContext !== false) {
    // Create a context with the dispatch span, then inject it into headers
    const contextWithDispatchSpan = trace.setSpan(parentContext, span as OtelSpan);
    headers = injectContext({ ...headers }, contextWithDispatchSpan);
  }

  addSpanEvent(span, 'job.dispatching', {
    [JobAttributes.JOB_ID]: context.job.id,
    [JobAttributes.JOB_TRIGGER]: context.triggeredBy,
  });

  return { span, headers };
}

/**
 * Dispatch a job with tracing.
 *
 * Wraps the dispatch operation in a traced span and returns headers for context propagation.
 *
 * @param context - Dispatch context
 * @param fn - Function that performs the actual dispatch
 * @param options - Tracing options
 *
 * @example
 * ```ts
 * await traceJobDispatch(
 *   { job: jobDef, triggeredBy: 'cron', queueName: 'jobs' },
 *   async (headers) => {
 *     const message = { jobId: job.id, triggeredBy: 'cron', ... };
 *     await queue.enqueue(message, { headers });
 *   }
 * );
 * ```
 */
export async function traceJobDispatch(
  context: JobDispatchContext,
  fn: (headers: PropagationHeaders) => Promise<void>,
  options: TracedDispatchOptions = {},
): Promise<void> {
  const { span, headers } = startJobDispatchSpan(context, options);

  // Create context with the dispatch span so that any child operations
  // (like TracedQueue.enqueue) will be properly parented
  const parentContext = options.root ? ROOT_CONTEXT : otelContext.active();
  const dispatchContext = trace.setSpan(parentContext, span as OtelSpan);

  try {
    // Run the callback WITHIN the dispatch span's context
    // This ensures TracedQueue.enqueue creates a child span
    await otelContext.with(dispatchContext, async () => {
      await fn(headers);
    });
    setSpanOk(span);
    addSpanEvent(span, 'job.dispatched', {
      [JobAttributes.JOB_ID]: context.job.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setSpanError(span, message, error instanceof Error ? error : undefined);
    addSpanEvent(span, 'job.dispatch_failed', {
      'error.message': message,
    });
    throw error;
  } finally {
    span.end();
  }
}

// ============================================================================
// SCHEDULER LIFECYCLE TRACING
// ============================================================================

/**
 * Create a span for scheduler start.
 *
 * This creates a root span to represent the scheduler lifecycle.
 *
 * @param schedulerId - Scheduler identifier
 * @param jobCount - Number of jobs to schedule
 * @returns Span for scheduler start
 */
export function createSchedulerStartSpan(
  schedulerId: string,
  jobCount: number,
): Span {
  const tracer = getSchedulerTracer();

  // Use ROOT_CONTEXT to ensure scheduler lifecycle is independent
  const span = createSpan(tracer, 'scheduler.start', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'scheduler.id': schedulerId,
      [SchedulerAttributes.SCHEDULER_JOB_COUNT]: jobCount,
    },
    parentContext: ROOT_CONTEXT,
  });

  addSpanEvent(span, 'scheduler.starting', {
    'job_count': jobCount,
  });

  return span;
}

/**
 * Create a span for scheduler stop.
 *
 * This creates a root span to represent the scheduler stop operation.
 *
 * @param schedulerId - Scheduler identifier
 * @returns Span for scheduler stop
 */
export function createSchedulerStopSpan(schedulerId: string): Span {
  const tracer = getSchedulerTracer();

  // Use ROOT_CONTEXT to ensure scheduler lifecycle is independent
  const span = createSpan(tracer, 'scheduler.stop', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'scheduler.id': schedulerId,
    },
    parentContext: ROOT_CONTEXT,
  });

  addSpanEvent(span, 'scheduler.stopping');

  return span;
}

/**
 * Create a span for scheduling a job (adding to cron scheduler).
 *
 * This creates a root span (no parent) to prevent scheduler startup operations
 * from inheriting context from unrelated operations.
 *
 * @param job - Job being scheduled
 * @param parentContext - Optional parent context (uses ROOT_CONTEXT if not provided)
 * @returns Span for the schedule operation
 */
export function createScheduleJobSpan(job: ScheduledJobDefinition, parentContext?: Context): Span {
  const tracer = getSchedulerTracer();

  // Use ROOT_CONTEXT by default to prevent inheriting unrelated context
  // Scheduler job scheduling is an independent operation at startup
  const span = createSpan(tracer, 'scheduler.schedule_job', {
    kind: SpanKind.INTERNAL,
    attributes: {
      ...createJobAttributes(job),
      [SchedulerAttributes.SCHEDULER_CRON]: job.schedule ?? '',
      [SchedulerAttributes.SCHEDULER_ENABLED]: job.enabled ?? true,
    },
    parentContext: parentContext ?? ROOT_CONTEXT,
  });

  return span;
}

/**
 * Create a span for unscheduling a job.
 *
 * This creates a root span (no parent) to prevent inheriting unrelated context.
 *
 * @param jobId - Job identifier
 * @param parentContext - Optional parent context (uses ROOT_CONTEXT if not provided)
 * @returns Span for the unschedule operation
 */
export function createUnscheduleJobSpan(jobId: string, parentContext?: Context): Span {
  const tracer = getSchedulerTracer();

  const span = createSpan(tracer, 'scheduler.unschedule_job', {
    kind: SpanKind.INTERNAL,
    attributes: {
      [JobAttributes.JOB_ID]: jobId,
    },
    parentContext: parentContext ?? ROOT_CONTEXT,
  });

  return span;
}

// ============================================================================
// CRON EVENT TRACING
// ============================================================================

/**
 * Record a cron job run event.
 *
 * @param span - Parent span
 * @param jobId - Job identifier
 * @param durationMs - Duration of the cron callback
 * @param success - Whether the callback succeeded
 * @param error - Error message if failed
 */
export function recordCronJobRun(
  span: Span,
  jobId: string,
  durationMs: number,
  success: boolean,
  error?: string,
): void {
  const eventName = success ? 'cron.job.run.success' : 'cron.job.run.error';

  const attributes: Attributes = {
    [JobAttributes.JOB_ID]: jobId,
    [JobAttributes.JOB_DURATION_MS]: durationMs,
  };

  if (error) {
    attributes['error.message'] = error;
  }

  addSpanEvent(span, eventName, attributes);
}

/**
 * Record scheduler reload event.
 *
 * @param span - Span to record event in
 * @param previousCount - Previous job count
 * @param newCount - New job count
 */
export function recordSchedulerReload(
  span: Span,
  previousCount: number,
  newCount: number,
): void {
  addSpanEvent(span, 'scheduler.reloaded', {
    'scheduler.previous_job_count': previousCount,
    'scheduler.new_job_count': newCount,
  });
}
