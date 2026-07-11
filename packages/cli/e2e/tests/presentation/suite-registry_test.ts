import { assertEquals } from '@std/assert';
import { DEPLOY, GATE, SCAFFOLD } from '../../src/domain/cli-surface.ts';
import { DATABASE } from '../../src/domain/extension-axes.ts';
import { builtInSuites, resolveSuite } from '../../src/presentation/cli/suites/registry.ts';

Deno.test('registry exposes scaffold capability suites from constants', () => {
  assertEquals(builtInSuites.map((suite) => suite.id), [
    SCAFFOLD.SERVICE,
    SCAFFOLD.CONTRACTS,
    SCAFFOLD.INFRASTRUCTURE,
    SCAFFOLD.PLUGIN,
    SCAFFOLD.RUNTIME,
    SCAFFOLD.USERLAND_INSTALL,
    DEPLOY.TARGETS,
  ]);
});

Deno.test('capability suites select only their scoped gates', () => {
  const service = resolveSuite(SCAFFOLD.SERVICE);
  assertEquals(service.gates.map((gate) => gate.id), [
    GATE.PREFLIGHT_DENO,
    GATE.SCAFFOLD_INIT,
    GATE.SERVICE_LIST,
    GATE.DATABASE_CODEGEN,
    GATE.GENERATED_SERVICE_CHECK,
  ]);
});

Deno.test('plugin suite includes all official plugin and generated-check gates', () => {
  const plugins = resolveSuite(SCAFFOLD.PLUGIN);
  assertEquals(plugins.gates.map((gate) => gate.id), [
    GATE.PREFLIGHT_DENO,
    GATE.SCAFFOLD_INIT,
    'scaffold.plugin.worker',
    'scaffold.plugin.saga',
    'scaffold.plugin.trigger',
    'scaffold.plugin.stream',
    'scaffold.plugin.auth',
    'scaffold.plugin.ai',
    GATE.SCAFFOLD_PLUGIN_LIST,
    GATE.GENERATED_PLUGINS_CHECK,
    GATE.BEHAVIOR_PLUGINS_HEALTH,
  ]);
});

Deno.test('true userland suite runs init, one local-path plugin install, assertion, and cleanup', () => {
  const userland = resolveSuite(SCAFFOLD.USERLAND_INSTALL);
  assertEquals(userland.gates.map((gate) => gate.id), [
    GATE.PREFLIGHT_DENO,
    GATE.SCAFFOLD_INIT,
    'scaffold.plugin.worker',
    GATE.USERLAND_INSTALL_ASSERTIONS,
    GATE.CLEANUP_USERLAND_SMOKE_ROOT,
  ]);
});

Deno.test('runtime suite includes full scaffold, database, runtime, and behavior gates', () => {
  const runtime = resolveSuite(SCAFFOLD.RUNTIME);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.SCAFFOLD_INIT), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.DATABASE_INIT), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.DATABASE_GENERATE), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.DATABASE_SEED), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.GENERATED_DENO_CHECK), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.SCAFFOLD_UI_ADD_AI), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.SCAFFOLD_UI_LOCAL_SOURCE), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.GENERATED_UI_AI_CHECK), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_AUTH_SMOKE_ENV), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_ASPIRE_START), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_WORKERS_JOBS), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_WORKERS_SEED), true);
  assertEquals(
    runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_WORKERS_TRIGGER_HEALTH_JOB),
    true,
  );
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_SAGAS_HEALTH), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_SAGAS_LIST), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_TRIGGERS_HEALTH), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_TRIGGERS_WEBHOOK), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_TRIGGERS_EVENTS), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_AUTH_LIVE), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_AUTH_READY), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_AUTH_SESSION), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_AI_CHAT_ROUTE), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_UI_RENDER), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_PLUGINS_HEALTH), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_OTEL_WEBHOOK), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_OTEL_TRACES), true);
});

Deno.test('runtime suite omits database resource wait for sqlite', () => {
  const runtime = resolveSuite(SCAFFOLD.RUNTIME, { database: DATABASE.SQLITE });
  assertEquals(runtime.defaultOptions.database, DATABASE.SQLITE);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_WAIT_POSTGRES), false);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_WAIT_MYSQL), false);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_WAIT_MSSQL), false);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_WAIT_GARNET), true);
});

Deno.test('runtime suite selects mssql database resource wait for mssql', () => {
  const runtime = resolveSuite(SCAFFOLD.RUNTIME, { database: DATABASE.MSSQL });
  assertEquals(runtime.defaultOptions.database, DATABASE.MSSQL);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_WAIT_POSTGRES), false);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_WAIT_MYSQL), false);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_WAIT_MSSQL), true);
});
