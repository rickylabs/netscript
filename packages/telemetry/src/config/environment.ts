import {
  OTEL_ENV_VARS,
  OTEL_SEMCONV_STABILITY_OPT_IN_VALUE,
  type TelemetryConfig,
  type TelemetryConfigDescription,
} from './constants.ts';
import { validateTelemetryConfig } from './schema.ts';

function parseResourceAttributes(value: string | undefined): Record<string, string> {
  if (!value) {
    return {};
  }

  const attributes: Record<string, string> = {};
  for (const pair of value.split(',')) {
    const [key, ...valueParts] = pair.split('=');
    if (key && valueParts.length > 0) {
      attributes[key.trim()] = valueParts.join('=').trim();
    }
  }

  return attributes;
}

function getEnv(name: string): string | undefined {
  try {
    return Deno.env.get(name);
  } catch {
    return undefined;
  }
}

/**
 * Resolve telemetry configuration from OpenTelemetry environment variables.
 *
 * The resolved configuration is validated with {@linkcode telemetryConfigSchema}
 * via {@linkcode validateTelemetryConfig}, so a malformed `OTEL_EXPORTER_OTLP_ENDPOINT`
 * fails fast with a {@linkcode TelemetryConfigError} rather than propagating a
 * bad endpoint into exporters.
 *
 * @throws {TelemetryConfigError} When the resolved configuration is invalid.
 */
export function getTelemetryConfig(): TelemetryConfig {
  const enabled = getEnv(OTEL_ENV_VARS.OTEL_DENO) === 'true';
  const endpoint = getEnv(OTEL_ENV_VARS.OTEL_EXPORTER_OTLP_ENDPOINT);
  const protocol = getEnv(OTEL_ENV_VARS.OTEL_EXPORTER_OTLP_PROTOCOL) ?? 'http/protobuf';
  const semconvStabilityOptIn = getEnv(OTEL_ENV_VARS.OTEL_SEMCONV_STABILITY_OPT_IN) ??
    OTEL_SEMCONV_STABILITY_OPT_IN_VALUE;
  const serviceName = getEnv(OTEL_ENV_VARS.OTEL_SERVICE_NAME) ?? 'unknown-service';
  const resourceAttributes = parseResourceAttributes(
    getEnv(OTEL_ENV_VARS.OTEL_RESOURCE_ATTRIBUTES),
  );
  const serviceVersion = resourceAttributes['service.version'] ?? '1.0.0';
  const sampler = getEnv(OTEL_ENV_VARS.OTEL_TRACES_SAMPLER) ?? 'parentbased_always_on';
  const debug = getEnv(OTEL_ENV_VARS.OTEL_LOG_LEVEL) === 'debug';

  return validateTelemetryConfig({
    enabled,
    endpoint,
    protocol,
    semconvStabilityOptIn,
    serviceName,
    serviceVersion,
    resourceAttributes,
    sampler,
    debug,
  });
}

/**
 * Return whether OpenTelemetry instrumentation is enabled.
 */
export function isTelemetryEnabled(): boolean {
  return getEnv(OTEL_ENV_VARS.OTEL_DENO) === 'true';
}

/**
 * Return the configured service name or the default service name.
 */
export function getServiceName(): string {
  return getEnv(OTEL_ENV_VARS.OTEL_SERVICE_NAME) ?? 'unknown-service';
}

/**
 * Return the configured OTLP endpoint, when present.
 */
export function getOtlpEndpoint(): string | undefined {
  return getEnv(OTEL_ENV_VARS.OTEL_EXPORTER_OTLP_ENDPOINT);
}

/**
 * Return configured OpenTelemetry environment variables.
 */
export function getOtelEnvVars(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const key of Object.values(OTEL_ENV_VARS)) {
    const value = getEnv(key);
    if (value !== undefined) {
      vars[key] = value;
    }
  }
  return vars;
}

/**
 * Return a log-safe summary of the resolved telemetry configuration.
 */
export function describeTelemetryConfig(): TelemetryConfigDescription {
  const config = getTelemetryConfig();
  return {
    enabled: config.enabled,
    endpoint: config.endpoint ?? 'not configured',
    protocol: config.protocol,
    semconvStabilityOptIn: config.semconvStabilityOptIn,
    serviceName: config.serviceName,
    serviceVersion: config.serviceVersion,
    sampler: config.sampler,
  };
}
