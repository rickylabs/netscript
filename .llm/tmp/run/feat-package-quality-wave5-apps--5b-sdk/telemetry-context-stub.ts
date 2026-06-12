/** Minimal telemetry context for focused sdk type gates. */
export function getTraceContext(): { traceparent?: string; tracestate?: string } | null {
  return null;
}
