/** Span shape accepted by worker instrumentation hooks. */
export type WorkerInstrumentationSpan = {
  /** Set one span attribute. */
  setAttribute(name: string, value: unknown): void;
  /** Set multiple span attributes. */
  setAttributes(attributes: Readonly<Record<string, unknown>>): void;
  /** Add a span event. */
  addEvent(name: string, attributes?: Readonly<Record<string, unknown>>): void;
};

/** Context supplied to worker instrumentation hooks. */
export type WorkerInstrumentationContext = Readonly<Record<string, unknown> & {
  readonly correlationId?: string;
  readonly status?: string;
}>;

/** Stub-only contract for worker telemetry instrumentation. */
export abstract class WorkerInstrumentation {
  /** Stable instrumentation name. */
  abstract readonly name: string;
  /** Apply instrumentation to a span. */
  abstract applyTo(span: WorkerInstrumentationSpan, ctx: WorkerInstrumentationContext): void;
}
