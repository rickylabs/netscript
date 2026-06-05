import type { InstrumentationContext, WorkerTelemetrySpan } from '../telemetry/mod.ts';

/** Stub-only contract for worker telemetry instrumentation. */
export abstract class WorkerInstrumentation {
  abstract readonly name: string;
  abstract applyTo(span: WorkerTelemetrySpan, ctx: InstrumentationContext): void;
}
