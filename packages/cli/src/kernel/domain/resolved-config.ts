/**
 * @module types/resolved-config
 * The single unified configuration type for Windows deployment.
 *
 * Produced by the config loader by merging:
 * - netscript.config.ts (schema + service definitions)
 * - appsettings.json (runtime service config from Aspire)
 * - .deploy/windows/config/runtime/*.json (hot-reload overrides)
 * - Environment variables (.env.local, .env)
 */

import type { InfrastructureConfig } from './infrastructure-config.ts';
import type { NetScriptConfig } from '@netscript/config';
import type { PluginType } from '@netscript/plugin';

/**
 * Service deploy configuration (merged from netscript.config.ts + appsettings.json).
 */
export interface ResolvedServiceConfig {
  name: string;
  runtime: 'deno' | 'node' | 'dotnet';
  port: number;
  entrypoint: string;
  workdir: string;
  dependsOn?: string[];
  permissions: string[];
  description?: string;
}

/**
 * Plugin deploy configuration (from appsettings.json NetScript.Plugins).
 */
export interface ResolvedPluginConfig {
  name: string;
  enabled: boolean;
  port: number;
  entrypoint: string;
  workdir: string;
  requiresKv: boolean;
  requiresDb: boolean;
  permissions: string[];
  description?: string;
}

/**
 * App deploy configuration (from appsettings.json NetScript.Apps).
 * Only Deno-runtime apps are compiled and deployed as Windows Services.
 */
export interface ResolvedAppConfig {
  name: string;
  enabled: boolean;
  runtime: 'deno' | 'node' | 'tauri';
  port: number;
  entrypoint: string;
  workdir: string;
  permissions: string[];
  description?: string;
  prebuild?: string;
}

/**
 * Resolved background-processor entrypoint configuration.
 */
export interface ResolvedBackgroundProcessorEntrypointConfig {
  name: string;
  entrypoint: string;
  description: string;
  permissions: string[];
  include?: string[];
  manifestResourceName?: string;
  environment?: Record<string, string>;
  assignWorkerId?: boolean;
}

/**
 * Background processor deploy configuration (from appsettings.json
 * NetScript.BackgroundProcessors plus plugin registry metadata).
 */
export interface ResolvedBackgroundProcessorConfig {
  name: string;
  enabled: boolean;
  workdir: string;
  concurrency: number;
  concurrencyEnvVar?: string;
  permissions: string[];
  description?: string;
  watchDirs?: string[];
  runtimeTopics?: string[];
  requiresKv: boolean;
  requiresDb: boolean;
  serviceReferences: string[];
  pluginReferences: string[];
  entrypoints: Record<string, ResolvedBackgroundProcessorEntrypointConfig>;
}

/**
 * Plugin registry entry normalized for deployment tooling.
 */
export interface RegisteredPluginRuntimeContribution {
  topic: string;
  description?: string;
  schemaDefinitions?: Record<string, unknown>;
  generatedContent?: Record<string, unknown>;
}

export type RegisteredPluginEnvironmentVariableValue =
  | string
  | {
    readonly value?: string;
    readonly fromEnv?: string;
    readonly defaultValue?: string;
  };

export interface RegisteredPluginEntrypoint {
  path: string;
  description?: string;
  permissions?: string[];
  include?: string[];
  manifestResourceName?: string;
  envVars?: Record<string, RegisteredPluginEnvironmentVariableValue>;
  assignWorkerId?: boolean;
}

export interface RegisteredPluginInfrastructure {
  port?: number;
  requires: ('kv' | 'db' | 'cache')[];
  optionalDeps?: ('kv' | 'db' | 'cache')[];
  concurrencyEnvVar?: string;
  defaultConcurrency?: number;
  manifestResourceName?: string;
  envVars?: Record<string, RegisteredPluginEnvironmentVariableValue>;
  runtimeTopics?: string[];
}

export interface RegisteredPluginService {
  entrypoint: string;
  port?: number;
  description?: string;
  dependencies?: string[];
  permissions?: string[];
  requiresDatabase?: boolean;
  requiresKv?: boolean;
}

export interface RegisteredPluginRuntimeConfig {
  schemas: readonly {
    topic: string;
    description?: string;
    schema: Record<string, unknown>;
  }[];
}

export interface RegisteredPluginConfig {
  name: string;
  displayName?: string;
  type?: PluginType;
  workdir: string;
  rootDir: string;
  permissions?: string[];
  service?: RegisteredPluginService;
  infrastructure?: RegisteredPluginInfrastructure;
  entrypoints?: Record<string, RegisteredPluginEntrypoint>;
  runtime?: RegisteredPluginRuntimeContribution;
  runtimeConfig?: RegisteredPluginRuntimeConfig;
}

/**
 * Default Deno runtime settings.
 */
export interface ResolvedDefaultsConfig {
  permissions: string[];
  watchMode: boolean;
}

/**
 * Resolved Windows deployment configuration.
 * Merges defaults from constants/windows.ts with user overrides from
 * netscript.config.ts `deploy.targets.windows` section.
 */
/**
 * Shared resolved deploy base — the build/bundle/compile/health/logging/docker
 * defaults common to every OS deploy target. {@link ResolvedWindowsDeployConfig}
 * and {@link ResolvedLinuxDeployConfig} extend this with their OS-specific path
 * fields, so the shared defaults are declared and resolved once (D2; resolved by
 * `resolveDeployBase`, the only per-OS input being the default compile triple).
 */
export interface ResolvedDeployBaseConfig {
  /** Deployment mode: compile binaries or run via deno + source */
  mode: 'compile' | 'script';
  /** Path to deno for script mode */
  denoPath: string;
  /** deno compile target triple */
  compileTarget: string;
  /** Max parallel compilations */
  concurrency: number;
  /** Per-service compile timeout in ms */
  compileTimeoutMs: number;
  /** Per-service bundle timeout in ms */
  bundleTimeoutMs: number;
  /** Packages to externalize during deno bundle */
  bundleExternal: readonly string[];
  /** npm specifier rewrites for externalized packages */
  bundleExternalImports: Record<string, string>;
  /** Workspace globs for temp compile config (undefined = derive from root deno.json) */
  workspace?: string[];
  /** V8 max heap per service type in MB */
  v8HeapMb: { service: number; plugin: number; worker: number; app: number };
  /** Whether to generate .env files alongside binaries */
  generateEnvFile: boolean;
  /** Log rotation settings */
  logging: {
    rotationSizeMb: number;
    maxRotations: number;
    dateRotation: 'Daily' | 'Weekly' | 'Monthly';
  };
  /** Health check settings */
  health: {
    intervalSeconds: number;
    maxFailedChecks: number;
    maxRestartAttempts: number;
  };
  /** Docker base images (for future docker deployment target) */
  docker: {
    denoBaseImage: string;
    dotnetBaseImage: string;
  };
  /**
   * Health-gated activation + release-retention convention (R-DEPLOY-3).
   * Shared by every target; bindings live in the bare-metal activation adapters.
   */
  activation: {
    /** Prior releases retained before pruning (current is always kept). */
    retain: number;
    /** Atomic activation strategy for this target's platform family. */
    strategy: 'symlink' | 'dir-swap';
    /** Health probe that gates a new release taking traffic. */
    healthGate: {
      /** HTTP path probed for health. */
      path: string;
      /** Port the health endpoint listens on (undefined → derived per service). */
      port?: number;
      /** Per-probe timeout in milliseconds. */
      timeoutMs: number;
      /** Delay between probe attempts in milliseconds. */
      intervalMs: number;
      /** Number of probe attempts before the gate fails. */
      retries: number;
      /** HTTP status that signals healthy. */
      expectStatus: number;
    };
  };
  /** Secret-material convention (R-DEPLOY-3): restricted-permission env file. */
  secrets: {
    /** Relative path of the generated restricted secret env file. */
    envFile: string;
    /** POSIX file mode for the secret file (0o600 default). */
    mode: number;
  };
  /** OpenTelemetry convention (R-DEPLOY-3): canonical `OTEL_DENO` runtime env. */
  otel: {
    /** Whether OTEL runtime env is emitted. */
    enabled: boolean;
    /** OTLP exporter endpoint (`OTEL_EXPORTER_OTLP_ENDPOINT`). */
    endpoint?: string;
    /** OTLP exporter protocol (`OTEL_EXPORTER_OTLP_PROTOCOL`). */
    protocol: string;
    /** Prefix applied to the derived `OTEL_SERVICE_NAME`. */
    serviceNamePrefix?: string;
  };
}

/**
 * Resolved Windows (Servy) deployment configuration. Extends the shared
 * {@link ResolvedDeployBaseConfig} with Windows-specific path fields.
 */
export interface ResolvedWindowsDeployConfig extends ResolvedDeployBaseConfig {
  /** Absolute path to servy-cli.exe */
  servyCliPath: string;
  /** Windows Service name prefix (e.g., "NetScript") */
  servicePrefix: string;
  /** Base install directory (e.g., "C:\NetScript") */
  installBase: string;
}

/**
 * Resolved Linux (systemd) deployment configuration. Extends the shared
 * {@link ResolvedDeployBaseConfig} with Linux-specific path/ownership fields.
 * Merges Linux-sensible defaults with user overrides from netscript.config.ts
 * `deploy.targets.linux`.
 */
export interface ResolvedLinuxDeployConfig extends ResolvedDeployBaseConfig {
  /** Path to systemctl */
  systemctlPath: string;
  /** systemd unit name prefix (e.g., "netscript") */
  unitPrefix: string;
  /** Base install directory (e.g., "/opt/netscript") */
  installBase: string;
  /** System user that owns the generated units */
  user?: string;
  /** System group that owns the generated units */
  group?: string;
  /** Runtime directory for sockets and pid files (e.g., "/run/netscript") */
  runtimeDir: string;
}

/**
 * Resolved Deno Deploy target configuration.
 * Merges `deploy.targets['deno-deploy']` from netscript.config.ts with CLI flag
 * overrides (flags win). Consumed by the composition layer to construct a
 * defaults-baked `DenoDeployTarget`.
 */
export interface ResolvedDenoDeployConfig {
  /** Deno Deploy organization slug (`--org`). */
  org?: string;
  /** Deno Deploy application/project name (`--app`). */
  app?: string;
  /** Whether pushes target production by default (`--prod`). */
  prod: boolean;
  /** Entrypoint module passed to `deno deploy`. */
  entrypoint?: string;
  /** Path to an env file loaded via `--env-file`. */
  envFile?: string;
}

/**
 * Fully-resolved deployment configuration — the single source of truth
 * passed to all adapters, generators, and command handlers.
 */
export interface ResolvedConfig {
  /** Application name (from appsettings or netscript.config.ts) */
  name: string;
  /** Application version */
  version: string;
  /** Absolute path to the project root */
  projectRoot: string;
  /** Absolute path to the deployment output directory */
  deployDir: string;

  /** Deno microservices */
  services: Record<string, ResolvedServiceConfig>;
  /** Plugin services (workers-api, sagas-api, triggers-api, ...) */
  plugins: Record<string, ResolvedPluginConfig>;
  /** Frontend and other app entries */
  apps: Record<string, ResolvedAppConfig>;
  /** Background processor runtime configs keyed by plugin name */
  backgroundProcessors: Record<string, ResolvedBackgroundProcessorConfig>;

  /** Infrastructure (databases, cache, OTLP) */
  infrastructure: InfrastructureConfig;

  /** Default Deno permissions */
  defaults: ResolvedDefaultsConfig;

  /** Raw connection strings from appsettings.json (for env var injection) */
  connectionStrings: Record<string, string>;

  /** Original validated netscript.config.ts (for code generation) */
  netscriptConfig: NetScriptConfig;

  /** Local plugin registry metadata keyed by plugin name */
  registeredPlugins: Record<string, RegisteredPluginConfig>;

  /** Resolved Windows deployment settings (defaults + user overrides) */
  deploy: ResolvedWindowsDeployConfig;
}
