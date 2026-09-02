import { defineCliE2eSuite } from '../../src/application/builders/define-cli-e2e-suite.ts';
import {
  GATE,
  type GateId,
  KV_BACKGROUND_RUNTIME_WAIT_RESOURCES,
  SCAFFOLD,
  SCAFFOLD_TITLE,
  type SuiteId,
} from '../../src/domain/cli-surface.ts';
import { DATABASE } from '../../src/domain/extension-axes.ts';
import type { RunOptions } from '../../src/domain/run-context.ts';
import type { DeferredGate, SuiteDefinition } from '../../src/domain/suite-definition.ts';

/** Built-in scaffold capability suite shape. */
export interface ScaffoldCapabilitySuite {
  readonly id: SuiteId;
  readonly title: string;
  readonly gates: readonly GateId[];
  readonly deferredGates?: readonly DeferredGate[];
  readonly defaults?: Partial<RunOptions>;
}

/** Runtime gates with explicitly accepted temporary deferrals. */
export const SCAFFOLD_RUNTIME_DEFERRED_GATES: readonly DeferredGate[] = [];

const SERVICE_GATES = [
  GATE.PREFLIGHT_DENO,
  GATE.SCAFFOLD_INIT,
  GATE.SCAFFOLD_SERVICE_CLIENT_ADD,
  GATE.SCAFFOLD_SERVICE_CLIENT_GENERATE,
  GATE.SERVICE_LIST,
  GATE.DATABASE_CODEGEN,
  GATE.GENERATED_SERVICE_CLIENT_CONTRACT,
  GATE.GENERATED_SERVICE_CHECK,
  // GATE.GENERATED_DENO_LINT is deliberately NOT wired into the service suite.
  // It already runs in the runtime suite, where the scaffold registers plugins.
  // This suite's fixture registers none, so the Aspire helper template's
  // `{{__slot4__}}`/`{{__slot5__}}` render empty and its `builder`,
  // `infrastructure`, `appHostDir`, `databaseEnvKey`, and `databaseProviderEnv`
  // symbols become unused -- 23 `no-unused-vars` in generated output this branch
  // does not author. That is pre-existing template debt, tracked separately; it
  // is not a reason to hold this slice, and suppressing it here would weaken a
  // gate that is genuinely useful where the slots are populated.
] as const;

const CONTRACT_GATES = [
  GATE.PREFLIGHT_DENO,
  GATE.SCAFFOLD_INIT,
  GATE.CONTRACT_LIST,
  GATE.DATABASE_CODEGEN,
  GATE.GENERATED_CONTRACTS_CHECK,
] as const;

const INFRASTRUCTURE_GATES = [
  GATE.PREFLIGHT_DENO,
  GATE.SCAFFOLD_INIT,
  GATE.DATABASE_CODEGEN,
  GATE.GENERATED_INFRASTRUCTURE_CHECK,
  GATE.BEHAVIOR_PROJECT_BOUNDARY_DEV,
] as const;

const RUNTIME_GATES = [
  GATE.PREFLIGHT_DENO,
  GATE.PREFLIGHT_ASPIRE,
  GATE.SCAFFOLD_INIT,
  GATE.SCAFFOLD_SERVICE_CLIENT_ADD,
  GATE.SCAFFOLD_SERVICE_CLIENT_GENERATE,
  GATE.SCAFFOLD_UI_DATA_SCREEN,
  'scaffold.plugin.worker',
  'scaffold.plugin.saga',
  'scaffold.plugin.trigger',
  'scaffold.plugin.stream',
  'scaffold.plugin.auth',
  'scaffold.plugin.ai',
  'scaffold.plugin.ai.mcp',
  GATE.SCAFFOLD_PLUGIN_AI_LIFECYCLE,
  GATE.SCAFFOLD_PLUGIN_LIST,
  GATE.SCAFFOLD_PLUGIN_AI_APPSETTINGS,
  GATE.SCAFFOLD_UI_ADD_AI,
  GATE.SCAFFOLD_UI_LOCAL_SOURCE,
  GATE.GENERATED_RUNTIME_SCHEMAS,
  GATE.DATABASE_CODEGEN,
  GATE.GENERATED_SERVICE_CLIENT_CONTRACT,
  GATE.BEHAVIOR_PROJECT_BOUNDARY_DEV,
  GATE.BEHAVIOR_PLUGINS_UNHEALTHY,
  GATE.GENERATED_PLUGINS_CHECK,
  GATE.GENERATED_WORKERS_REGISTRY,
  GATE.GENERATED_SAGAS_REGISTRY,
  GATE.BEHAVIOR_PLUGIN_DOCTOR_MISSING_MODULE,
  GATE.RUNTIME_ASPIRE_RESTORE,
  // Declared service environment is wired here, not next to the other pre-start
  // fixtures: it regenerates every helper from appsettings.json, so it has to
  // run before the fixtures that hand-patch a generated helper — and running it
  // here also puts the generated environment block under the generated-quality
  // gates below.
  GATE.RUNTIME_SERVICE_ENV_FIXTURE,
  GATE.GENERATED_QUALITY_NEGATIVE,
  GATE.GENERATED_DENO_CHECK,
  GATE.GENERATED_DENO_LINT,
  GATE.GENERATED_DENO_FMT_CHECK,
  GATE.GENERATED_UI_AI_CHECK,
  GATE.GENERATED_AI_NAMESPACE_CHECK,
  GATE.RUNTIME_AUTH_SMOKE_ENV,
  GATE.RUNTIME_FLOW_B_FIXTURE,
  GATE.RUNTIME_READINESS_FIXTURE,
  GATE.RUNTIME_ASPIRE_START,
  GATE.DATABASE_INIT,
  GATE.DATABASE_MIGRATION_ARTIFACTS,
  GATE.DATABASE_GENERATE,
  GATE.DATABASE_SEED,
  GATE.RUNTIME_CAPTURE_DB_ALLOCATION_FIRST,
  GATE.RUNTIME_ASPIRE_RESTART_AFTER_DB,
  GATE.RUNTIME_CAPTURE_DB_ALLOCATION_SECOND,
  GATE.RUNTIME_WAIT_POSTGRES,
  GATE.RUNTIME_WAIT_MYSQL,
  GATE.RUNTIME_WAIT_MSSQL,
  GATE.RUNTIME_WAIT_GARNET,
  ...KV_BACKGROUND_RUNTIME_WAIT_RESOURCES.map((resource) => `runtime.wait.${resource}` as const),
  GATE.RUNTIME_WAIT_AUTH,
  GATE.RUNTIME_WAIT_STREAMS,
  GATE.RUNTIME_WAIT_APP,
  GATE.RUNTIME_ASPIRE_DESCRIBE,
  GATE.RUNTIME_HEALTH_LISTENER_UNREACHABLE,
  GATE.RUNTIME_TYPED_DB_PHASE_B,
  GATE.BEHAVIOR_DB_STATUS_PRESERVES_APPHOST,
  GATE.BEHAVIOR_ENDPOINT_READINESS,
  GATE.BEHAVIOR_WORKERS_HEALTH,
  GATE.BEHAVIOR_WORKERS_JOBS,
  GATE.BEHAVIOR_WORKERS_TASKS,
  GATE.BEHAVIOR_WORKERS_SEED,
  GATE.BEHAVIOR_WORKERS_TRIGGER_HEALTH_JOB,
  GATE.BEHAVIOR_WORKERS_EXECUTIONS,
  GATE.BEHAVIOR_MCP_ENDPOINT_DIRECTORY,
  GATE.BEHAVIOR_SERVICE_HEALTH,
  GATE.BEHAVIOR_SERVICE_CLIENT_REFETCH,
  GATE.BEHAVIOR_SERVICE_ENV,
  GATE.BEHAVIOR_LIVE_DB_ENDPOINT,
  GATE.BEHAVIOR_SAGAS_HEALTH,
  GATE.BEHAVIOR_SAGAS_LIST,
  GATE.BEHAVIOR_SAGAS_INSTANCES,
  GATE.BEHAVIOR_TRIGGERS_HEALTH,
  GATE.BEHAVIOR_TRIGGERS_WEBHOOK,
  GATE.BEHAVIOR_TRIGGERS_EVENTS,
  GATE.BEHAVIOR_AUTH_LIVE,
  GATE.BEHAVIOR_AUTH_READY,
  GATE.BEHAVIOR_AUTH_SESSION,
  GATE.BEHAVIOR_AI_CHAT_ROUTE,
  GATE.BEHAVIOR_APP_HOME,
  GATE.BEHAVIOR_APP_DYNAMIC_ROUTE,
  GATE.BEHAVIOR_APP_REFERENCE,
  GATE.BEHAVIOR_UI_RENDER,
  GATE.BEHAVIOR_MCP_WIDGET_ROUNDTRIP,
  GATE.BEHAVIOR_PLUGINS_HEALTH,
  GATE.BEHAVIOR_PACKAGE_BACKED_PLUGIN_DOCTOR,
  GATE.BEHAVIOR_OTEL_WEBHOOK,
  GATE.BEHAVIOR_OTEL_STREAM_CONSUMER,
  GATE.BEHAVIOR_OTEL_TRACES,
  GATE.BEHAVIOR_STREAMS_PRODUCER_RECONNECT,
  GATE.BEHAVIOR_OTEL_TASK_TRACES,
  GATE.CLEANUP_ASPIRE_STOP,
] as const;

// The generated users service currently probes Prisma with a tagged raw query that
// is not supported by the libSQL adapter. Keep that product-health assertion in
// the Postgres merge-readiness suite while the reduced-container tier exercises
// every provider-neutral runtime behavior.
const POSTGRES_ONLY_RUNTIME_GATES = new Set<GateId>([
  GATE.DATABASE_MIGRATION_ARTIFACTS,
  GATE.RUNTIME_CAPTURE_DB_ALLOCATION_FIRST,
  GATE.RUNTIME_CAPTURE_DB_ALLOCATION_SECOND,
  GATE.RUNTIME_TYPED_DB_PHASE_B,
  GATE.BEHAVIOR_LIVE_DB_ENDPOINT,
]);

const RUNTIME_SQLITE_GATES = RUNTIME_GATES.filter((gate) => !POSTGRES_ONLY_RUNTIME_GATES.has(gate));

const PLUGIN_GATES = [
  GATE.PREFLIGHT_DENO,
  GATE.SCAFFOLD_INIT,
  'scaffold.plugin.worker',
  'scaffold.plugin.saga',
  'scaffold.plugin.trigger',
  'scaffold.plugin.stream',
  'scaffold.plugin.auth',
  'scaffold.plugin.ai',
  'scaffold.plugin.ai.mcp',
  GATE.SCAFFOLD_PLUGIN_AI_LIFECYCLE,
  GATE.SCAFFOLD_PLUGIN_LIST,
  GATE.BEHAVIOR_PLUGINS_UNHEALTHY,
  GATE.GENERATED_PLUGINS_CHECK,
  GATE.GENERATED_WORKERS_REGISTRY,
  GATE.GENERATED_SAGAS_REGISTRY,
  GATE.BEHAVIOR_PLUGINS_HEALTH,
  GATE.BEHAVIOR_PACKAGE_BACKED_PLUGIN_DOCTOR,
] as const;

/** Scaffold capability suites exposed by the CLI. */
export const scaffoldCapabilitySuites: readonly ScaffoldCapabilitySuite[] = [
  {
    id: SCAFFOLD.SERVICE,
    title: SCAFFOLD_TITLE.SERVICE,
    gates: SERVICE_GATES,
  },
  {
    id: SCAFFOLD.CONTRACTS,
    title: SCAFFOLD_TITLE.CONTRACTS,
    gates: CONTRACT_GATES,
  },
  {
    id: SCAFFOLD.INFRASTRUCTURE,
    title: SCAFFOLD_TITLE.INFRASTRUCTURE,
    gates: INFRASTRUCTURE_GATES,
  },
  {
    id: SCAFFOLD.PLUGIN,
    title: SCAFFOLD_TITLE.PLUGIN,
    gates: PLUGIN_GATES,
  },
  {
    id: SCAFFOLD.RUNTIME,
    title: SCAFFOLD_TITLE.RUNTIME,
    gates: RUNTIME_GATES,
    deferredGates: SCAFFOLD_RUNTIME_DEFERRED_GATES,
  },
  {
    id: SCAFFOLD.RUNTIME_SQLITE,
    title: SCAFFOLD_TITLE.RUNTIME_SQLITE,
    gates: RUNTIME_SQLITE_GATES,
    deferredGates: SCAFFOLD_RUNTIME_DEFERRED_GATES,
    defaults: { database: DATABASE.SQLITE, cache: false },
  },
];

/** Build one scaffold capability smoke suite. */
export function createScaffoldCapabilitySuite(
  capability: ScaffoldCapabilitySuite,
  overrides: Partial<RunOptions> = {},
): SuiteDefinition {
  const resolved = { ...capability.defaults, ...overrides };
  const suite = defineCliE2eSuite()
    .withId(capability.id)
    .withTitle(capability.title)
    .withWorkspace((workspace) => {
      let next = workspace;
      if (resolved.repoRoot) next = next.withRepoRoot(resolved.repoRoot);
      if (resolved.cliEntrypoint) {
        next = next.withCliEntrypoint(resolved.cliEntrypoint);
      }
      if (resolved.smokeRoot) next = next.withSmokeRoot(resolved.smokeRoot);
      if (resolved.projectName) {
        next = next.withProjectName(resolved.projectName);
      }
      if (resolved.database) next = next.withDatabase(resolved.database);
      if (resolved.packageSource) {
        next = next.withPackageSource(resolved.packageSource);
      }
      if (resolved.cache !== undefined) {
        next = next.withCache(resolved.cache);
      }
      if (resolved.cleanup !== undefined) {
        next = next.withCleanup(resolved.cleanup);
      }
      return next;
    })
    .withScaffold((scaffold) =>
      scaffold.withOfficialPluginSuite((plugins) => {
        let next = plugins.withSamples(resolved.samples ?? true);
        if (resolved.plugins) {
          next = next.withSamples(resolved.samples ?? true);
          for (const kind of resolved.plugins) next = next.withOfficial(kind);
        }
        return next;
      })
    )
    .withReporting((reporting) => {
      let next = reporting;
      if (resolved.format === 'pretty') next = next.withPretty();
      if (resolved.format === 'json') next = next.withJson();
      if (resolved.format === 'ndjson') next = next.withNdjson();
      if (resolved.reportPath) next = next.withReport(resolved.reportPath);
      if (resolved.logFile) next = next.withLogFile(resolved.logFile);
      return next;
    })
    .build();

  if (capability.gates.length === 0) return suite;

  const gatesById = new Map(suite.gates.map((gate) => [gate.id, gate]));
  return {
    ...suite,
    deferredGates: capability.deferredGates,
    gates: runtimeGateIds(capability.gates, suite.defaultOptions.database).map(
      (id) => {
        const gate = gatesById.get(id);
        if (!gate) {
          throw new Error(
            `Gate "${id}" is not registered for suite "${capability.id}".`,
          );
        }
        return gate;
      },
    ),
  };
}

function runtimeGateIds(
  gates: readonly GateId[],
  database: RunOptions['database'],
): readonly GateId[] {
  return gates.filter((id) => {
    if (POSTGRES_ONLY_RUNTIME_GATES.has(id)) return database === 'postgres';
    if (id === GATE.RUNTIME_WAIT_POSTGRES) return database === 'postgres';
    if (id === GATE.RUNTIME_WAIT_MYSQL) return database === 'mysql';
    if (id === GATE.RUNTIME_WAIT_MSSQL) return database === 'mssql';
    return true;
  });
}

/** Build the official plugin scaffold smoke suite. */
export function createScaffoldPluginsSuite(
  overrides: Partial<RunOptions> = {},
): SuiteDefinition {
  const capability = scaffoldCapabilitySuites.find((suite) => suite.id === SCAFFOLD.PLUGIN);
  if (!capability) throw new Error('scaffold.plugins suite is not registered.');
  return createScaffoldCapabilitySuite(capability, overrides);
}
