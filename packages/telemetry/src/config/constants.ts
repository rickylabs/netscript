export const OTEL_ENV_VARS = {
  OTEL_DENO: 'OTEL_DENO',
  OTEL_EXPORTER_OTLP_ENDPOINT: 'OTEL_EXPORTER_OTLP_ENDPOINT',
  OTEL_EXPORTER_OTLP_PROTOCOL: 'OTEL_EXPORTER_OTLP_PROTOCOL',
  OTEL_SERVICE_NAME: 'OTEL_SERVICE_NAME',
  OTEL_RESOURCE_ATTRIBUTES: 'OTEL_RESOURCE_ATTRIBUTES',
  OTEL_TRACES_SAMPLER: 'OTEL_TRACES_SAMPLER',
  OTEL_LOG_LEVEL: 'OTEL_LOG_LEVEL',
  OTEL_BSP_SCHEDULE_DELAY: 'OTEL_BSP_SCHEDULE_DELAY',
  OTEL_BLRP_SCHEDULE_DELAY: 'OTEL_BLRP_SCHEDULE_DELAY',
  OTEL_METRIC_EXPORT_INTERVAL: 'OTEL_METRIC_EXPORT_INTERVAL',
} as const;

export interface TelemetryConfig {
  enabled: boolean;
  endpoint: string | undefined;
  protocol: string;
  serviceName: string;
  serviceVersion: string;
  resourceAttributes: Record<string, string>;
  sampler: string;
  debug: boolean;
}

export interface TelemetryConfigDescription {
  enabled: boolean;
  endpoint: string;
  protocol: string;
  serviceName: string;
  serviceVersion: string;
  sampler: string;
}
