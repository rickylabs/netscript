import { assertEquals } from '@std/assert';
import { GATE, SCAFFOLD } from '../../src/domain/cli-surface.ts';
import { builtInSuites, resolveSuite } from '../../src/presentation/cli/suites/registry.ts';

Deno.test('registry exposes scaffold capability suites from constants', () => {
  assertEquals(builtInSuites.map((suite) => suite.id), [
    SCAFFOLD.SERVICE,
    SCAFFOLD.CONTRACTS,
    SCAFFOLD.INFRASTRUCTURE,
    SCAFFOLD.PLUGIN,
    SCAFFOLD.RUNTIME,
  ]);
});

Deno.test('capability suites select only their scoped gates', () => {
  const service = resolveSuite(SCAFFOLD.SERVICE);
  assertEquals(service.gates.map((gate) => gate.id), [
    GATE.PREFLIGHT_DENO,
    GATE.SCAFFOLD_INIT,
    GATE.SERVICE_LIST,
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
    GATE.SCAFFOLD_PLUGIN_LIST,
    GATE.GENERATED_PLUGINS_CHECK,
    GATE.BEHAVIOR_PLUGINS_HEALTH,
  ]);
});

Deno.test('runtime suite excludes scaffold and database gates', () => {
  const runtime = resolveSuite(SCAFFOLD.RUNTIME);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.SCAFFOLD_INIT), false);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.DATABASE_INIT), false);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_ASPIRE_START), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_SAGAS_HEALTH), true);
});
