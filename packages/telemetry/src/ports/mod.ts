/**
 * Telemetry provider ports for {@linkcode @netscript/telemetry}.
 *
 * @module
 */

export * from './tracer-provider-port.ts';
export * from './provider-options.ts';
export * from './propagator-port.ts';
export * from './meter-port.ts';
export * from './span-link-port.ts';
export * from './telemetry-query-port.ts';

// Re-export the domain contract types the ports build on, so provider adapters
// can consume them through the ports boundary (the telemetry layering law bars
// adapters from importing `domain/` directly).
export type { Attributes, Context, Link, SpanContext } from '../domain/types.ts';
