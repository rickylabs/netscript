/** Database engines covered by the E2E matrix. */
export const DATABASE = {
  POSTGRES: 'postgres',
  MYSQL: 'mysql',
  SQLITE: 'sqlite',
  MSSQL: 'mssql',
} as const;

/** Package source modes for generated projects and plugins. */
export const PACKAGE_SOURCE = {
  AUTO: 'auto',
  STARTER: 'starter',
  LOCAL: 'local',
  JSR: 'jsr',
} as const;

/** Runtime launcher used by generated projects. */
export const RUNTIME = {
  ASPIRE: 'aspire',
  BARE: 'bare',
} as const;

/** Deployment targets modeled by the suite. */
export const DEPLOY_TARGET = {
  WINDOWS_SERVICE: 'windows-service',
  DOCKER: 'docker',
} as const;

/** Official plugin families used by scaffold smoke tests. */
export const PLUGIN = {
  WORKER: 'worker',
  SAGA: 'saga',
  TRIGGER: 'trigger',
  STREAM: 'stream',
  AUTH: 'auth',
  AI: 'ai',
} as const;

/** Reporter formats emitted by the CLI. */
export const REPORT_FORMAT = {
  PRETTY: 'pretty',
  JSON: 'json',
  NDJSON: 'ndjson',
} as const;

export type DatabaseEngine = typeof DATABASE[keyof typeof DATABASE];
export type PackageSource = typeof PACKAGE_SOURCE[keyof typeof PACKAGE_SOURCE];
export type RuntimeKind = typeof RUNTIME[keyof typeof RUNTIME];
export type DeployTarget = typeof DEPLOY_TARGET[keyof typeof DEPLOY_TARGET];
export type PluginKind = typeof PLUGIN[keyof typeof PLUGIN];
export type ReportFormat = typeof REPORT_FORMAT[keyof typeof REPORT_FORMAT];
