/**
 * Telemetry semantic-convention opt-in environment variable.
 */
export const OTEL_SEMCONV_STABILITY_OPT_IN = 'OTEL_SEMCONV_STABILITY_OPT_IN' as const;

/**
 * NetScript's required OpenTelemetry semantic-convention stability opt-in.
 */
export const NETSCRIPT_SEMCONV_STABILITY_OPT_IN =
  'messaging,rpc,gen_ai_latest_experimental' as const;

/**
 * Single proprietary attribute root reserved for NetScript-owned telemetry keys.
 */
export const NETSCRIPT_ATTRIBUTE_ROOT = 'netscript' as const;

/**
 * Deprecated-alias migration window used while consumers move to `netscript.*`.
 */
export const NETSCRIPT_ATTRIBUTE_ALIAS_WINDOW = '0.0.1-beta.5' as const;

/**
 * Deprecated-alias migration mode matching OpenTelemetry's duplicate-key window.
 */
export const NETSCRIPT_ATTRIBUTE_ALIAS_MODE = 'dup' as const;

/**
 * Attribute domains whose proprietary keys must live below `netscript.*`.
 */
export const NetScriptAttributeDomains = {
  JOB: 'netscript.job',
  EXECUTION: 'netscript.execution',
  SAGA: 'netscript.saga',
  TRIGGER: 'netscript.trigger',
  WORKER: 'netscript.worker',
  SCHEDULER: 'netscript.scheduler',
  MESSAGING: 'netscript.messaging',
  CORRELATION: 'netscript.correlation',
  DURABILITY: 'netscript.durability',
  IDEMPOTENCY: 'netscript.idempotency',
  RETRY: 'netscript.retry',
  CONCURRENCY: 'netscript.concurrency',
  OUTCOME: 'netscript.outcome',
  SSE: 'netscript.sse',
  KV: 'netscript.kv',
} as const;

/**
 * Cross-domain correlation floor required on correlated spans.
 */
export const NetScriptCorrelationAttributes = {
  CORRELATION_ID: 'netscript.correlation.id',
} as const;

/**
 * Telemetry convention checklist entries used to grade package instrumentation.
 */
export const TelemetryConventionChecklist = [
  {
    id: 'TC-1',
    summary: 'Span names use the central `<domain>.<operation>` hierarchy.',
  },
  {
    id: 'TC-2',
    summary: 'Every emitted span declares the correct SpanKind.',
  },
  {
    id: 'TC-3',
    summary: 'Every emitted span records OK or ERROR status and exceptions.',
  },
  {
    id: 'TC-4',
    summary: 'Lifecycle breadcrumbs use span events, not extra local spans.',
  },
  {
    id: 'TC-5',
    summary: 'OpenTelemetry semantic-convention keys are used verbatim where they exist.',
  },
  {
    id: 'TC-6',
    summary: 'NetScript-owned attributes live below the single `netscript.*` root.',
  },
  {
    id: 'TC-7',
    summary: 'Every span carries the required identity, correlation, outcome, and retry floor.',
  },
  {
    id: 'TC-8',
    summary: 'Sensitive content is redacted or hashed before it reaches telemetry.',
  },
  {
    id: 'TC-9',
    summary: 'W3C trace context is extracted on ingress and injected on egress.',
  },
  {
    id: 'TC-10',
    summary: 'Subprocess propagation uses TRACEPARENT, TRACESTATE, and CORRELATION_ID env keys.',
  },
  {
    id: 'TC-11',
    summary: 'Per-domain metric instruments live behind the shared telemetry layer.',
  },
  {
    id: 'TC-12',
    summary: 'Enablement is decoupled from OTEL_DENO and falls back to no-op telemetry.',
  },
  {
    id: 'TC-13',
    summary: 'Packages consume the shared instrumentation facade instead of private tracers.',
  },
  {
    id: 'TC-14',
    summary: 'Fan-in uses span links at span creation time, not parent-child edges.',
  },
] as const;

/**
 * Telemetry convention checklist identifier.
 */
export type TelemetryConventionId = (typeof TelemetryConventionChecklist)[number]['id'];

/**
 * Proprietary NetScript attribute domain root.
 */
export type NetScriptAttributeDomain =
  (typeof NetScriptAttributeDomains)[keyof typeof NetScriptAttributeDomains];
