import { GATE, GATE_PHASE } from '../../../domain/cli-surface.ts';
import type { CommandGateDefinition, GateDefinition } from '../../../domain/gate-definition.ts';
import type { RunContext } from '../../../domain/run-context.ts';
import { cli } from './gate-factory.ts';
import { generatedAppName } from './runtime/generated-app-name.ts';

const RESOURCE_NAME = 'users';
const RESOURCE_CLIENT = 'users';
const RESOURCE_PROCEDURE = 'list';
const RERUN_SKIP_SUMMARY = 'Resource slice applied: 0 written, 11 skipped, 0 conflicts.';

/** Create first-run and idempotent-rerun gates for a generated Fresh resource slice. */
export function createResourceSliceGates(): readonly GateDefinition[] {
  return [
    resourceGate(
      GATE.SCAFFOLD_RESOURCE_GENERATE,
      'Generate a typed Fresh resource slice',
    ),
    resourceGate(
      GATE.SCAFFOLD_RESOURCE_RERUN,
      'Rerun the resource slice with zero writes',
      [RERUN_SKIP_SUMMARY],
    ),
  ];
}

function resourceGate(
  id: CommandGateDefinition['id'],
  title: string,
  stdoutIncludes?: readonly string[],
): CommandGateDefinition {
  return {
    id,
    title,
    phase: GATE_PHASE.SCAFFOLD,
    kind: 'command',
    critical: true,
    command: resourceCommand,
    cwd: (context) => context.project.projectRoot,
    outputMode: 'capture',
    stdoutIncludes,
  };
}

function resourceCommand(context: RunContext): readonly string[] {
  return cli(
    context,
    'generate',
    'resource',
    RESOURCE_NAME,
    '--client',
    RESOURCE_CLIENT,
    '--procedure',
    RESOURCE_PROCEDURE,
    '--partial',
    '--app',
    generatedAppName(context),
  );
}
