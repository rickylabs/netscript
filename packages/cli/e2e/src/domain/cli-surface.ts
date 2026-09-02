import type { PluginKind } from './extension-axes.ts';

/** Built-in scaffold suites. */
export const SCAFFOLD = {
  SERVICE: 'scaffold.service',
  CONTRACTS: 'scaffold.contracts',
  INFRASTRUCTURE: 'scaffold.infrastructure',
  PLUGIN: 'scaffold.plugins',
  RUNTIME: 'scaffold.runtime',
  RUNTIME_SQLITE: 'scaffold.runtime.sqlite',
  USERLAND_INSTALL: 'scaffold.userland-install',
} as const;

/** Documentation-walk suites. */
export const QUICKSTART = {
  WALK: 'quickstart.walk',
} as const;

/** Stable titles for documentation-walk suites. */
export const QUICKSTART_TITLE = {
  WALK: 'Published CLI Quickstart walk',
} as const;

/** Suite ids that require exclusive access to the expensive runtime path. */
export const EXPENSIVE_RUNTIME_SUITE_IDS = [
  SCAFFOLD.RUNTIME,
  SCAFFOLD.RUNTIME_SQLITE,
  QUICKSTART.WALK,
] as const;

/** Stable titles for built-in suites. */
export const SCAFFOLD_TITLE = {
  SERVICE: 'Service scaffold capability smoke',
  CONTRACTS: 'Contracts scaffold capability smoke',
  INFRASTRUCTURE: 'Infrastructure scaffold capability smoke',
  PLUGIN: 'Official plugin scaffold smoke',
  RUNTIME: 'Runtime scaffold capability smoke',
  RUNTIME_SQLITE: 'Runtime scaffold capability smoke (sqlite, reduced containers)',
  USERLAND_INSTALL: 'True userland plugin install smoke',
} as const;

/** Built-in deploy suites. */
export const DEPLOY = {
  TARGETS: 'deploy.targets',
  DESKTOP_NATIVE: 'deploy.desktop-native',
} as const;

/** Stable titles for deploy suites. */
export const DEPLOY_TITLE = {
  TARGETS: 'Deploy target acceptance smoke',
  DESKTOP_NATIVE: 'Native desktop deployment acceptance',
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
  SCAFFOLD_DESIGN_PRODUCTION_EXCLUSION: 'scaffold.design-production-exclusion',
  SERVICE_LIST: 'service.list',
  CONTRACT_ADD: 'contract.add',
  CONTRACT_LIST: 'contract.list',
  SCAFFOLD_PLUGIN_LIST: 'scaffold.plugin-list',
  SCAFFOLD_PLUGIN_AI_MCP: 'scaffold.plugin.ai.mcp',
  SCAFFOLD_PLUGIN_AI_LIFECYCLE: 'scaffold.plugin.ai.lifecycle',
  SCAFFOLD_PLUGIN_AI_APPSETTINGS: 'scaffold.plugin.ai.appsettings',
  SCAFFOLD_UI_ADD_AI: 'scaffold.ui-add-ai',
  SCAFFOLD_UI_LOCAL_SOURCE: 'scaffold.ui-local-source',
  SCAFFOLD_UI_DATA_SCREEN: 'scaffold.ui-data-screen',
  DATABASE_INIT: 'database.init',
  DATABASE_MIGRATION_ARTIFACTS: 'database.migration-artifacts',
  DATABASE_LIST: 'database.list',
  DATABASE_VALIDATE: 'database.validate',
  DATABASE_DEPLOY: 'database.deploy',
  DATABASE_CODEGEN: 'database.codegen',
  DATABASE_GENERATE: 'database.generate',
  DATABASE_SEED: 'database.seed',
  GENERATED_SERVICE_CHECK: 'generated.service-check',
  GENERATED_CONTRACTS_CHECK: 'generated.contracts-check',
  GENERATED_INFRASTRUCTURE_CHECK: 'generated.infrastructure-check',
  GENERATED_RUNTIME_SCHEMAS: 'generated.runtime-schemas',
  GENERATED_PLUGINS_CHECK: 'generated.plugins-check',
  BEHAVIOR_PLUGINS_UNHEALTHY: 'behavior.plugins-unhealthy',
  GENERATED_WORKERS_REGISTRY: 'generated.workers-registry',
  GENERATED_SAGAS_REGISTRY: 'generated.sagas-registry',
  GENERATED_DENO_CHECK: 'generated.deno-check',
  GENERATED_QUALITY_NEGATIVE: 'generated.quality-negative',
  GENERATED_DENO_LINT: 'generated.deno-lint',
  GENERATED_DENO_FMT_CHECK: 'generated.deno-fmt-check',
  GENERATED_UI_AI_CHECK: 'generated.ui-ai-check',
  GENERATED_AI_NAMESPACE_CHECK: 'generated.ai-namespace-check',
  BEHAVIOR_PLUGIN_DOCTOR_MISSING_MODULE: 'behavior.plugin-doctor-missing-module',
  BEHAVIOR_UI_RENDER: 'behavior.ui-render',
  BEHAVIOR_MCP_WIDGET_ROUNDTRIP: 'behavior.mcp-widget-roundtrip',
  RUNTIME_AUTH_SMOKE_ENV: 'runtime.auth-smoke-env',
  RUNTIME_FLOW_B_FIXTURE: 'runtime.flow-b-fixture',
  RUNTIME_READINESS_FIXTURE: 'runtime.readiness-fixture',
  RUNTIME_SERVICE_ENV_FIXTURE: 'runtime.service-env-fixture',
  RUNTIME_ASPIRE_RESTORE: 'runtime.aspire-restore',
  RUNTIME_ASPIRE_START: 'runtime.aspire-start',
  RUNTIME_CAPTURE_DB_ALLOCATION_FIRST: 'runtime.capture-db-allocation-first',
  RUNTIME_ASPIRE_RESTART_AFTER_DB: 'runtime.aspire-restart-after-db',
  RUNTIME_TYPED_DB_PHASE_B: 'runtime.typed-db-phase-b',
  RUNTIME_CAPTURE_DB_ALLOCATION_SECOND: 'runtime.capture-db-allocation-second',
  RUNTIME_WAIT_DATABASE: 'runtime.wait.database',
  RUNTIME_WAIT_POSTGRES: 'runtime.wait.postgres',
  RUNTIME_WAIT_MYSQL: 'runtime.wait.mysql',
  RUNTIME_WAIT_MSSQL: 'runtime.wait.mssql',
  RUNTIME_WAIT_GARNET: 'runtime.wait.garnet',
  RUNTIME_WAIT_WORKERS_API: 'runtime.wait.workers-api',
  RUNTIME_WAIT_WORKERS: 'runtime.wait.workers',
  RUNTIME_WAIT_SAGAS_API: 'runtime.wait.sagas-api',
  RUNTIME_WAIT_SAGAS: 'runtime.wait.sagas',
  RUNTIME_WAIT_TRIGGERS_API: 'runtime.wait.triggers-api',
  RUNTIME_WAIT_TRIGGERS: 'runtime.wait.triggers',
  RUNTIME_WAIT_AUTH: 'runtime.wait.auth',
  RUNTIME_WAIT_STREAMS: 'runtime.wait.streams',
  RUNTIME_WAIT_APP: 'runtime.wait.app',
  RUNTIME_ASPIRE_DESCRIBE: 'runtime.aspire-describe',
  RUNTIME_HEALTH_LISTENER_UNREACHABLE: 'runtime.health.listener-unreachable',
  BEHAVIOR_APP_HOME: 'behavior.app-home',
  BEHAVIOR_APP_DYNAMIC_ROUTE: 'behavior.app-dynamic-route',
  BEHAVIOR_APP_REFERENCE: 'behavior.app-reference',
  BEHAVIOR_PROJECT_BOUNDARY_DEV: 'behavior.project-boundary-dev',
  BEHAVIOR_WORKERS_HEALTH: 'behavior.workers-health',
  BEHAVIOR_WORKERS_JOBS: 'behavior.workers-jobs',
  BEHAVIOR_WORKERS_TASKS: 'behavior.workers-tasks',
  BEHAVIOR_WORKERS_SEED: 'behavior.workers-seed',
  BEHAVIOR_WORKERS_TRIGGER_HEALTH_JOB: 'behavior.workers-trigger-health-job',
  BEHAVIOR_WORKERS_EXECUTIONS: 'behavior.workers-executions',
  BEHAVIOR_SERVICE_HEALTH: 'behavior.service-health',
  BEHAVIOR_SERVICE_ENV: 'behavior.service-env',
  BEHAVIOR_LIVE_DB_ENDPOINT: 'behavior.live-db-endpoint',
  BEHAVIOR_MCP_ENDPOINT_DIRECTORY: 'behavior.mcp-endpoint-directory',
  BEHAVIOR_DB_STATUS_PRESERVES_APPHOST: 'behavior.db-status-preserves-apphost',
  BEHAVIOR_ENDPOINT_READINESS: 'behavior.endpoint-readiness',
  BEHAVIOR_SAGAS_HEALTH: 'behavior.sagas-health',
  BEHAVIOR_SAGAS_LIST: 'behavior.sagas-list',
  BEHAVIOR_SAGAS_INSTANCES: 'behavior.sagas-instances',
  BEHAVIOR_DURABLE_CLI_PARITY: 'behavior.durable-cli-parity',
  BEHAVIOR_TRIGGERS_HEALTH: 'behavior.triggers-health',
  BEHAVIOR_TRIGGERS_WEBHOOK: 'behavior.triggers-webhook',
  BEHAVIOR_TRIGGERS_EVENTS: 'behavior.triggers-events',
  BEHAVIOR_AUTH_LIVE: 'behavior.auth-live',
  BEHAVIOR_AUTH_READY: 'behavior.auth-ready',
  BEHAVIOR_AUTH_SESSION: 'behavior.auth-session',
  BEHAVIOR_STREAMS_PRODUCER_RECONNECT: 'behavior.streams.producer-reconnect',
  BEHAVIOR_AI_CHAT_ROUTE: 'behavior.ai-chat-route',
  BEHAVIOR_PLUGINS_HEALTH: 'behavior.plugins-health',
  BEHAVIOR_PACKAGE_BACKED_PLUGIN_DOCTOR: 'behavior.package-backed-plugin-doctor',
  DEPLOY_DENO_DEPLOY_PLAN: 'deploy.deno-deploy.plan',
  DEPLOY_COMPOSE_RESOLUTION: 'deploy.compose-resolution',
  DEPLOY_DESKTOP_PREFLIGHT: 'deploy.desktop.preflight',
  DEPLOY_DESKTOP_FIXTURE: 'deploy.desktop.fixture',
  DEPLOY_DESKTOP_LINUX_NATIVE: 'deploy.desktop.linux-native',
  DEPLOY_DESKTOP_WINDOWS_NATIVE: 'deploy.desktop.windows-native',
  DEPLOY_DESKTOP_DARWIN_NATIVE: 'deploy.desktop.darwin-native',
  USERLAND_INSTALL_ASSERTIONS: 'userland-install.assertions',
  BEHAVIOR_OTEL_WEBHOOK: 'behavior.otel.webhook',
  BEHAVIOR_OTEL_STREAM_CONSUMER: 'behavior.otel.stream-consumer',
  BEHAVIOR_OTEL_TRACES: 'behavior.otel.traces',
  BEHAVIOR_OTEL_TASK_TRACES: 'behavior.otel.task-traces',
  CLEANUP_USERLAND_SMOKE_ROOT: 'cleanup.userland-smoke-root',
  CLEANUP_ASPIRE_STOP: 'cleanup.aspire-stop',
  CLEANUP_DOCKER_CREATED_CONTAINERS: 'cleanup.docker-created-containers',
  QUICKSTART_INSTALL: 'quickstart.1-install-cli',
  QUICKSTART_INIT: 'quickstart.2-init-workspace',
  QUICKSTART_SERVICE_ADD: 'quickstart.3-add-service',
  QUICKSTART_ASPIRE: 'quickstart.4-aspire-restore-start',
  QUICKSTART_DATABASE: 'quickstart.5-database-workflow',
  QUICKSTART_DATABASE_INTEGRITY: 'quickstart.pgdata-integrity-after-teardown',
  QUICKSTART_CHECK: 'quickstart.6-project-check',
  QUICKSTART_SERVICE_RESPONSE: 'quickstart.7-service-response',
} as const;

/** Generated Aspire resource ids waited on by the scaffold plugin suite. */
export const ASPIRE_RESOURCE = {
  POSTGRES: 'postgres',
  MYSQL: 'mysql',
  MSSQL: 'mssql',
  GARNET: 'garnet',
  WORKERS_API: 'workers-api',
  WORKERS: 'workers',
  SAGAS_API: 'sagas-api',
  SAGAS: 'sagas',
  TRIGGERS_API: 'triggers-api',
  TRIGGERS: 'triggers',
  AUTH: 'auth',
  STREAMS: 'streams',
} as const;

export type ScaffoldSuiteId = typeof SCAFFOLD[keyof typeof SCAFFOLD];
/** Built-in suites that require exclusive access to the expensive runtime path. */
export type ExpensiveRuntimeSuiteId = typeof EXPENSIVE_RUNTIME_SUITE_IDS[number];
export type DeploySuiteId = typeof DEPLOY[keyof typeof DEPLOY];
export type QuickstartSuiteId = typeof QUICKSTART[keyof typeof QUICKSTART];
export type SuiteId = ScaffoldSuiteId | DeploySuiteId | QuickstartSuiteId;
export type GatePhase = typeof GATE_PHASE[keyof typeof GATE_PHASE];
export type StaticGateId = typeof GATE[keyof typeof GATE];
export type AspireResource = typeof ASPIRE_RESOURCE[keyof typeof ASPIRE_RESOURCE];

/** KV-backed first-party background runtimes that require generated-project health proof. */
export const KV_BACKGROUND_RUNTIME_RESOURCES = [
  ASPIRE_RESOURCE.WORKERS,
  ASPIRE_RESOURCE.SAGAS,
  ASPIRE_RESOURCE.TRIGGERS,
] as const satisfies readonly AspireResource[];

/** API and background resources in stable runtime-wait execution order. */
export const KV_BACKGROUND_RUNTIME_WAIT_RESOURCES = KV_BACKGROUND_RUNTIME_RESOURCES.flatMap(
  (runtime) => [`${runtime}-api` as const, runtime],
) satisfies readonly AspireResource[];
export type PluginGateId = `scaffold.plugin.${PluginKind}`;
export type RuntimeWaitGateId = `runtime.wait.${AspireResource}`;
export type GateId = StaticGateId | PluginGateId | RuntimeWaitGateId;
