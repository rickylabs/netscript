import { context, trace, type Tracer as OtelTracer } from '@opentelemetry/api';
import { isTelemetryEnabled } from '../config/mod.ts';
import type { Context, Span, Tracer } from '../domain/types.ts';

/**
 * Standard tracer names for NetScript telemetry domains.
 */
export const TracerNames = {
  QUEUE: '@netscript/queue',
  WORKER: '@netscript/worker',
  SCHEDULER: '@netscript/scheduler',
  JOB: '@netscript/job',
  SAGA: '@netscript/saga',
  SSE: '@netscript/sse',
  KV: '@netscript/kv',
  DEFAULT: '@netscript/telemetry',
} as const;

const tracerCache = new Map<string, OtelTracer>();

/**
 * Return a cached tracer for the supplied instrumentation name and version.
 */
export function getTracer(name: string = TracerNames.DEFAULT, version = '1.0.0'): Tracer {
  const cacheKey = `${name}@${version}`;
  if (!tracerCache.has(cacheKey)) {
    tracerCache.set(cacheKey, trace.getTracer(name, version));
  }
  const tracer = tracerCache.get(cacheKey);
  if (!tracer) {
    throw new Error(`Unable to create telemetry tracer '${cacheKey}'`);
  }
  return tracer as Tracer;
}

/**
 * Return the OpenTelemetry context active on the current async execution path.
 */
export function getActiveContext(): Context {
  return context.active();
}

/**
 * Return the active span, when one is present in the active context.
 */
export function getActiveSpan(): Span | undefined {
  return trace.getActiveSpan() as Span | undefined;
}

/**
 * Report whether tracing should be enabled for the current process.
 */
export function isTracingEnabled(): boolean {
  return isTelemetryEnabled();
}

/**
 * Return the queue-domain tracer.
 */
export function getQueueTracer(): Tracer {
  return getTracer(TracerNames.QUEUE);
}

/**
 * Return the worker-domain tracer.
 */
export function getWorkerTracer(): Tracer {
  return getTracer(TracerNames.WORKER);
}

/**
 * Return the scheduler-domain tracer.
 */
export function getSchedulerTracer(): Tracer {
  return getTracer(TracerNames.SCHEDULER);
}

/**
 * Return the job-domain tracer.
 */
export function getJobTracer(): Tracer {
  return getTracer(TracerNames.JOB);
}

/**
 * Return the Server-Sent Events domain tracer.
 */
export function getSSETracer(): Tracer {
  return getTracer(TracerNames.SSE);
}

/**
 * Return the key-value domain tracer.
 */
export function getKVTracer(): Tracer {
  return getTracer(TracerNames.KV);
}

/**
 * Return the saga-domain tracer.
 */
export function getSagaTracer(): Tracer {
  return getTracer(TracerNames.SAGA);
}
