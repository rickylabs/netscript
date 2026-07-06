import type { Context } from '../application/mod.ts';
import { extractContext, extractFromTraceContext, resolveTraceContext } from './w3c.ts';
import type { JobTraceEnv, PropagationHeaders, SerializedTraceContext } from './types.ts';

/**
 * Create environment variables carrying trace context for a job subprocess.
 */
export function createJobTraceEnv(ctx?: Context): JobTraceEnv {
  const traceContext = resolveTraceContext(ctx);
  if (!traceContext) {
    return {};
  }

  const env: JobTraceEnv = {
    JOB_TRACE_CONTEXT: JSON.stringify(traceContext),
    TRACEPARENT: traceContext.traceparent,
  };
  if (traceContext.tracestate) {
    env.TRACESTATE = traceContext.tracestate;
  }
  return env;
}

/**
 * Extract a parent context from job subprocess environment variables.
 */
export function extractJobTraceContext(): Context | null {
  const jsonContext = Deno.env.get('JOB_TRACE_CONTEXT');
  if (jsonContext) {
    try {
      return extractFromTraceContext(JSON.parse(jsonContext) as SerializedTraceContext);
    } catch {
      // Fall through to TRACEPARENT.
    }
  }

  const traceparent = Deno.env.get('TRACEPARENT');
  if (!traceparent) {
    return null;
  }

  const headers: PropagationHeaders = { traceparent };
  const tracestate = Deno.env.get('TRACESTATE');
  if (tracestate) {
    headers.tracestate = tracestate;
  }
  return extractContext(headers);
}
