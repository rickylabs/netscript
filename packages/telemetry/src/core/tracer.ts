import { type Context, context, type Span, trace, type Tracer } from '@opentelemetry/api';
import { isTelemetryEnabled } from '../config/mod.ts';

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

const tracerCache = new Map<string, Tracer>();

export function getTracer(name: string = TracerNames.DEFAULT, version = '1.0.0'): Tracer {
  const cacheKey = `${name}@${version}`;
  if (!tracerCache.has(cacheKey)) {
    tracerCache.set(cacheKey, trace.getTracer(name, version));
  }
  return tracerCache.get(cacheKey)!;
}

export function getActiveContext(): Context {
  return context.active();
}

export function getActiveSpan(): Span | undefined {
  return trace.getActiveSpan();
}

export function isTracingEnabled(): boolean {
  return isTelemetryEnabled();
}

export function getQueueTracer(): Tracer {
  return getTracer(TracerNames.QUEUE);
}

export function getWorkerTracer(): Tracer {
  return getTracer(TracerNames.WORKER);
}

export function getSchedulerTracer(): Tracer {
  return getTracer(TracerNames.SCHEDULER);
}

export function getJobTracer(): Tracer {
  return getTracer(TracerNames.JOB);
}

export function getSSETracer(): Tracer {
  return getTracer(TracerNames.SSE);
}

export function getKVTracer(): Tracer {
  return getTracer(TracerNames.KV);
}

export function getSagaTracer(): Tracer {
  return getTracer(TracerNames.SAGA);
}
