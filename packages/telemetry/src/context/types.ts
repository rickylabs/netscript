export interface SerializedTraceContext {
  traceparent: string;
  tracestate?: string;
}

export type PropagationHeaders = Record<string, string>;

export interface JobTraceEnv {
  JOB_TRACE_CONTEXT?: string;
  TRACEPARENT?: string;
  TRACESTATE?: string;
}

export interface ParsedTraceparent {
  version: string;
  traceId: string;
  parentId: string;
  traceFlags: number;
}
