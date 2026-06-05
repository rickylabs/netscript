import { GATE, GATE_PHASE } from '../../../domain/cli-surface.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import { cli, commandGate } from './gate-factory.ts';

/** Create a generated-project type-check gate for plugin surfaces. */
export function createGeneratedPluginCheckGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.GENERATED_PLUGINS_CHECK,
      'Generate plugin registries from discovered manifests',
      GATE_PHASE.DATABASE,
      (context) =>
        cli(context, 'generate', 'plugins', '--project-root', context.project.projectRoot),
    ),
  ];
}
