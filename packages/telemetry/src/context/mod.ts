/**
 * Context propagation helpers for {@linkcode @netscript/telemetry}.
 */

export * from './types.ts';
export type { Context, Span, SpanContext } from '../core/mod.ts';
export * from './w3c.ts';
export * from './payload-context.ts';
export * from './message.ts';
export * from './helpers.ts';

export {
  extractContext as getParentContextFromHeaders,
  injectContext,
  resolveTraceContext as getTraceContext,
} from './w3c.ts';
