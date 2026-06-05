import type {
  AppConfig,
  AspireConfig,
  DatabasesConfig,
  DeployConfig,
  GatewayConfig,
  LoggingConfig,
  PathsConfig,
  RuntimeConfigSection,
  SagasConfig,
  SdkConfig,
  ServiceConfig,
  TriggersConfig,
} from './config-section-types.ts';

/** Fully validated NetScript configuration. */
export interface NetScriptConfig {
  /** Plugin-owned top-level configuration sections preserved by the loader. */
  [pluginSection: string]: unknown;
  /** Project name. */
  name: string;
  /** Project version. */
  version: string;
  /** Workspace path conventions. */
  paths: PathsConfig;
  /** Logging behavior. */
  logging?: LoggingConfig;
  /** Aspire orchestration settings. */
  aspire?: AspireConfig;
  /** Database configuration. */
  databases: DatabasesConfig;
  /** Service configuration by service name. */
  services?: Record<string, ServiceConfig>;
  /** Application configuration by app name. */
  apps?: Record<string, AppConfig>;
  /** Saga configuration. */
  sagas?: SagasConfig;
  /** Trigger configuration. */
  triggers?: TriggersConfig;
  /** Gateway configuration. */
  gateway?: GatewayConfig;
  /** SDK generation configuration. */
  sdk?: SdkConfig;
  /** Deployment configuration. */
  deploy?: DeployConfig;
  /** Runtime schema/config output settings. */
  runtimeConfig?: RuntimeConfigSection;
  /** Enabled plugin package names or specifiers. */
  plugins: string[];
}

/** Authoring form accepted by `defineConfig` and `loadConfig`. */
export interface NetScriptConfigInput {
  /** Plugin-owned top-level configuration sections preserved by the loader. */
  [pluginSection: string]: unknown;
  /** Project name. */
  name: string;
  /** Optional project version. */
  version?: string;
  /** Partial workspace path conventions. */
  paths?: Partial<PathsConfig>;
  /** Partial logging behavior. */
  logging?: Partial<LoggingConfig>;
  /** Partial Aspire orchestration settings. */
  aspire?: Partial<AspireConfig>;
  /** Database configuration. */
  databases: DatabasesConfig;
  /** Service authoring configuration by service name. */
  services?: Record<string, Partial<ServiceConfig> & Pick<ServiceConfig, 'port'>>;
  /** Application authoring configuration by app name. */
  apps?: Record<string, Partial<AppConfig> & Pick<AppConfig, 'port'>>;
  /** Partial saga configuration. */
  sagas?: Partial<SagasConfig>;
  /** Partial trigger configuration. */
  triggers?: Partial<TriggersConfig>;
  /** Partial gateway configuration. */
  gateway?: Partial<GatewayConfig>;
  /** Partial SDK generation configuration. */
  sdk?: Partial<SdkConfig>;
  /** Deployment configuration. */
  deploy?: DeployConfig;
  /** Runtime schema/config output settings. */
  runtimeConfig?: RuntimeConfigSection;
  /** Enabled plugin package names or specifiers. */
  plugins?: string[];
}
