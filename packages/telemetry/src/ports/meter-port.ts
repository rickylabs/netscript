/**
 * Metrics port for {@linkcode @netscript/telemetry}.
 *
 * A meter adapter binds NetScript metric instruments to a concrete
 * OpenTelemetry meter provider. The Deno-native provider delegates to the
 * runtime's global meter (which the runtime flushes), while the SDK provider
 * owns a `MeterProvider` whose observable instruments must be flushed on exit —
 * hence the {@linkcode MeterPort.forceFlush} hook.
 *
 * @module
 */

import type { Attributes } from '../domain/types.ts';

/** Additive counter instrument. */
export interface Counter {
  /** Add `value` to the counter, optionally tagged with attributes. */
  add(value: number, attributes?: Attributes): void;
}

/** Value-distribution instrument. */
export interface Histogram {
  /** Record a measurement, optionally tagged with attributes. */
  record(value: number, attributes?: Attributes): void;
}

/** Sink passed to an observable instrument callback. */
export interface ObservableResult {
  /** Report an observed measurement, optionally tagged with attributes. */
  observe(value: number, attributes?: Attributes): void;
}

/** Callback invoked on collection to observe an asynchronous gauge value. */
export type ObservableCallback = (result: ObservableResult) => void | Promise<void>;

/** Asynchronous gauge instrument observed on each collection cycle. */
export interface ObservableGauge {
  /** Register a callback invoked on every metric collection. */
  addCallback(callback: ObservableCallback): void;
  /** Remove a previously registered callback. */
  removeCallback(callback: ObservableCallback): void;
}

/** Options accepted when creating an instrument. */
export interface MetricInstrumentOptions {
  /** Human-readable description of the instrument. */
  description?: string;
  /** Unit of measure (for example `"ms"` or `"By"`). */
  unit?: string;
}

/** Factory for metric instruments, scoped to an instrumentation name. */
export interface Meter {
  /** Create an additive counter. */
  createCounter(name: string, options?: MetricInstrumentOptions): Counter;
  /** Create a value-distribution histogram. */
  createHistogram(name: string, options?: MetricInstrumentOptions): Histogram;
  /** Create an asynchronous gauge. */
  createObservableGauge(name: string, options?: MetricInstrumentOptions): ObservableGauge;
}

/**
 * Port a metrics adapter implements.
 *
 * {@linkcode MeterPort.forceFlush} is the load-bearing hook for the SDK
 * provider: observable instruments are only exported on a collection cycle, so
 * a flush must run on process exit to avoid losing the final gauge values.
 */
export interface MeterPort {
  /** Obtain a {@linkcode Meter} for the given instrumentation scope. */
  getMeter(name: string, version?: string): Meter;
  /**
   * Force the meter provider to collect and export buffered measurements.
   *
   * The Deno-native meter treats this as a no-op (the runtime owns export); the
   * SDK meter drains its `PeriodicExportingMetricReader`.
   */
  forceFlush(): void | Promise<void>;
}
