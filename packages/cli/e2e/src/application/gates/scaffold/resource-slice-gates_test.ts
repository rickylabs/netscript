import { assert, assertEquals } from '@std/assert';
import { createSmokeProject } from '../../builders/workspace/smoke-project-factory.ts';
import { GATE, SCAFFOLD } from '../../../domain/cli-surface.ts';
import { DATABASE, PACKAGE_SOURCE, REPORT_FORMAT } from '../../../domain/extension-axes.ts';
import type { CommandGateDefinition } from '../../../domain/gate-definition.ts';
import type { RunContext, RunOptions } from '../../../domain/run-context.ts';
import { resolveSuite } from '../../../presentation/cli/suites/registry.ts';
import { RUNTIME_GATES } from '../../../../suites/scaffold/capability-suites.ts';
import { createScaffoldGates } from './scaffold-gates.ts';
import { createResourceSliceGates } from './resource-slice-gates.ts';

const EXPECTED_COMMAND = [
  'deno',
  'run',
  '-A',
  '/repo/packages/cli/bin/netscript.ts',
  'generate',
  'resource',
  'people',
  '--client',
  'users',
  '--procedure',
  'list',
  '--partial',
  '--app',
  'prod-local-test-web',
] as const;
const EXPECTED_RERUN_STDOUT = 'Resource slice applied: 0 written, 11 skipped, 0 conflicts.';

Deno.test('resource slice gates preserve exact first-run and rerun commands', () => {
  const context = createContext();
  const gates = createResourceSliceGates().map(commandGate);

  assertEquals(gates.map((gate) => gate.id), [
    GATE.SCAFFOLD_RESOURCE_GENERATE,
    GATE.SCAFFOLD_RESOURCE_RERUN,
  ]);
  assertEquals(gates.map((gate) => gate.command(context)), [
    EXPECTED_COMMAND,
    EXPECTED_COMMAND,
  ]);
  assertEquals(gates.map((gate) => gate.cwd(context)), [
    context.project.projectRoot,
    context.project.projectRoot,
  ]);
  assertEquals(gates.map((gate) => gate.outputMode), ['capture', 'capture']);
  assertEquals(gates[0].stdoutIncludes, undefined);
  assertEquals(gates[1].stdoutIncludes, [EXPECTED_RERUN_STDOUT]);
});

Deno.test('resource slice gates follow generated client creation in scaffold composition', () => {
  const ids = createScaffoldGates({ plugins: [], samples: false }).map((gate) => gate.id);
  const serviceClientGenerate = ids.indexOf(GATE.SCAFFOLD_SERVICE_CLIENT_GENERATE);
  const firstRun = ids.indexOf(GATE.SCAFFOLD_RESOURCE_GENERATE);
  const rerun = ids.indexOf(GATE.SCAFFOLD_RESOURCE_RERUN);
  const serviceClientContract = ids.indexOf(GATE.GENERATED_SERVICE_CLIENT_CONTRACT);

  assert(serviceClientGenerate >= 0);
  assert(serviceClientGenerate < serviceClientContract);
  assertEquals(firstRun, serviceClientContract + 1);
  assertEquals(rerun, firstRun + 1);
});

Deno.test('scaffold.runtime reaches resource gates after codegen and before generated quality', () => {
  assertEquals(
    RUNTIME_GATES.filter((id) =>
      id === GATE.SCAFFOLD_RESOURCE_GENERATE || id === GATE.SCAFFOLD_RESOURCE_RERUN
    ),
    [GATE.SCAFFOLD_RESOURCE_GENERATE, GATE.SCAFFOLD_RESOURCE_RERUN],
  );
  const selectedDatabaseCodegen = RUNTIME_GATES.indexOf(GATE.DATABASE_CODEGEN);
  const selectedServiceClientContract = RUNTIME_GATES.indexOf(
    GATE.GENERATED_SERVICE_CLIENT_CONTRACT,
  );
  const selectedFirstRun = RUNTIME_GATES.indexOf(GATE.SCAFFOLD_RESOURCE_GENERATE);
  const selectedRerun = RUNTIME_GATES.indexOf(GATE.SCAFFOLD_RESOURCE_RERUN);
  const selectedDataScreen = RUNTIME_GATES.indexOf(GATE.SCAFFOLD_UI_DATA_SCREEN);
  assert(selectedDatabaseCodegen < selectedFirstRun);
  assertEquals(selectedServiceClientContract, selectedDatabaseCodegen + 1);
  assertEquals(selectedFirstRun, selectedServiceClientContract + 1);
  assertEquals(selectedRerun, selectedFirstRun + 1);
  assertEquals(selectedDataScreen, selectedRerun + 1);

  const runtimeIds = resolveSuite(SCAFFOLD.RUNTIME).gates.map((gate) => gate.id);
  const serviceClientGenerate = runtimeIds.indexOf(GATE.SCAFFOLD_SERVICE_CLIENT_GENERATE);
  const databaseCodegen = runtimeIds.indexOf(GATE.DATABASE_CODEGEN);
  const firstRun = runtimeIds.indexOf(GATE.SCAFFOLD_RESOURCE_GENERATE);
  const rerun = runtimeIds.indexOf(GATE.SCAFFOLD_RESOURCE_RERUN);
  const serviceClientContract = runtimeIds.indexOf(GATE.GENERATED_SERVICE_CLIENT_CONTRACT);
  const dataScreen = runtimeIds.indexOf(GATE.SCAFFOLD_UI_DATA_SCREEN);
  const generatedQuality = runtimeIds.indexOf(GATE.GENERATED_QUALITY_NEGATIVE);
  const generatedCheck = runtimeIds.indexOf(GATE.GENERATED_DENO_CHECK);

  assert(serviceClientGenerate < databaseCodegen);
  assert(databaseCodegen < firstRun);
  assertEquals(serviceClientContract, databaseCodegen + 1);
  assertEquals(firstRun, serviceClientContract + 1);
  assertEquals(rerun, firstRun + 1);
  assertEquals(dataScreen, rerun + 1);
  assert(rerun < generatedQuality);
  assert(rerun < generatedCheck);
});

function commandGate(
  gate: ReturnType<typeof createResourceSliceGates>[number],
): CommandGateDefinition {
  if (gate.kind !== 'command') throw new Error(`Expected ${gate.id} to be a command gate.`);
  return gate;
}

function createContext(): RunContext {
  const options: RunOptions = {
    repoRoot: '/repo',
    cliEntrypoint: 'packages/cli/bin/netscript.ts',
    smokeRoot: '/repo/.llm/tmp/cli-e2e',
    projectName: 'prod-local-test',
    database: DATABASE.POSTGRES,
    packageSource: PACKAGE_SOURCE.LOCAL,
    plugins: [],
    samples: false,
    cache: true,
    cleanup: true,
    format: REPORT_FORMAT.PRETTY,
    commandTimeoutMs: 1,
    httpTimeoutMs: 1,
  };
  return {
    request: { suiteId: SCAFFOLD.RUNTIME, options },
    project: createSmokeProject(options),
  };
}
