import { GATE, GATE_PHASE, SCAFFOLD, SCAFFOLD_TITLE } from '../../src/domain/cli-surface.ts';
import type { SuiteDefinition } from '../../src/domain/suite-definition.ts';
import type { RunOptions } from '../../src/domain/run-context.ts';
import { defaultRunOptions } from '../../src/application/builders/workspace/suite-builder-options.ts';
import { cli, commandGate } from '../../src/application/gates/scaffold/gate-factory.ts';
import { createCleanupGates } from '../../src/application/gates/scaffold/runtime-gates.ts';
import { generatedAppName } from '../../src/application/gates/scaffold/runtime/generated-app-name.ts';

/** Follow the public showcase recipe without any extra plugin or environment wiring. */
export function createShowcaseSuite(overrides: Partial<RunOptions> = {}): SuiteDefinition {
  return {
    id: SCAFFOLD.SHOWCASE,
    title: SCAFFOLD_TITLE.SHOWCASE,
    description:
      'Documented opt-in init, setup, live commerce, fulfilment, saga and stream activity.',
    defaultOptions: {
      ...defaultRunOptions(overrides),
      database: 'sqlite',
      cache: false,
      ...overrides,
    },
    gates: [
      commandGate(
        GATE.SHOWCASE_INIT,
        'Opt in to the Northwind scaffold',
        GATE_PHASE.SCAFFOLD,
        (context) =>
          cli(
            context,
            'init',
            context.project.projectName,
            '--from',
            'showcase',
            '--path',
            context.project.smokeRoot,
            '--db',
            context.request.options.database,
            '--ci',
            '--yes',
            '--no-git',
          ),
      ),
      commandGate(
        GATE.SHOWCASE_SETUP,
        'Run the documented complete setup task',
        GATE_PHASE.SCAFFOLD,
        () => ['deno', 'task', 'showcase:setup'],
        (context) => context.project.projectRoot,
      ),
      commandGate(
        GATE.SHOWCASE_CHECK,
        'Check the actual generated commerce workspace',
        GATE_PHASE.SCAFFOLD,
        () => ['deno', 'task', 'check'],
        (context) => context.project.projectRoot,
      ),
      commandGate(
        GATE.SHOWCASE_BUILD,
        'Build the generated Fresh showcase',
        GATE_PHASE.SCAFFOLD,
        (context) => ['deno', 'task', '--cwd', `apps/${generatedAppName(context)}`, 'build'],
        (context) => context.project.projectRoot,
      ),
      commandGate(
        GATE.SHOWCASE_START,
        'Start the documented Aspire runtime',
        GATE_PHASE.RUNTIME,
        () => ['deno', 'task', 'aspire:start'],
        (context) => context.project.projectRoot,
      ),
      commandGate(
        GATE.SHOWCASE_WALKTHROUGH,
        'Render seeded commerce and execute both order entry points',
        GATE_PHASE.BEHAVIOR,
        (
          context,
        ) => [
          'deno',
          'run',
          '-A',
          `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/showcase/probe-showcase.ts`,
          context.project.appHost,
          generatedAppName(context),
        ],
      ),
      ...createCleanupGates(),
    ],
  };
}
