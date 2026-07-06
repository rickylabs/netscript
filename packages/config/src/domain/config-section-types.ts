/**
 * @module @netscript/config/types
 *
 * Public section type definitions for NetScript configuration.
 */

/** Permission value accepted by Deno-style runtime permission fields. */
export type PermissionValue = boolean | string[];

/** Permission flags for jobs and task execution. */
export interface PermissionConfig {
  /** Allow network access globally or for selected hosts. */
  net?: PermissionValue;
  /** Allow file read access globally or for selected paths. */
  read?: PermissionValue;
  /** Allow file write access globally or for selected paths. */
  write?: PermissionValue;
  /** Allow environment access globally or for selected variable names. */
  env?: PermissionValue;
  /** Allow subprocess execution globally or for selected commands. */
  run?: PermissionValue;
  /** Allow foreign-function interface access. */
  ffi?: boolean;
  /** Allow dynamic imports from selected URL prefixes. */
  import?: string[];
}

/** Logging configuration used by runtime and CLI entrypoints. */
export interface LoggingConfig {
  /** Minimum log level emitted by the project. */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Log output format. */
  format: 'text' | 'json';
  /** Whether emitted logs include timestamps. */
  timestamps: boolean;
  /** Whether text logs use ANSI colors. */
  colors?: boolean;
}

/** Workspace-aware path conventions used by CLI and generators. */
export interface PathsConfig {
  /** Directory containing service packages. */
  services: string;
  /** Directory containing framework or application packages. */
  packages: string;
  /** Directory containing frontend applications. */
  apps: string;
  /** Directory containing worker modules. */
  workers: string;
  /** Directory containing saga modules. */
  sagas: string;
  /** Directory containing trigger modules. */
  triggers: string;
  /** Directory containing plugin packages. */
  plugins: string;
  /** Directory containing versioned contracts. */
  contracts: string;
  /** Directory containing database schema assets. */
  database: string;
  /** Directory containing task scripts. */
  tasks: string;
  /** Directory containing deployment output. */
  deploy: string;
}

/** Aspire orchestration settings for generated AppHost projects or entrypoints. */
export interface AspireConfig {
  /** Path to a legacy AppHost project directory or modern TS AppHost entrypoint file. */
  appHost: string;
  /** Local Aspire dashboard port. */
  dashboardPort: number;
}

/**
 * Environment context provided to async config functions.
 */
export interface ConfigEnv {
  /** Current mode: development, production, or test. */
  mode: 'development' | 'production' | 'test';
  /** CLI command currently being executed. */
  command: string;
}

/**
 * Options for loading configuration files.
 */
export interface LoadConfigOptions {
  /** Working directory to search from. */
  cwd?: string;
  /** Explicit path to the config file. */
  configFile?: string;
}

/**
 * Environment variable definition for `resolveEnv`.
 */
export interface EnvDef {
  /** Override environment variable name. */
  env?: string;
  /** Coercion type used when reading the variable. */
  type?: 'string' | 'number' | 'boolean' | 'json';
  /** Default value used when the variable is absent. */
  default?: unknown;
  /** Whether the variable must be present. */
  required?: boolean;
}

/**
 * Resolved environment variable type based on an {@linkcode EnvDef}.
 */
export type ResolvedEnvType<T extends EnvDef> = T['type'] extends 'number' ? number
  : T['type'] extends 'boolean' ? boolean
  : T['type'] extends 'json' ? unknown
  : string;

/** Service configuration definition. */
export interface ServiceConfig {
  /** Service runtime type. */
  runtime: 'deno' | 'node' | 'dotnet';
  /** Port to listen on. */
  port: number;
  /** Working directory relative to the project root. */
  workdir?: string;
  /** Entrypoint file relative to `workdir`. */
  entrypoint?: string;
  /** Service dependencies by configured service name. */
  dependsOn?: string[];
  /** Plugin API dependencies by configured plugin resource name. */
  pluginReferences?: string[];
}

/** Frontend application configuration definition. */
export interface AppConfig {
  /** Application runtime type. */
  runtime: 'deno' | 'node' | 'tauri';
  /** Port to listen on. */
  port: number;
  /** Working directory relative to the project root. */
  workdir?: string;
  /** Entrypoint file relative to `workdir`. */
  entrypoint?: string;
  /** Explicit runtime permissions when needed. */
  permissions?: string[];
  /** Human-readable description. */
  description?: string;
}

/** Database provider accepted by project configuration. */
export type DatabaseProvider =
  | 'postgresql'
  | 'postgres'
  | 'mysql'
  | 'sqlite'
  | 'mssql'
  | 'sqlserver';

/** Database configuration definition. */
export interface DatabaseConfig {
  /** Optional logical name for this database. */
  name?: string;
  /** Database provider. */
  provider: DatabaseProvider;
  /** Connection URL or environment reference. */
  url?: string;
  /** Schema directory path. */
  schema: string;
  /** Generated output directory. */
  output?: string;
  /** Zod generator configuration. */
  zodGenerator?: {
    /** Output directory for generated schemas. */
    output: string;
    /** Generation mode. */
    mode: 'minimal' | 'full';
  };
}

/** Database section with optional active provider selector. */
export interface DatabasesConfig {
  /** Active database engine selector. */
  active?: DatabaseProvider;
  /** Configured databases. */
  config: DatabaseConfig[];
}

/** Saga retry configuration. */
export interface SagaRetryConfig {
  /** Maximum retry attempts before moving to a dead-letter queue. */
  maxAttempts: number;
  /** Initial retry delay in milliseconds. */
  initialDelay: number;
  /** Maximum retry delay in milliseconds. */
  maxDelay: number;
  /** Backoff multiplier for exponential backoff. */
  backoffMultiplier: number;
  /** Whether retry delays include jitter. */
  jitter: boolean;
}

/** Saga timeout configuration. */
export interface SagaTimeoutConfig {
  /** Timeout for saga completion in milliseconds. */
  completionTimeout?: number;
  /** Minimum allowed timeout in milliseconds. */
  minTimeout: number;
  /** Maximum allowed timeout in milliseconds. */
  maxTimeout: number;
}

/** Saga definition configuration. */
export interface SagaDefinition {
  /** Unique saga identifier. */
  id: string;
  /** Topic used for message routing and isolation. */
  topic?: string;
  /** Human-readable saga name. */
  name: string;
  /** Saga description. */
  description?: string;
  /** Entrypoint file path relative to the saga directory. */
  entrypoint: string;
  /** Whether the saga is enabled. */
  enabled: boolean;
  /** Retry configuration for this saga. */
  retry?: SagaRetryConfig;
  /** Timeout configuration for this saga. */
  timeout?: SagaTimeoutConfig;
  /** Saga tags for filtering. */
  tags?: string[];
  /** Additional metadata. */
  metadata?: Record<string, unknown>;
}

/** Per-topic saga scaling configuration. */
export interface SagaScalingConfig {
  /** Number of concurrent saga message processors. */
  concurrency: number;
  /** Deployment mode for this topic. */
  mode: 'combined' | 'distributed';
}

/** Per-topic saga retention configuration. */
export interface SagaRetentionConfig {
  /** Days to keep active saga state. */
  activeDays: number;
  /** Days to keep completed saga state. */
  completedDays: number;
  /** Whether completed sagas are archived to a database. */
  archiveToDb: boolean;
}

/** Saga group configuration for a topic. */
export interface SagaGroup {
  /** Topic identifier for message routing. */
  topic: string;
  /** Scaling configuration for this topic. */
  scaling?: SagaScalingConfig;
  /** Retention policy for this topic. */
  retention?: SagaRetentionConfig;
  /** Saga definitions belonging to this topic. */
  sagas: SagaDefinition[];
}

/** Saga store backend provider selector. */
export type SagaStoreProvider = 'auto' | 'redis' | 'postgres' | 'inmemory';

/** Saga transport backend provider selector. */
export type SagaTransportProvider = 'auto' | 'redis' | 'rabbitmq' | 'inmemory';

/** Sagas configuration section. */
export interface SagasConfig {
  /** Directory containing saga files. */
  sagasDir: string;
  /** Transport provider backend. */
  transportProvider: SagaTransportProvider;
  /** Store provider backend. */
  storeProvider: SagaStoreProvider;
  /** Number of concurrent legacy saga processors. */
  concurrency: number;
  /** Global retry configuration. */
  retry?: SagaRetryConfig;
  /** Global timeout configuration. */
  timeout?: SagaTimeoutConfig;
  /** Legacy flat saga definitions. */
  sagas: SagaDefinition[];
  /** Saga groups organized by topic. */
  groups: SagaGroup[];
  /** Whether sagas are enabled. */
  enabled: boolean;
}

/** Trigger definition config type. */
export interface TriggerDefinitionConfig {
  /** Trigger identifier. */
  id: string;
  /** Human-readable trigger name. */
  name: string;
  /** Trigger type. */
  type: 'file' | 'webhook' | 'cron' | 'manual';
  /** Whether the trigger is enabled. */
  enabled: boolean;
  /** Path to the trigger entrypoint. */
  entrypoint?: string;
  /** Trigger tags for filtering. */
  tags: string[];
}

/** Trigger group scaling configuration. */
export interface TriggerScalingConfig {
  /** Maximum concurrent action executions for this topic. */
  concurrency: number;
}

/** Trigger group retention configuration. */
export interface TriggerRetentionConfig {
  /** Days to keep events in KV. */
  kvDays: number;
  /** Days to keep events in a database. */
  dbDays: number;
}

/** Trigger group type. */
export interface TriggerGroup {
  /** Topic identifier for grouping. */
  topic: string;
  /** Scaling configuration. */
  scaling: TriggerScalingConfig;
  /** Retention policy for trigger events. */
  retention: TriggerRetentionConfig;
  /** Trigger definitions in this group. */
  triggers: TriggerDefinitionConfig[];
}

/** Webhook configuration type. */
export interface WebhookConfig {
  /** Whether webhook ingestion is enabled. */
  enabled: boolean;
  /** Base path for webhook endpoints. */
  basePath: string;
  /** Rate limit per minute per IP. */
  rateLimitPerMinute: number;
}

/** Triggers configuration section. */
export interface TriggersConfig {
  /** Directory containing trigger files. */
  triggersDir: string;
  /** Trigger groups organized by topic. */
  groups: TriggerGroup[];
  /** Webhook ingestion configuration. */
  webhooks?: WebhookConfig;
  /** Whether triggers are enabled. */
  enabled: boolean;
}

/** Fields shared by every `deploy.targets.*` deployment target. */
export interface DeployTargetBase {
  /** Deployment mode. */
  mode?: 'compile' | 'script';
  /** Path to Deno executable for script mode. */
  denoPath?: string;
  /** Deno compile target triple. */
  compileTarget?: string;
  /** Maximum parallel compilations. */
  concurrency?: number;
  /** Compilation timeout in milliseconds per service. */
  compileTimeoutMs?: number;
  /** Bundle timeout in milliseconds per service. */
  bundleTimeoutMs?: number;
  /** Additional npm package names passed as bundle externals. */
  bundleExternal?: string[];
  /** Additional import specifier rewrites for external packages. */
  bundleExternalImports?: Record<string, string>;
  /** Workspace members included in the compile config. */
  workspace?: string[];
  /** Per-service-type V8 heap settings in megabytes. */
  v8HeapMb?: {
    /** Heap limit for service processes. */
    service?: number;
    /** Heap limit for plugin processes. */
    plugin?: number;
    /** Heap limit for worker processes. */
    worker?: number;
    /** Heap limit for frontend app processes. */
    app?: number;
  };
  /** Whether build output includes env files. */
  generateEnvFile?: boolean;
  /** Servy log rotation settings. */
  logging?: {
    /** Maximum log file size before rotation in megabytes. */
    rotationSizeMb?: number;
    /** Number of rotated files to retain. */
    maxRotations?: number;
    /** Date-based rotation schedule. */
    dateRotation?: 'Daily' | 'Weekly' | 'Monthly';
  };
  /** Servy health monitoring settings. */
  health?: {
    /** Health check interval in seconds. */
    intervalSeconds?: number;
    /** Failed checks before recovery action. */
    maxFailedChecks?: number;
    /** Maximum restart attempts before giving up. */
    maxRestartAttempts?: number;
  };
  /** Container image configuration. */
  docker?: {
    /** Deno base image used for container output. */
    denoBaseImage: string;
    /** .NET base image used for container output. */
    dotnetBaseImage: string;
  };
  /**
   * Health-gated activation + release-retention convention (shared across every
   * deploy target — R-DEPLOY-3). Bare-metal swaps the active release atomically
   * only after a health probe passes, and prunes old releases beyond `retain`.
   */
  activation?: {
    /** Number of prior releases to retain before pruning. Default: 3. */
    retain?: number;
    /** Atomic activation strategy. Default: `symlink` (Linux) / `dir-swap` (Windows). */
    strategy?: 'symlink' | 'dir-swap';
    /** Health probe that gates a new release taking traffic. */
    healthGate?: {
      /** HTTP path probed for health. Default: `/health`. */
      path?: string;
      /** Port the health endpoint listens on. */
      port?: number;
      /** Per-probe timeout in milliseconds. Default: 2000. */
      timeoutMs?: number;
      /** Delay between probe attempts in milliseconds. Default: 2000. */
      intervalMs?: number;
      /** Number of probe attempts before the gate fails. Default: 5. */
      retries?: number;
      /** HTTP status that signals healthy. Default: 200. */
      expectStatus?: number;
    };
  };
  /**
   * Secret-material convention (shared across every deploy target — R-DEPLOY-3).
   * Beta baseline writes a restricted-permission env file; the external secret
   * store is the deferred stable slice.
   */
  secrets?: {
    /** Relative path of the generated restricted secret env file. */
    envFile?: string;
    /** POSIX file mode for the secret file. Default: 0o600. */
    mode?: number;
  };
  /**
   * OpenTelemetry convention (shared across every deploy target — R-DEPLOY-3).
   * Derives the canonical `OTEL_DENO='true'` runtime env plus optional endpoint /
   * protocol / service-name-prefix wiring.
   */
  otel?: {
    /** Whether OTEL runtime env is emitted. Default: true. */
    enabled?: boolean;
    /** OTLP exporter endpoint (`OTEL_EXPORTER_OTLP_ENDPOINT`). */
    endpoint?: string;
    /** OTLP exporter protocol (`OTEL_EXPORTER_OTLP_PROTOCOL`). */
    protocol?: string;
    /** Prefix applied to the derived `OTEL_SERVICE_NAME`. */
    serviceNamePrefix?: string;
  };
}

/** Windows Services deployment target (`deploy.targets.windows`). */
export interface WindowsDeployTarget extends DeployTargetBase {
  /** Path to the Servy CLI executable. */
  servyCliPath?: string;
  /** Base directory for service installation. */
  installBase?: string;
  /** Windows Service name prefix. */
  servicePrefix?: string;
}

/**
 * Docker / Compose deployment target (`deploy.targets.docker` and
 * `deploy.targets.compose`).
 *
 * Both keys map to the Aspire-driven compose adapter: `compose` emits a
 * docker-compose project and self-hosts it via `docker compose up`, while
 * `docker` follows the single-image build/push path. Extends the shared base —
 * which already carries the container `docker` image sub-block defaulting to
 * `denoland/deno:2` — with compose/registry-specific settings. The manifest and
 * compose YAML are authored by `aspire publish`, never by NetScript.
 */
export interface DockerComposeDeployTarget extends DeployTargetBase {
  /** Compose project name (`docker compose -p`). Default: the workspace name. */
  projectName?: string;
  /** Directory for emitted compose artifacts. Default: `.deploy/compose`. */
  outputPath?: string;
  /** Container image registry for the `docker` push path (e.g. `ghcr.io/acme`). */
  registry?: string;
  /** Base image name/tag for built service images. Default: the service name. */
  imageName?: string;
}

/** Linux systemd deployment target (`deploy.targets.linux`). */
export interface LinuxDeployTarget extends DeployTargetBase {
  /** Path to the systemctl executable. */
  systemctlPath?: string;
  /** systemd unit name prefix. */
  unitPrefix?: string;
  /** Base directory for service installation. */
  installBase?: string;
  /** System user that owns the generated units. */
  user?: string;
  /** System group that owns the generated units. */
  group?: string;
  /** Runtime directory for sockets and pid files. */
  runtimeDir?: string;
}

/**
 * Deno Deploy cloud deployment target (`deploy.targets['deno-deploy']`).
 *
 * Pushes a scaffolded NetScript project to the Deno Deploy platform via the
 * native `deno deploy` CLI (source build, no Dockerfile). The shared compile /
 * bundle fields of {@link DeployTargetBase} are inherited but generally unused
 * by the hosted platform; the Deno-Deploy-specific fields below drive the push.
 */
export interface DenoDeployTarget extends DeployTargetBase {
  /** Deno Deploy organization slug (`deno deploy --org`). */
  org?: string;
  /** Deno Deploy application/project name (`deno deploy --app`). */
  app?: string;
  /** Entrypoint module passed to `deno deploy`. Default: `main.ts`. */
  entrypoint?: string;
  /** Whether pushes target production (`deno deploy --prod`) by default. */
  prod?: boolean;
  /** Path to an env file loaded via `deno deploy env load`. */
  envFile?: string;
}

/**
 * Aspire cloud deployment target (`deploy.targets.kubernetes`,
 * `deploy.targets['azure-aca']`, `deploy.targets['azure-app-service']`,
 * `deploy.targets['azure-aks']`, and `deploy.targets['cloud-run']`).
 *
 * These targets delegate publish/deploy to the generated TypeScript AppHost and
 * Aspire CLI. Target-specific cluster/cloud auth, RBAC, and provider resources
 * remain operator-owned unless the AppHost's Aspire integration provisions them.
 */
export interface AspireCloudDeployTarget extends DeployTargetBase {
  /** Aspire AppHost environment name passed to `aspire --environment`. */
  environment?: string;
  /** Directory for emitted publish/deploy artifacts. */
  outputPath?: string;
  /** AppHost path used when Aspire default discovery is insufficient. */
  appHost?: string;
  /** Container registry for targets that publish Docker images. */
  registry?: string;
  /** Base image name/tag for built service images. */
  imageName?: string;
}

/** Top-level deployment configuration type. */
export interface DeployConfig {
  /** Deployment targets keyed by name. */
  targets?: {
    /** Windows Services deployment settings. */
    windows?: WindowsDeployTarget;
    /** Docker single-image (build/push) deployment settings. */
    docker?: DockerComposeDeployTarget;
    /** Docker Compose (emit + self-host) deployment settings. */
    compose?: DockerComposeDeployTarget;
    /** Linux systemd deployment settings. */
    linux?: LinuxDeployTarget;
    /** Deno Deploy cloud deployment settings. */
    'deno-deploy'?: DenoDeployTarget;
    /** Kubernetes deployment settings. */
    kubernetes?: AspireCloudDeployTarget;
    /** Azure Container Apps deployment settings. */
    'azure-aca'?: AspireCloudDeployTarget;
    /** Azure App Service deployment settings. */
    'azure-app-service'?: AspireCloudDeployTarget;
    /** Azure Kubernetes Service deployment settings. */
    'azure-aks'?: AspireCloudDeployTarget;
    /** Google Cloud Run deployment settings. */
    'cloud-run'?: AspireCloudDeployTarget;
  };
}

/** Runtime schema/config output path entry type. */
export interface RuntimeConfigPathEntry {
  /** Output JSON Schema path for a runtime topic. */
  schemaPath: string;
  /** Directory containing operator-managed runtime config files. */
  configDir: string;
}

/** Runtime schema/config section type. */
export interface RuntimeConfigSection {
  /** Per-topic schema and config path mapping. */
  paths?: Record<string, RuntimeConfigPathEntry>;
}

/** Gateway configuration section. */
export interface GatewayConfig {
  /** Whether the gateway is enabled. */
  enabled: boolean;
  /** Gateway port. */
  port: number;
}

/** SDK generation configuration section. */
export interface SdkConfig {
  /** TypeScript SDK generation options. */
  typescript?: {
    /** Whether TypeScript SDK generation is enabled. */
    enabled: boolean;
    /** Output directory for generated TypeScript SDK files. */
    output: string;
  };
  /** .NET SDK generation options. */
  dotnet?: {
    /** Whether .NET SDK generation is enabled. */
    enabled: boolean;
    /** Output directory for generated .NET SDK files. */
    output: string;
  };
}
