/**
 * @module @netscript/config/types
 *
 * Public TypeScript type definitions for NetScript configuration.
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

/** Aspire orchestration settings for generated AppHost projects. */
export interface AspireConfig {
  /** Path to the AppHost project. */
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

/** Windows-specific deployment configuration type. */
export interface WindowsDeployConfig {
  /** Path to the Servy CLI executable. */
  servyCliPath?: string;
  /** Base directory for service installation. */
  installBase?: string;
  /** Windows Service name prefix. */
  servicePrefix?: string;
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
}

/** Top-level deployment configuration type. */
export interface DeployConfig {
  /** Windows Services deployment settings. */
  windows?: WindowsDeployConfig;
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
  typescript?: {
    enabled: boolean;
    output: string;
  };
  dotnet?: {
    enabled: boolean;
    output: string;
  };
}

/** Fully validated NetScript configuration. */
export interface NetScriptConfig {
  /** Plugin-owned top-level configuration sections preserved by the loader. */
  [pluginSection: string]: unknown;
  name: string;
  version: string;
  paths: PathsConfig;
  logging?: LoggingConfig;
  aspire?: AspireConfig;
  databases: DatabasesConfig;
  services?: Record<string, ServiceConfig>;
  apps?: Record<string, AppConfig>;
  sagas?: SagasConfig;
  triggers?: TriggersConfig;
  gateway?: GatewayConfig;
  sdk?: SdkConfig;
  deploy?: DeployConfig;
  runtimeConfig?: RuntimeConfigSection;
  plugins: string[];
}

/** Authoring form accepted by `defineConfig` and `loadConfig`. */
export interface NetScriptConfigInput {
  /** Plugin-owned top-level configuration sections preserved by the loader. */
  [pluginSection: string]: unknown;
  name: string;
  version?: string;
  paths?: Partial<PathsConfig>;
  logging?: Partial<LoggingConfig>;
  aspire?: Partial<AspireConfig>;
  databases: DatabasesConfig;
  services?: Record<string, Partial<ServiceConfig> & Pick<ServiceConfig, 'port'>>;
  apps?: Record<string, Partial<AppConfig> & Pick<AppConfig, 'port'>>;
  sagas?: Partial<SagasConfig>;
  triggers?: Partial<TriggersConfig>;
  gateway?: Partial<GatewayConfig>;
  sdk?: Partial<SdkConfig>;
  deploy?: DeployConfig;
  runtimeConfig?: RuntimeConfigSection;
  plugins?: string[];
}
