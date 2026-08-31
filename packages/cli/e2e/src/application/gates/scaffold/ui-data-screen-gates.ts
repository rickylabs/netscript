import { GATE, GATE_PHASE } from '../../../domain/cli-surface.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import type { RunContext } from '../../../domain/run-context.ts';
import { cli, commandGate } from './gate-factory.ts';
import { generatedAppName } from './generated-app-name.ts';

/** Create the generated-project consumer gate for a data-bound Fresh screen. */
export function createUiDataScreenGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.SCAFFOLD_UI_DATA_SCREEN,
      'Scaffold a generated Fresh data screen',
      GATE_PHASE.SCAFFOLD,
      dataScreenCommand,
      (context) => context.project.projectRoot,
    ),
  ];
}

function dataScreenCommand(context: RunContext): readonly string[] {
  return cli(
    context,
    'ui:add',
    'page',
    'data-screen',
    '--island',
    '--app',
    generatedAppName(context),
  );
}
