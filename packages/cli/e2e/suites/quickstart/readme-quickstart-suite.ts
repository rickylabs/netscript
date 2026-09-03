import { resolve } from '@std/path';
import { defaultRunOptions } from '../../src/application/builders/workspace/suite-builder-options.ts';
import { commandGate } from '../../src/application/gates/scaffold/gate-factory.ts';
import { GATE, GATE_PHASE, QUICKSTART, QUICKSTART_TITLE } from '../../src/domain/cli-surface.ts';
import { README_QUICKSTART_EXPECTED_COMMANDS } from '../../src/domain/readme-quickstart.ts';
import { PACKAGE_SOURCE } from '../../src/domain/extension-axes.ts';
import type { GateId, GatePhase } from '../../src/domain/cli-surface.ts';
import type { RunContext, RunOptions } from '../../src/domain/run-context.ts';
import type { SuiteDefinition } from '../../src/domain/suite-definition.ts';
import { createCleanupGates } from '../../src/application/gates/scaffold/runtime-gates.ts';

const DEFAULT_COMMAND_TIMEOUT_MS = 900_000;
const ASPIRE_COMMAND_TIMEOUT_MS = 180_000;
const ASPIRE_WAIT_TIMEOUT_MS = 65_000;
const WRAPPER_GRACE_MS = 5_000;

const README_GATE_IDS = [
  GATE.README_QUICKSTART_INSTALL,
  GATE.README_QUICKSTART_INIT,
  GATE.README_QUICKSTART_CD_ASPIRE,
  GATE.README_QUICKSTART_ASPIRE_RESTORE,
  GATE.README_QUICKSTART_ASPIRE_START,
  GATE.README_QUICKSTART_ASPIRE_WAIT,
  GATE.README_QUICKSTART_CD_ROOT,
  GATE.README_QUICKSTART_DB_INIT,
  GATE.README_QUICKSTART_DB_GENERATE,
  GATE.README_QUICKSTART_DB_SEED,
  GATE.README_QUICKSTART_CURL_HEALTH,
] as const;

const README_GATE_PHASES = [
  GATE_PHASE.PREFLIGHT,
  GATE_PHASE.SCAFFOLD,
  GATE_PHASE.SCAFFOLD,
  GATE_PHASE.RUNTIME,
  GATE_PHASE.RUNTIME,
  GATE_PHASE.RUNTIME,
  GATE_PHASE.DATABASE,
  GATE_PHASE.DATABASE,
  GATE_PHASE.DATABASE,
  GATE_PHASE.DATABASE,
  GATE_PHASE.BEHAVIOR,
] as const;

/** Build the exact root README Quickstart walk for a published JSR CLI. */
export function createReadmeQuickstartSuite(
  overrides: Partial<RunOptions> = {},
): SuiteDefinition {
  const options = {
    ...defaultRunOptions({ packageSource: PACKAGE_SOURCE.JSR }),
    ...overrides,
    packageSource: overrides.packageSource ?? PACKAGE_SOURCE.JSR,
  };
  const smokeRoot = overrides.smokeRoot ?? resolve(options.repoRoot, '.llm', 'tmp', 'cli-e2e');
  return Object.freeze({
    id: QUICKSTART.README,
    title: QUICKSTART_TITLE.README,
    description: 'Execute every marked root README Quickstart command once on a clean runner.',
    defaultOptions: Object.freeze({
      ...options,
      packageSource: PACKAGE_SOURCE.JSR,
      projectName: 'my-app',
      smokeRoot,
    }),
    gates: Object.freeze([
      ...README_QUICKSTART_EXPECTED_COMMANDS.map((command, index) =>
        readmeCommandGate(README_GATE_IDS[index], README_GATE_PHASES[index], command, index)
      ),
      ...createCleanupGates(),
    ]),
  });
}

function readmeCommandGate(
  id: GateId,
  phase: GatePhase,
  command: string,
  index: number,
) {
  const childTimeoutMs = commandTimeout(command);
  return commandGate(
    id,
    `README command ${index + 1}/${README_QUICKSTART_EXPECTED_COMMANDS.length}: ${command}`,
    phase,
    (context) => readmeWalkerCommand(context, index, childTimeoutMs),
    (context) => context.project.repoRoot,
    'capture',
    `README command ${index + 1} failed; inspect its line-aware child receipt.`,
    undefined,
    childTimeoutMs + WRAPPER_GRACE_MS,
  );
}

function readmeWalkerCommand(
  context: RunContext,
  index: number,
  timeoutMs: number,
): readonly string[] {
  requirePublishedCli(context);
  return [
    'deno',
    'run',
    '--allow-read',
    '--allow-write',
    '--allow-run',
    resolve(
      context.project.repoRoot,
      'packages/cli/e2e/src/application/gates/quickstart/readme-command.ts',
    ),
    context.project.repoRoot,
    context.project.smokeRoot,
    context.project.appHost,
    String(index),
    context.project.cliEntrypoint,
    resolve(context.project.repoRoot, '.llm/tmp/readme-quickstart/state.json'),
    String(timeoutMs),
  ];
}

function requirePublishedCli(context: RunContext): void {
  if (
    context.request.options.packageSource !== PACKAGE_SOURCE.JSR ||
    !context.project.cliEntrypoint.startsWith('jsr:@netscript/cli@')
  ) {
    throw new Error(
      'readme.quickstart requires --source jsr and --cli jsr:@netscript/cli@<version>.',
    );
  }
}

function commandTimeout(command: string): number {
  if (command.startsWith('aspire wait ')) return ASPIRE_WAIT_TIMEOUT_MS;
  if (command.startsWith('aspire ')) return ASPIRE_COMMAND_TIMEOUT_MS;
  return DEFAULT_COMMAND_TIMEOUT_MS;
}
