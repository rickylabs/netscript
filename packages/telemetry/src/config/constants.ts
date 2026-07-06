import {
  NETSCRIPT_SEMCONV_STABILITY_OPT_IN,
  OTEL_SEMCONV_STABILITY_OPT_IN,
} from '../domain/mod.ts';

/**
 * OpenTelemetry environment variable names used by NetScript packages.
 */
export const OTEL_ENV_VARS: {
  readonly OTEL_DENO: 'OTEL_DENO';
  readonly OTEL_EXPORTER_OTLP_ENDPOINT: 'OTEL_EXPORTER_OTLP_ENDPOINT';
  readonly OTEL_EXPORTER_OTLP_PROTOCOL: 'OTEL_EXPORTER_OTLP_PROTOCOL';
  readonly OTEL_SEMCONV_STABILITY_OPT_IN: typeof OTEL_SEMCONV_STABILITY_OPT_IN;
  readonly OTEL_SERVICE_NAME: 'OTEL_SERVICE_NAME';
  readonly OTEL_RESOURCE_ATTRIBUTES: 'OTEL_RESOURCE_ATTRIBUTES';
  readonly OTEL_TRACES_SAMPLER: 'OTEL_TRACES_SAMPLER';
  readonly OTEL_LOG_LEVEL: 'OTEL_LOG_LEVEL';
  readonly OTEL_BSP_SCHEDULE_DELAY: 'OTEL_BSP_SCHEDULE_DELAY';
  readonly OTEL_BLRP_SCHEDULE_DELAY: 'OTEL_BLRP_SCHEDULE_DELAY';
  readonly OTEL_METRIC_EXPORT_INTERVAL: 'OTEL_METRIC_EXPORT_INTERVAL';
} = {
  OTEL_DENO: 'OTEL_DENO',
  OTEL_EXPORTER_OTLP_ENDPOINT: 'OTEL_EXPORTER_OTLP_ENDPOINT',
  OTEL_EXPORTER_OTLP_PROTOCOL: 'OTEL_EXPORTER_OTLP_PROTOCOL',
  OTEL_SEMCONV_STABILITY_OPT_IN: OTEL_SEMCONV_STABILITY_OPT_IN,
  OTEL_SERVICE_NAME: 'OTEL_SERVICE_NAME',
  OTEL_RESOURCE_ATTRIBUTES: 'OTEL_RESOURCE_ATTRIBUTES',
  OTEL_TRACES_SAMPLER: 'OTEL_TRACES_SAMPLER',
  OTEL_LOG_LEVEL: 'OTEL_LOG_LEVEL',
  OTEL_BSP_SCHEDULE_DELAY: 'OTEL_BSP_SCHEDULE_DELAY',
  OTEL_BLRP_SCHEDULE_DELAY: 'OTEL_BLRP_SCHEDULE_DELAY',
  OTEL_METRIC_EXPORT_INTERVAL: 'OTEL_METRIC_EXPORT_INTERVAL',
} as const;

/**
 * NetScript's required semantic-convention stability opt-in value.
 */
export const OTEL_SEMCONV_STABILITY_OPT_IN_VALUE: typeof NETSCRIPT_SEMCONV_STABILITY_OPT_IN =
  NETSCRIPT_SEMCONV_STABILITY_OPT_IN;

/**
 * Resolved telemetry configuration for the current process.
 */
export interface TelemetryConfig {
  /** Whether OpenTelemetry instrumentation is enabled. */
  enabled: boolean;
  /** Optional OTLP endpoint URL. */
  endpoint: string | undefined;
  /** OTLP exporter protocol. */
  protocol: string;
  /** Semantic-convention stability opt-in value. */
  semconvStabilityOptIn: string;
  /** Service name reported to telemetry backends. */
  serviceName: string;
  /** Service version reported to telemetry backends. */
  serviceVersion: string;
  /** Resource attributes parsed from the environment. */
  resourceAttributes: Record<string, string>;
  /** Trace sampler name. */
  sampler: string;
  /** Whether debug-level telemetry logging is enabled. */
  debug: boolean;
}

/**
 * Redacted configuration summary suitable for logs and diagnostics.
 */
export interface TelemetryConfigDescription {
  /** Whether OpenTelemetry instrumentation is enabled. */
  enabled: boolean;
  /** Configured OTLP endpoint or a placeholder. */
  endpoint: string;
  /** OTLP exporter protocol. */
  protocol: string;
  /** Semantic-convention stability opt-in value. */
  semconvStabilityOptIn: string;
  /** Service name reported to telemetry backends. */
  serviceName: string;
  /** Service version reported to telemetry backends. */
  serviceVersion: string;
  /** Trace sampler name. */
  sampler: string;
}
