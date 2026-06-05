import { GATE, GATE_PHASE } from '../../../domain/cli-surface.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import { cli, commandGate } from './gate-factory.ts';

/** Create a behavior gate that validates installed plugins through host diagnostics. */
export function createBehaviorPluginHealthGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.BEHAVIOR_PLUGINS_HEALTH,
      'Check installed plugin health',
      GATE_PHASE.BEHAVIOR,
      (context) => cli(context, 'plugin', 'doctor', '--project-root', context.project.projectRoot),
    ),
  ];
}
