import type { JobDefinition } from '@netscript/plugin-workers-core/runtime';
import { describeTelemetryConfig, isTelemetryEnabled } from '@netscript/telemetry/config';
import { JobAttributes, SchedulerAttributes } from '@netscript/telemetry/attributes';
import type { Span } from '@netscript/telemetry/tracer';
import {
  createScheduleJobSpan,
  createSchedulerStartSpan,
  recordCronJobRun,
  type TracedQueue,
  traceJobDispatch,
} from '@netscript/telemetry/instrumentation';

export type { Span, TracedQueue };
export { traceJobDispatch };

/** Log telemetry configuration once when the scheduler process is constructed. */
export function logSchedulerTelemetryConfig(): void {
  if (!isTelemetryEnabled()) return;
  console.log(JSON.stringify({
    prefix: 'Scheduler OpenTelemetry',
    ...describeTelemetryConfig(),
  }));
}

/** Start the long-lived scheduler span. */
export function startSchedulerSpan(): Span {
  return createSchedulerStartSpan('scheduler', 0);
}

/** Record scheduler startup metadata. */
export function recordSchedulerStarted(span: Span, jobCount: number): void {
  span.setAttribute(SchedulerAttributes.SCHEDULER_JOB_COUNT, jobCount);
  span.addEvent('scheduler.started', {
    'scheduler.job_count': jobCount,
  });
}

/** Record scheduler shutdown metadata and close the span. */
export function endSchedulerSpan(span: Span): void {
  span.addEvent('scheduler.stopped');
  span.end();
}

/** Create a span for registering a cron-backed worker job. */
export function createJobScheduleSpan(job: JobDefinition): Span {
  return createScheduleJobSpan({
    id: job.id,
    name: job.name,
    schedule: job.schedule,
    timezone: job.timezone,
    enabled: job.enabled,
    entrypoint: job.entrypoint,
    timeout: job.timeout,
    maxRetries: job.maxRetries,
    tags: job.tags,
  });
}

/** Record a successfully scheduled job on the schedule span. */
export function recordJobScheduled(span: Span, job: JobDefinition): void {
  span.addEvent('job.scheduled', {
    [JobAttributes.JOB_ID]: job.id,
    [SchedulerAttributes.SCHEDULER_CRON]: job.schedule,
  });
}

/** Record a cron run outcome on the long-lived scheduler span. */
export function recordSchedulerCronRun(
  span: Span,
  jobId: string,
  duration: number,
  success: boolean,
  error?: string,
): void {
  recordCronJobRun(span, jobId, duration, success, error);
}
