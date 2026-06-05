import { GATE, GATE_PHASE } from '../../../domain/cli-surface.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import type { PluginSuiteState } from '../../builders/scaffold/plugin-suite-state.ts';
import { cli, commandGate } from './gate-factory.ts';
import { createPluginAddGates } from './plugin-add-gates.ts';

/** Create preflight gates for required CLI tooling. */
export function createPreflightGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.PREFLIGHT_DENO,
      'Deno CLI is available',
      GATE_PHASE.PREFLIGHT,
      () => ['deno', '--version'],
    ),
    commandGate(GATE.PREFLIGHT_ASPIRE, 'Aspire CLI is available', GATE_PHASE.PREFLIGHT, () => [
      'aspire',
      '--version',
    ]),
  ];
}

/** Create scaffold-phase gates for the generated project and plugins. */
export function createScaffoldGates(state: PluginSuiteState): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.SCAFFOLD_INIT,
      'Scaffold generated project',
      GATE_PHASE.SCAFFOLD,
      (context) =>
        cli(
          context,
          'init',
          context.project.projectName,
          '--path',
          context.project.smokeRoot,
          '--db',
          context.request.options.database,
          '--service',
          '--service-name',
          'users',
          '--service-port',
          '3001',
          '--ci',
          '--yes',
          '--no-git',
          '--force',
        ),
    ),
    commandGate(
      GATE.SERVICE_LIST,
      'List generated services',
      GATE_PHASE.SCAFFOLD,
      (context) => cli(context, 'service', 'list', '--project-root', context.project.projectRoot),
    ),
    commandGate(
      GATE.CONTRACT_LIST,
      'List generated contracts',
      GATE_PHASE.SCAFFOLD,
      (context) => cli(context, 'contract', 'list', '--path', context.project.projectRoot),
    ),
    ...createPluginAddGates(state),
    commandGate(
      GATE.SCAFFOLD_PLUGIN_LIST,
      'List configured plugins',
      GATE_PHASE.SCAFFOLD,
      (context) => cli(context, 'plugin', 'list', '--project-root', context.project.projectRoot),
    ),
  ];
}
