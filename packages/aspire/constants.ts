/**
 * @module
 *
 * Constants ported from the C# NuGet package's `DenoTelemetryDefaults`,
 * `DenoHostingDefaults`, `NetScriptHostingConfiguration`, and
 * `NetScriptResourceDefaults`.
 *
 * All constants are `as const` frozen objects for type-safe key access
 * and exhaustive pattern matching.
 *
 * @example
 * ```ts
 * import { OTEL_ENV_VARS, OTEL_DEFAULTS } from '@netscript/aspire/constants';
 *
 * console.log(OTEL_ENV_VARS.OTEL_DENO); // "OTEL_DENO"
 * console.log(OTEL_DEFAULTS.PROTOCOL);   // "http/protobuf"
 * ```
 */

/**
 * OpenTelemetry environment variable names.
 * Ported from `DenoTelemetryDefaults` in `DenoTelemetryExtensions.cs`.
 */
export const OTEL_ENV_VARS = {
  OTEL_DENO: 'OTEL_DENO',
  OTEL_EXPORTER_OTLP_ENDPOINT: 'OTEL_EXPORTER_OTLP_ENDPOINT',
  OTEL_EXPORTER_OTLP_PROTOCOL: 'OTEL_EXPORTER_OTLP_PROTOCOL',
  OTEL_SERVICE_NAME: 'OTEL_SERVICE_NAME',
  OTEL_RESOURCE_ATTRIBUTES: 'OTEL_RESOURCE_ATTRIBUTES',
  OTEL_TRACES_SAMPLER: 'OTEL_TRACES_SAMPLER',
  OTEL_BSP_SCHEDULE_DELAY: 'OTEL_BSP_SCHEDULE_DELAY',
  OTEL_BLRP_SCHEDULE_DELAY: 'OTEL_BLRP_SCHEDULE_DELAY',
  OTEL_METRIC_EXPORT_INTERVAL: 'OTEL_METRIC_EXPORT_INTERVAL',
  OTEL_METRICS_EXEMPLAR_FILTER: 'OTEL_METRICS_EXEMPLAR_FILTER',
} as const;

/**
 * OpenTelemetry default values.
 * Ported from `DenoTelemetryDefaults` and `DenoHostingDefaults`.
 */
export const OTEL_DEFAULTS = {
  /** OTLP protocol for Deno's built-in OTEL exporter. */
  PROTOCOL: 'http/protobuf',
  /** Default OTLP HTTP endpoint (Aspire dashboard collector). */
  ENDPOINT: 'http://localhost:4318',
  /** Trace sampling strategy. */
  SAMPLER: 'always_on',
  /** Development export interval in milliseconds (BSP, BLRP, metrics). */
  EXPORT_INTERVAL: '1000',
  /** Exemplar filter strategy for metrics. */
  EXEMPLAR_FILTER: 'trace_based',
  /** Fallback app version when not specified in config. */
  DEFAULT_VERSION: '1.0.0',
} as const;

/**
 * Aspire dashboard environment variable names.
 * Ported from `ConfigureAspireDashboard` in `NetScriptHostingExtensions.cs`.
 */
export const DASHBOARD_ENV_VARS = {
  /** OTLP HTTP endpoint consumed by the Aspire dashboard collector. */
  OTLP_HTTP_ENDPOINT: 'ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL',
  /** Allows the local dashboard collector to receive unsecured HTTP traffic. */
  ALLOW_UNSECURED_TRANSPORT: 'ASPIRE_ALLOW_UNSECURED_TRANSPORT',
  /** Allows local, unauthenticated dashboard OTLP/API access during development. */
  UNSECURED_ALLOW_ANONYMOUS: 'ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS',
} as const;

/**
 * Default Deno permission flags applied to all resources.
 * Ported from `DenoHostingDefaults.DefaultPermissions`.
 */
export const DEFAULT_PERMISSIONS: readonly string[] = [
  '--allow-net',
  '--allow-env',
  '--allow-read',
  '--allow-sys',
] as const;

/**
 * ASP.NET Core `IConfiguration` section paths for NetScript config sections.
 * Ported from `NetScriptHostingConfiguration`.
 */
export const CONFIG_SECTIONS = {
  Services: 'NetScript:Services',
  Apps: 'NetScript:Apps',
  Plugins: 'NetScript:Plugins',
  BackgroundProcessors: 'NetScript:BackgroundProcessors',
  Databases: 'NetScript:Databases',
  Cache: 'NetScript:Cache',
  Tools: 'NetScript:Tools',
  PrismaStudio: 'NetScript:Tools:prisma-studio',
} as const;

/**
 * Default values for resource configuration.
 * Ported from `DenoHostingDefaults` and `NetScriptResourceDefaults`.
 */
export const RESOURCE_DEFAULTS = {
  /** Default Deno runtime identifier. */
  Runtime: 'deno',
  /** Default service entrypoint path. */
  ServiceEntrypoint: 'src/main.ts',
  /** Default app (Fresh) entrypoint path — at the app root, not src/. */
  AppEntrypoint: 'main.ts',
  /** Watch flag for HMR-capable resources (services, plugins). */
  WatchHmrFlag: '--watch-hmr',
  /** Watch flag for non-HMR resources. */
  WatchFlag: '--watch',
  /** Use Deno's global npm cache for runtime executables instead of workspace node_modules. */
  NodeModulesDirNoneFlag: '--node-modules-dir=none',
  /** Enable Deno worker permission options used by background job execution. */
  UnstableWorkerOptionsFlag: '--unstable-worker-options',
  /** Environment variable name for HTTP port injection. */
  PortEnvVar: 'PORT',
  /** Default HTTP endpoint name for Aspire service discovery. */
  HttpEndpointName: 'http',
} as const;

/**
 * Configuration key constants used in `IConfiguration` binding.
 * Ported from `DenoHostingDefaults`.
 */
export const CONFIG_KEYS = {
  /** Path to the `Version` key. */
  Version: 'NetScript:Version',
  /** Path to the `Name` key. */
  Name: 'NetScript:Name',
  /** Current OTLP endpoint path. */
  OtlpEndpoint: 'NetScript:Otel:HttpEndpoint',
  /** Current Deno defaults section path. */
  DenoDefaults: 'NetScript:Defaults:Deno',
  /** Watch mode key (relative to Deno defaults). */
  WatchMode: 'WatchMode',
  /** Permissions key (relative to Deno defaults). */
  Permissions: 'Permissions',
  /** Service references key (relative to entry). */
  ServiceReferences: 'ServiceReferences',
  /** Plugin references key (relative to entry). */
  PluginReferences: 'PluginReferences',
} as const;
