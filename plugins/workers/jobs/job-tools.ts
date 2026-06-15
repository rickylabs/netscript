import type { JobHandlerContext } from '@netscript/plugin-workers-core';

type Span = {
  setAttribute(name: string, value: unknown): void;
  addEvent(name: string, attributes?: Record<string, unknown>): void;
};

export type JobTools = Readonly<{
  log: Readonly<{
    info(...data: unknown[]): void;
    warn(...data: unknown[]): void;
    error(...data: unknown[]): void;
    debug(...data: unknown[]): void;
  }>;
  progress(percent: number, message?: string): void | Promise<void>;
  trace: Readonly<{
    addEvent(name: string, attributes?: Record<string, unknown>): void;
    recordProgress(current: number, total: number, unit?: string): void;
    withChildSpan<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T>;
  }>;
  traceContext: Readonly<{
    traceparent?: string;
    tracestate?: string;
  }>;
}>;

const noopSpan: Span = {
  setAttribute: () => {},
  addEvent: () => {},
};

/** Local job runtime tools for migrated plugin jobs. */
export function createJobTools(ctx: JobHandlerContext): JobTools {
  return {
    log: {
      info: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.log,
    },
    progress: (percent: number, message?: string) => ctx.reportProgress?.(percent, message),
    trace: {
      addEvent: (_name: string, _attributes?: Record<string, unknown>) => {},
      recordProgress: (_current: number, _total: number, _unit?: string) => {},
      withChildSpan: <T>(_name: string, fn: (span: Span) => Promise<T>) => fn(noopSpan),
    },
    traceContext: {
      traceparent: ctx.traceparent,
      tracestate: ctx.tracestate,
    },
  };
}
