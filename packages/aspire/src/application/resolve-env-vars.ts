/**
 * @module
 *
 * OpenTelemetry environment variable builder.
 *
 * Generates the correct set of OTEL environment variables based on the
 * resource registration mode. Ported from `DenoTelemetryExtensions.cs`.
 */

import { OTEL_DEFAULTS, OTEL_ENV_VARS } from '../../constants.ts';

/**
 * Registration mode determining which OTEL env vars are needed.
 *
 * - `denoApp`: Resource registered via `addDenoApp()` with the SDK's
 *   `WithDenoDefaults()` pipeline. That SDK path automatically sets 7 OTEL
 *   vars, so only 3 additional vars are needed.
 * - `denoTask`: Resource registered via `addDenoTask()` — no OTEL defaults applied.
 *   All 10 vars must be set explicitly.
 * - `executable`: Resource registered via `addExecutable()` — same as `denoTask`.
 */
export type OtelMode = 'denoApp' | 'denoTask' | 'executable';

/**
 * Builds OpenTelemetry environment variables for a Deno resource.
 *
 * The returned record maps environment variable names to their values.
 * The set of variables depends on the registration mode:
 *
 * - **`denoApp`**: Returns 3 vars (`OTEL_DENO`, `OTEL_SERVICE_NAME`,
 *   `OTEL_RESOURCE_ATTRIBUTES`). Use this only for resources registered through
 *   the Aspire SDK path that runs `WithDenoDefaults()` and `.WithOtlpExporter()`.
 *
 * - **`denoTask` / `executable`**: Returns all 10 vars. These registration
 *   methods do NOT call `WithDenoDefaults()`, so all OTEL configuration
 *   must be provided explicitly.
 *
 * @param serviceName - The resource/service name (e.g., "users")
 * @param serviceVersion - The app version (e.g., "1.0.0")
 * @param mode - How the resource will be registered with the Aspire SDK
 * @param otlpEndpoint - OTLP HTTP endpoint override (defaults to `http://localhost:4318`)
 * @returns Record of environment variable name → value pairs
 *
 * @example
 * ```ts
 * // For addDenoApp with WithDenoDefaults() — only 3 vars needed
 * const vars = buildOtelEnvVars('users', '1.0.0', 'denoApp');
 * // { OTEL_DENO: "true", OTEL_SERVICE_NAME: "users", OTEL_RESOURCE_ATTRIBUTES: "service.version=1.0.0" }
 *
 * // For addExecutable — all 10 vars
 * const vars = buildOtelEnvVars('users', '1.0.0', 'executable');
 * // { OTEL_DENO: "true", OTEL_EXPORTER_OTLP_ENDPOINT: "http://localhost:4318", ... }
 * ```
 */
export function buildOtelEnvVars(
  serviceName: string,
  serviceVersion: string,
  mode: OtelMode,
  otlpEndpoint: string = OTEL_DEFAULTS.ENDPOINT,
): Record<string, string> {
  // Core vars that WithDenoOpenTelemetry() sets — always needed
  const coreVars: Record<string, string> = {
    [OTEL_ENV_VARS.OTEL_DENO]: 'true',
    [OTEL_ENV_VARS.OTEL_SERVICE_NAME]: serviceName,
    [OTEL_ENV_VARS.OTEL_RESOURCE_ATTRIBUTES]: `service.version=${serviceVersion}`,
  };

  // denoApp is only valid when WithDenoDefaults() and .WithOtlpExporter() set the rest.
  if (mode === 'denoApp') {
    return coreVars;
  }

  // For denoTask/executable, we must set ALL OTEL vars explicitly
  return {
    ...coreVars,
    [OTEL_ENV_VARS.OTEL_EXPORTER_OTLP_ENDPOINT]: otlpEndpoint,
    [OTEL_ENV_VARS.OTEL_EXPORTER_OTLP_PROTOCOL]: OTEL_DEFAULTS.PROTOCOL,
    [OTEL_ENV_VARS.OTEL_TRACES_SAMPLER]: OTEL_DEFAULTS.SAMPLER,
    [OTEL_ENV_VARS.OTEL_BSP_SCHEDULE_DELAY]: OTEL_DEFAULTS.EXPORT_INTERVAL,
    [OTEL_ENV_VARS.OTEL_BLRP_SCHEDULE_DELAY]: OTEL_DEFAULTS.EXPORT_INTERVAL,
    [OTEL_ENV_VARS.OTEL_METRIC_EXPORT_INTERVAL]: OTEL_DEFAULTS.EXPORT_INTERVAL,
    [OTEL_ENV_VARS.OTEL_METRICS_EXEMPLAR_FILTER]: OTEL_DEFAULTS.EXEMPLAR_FILTER,
  };
}
