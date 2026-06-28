import type { PluginKind } from './extension-axes.ts';

/** Built-in scaffold suites. */
export const SCAFFOLD = {
  SERVICE: 'scaffold.service',
  CONTRACTS: 'scaffold.contracts',
  INFRASTRUCTURE: 'scaffold.infrastructure',
  PLUGIN: 'scaffold.plugins',
  RUNTIME: 'scaffold.runtime',
  USERLAND_INSTALL: 'scaffold.userland-install',
} as const;

/** Stable titles for built-in suites. */
export const SCAFFOLD_TITLE = {
  SERVICE: 'Service scaffold capability smoke',
  CONTRACTS: 'Contracts scaffold capability smoke',
  INFRASTRUCTURE: 'Infrastructure scaffold capability smoke',
  PLUGIN: 'Official plugin scaffold smoke',
  RUNTIME: 'Runtime scaffold capability smoke',
  USERLAND_INSTALL: 'True userland plugin install smoke',
} as const;

/** Gate phases in suite execution order. */
export const GATE_PHASE = {
  PREFLIGHT: 'preflight',
  SCAFFOLD: 'scaffold',
  DATABASE: 'database',
  RUNTIME: 'runtime',
  BEHAVIOR: 'behavior',
  CLEANUP: 'cleanup',
} as const;

/** Static gate ids used by the scaffold plugin suite. */
export const GATE = {
  PREFLIGHT_DENO: 'preflight.deno',
  PREFLIGHT_ASPIRE: 'preflight.aspire',
  SCAFFOLD_INIT: 'scaffold.init',
  SERVICE_LIST: 'service.list',
  CONTRACT_LIST: 'contract.list',
  SCAFFOLD_PLUGIN_LIST: 'scaffold.plugin-list',
  DATABASE_INIT: 'database.init',
  DATABASE_GENERATE: 'database.generate',
  DATABASE_SEED: 'database.seed',
  GENERATED_SERVICE_CHECK: 'generated.service-check',
  GENERATED_CONTRACTS_CHECK: 'generated.contracts-check',
  GENERATED_INFRASTRUCTURE_CHECK: 'generated.infrastructure-check',
  GENERATED_PLUGINS_CHECK: 'generated.plugins-check',
  GENERATED_DENO_CHECK: 'generated.deno-check',
  RUNTIME_AUTH_SMOKE_ENV: 'runtime.auth-smoke-env',
  RUNTIME_ASPIRE_RESTORE: 'runtime.aspire-restore',
  RUNTIME_ASPIRE_START: 'runtime.aspire-start',
  RUNTIME_WAIT_POSTGRES: 'runtime.wait.postgres',
  RUNTIME_WAIT_GARNET: 'runtime.wait.garnet',
  RUNTIME_WAIT_WORKERS_API: 'runtime.wait.workers-api',
  RUNTIME_WAIT_WORKERS: 'runtime.wait.workers',
  RUNTIME_WAIT_SAGAS_API: 'runtime.wait.sagas-api',
  RUNTIME_WAIT_SAGAS: 'runtime.wait.sagas',
  RUNTIME_WAIT_TRIGGERS_API: 'runtime.wait.triggers-api',
  RUNTIME_WAIT_TRIGGERS: 'runtime.wait.triggers',
  RUNTIME_WAIT_AUTH: 'runtime.wait.auth',
  RUNTIME_ASPIRE_DESCRIBE: 'runtime.aspire-describe',
  BEHAVIOR_WORKERS_HEALTH: 'behavior.workers-health',
  BEHAVIOR_WORKERS_JOBS: 'behavior.workers-jobs',
  BEHAVIOR_WORKERS_TASKS: 'behavior.workers-tasks',
  BEHAVIOR_WORKERS_SEED: 'behavior.workers-seed',
  BEHAVIOR_WORKERS_TRIGGER_HEALTH_JOB: 'behavior.workers-trigger-health-job',
  BEHAVIOR_WORKERS_EXECUTIONS: 'behavior.workers-executions',
  BEHAVIOR_SERVICE_HEALTH: 'behavior.service-health',
  BEHAVIOR_SAGAS_HEALTH: 'behavior.sagas-health',
  BEHAVIOR_SAGAS_LIST: 'behavior.sagas-list',
  BEHAVIOR_SAGAS_INSTANCES: 'behavior.sagas-instances',
  BEHAVIOR_TRIGGERS_HEALTH: 'behavior.triggers-health',
  BEHAVIOR_TRIGGERS_WEBHOOK: 'behavior.triggers-webhook',
  BEHAVIOR_TRIGGERS_EVENTS: 'behavior.triggers-events',
  BEHAVIOR_AUTH_LIVE: 'behavior.auth-live',
  BEHAVIOR_AUTH_READY: 'behavior.auth-ready',
  BEHAVIOR_AUTH_SESSION: 'behavior.auth-session',
  BEHAVIOR_PLUGINS_HEALTH: 'behavior.plugins-health',
  USERLAND_INSTALL_ASSERTIONS: 'userland-install.assertions',
  BEHAVIOR_OTEL_WEBHOOK: 'behavior.otel.webhook',
  BEHAVIOR_OTEL_TRACES: 'behavior.otel.traces',
  CLEANUP_USERLAND_SMOKE_ROOT: 'cleanup.userland-smoke-root',
  CLEANUP_ASPIRE_STOP: 'cleanup.aspire-stop',
  CLEANUP_DOCKER_CREATED_CONTAINERS: 'cleanup.docker-created-containers',
} as const;

/** Generated Aspire resource ids waited on by the scaffold plugin suite. */
export const ASPIRE_RESOURCE = {
  POSTGRES: 'postgres',
  GARNET: 'garnet',
  WORKERS_API: 'workers-api',
  WORKERS: 'workers',
  SAGAS_API: 'sagas-api',
  SAGAS: 'sagas',
  TRIGGERS_API: 'triggers-api',
  TRIGGERS: 'triggers',
  AUTH: 'auth',
} as const;

export type SuiteId = typeof SCAFFOLD[keyof typeof SCAFFOLD];
export type GatePhase = typeof GATE_PHASE[keyof typeof GATE_PHASE];
export type StaticGateId = typeof GATE[keyof typeof GATE];
export type AspireResource = typeof ASPIRE_RESOURCE[keyof typeof ASPIRE_RESOURCE];
export type PluginGateId = `scaffold.plugin.${PluginKind}`;
export type RuntimeWaitGateId = `runtime.wait.${AspireResource}`;
export type GateId = StaticGateId | PluginGateId | RuntimeWaitGateId;
