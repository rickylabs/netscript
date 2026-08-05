import type { Attributes, AttributeValue, Span } from '@netscript/telemetry/tracer';
import { getActiveSpan } from '@netscript/telemetry/tracer';
import { recordJobProgress, withChildSpan } from '@netscript/telemetry/instrumentation';
import type { JobHandlerContext } from '../public/root.ts';

const PERCENT_TOTAL = 100;
const PERCENT_UNIT = 'percent';

/** Span operations exposed to worker job handlers. */
export type JobToolSpan = Readonly<{
  setAttribute(name: string, value: unknown): void;
  addEvent(name: string, attributes?: Readonly<Record<string, unknown>>): void;
}>;

/** Runtime tools exposed to worker job handlers. */
export type JobTools = Readonly<{
  log: Readonly<{
    info(...data: unknown[]): void;
    warn(...data: unknown[]): void;
    error(...data: unknown[]): void;
    debug(...data: unknown[]): void;
  }>;
  progress(percent: number, message?: string): void | Promise<void>;
  trace: Readonly<{
    addEvent(name: string, attributes?: Readonly<Record<string, unknown>>): void;
    recordProgress(current: number, total: number, unit?: string): void;
    withChildSpan<T>(name: string, fn: (span: JobToolSpan) => Promise<T>): Promise<T>;
  }>;
  traceContext: Readonly<{
    traceparent?: string;
    tracestate?: string;
  }>;
}>;

/** Create handler tools backed by the active worker telemetry context. */
export function createJobTools(ctx: JobHandlerContext): JobTools {
  return {
    log: {
      info: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.log,
    },
    progress: (percent, message) => {
      recordJobProgress(percent, PERCENT_TOTAL, PERCENT_UNIT);
      return ctx.reportProgress?.(percent, message);
    },
    trace: {
      addEvent: (name, attributes) => {
        getActiveSpan()?.addEvent(name, toTelemetryAttributes(attributes));
      },
      recordProgress: (current, total, unit) => recordJobProgress(current, total, unit),
      withChildSpan: (name, fn) => withChildSpan(name, (span) => fn(toJobToolSpan(span))),
    },
    traceContext: {
      traceparent: ctx.traceparent,
      tracestate: ctx.tracestate,
    },
  };
}

function toJobToolSpan(span: Span): JobToolSpan {
  return {
    setAttribute: (name, value) => {
      span.setAttribute(name, toTelemetryAttributeValue(value));
    },
    addEvent: (name, attributes) => {
      span.addEvent(name, toTelemetryAttributes(attributes));
    },
  };
}

function toTelemetryAttributes(
  attributes: Readonly<Record<string, unknown>> | undefined,
): Attributes | undefined {
  if (!attributes) return undefined;
  return Object.fromEntries(
    Object.entries(attributes).map(([name, value]) => [name, toTelemetryAttributeValue(value)]),
  );
}

function toTelemetryAttributeValue(value: unknown): AttributeValue {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (isAttributeArray(value)) return value;
  if (value === undefined) return 'undefined';
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function isAttributeArray(value: unknown): value is string[] | number[] | boolean[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  const valueType = typeof value[0];
  return (valueType === 'string' || valueType === 'number' || valueType === 'boolean') &&
    value.every((item) => typeof item === valueType);
}
