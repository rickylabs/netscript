/** Span shape accepted by worker instrumentation hooks. */
export type WorkerInstrumentationSpan = {
  setAttribute(name: string, value: unknown): void;
  setAttributes(attributes: Readonly<Record<string, unknown>>): void;
  addEvent(name: string, attributes?: Readonly<Record<string, unknown>>): void;
};

/** Context supplied to worker instrumentation hooks. */
export type WorkerInstrumentationContext = Readonly<Record<string, unknown> & {
  readonly correlationId?: string;
  readonly status?: string;
}>;

/** Stub-only contract for worker telemetry instrumentation. */
export abstract class WorkerInstrumentation {
  abstract readonly name: string;
  abstract applyTo(span: WorkerInstrumentationSpan, ctx: WorkerInstrumentationContext): void;
}
