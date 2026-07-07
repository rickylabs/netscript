/**
 * Context-propagation port for {@linkcode @netscript/telemetry}.
 *
 * A propagator adapter serializes an execution {@linkcode Context} into a
 * text-map carrier (for example, outgoing message headers) and reconstructs it
 * on the receiving side, implementing W3C Trace Context propagation. Defining
 * the port here lets the composition root pick a propagator implementation
 * without importing an adapter directly.
 *
 * @module
 */

import type { Context } from '../domain/types.ts';

/**
 * Read-only carrier a propagator extracts trace context from.
 *
 * Header maps commonly surface missing values as `undefined`, so extraction
 * carriers permit it; injection targets a mutable string map.
 */
export type PropagationExtractCarrier = Readonly<Record<string, string | undefined>>;

/** Mutable carrier a propagator injects trace-context headers into. */
export type PropagationInjectCarrier = Record<string, string>;

/**
 * Port a context-propagation adapter implements.
 *
 * The contract mirrors the OpenTelemetry `TextMapPropagator` surface but is
 * expressed in terms of the telemetry `domain` {@linkcode Context} so callers
 * never depend on a concrete OpenTelemetry API type.
 */
export interface PropagatorPort {
  /**
   * Inject the trace context carried by `context` into `carrier` as W3C
   * `traceparent`/`tracestate` headers.
   */
  inject(context: Context, carrier: PropagationInjectCarrier): void;
  /**
   * Extract a trace context from `carrier`, returning a context derived from
   * `context` (unchanged when the carrier holds no valid trace headers).
   */
  extract(context: Context, carrier: PropagationExtractCarrier): Context;
  /** Carrier keys this propagator reads and writes (for example `traceparent`). */
  fields(): string[];
}
