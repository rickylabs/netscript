import type { PluginKind } from './extension-axes.ts';

/** Built-in scaffold suites. */
export const SCAFFOLD = {
  SERVICE: 'scaffold.service',
  CONTRACTS: 'scaffold.contracts',
  INFRASTRUCTURE: 'scaffold.infrastructure',
  PLUGIN: 'scaffold.plugins',
  RUNTIME: 'scaffold.runtime',
} as const;

/** Stable titles for built-in suites. */
export const SCAFFOLD_TITLE = {
  SERVICE: 'Service scaffold capability smoke',
  CONTRACTS: 'Contracts scaffold capability smoke',
  INFRASTRUCTURE: 'Infrastructure scaffold capability smoke',
  PLUGIN: 'Official plugin scaffold smoke',
  RUNTIME: 'Runtime scaffold capability smoke',
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
  RUNTIME_ASPIRE_DESCRIBE: 'runtime.aspire-describe',
  BEHAVIOR_WORKERS_HEALTH: 'behavior.workers-health',
  BEHAVIOR_SAGAS_HEALTH: 'behavior.sagas-health',
  BEHAVIOR_PLUGINS_HEALTH: 'behavior.plugins-health',
  BEHAVIOR_OTEL_WEBHOOK: 'behavior.otel.webhook',
  BEHAVIOR_OTEL_TRACES: 'behavior.otel.traces',
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
} as const;

export type SuiteId = typeof SCAFFOLD[keyof typeof SCAFFOLD];
export type GatePhase = typeof GATE_PHASE[keyof typeof GATE_PHASE];
export type StaticGateId = typeof GATE[keyof typeof GATE];
export type AspireResource = typeof ASPIRE_RESOURCE[keyof typeof ASPIRE_RESOURCE];
export type PluginGateId = `scaffold.plugin.${PluginKind}`;
export type RuntimeWaitGateId = `runtime.wait.${AspireResource}`;
export type GateId = StaticGateId | PluginGateId | RuntimeWaitGateId;
