/**
 * Worker Instrumentation
 *
 * Provides tracing helpers for worker job execution.
 * Enables distributed tracing from scheduler → queue → worker → job subprocess.
 *
 * @module
 */

import { type Attributes, type Context, type Span, SpanKind } from '@opentelemetry/api';
import {
  addSpanEvent,
  createSpan,
  getActiveSpan,
  getJobTracer,
  getWorkerTracer,
  withSpan,
} from '../core/mod.ts';
import {
  createJobTraceEnv,
  extractJobTraceContext,
  getTraceContext,
  type SerializedTraceContext,
} from '../context/mod.ts';
import {
  createJobAttributes,
  ExecutionAttributes,
  JobAttributes,
  JobStatuses,
  SpanNames,
  WorkerAttributes,
} from '../attributes/mod.ts';
import { getOtelEnvVars } from '../config/mod.ts';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Job definition for tracing
 */
export interface TracedJobDefinition {
  id: string;
  name?: string;
  entrypoint?: string;
  timeout?: number;
  maxRetries?: number;
  priority?: number;
  tags?: string[];
  timezone?: string;
}

/**
 * Job execution context for tracing
 */
export interface TracedJobExecution {
  executionId: string;
  jobId: string;
  attempt?: number;
  triggeredBy?: string;
  correlationId?: string;
  startedAt?: Date;
}

/**
 * Options for job execution tracing
 */
export interface JobExecutionOptions {
  /** Job definition */
  job: TracedJobDefinition;

  /** Execution details */
  execution: TracedJobExecution;

  /** Additional attributes */
  attributes?: Attributes;

  /** Parent context (extracted from queue message) */
  parentContext?: Context;
}

/**
 * Result of a traced job execution
 */
export interface TracedJobResult {
  /** Whether the job succeeded */
  success: boolean;

  /** Exit code (for subprocess jobs) */
  exitCode?: number;

  /** Job output/result */
  result?: Record<string, unknown>;

  /** Error message if failed */
  error?: string;

  /** Duration in milliseconds */
  durationMs?: number;
}

/**
 * Worker configuration for tracing
 */
export interface TracedWorkerConfig {
  workerId: string;
  queueName: string;
  concurrency?: number;
}

// ============================================================================
// WORKER TRACING
// ============================================================================

/**
 * Create a span for worker process start.
 *
 * @param config - Worker configuration
 * @returns Span for the worker process
 */
export function startWorkerSpan(config: TracedWorkerConfig): Span {
  const tracer = getWorkerTracer();

  const span = createSpan(tracer, SpanNames.WORKER_START, {
    kind: SpanKind.INTERNAL,
    attributes: {
      [WorkerAttributes.WORKER_ID]: config.workerId,
      [WorkerAttributes.WORKER_QUEUE]: config.queueName,
      [WorkerAttributes.WORKER_CONCURRENCY]: config.concurrency ?? 1,
    },
  });

  addSpanEvent(span, 'worker.started');
  return span;
}

/**
 * Create a span for worker process stop.
 *
 * @param workerId - Worker identifier
 * @param activeJobs - Number of active jobs at stop time
 * @returns Span for the worker stop
 */
export function createWorkerStopSpan(workerId: string, activeJobs = 0): Span {
  const tracer = getWorkerTracer();

  const span = createSpan(tracer, SpanNames.WORKER_STOP, {
    kind: SpanKind.INTERNAL,
    attributes: {
      [WorkerAttributes.WORKER_ID]: workerId,
      [WorkerAttributes.WORKER_ACTIVE_JOBS]: activeJobs,
    },
  });

  return span;
}

// ============================================================================
// JOB EXECUTION TRACING
// ============================================================================

/**
 * Execute a job with tracing.
 *
 * Creates a span for the job execution and provides the span to the callback.
 *
 * @param options - Job execution options
 * @param fn - Function that executes the job
 * @returns Job result
 *
 * @example
 * ```ts
 * const result = await traceJobExecution(
 *   { job: jobDef, execution: { executionId, jobId } },
 *   async (span) => {
 *     span.setAttribute('custom', 'value');
 *     return await executeJob();
 *   }
 * );
 * ```
 */
export async function traceJobExecution<T extends TracedJobResult>(
  options: JobExecutionOptions,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const tracer = getJobTracer();
  const { job, execution, attributes, parentContext } = options;

  // Build attributes
  const spanAttributes: Attributes = {
    ...createJobAttributes(job),
    [ExecutionAttributes.EXECUTION_ID]: execution.executionId,
    [JobAttributes.JOB_STATUS]: JobStatuses.RUNNING,
  };

  if (execution.attempt) {
    spanAttributes[JobAttributes.JOB_ATTEMPT] = execution.attempt;
  }
  if (execution.triggeredBy) {
    spanAttributes[JobAttributes.JOB_TRIGGER] = execution.triggeredBy;
  }
  if (execution.correlationId) {
    spanAttributes['correlation.id'] = execution.correlationId;
  }
  if (attributes) {
    Object.assign(spanAttributes, attributes);
  }

  return await withSpan(
    tracer,
    SpanNames.JOB_EXECUTE,
    async (span) => {
      const startTime = Date.now();

      addSpanEvent(span, 'job.started', {
        [JobAttributes.JOB_ID]: job.id,
        [ExecutionAttributes.EXECUTION_ID]: execution.executionId,
      });

      try {
        const result = await fn(span);
        const durationMs = Date.now() - startTime;

        // Update span with result
        span.setAttribute(JobAttributes.JOB_DURATION_MS, durationMs);
        span.setAttribute(
          JobAttributes.JOB_STATUS,
          result.success ? JobStatuses.COMPLETED : JobStatuses.FAILED,
        );

        if (result.exitCode !== undefined) {
          span.setAttribute(JobAttributes.JOB_EXIT_CODE, result.exitCode);
        }

        if (result.success) {
          addSpanEvent(span, 'job.completed', {
            [JobAttributes.JOB_DURATION_MS]: durationMs,
          });
        } else {
          addSpanEvent(span, 'job.failed', {
            [JobAttributes.JOB_DURATION_MS]: durationMs,
            'error.message': result.error ?? 'Unknown error',
          });
        }

        return result;
      } catch (error) {
        const durationMs = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        span.setAttribute(JobAttributes.JOB_DURATION_MS, durationMs);
        span.setAttribute(JobAttributes.JOB_STATUS, JobStatuses.FAILED);

        addSpanEvent(span, 'job.exception', {
          'exception.message': errorMessage,
        });

        throw error;
      }
    },
    {
      kind: SpanKind.INTERNAL,
      attributes: spanAttributes,
      parentContext,
    },
  );
}

/**
 * Create a span for job subprocess spawn.
 *
 * @param job - Job definition
 * @param executionId - Execution identifier
 * @returns Span for the subprocess spawn
 */
export function createJobSpawnSpan(
  job: TracedJobDefinition,
  executionId: string,
): Span {
  const tracer = getJobTracer();

  const span = createSpan(tracer, SpanNames.JOB_SPAWN, {
    kind: SpanKind.INTERNAL,
    attributes: {
      ...createJobAttributes(job),
      [ExecutionAttributes.EXECUTION_ID]: executionId,
    },
  });

  return span;
}

// ============================================================================
// JOB SUBPROCESS ENVIRONMENT
// ============================================================================

/**
 * Create environment variables for a job subprocess.
 *
 * Includes:
 * - All OTEL_* environment variables from parent process
 * - Trace context for continuing the trace in the subprocess
 *
 * @param additionalEnv - Additional environment variables to include
 * @returns Environment variables for the subprocess
 *
 * @example
 * ```ts
 * const env = createJobSubprocessEnv({
 *   JOB_ID: job.id,
 *   JOB_PAYLOAD: JSON.stringify(payload),
 * });
 *
 * const command = new Deno.Command('deno', {
 *   args: ['run', job.entrypoint],
 *   env,
 * });
 * ```
 */
export function createJobSubprocessEnv(
  additionalEnv: Record<string, string> = {},
): Record<string, string> {
  return {
    // Pass through all existing environment (includes OTEL_* from Aspire)
    ...Deno.env.toObject(),
    // Pass OTEL environment variables explicitly
    ...getOtelEnvVars(),
    // Reduce batch span processor delay to minimize subprocess exit wait time
    // Default is 5000ms which causes 20+ second delays on process exit
    OTEL_BSP_SCHEDULE_DELAY: '100',
    OTEL_BSP_EXPORT_TIMEOUT: '5000',
    // Add trace context for the subprocess
    ...createJobTraceEnv(),
    // Add any additional environment variables
    ...additionalEnv,
  };
}

/**
 * Initialize tracing in a job subprocess.
 *
 * Call this at the start of a job script to continue the trace from the worker.
 *
 * @returns Parent context if available, or undefined
 *
 * @example
 * ```ts
 * // In job script (e.g., jobs/my-job.ts)
 * import { initJobTracing, withSpan, getJobTracer } from '@netscript/telemetry';
 *
 * const parentContext = initJobTracing();
 *
 * // Create spans that are linked to the worker trace
 * await withSpan(getJobTracer(), 'job.main', async (span) => {
 *   span.setAttribute('job.step', 'processing');
 *   // ... job logic
 * }, { parentContext });
 * ```
 */
export function initJobTracing(): Context | null {
  return extractJobTraceContext();
}

/**
 * Get trace context from the current span for passing to nested operations.
 *
 * @returns Serialized trace context or null
 */
export function getJobTraceContext(): SerializedTraceContext | null {
  return getTraceContext();
}

// ============================================================================
// JOB SCRIPT HELPERS
// ============================================================================

/**
 * Create a traced job main function wrapper.
 *
 * Simplifies tracing in job scripts by handling context extraction and span creation.
 *
 * @param jobId - Job identifier
 * @param fn - Job main function
 * @returns Result of the job function
 *
 * @example
 * ```ts
 * // In job script
 * import { runTracedJob } from '@netscript/telemetry/instrumentation/worker';
 *
 * const result = await runTracedJob('my-job', async (span) => {
 *   span.addEvent('step.started', { step: 'fetch' });
 *   const data = await fetchData();
 *
 *   span.addEvent('step.completed', { step: 'fetch' });
 *   return { data };
 * });
 *
 * // Output result for worker to capture
 * console.log(JSON.stringify(result));
 * ```
 */
export async function runTracedJob<T>(
  jobId: string,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const tracer = getJobTracer();
  const parentContext = initJobTracing();

  return await withSpan(
    tracer,
    'job.main',
    async (span) => {
      span.setAttribute(JobAttributes.JOB_ID, jobId);
      span.setAttribute('job.subprocess', true);

      addSpanEvent(span, 'job.subprocess.started');

      try {
        const result = await fn(span);
        addSpanEvent(span, 'job.subprocess.completed');
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        addSpanEvent(span, 'job.subprocess.failed', {
          'error.message': message,
        });
        throw error;
      }
    },
    {
      kind: SpanKind.INTERNAL,
      parentContext: parentContext ?? undefined,
    },
  );
}

/**
 * Create a child span within the current job context.
 *
 * Use this for tracing individual tasks or operations within a job.
 * Creates proper parent-child relationships in traces.
 *
 * @param name - Span name (e.g., 'task.validate', 'task.transform')
 * @param fn - Function to execute within the span
 * @param attributes - Optional span attributes
 * @returns Result of the function
 *
 * @example
 * ```ts
 * await runTracedJob('my-job', async (jobSpan) => {
 *   // Create child spans for each task
 *   const result1 = await withChildSpan('task.validate', async (span) => {
 *     span.setAttribute('task.type', 'validation');
 *     return await validateData();
 *   });
 *
 *   const result2 = await withChildSpan('task.transform', async (span) => {
 *     return await transformData(result1);
 *   }, { 'input.size': result1.length });
 *
 *   return { result1, result2 };
 * });
 * ```
 */
export async function withChildSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Attributes,
): Promise<T> {
  const tracer = getJobTracer();
  return await withSpan(tracer, name, fn, {
    kind: SpanKind.INTERNAL,
    attributes,
  });
}

/**
 * Add a step event to the current job span.
 *
 * @param stepName - Name of the step
 * @param attributes - Step attributes
 */
export function addJobStepEvent(
  stepName: string,
  attributes?: Attributes,
): void {
  const span = getActiveSpan();
  if (span) {
    addSpanEvent(span, `job.step.${stepName}`, attributes);
  }
}

/**
 * Record job progress in the current span.
 *
 * @param current - Current progress value
 * @param total - Total expected value
 * @param unit - Unit of measurement (e.g., "records", "items")
 */
export function recordJobProgress(
  current: number,
  total: number,
  unit = 'items',
): void {
  const span = getActiveSpan();
  if (span) {
    const percentage = Math.round((current / total) * 100);
    addSpanEvent(span, 'job.progress', {
      'progress.current': current,
      'progress.total': total,
      'progress.percentage': percentage,
      'progress.unit': unit,
    });
  }
}

// ============================================================================
// WORKER METRICS HELPERS
// ============================================================================

/**
 * Record worker metrics in a span.
 *
 * @param span - Span to record metrics in
 * @param metrics - Worker metrics
 */
export function recordWorkerMetrics(
  span: Span,
  metrics: {
    activeJobs: number;
    processedJobs?: number;
    failedJobs?: number;
    avgDurationMs?: number;
  },
): void {
  span.setAttributes({
    [WorkerAttributes.WORKER_ACTIVE_JOBS]: metrics.activeJobs,
  });

  if (metrics.processedJobs !== undefined) {
    span.setAttribute('worker.jobs.processed', metrics.processedJobs);
  }
  if (metrics.failedJobs !== undefined) {
    span.setAttribute('worker.jobs.failed', metrics.failedJobs);
  }
  if (metrics.avgDurationMs !== undefined) {
    span.setAttribute('worker.jobs.avg_duration_ms', metrics.avgDurationMs);
  }
}
