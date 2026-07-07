/**
 * @module @netscript/telemetry
 *
 * OpenTelemetry tracing primitives, context propagation, instrumentation
 * registries, and NetScript runtime adapters.
 *
 * The root entrypoint exposes the stable package diagnostic and instrumentation
 * registry contract. Runtime helpers live on typed subpaths so callers can
 * import only the layer they need:
 *
 * - `@netscript/telemetry/config`
 * - `@netscript/telemetry/tracer`
 * - `@netscript/telemetry/context`
 * - `@netscript/telemetry/attributes`
 * - `@netscript/telemetry/instrumentation`
 * - `@netscript/telemetry/registry`
 * - `@netscript/telemetry/orpc`
 * - `@netscript/telemetry/otel`
 * - `@netscript/telemetry/query`
 * - `@netscript/telemetry/testing`
 *
 * The most common tracing primitives (`getTracer`, `withSpan`, W3C context
 * propagation) are also re-exported here for convenience.
 *
 * @example Inspect an instrumentation registry
 * ```ts
 * import { inspectTelemetry, InstrumentationRegistry } from "@netscript/telemetry";
 *
 * const registry = new InstrumentationRegistry();
 * registry.register({ name: "queue" });
 *
 * const report = inspectTelemetry(registry);
 * console.log(report.summary);
 * ```
 */

export {
  DuplicateInstrumentationError,
  InstrumentationRegistry,
} from './src/application/registry/mod.ts';
export type {
  InstrumentationContext,
  InstrumentationEntry,
  InstrumentationRegistration,
} from './src/application/registry/mod.ts';
export { initJobTracing, runTracedJob } from './src/instrumentation/worker.ts';
export type {
  Attributes,
  AttributeValue,
  Context,
  CreateSpanOptions,
  Exception,
  Link,
  Span,
  SpanContext,
  SpanOptions,
  SpanStatus,
  TimeInput,
  Tracer,
  TraceState,
} from './src/domain/types.ts';
export { SpanKind, SpanStatusCode } from './src/domain/types.ts';
export type {
  Counter,
  Histogram,
  Meter,
  MeterPort,
  MetricInstrumentOptions,
  ObservableCallback,
  ObservableGauge,
  ObservableResult,
  PropagationExtractCarrier,
  PropagationInjectCarrier,
  PropagatorPort,
  SpanLinkPort,
  TelemetryProviderDescriptor,
  TelemetryProviderOptions,
  TracerProviderPort,
} from './src/ports/mod.ts';
export { inspectTelemetry } from './src/diagnostics/inspect-telemetry.ts';
export type { InspectionReport } from './src/diagnostics/inspect-telemetry.ts';

export {
  createFanInLinks,
  createSpan,
  getActiveContext,
  getActiveSpan,
  getTracer,
  isTracingEnabled,
  TracerNames,
  withSpan,
  withSpanSync,
} from './src/application/mod.ts';
export type { FanInLinkMessage } from './src/application/mod.ts';
export { getParentContextFromHeaders, injectContext } from './src/context/mod.ts';
export type { PropagationHeaders, SerializedTraceContext } from './src/context/mod.ts';
