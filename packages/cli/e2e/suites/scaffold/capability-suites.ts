import { defineCliE2eSuite } from '../../src/application/builders/define-cli-e2e-suite.ts';
import {
  GATE,
  type GateId,
  SCAFFOLD,
  SCAFFOLD_TITLE,
  type SuiteId,
} from '../../src/domain/cli-surface.ts';
import type { RunOptions } from '../../src/domain/run-context.ts';
import type { SuiteDefinition } from '../../src/domain/suite-definition.ts';

/** Built-in scaffold capability suite shape. */
export interface ScaffoldCapabilitySuite {
  readonly id: SuiteId;
  readonly title: string;
  readonly gates: readonly GateId[];
}

const SERVICE_GATES = [
  GATE.PREFLIGHT_DENO,
  GATE.SCAFFOLD_INIT,
  GATE.SERVICE_LIST,
  GATE.DATABASE_CODEGEN,
  GATE.GENERATED_SERVICE_CHECK,
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
  GATE.DATABASE_INIT,
  GATE.DATABASE_GENERATE,
  GATE.DATABASE_SEED,
  GATE.GENERATED_INFRASTRUCTURE_CHECK,
] as const;

const RUNTIME_GATES = [
  GATE.PREFLIGHT_DENO,
  GATE.PREFLIGHT_ASPIRE,
  GATE.SCAFFOLD_INIT,
  'scaffold.plugin.worker',
  'scaffold.plugin.saga',
  'scaffold.plugin.trigger',
  'scaffold.plugin.stream',
  'scaffold.plugin.auth',
  'scaffold.plugin.ai',
  'scaffold.plugin.ai.mcp',
  GATE.SCAFFOLD_PLUGIN_LIST,
  GATE.SCAFFOLD_UI_ADD_AI,
  GATE.SCAFFOLD_UI_LOCAL_SOURCE,
  GATE.DATABASE_INIT,
  GATE.DATABASE_GENERATE,
  GATE.DATABASE_SEED,
  GATE.GENERATED_PLUGINS_CHECK,
  GATE.GENERATED_DENO_CHECK,
  GATE.GENERATED_UI_AI_CHECK,
  GATE.RUNTIME_AUTH_SMOKE_ENV,
  GATE.RUNTIME_FLOW_B_FIXTURE,
  GATE.RUNTIME_ASPIRE_RESTORE,
  GATE.RUNTIME_ASPIRE_START,
  GATE.RUNTIME_WAIT_POSTGRES,
  GATE.RUNTIME_WAIT_MYSQL,
  GATE.RUNTIME_WAIT_MSSQL,
  GATE.RUNTIME_WAIT_GARNET,
  GATE.RUNTIME_WAIT_WORKERS_API,
  GATE.RUNTIME_WAIT_WORKERS,
  GATE.RUNTIME_WAIT_SAGAS_API,
  GATE.RUNTIME_WAIT_SAGAS,
  GATE.RUNTIME_WAIT_TRIGGERS_API,
  GATE.RUNTIME_WAIT_TRIGGERS,
  GATE.RUNTIME_WAIT_AUTH,
  GATE.RUNTIME_WAIT_STREAMS,
  GATE.RUNTIME_ASPIRE_DESCRIBE,
  GATE.BEHAVIOR_WORKERS_HEALTH,
  GATE.BEHAVIOR_WORKERS_JOBS,
  GATE.BEHAVIOR_WORKERS_TASKS,
  GATE.BEHAVIOR_WORKERS_SEED,
  GATE.BEHAVIOR_WORKERS_TRIGGER_HEALTH_JOB,
  GATE.BEHAVIOR_WORKERS_EXECUTIONS,
  GATE.BEHAVIOR_SERVICE_HEALTH,
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
  GATE.BEHAVIOR_UI_RENDER,
  GATE.BEHAVIOR_MCP_WIDGET_ROUNDTRIP,
  GATE.BEHAVIOR_PLUGINS_HEALTH,
  GATE.BEHAVIOR_OTEL_WEBHOOK,
  GATE.BEHAVIOR_OTEL_STREAM_CONSUMER,
  GATE.BEHAVIOR_OTEL_TRACES,
  GATE.CLEANUP_ASPIRE_STOP,
] as const;

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
  GATE.SCAFFOLD_PLUGIN_LIST,
  GATE.GENERATED_PLUGINS_CHECK,
  GATE.BEHAVIOR_PLUGINS_HEALTH,
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
  },
];

/** Build one scaffold capability smoke suite. */
export function createScaffoldCapabilitySuite(
  capability: ScaffoldCapabilitySuite,
  overrides: Partial<RunOptions> = {},
): SuiteDefinition {
  const suite = defineCliE2eSuite()
    .withId(capability.id)
    .withTitle(capability.title)
    .withWorkspace((workspace) => {
      let next = workspace;
      if (overrides.repoRoot) next = next.withRepoRoot(overrides.repoRoot);
      if (overrides.cliEntrypoint) next = next.withCliEntrypoint(overrides.cliEntrypoint);
      if (overrides.smokeRoot) next = next.withSmokeRoot(overrides.smokeRoot);
      if (overrides.projectName) next = next.withProjectName(overrides.projectName);
      if (overrides.database) next = next.withDatabase(overrides.database);
      if (overrides.packageSource) next = next.withPackageSource(overrides.packageSource);
      if (overrides.cleanup !== undefined) next = next.withCleanup(overrides.cleanup);
      return next;
    })
    .withScaffold((scaffold) =>
      scaffold.withOfficialPluginSuite((plugins) => {
        let next = plugins.withSamples(overrides.samples ?? true);
        if (overrides.plugins) {
          next = next.withSamples(overrides.samples ?? true);
          for (const kind of overrides.plugins) next = next.withOfficial(kind);
        }
        return next;
      })
    )
    .withReporting((reporting) => {
      let next = reporting;
      if (overrides.format === 'pretty') next = next.withPretty();
      if (overrides.format === 'json') next = next.withJson();
      if (overrides.format === 'ndjson') next = next.withNdjson();
      if (overrides.reportPath) next = next.withReport(overrides.reportPath);
      if (overrides.logFile) next = next.withLogFile(overrides.logFile);
      return next;
    })
    .build();

  if (capability.gates.length === 0) return suite;

  const gatesById = new Map(suite.gates.map((gate) => [gate.id, gate]));
  return {
    ...suite,
    gates: runtimeGateIds(capability.gates, suite.defaultOptions.database).map((id) => {
      const gate = gatesById.get(id);
      if (!gate) throw new Error(`Gate "${id}" is not registered for suite "${capability.id}".`);
      return gate;
    }),
  };
}

function runtimeGateIds(
  gates: readonly GateId[],
  database: RunOptions['database'],
): readonly GateId[] {
  return gates.filter((id) => {
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
