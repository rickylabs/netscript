import { GATE_PHASE, SCAFFOLD } from '../../../domain/cli-surface.ts';
import { PACKAGE_SOURCE, PLUGIN, type PluginKind } from '../../../domain/extension-axes.ts';
import { join } from '@std/path';
import type {
  CommandFactory,
  GateDefinition,
  WorkingDirectoryFactory,
} from '../../../domain/gate-definition.ts';
import type { PluginSuiteState } from '../../builders/scaffold/plugin-suite-state.ts';
import { cli, commandGate } from './gate-factory.ts';

function pluginName(kind: PluginKind): string {
  if (kind === PLUGIN.AUTH) return 'auth';
  return `${kind}s`;
}

function localPluginDir(kind: PluginKind): string {
  if (kind === PLUGIN.WORKER) return 'workers';
  if (kind === PLUGIN.SAGA) return 'sagas';
  if (kind === PLUGIN.TRIGGER) return 'triggers';
  if (kind === PLUGIN.STREAM) return 'streams';
  return 'auth';
}

function pluginAddCommand(
  kind: PluginKind,
  state: PluginSuiteState,
): CommandFactory {
  return (context) => {
    const args = [
      'plugin',
      'add',
      kind,
      '--name',
      pluginName(kind),
      '--project-root',
      kind === PLUGIN.WORKER || kind === PLUGIN.STREAM ? context.project.projectRoot : '.',
      state.samples ? '--samples' : '--no-samples',
      '--force',
    ];

    if (context.request.suiteId === SCAFFOLD.USERLAND_INSTALL) {
      args.push(
        '--ci',
        '--local-path',
        join(context.project.repoRoot, 'plugins', localPluginDir(kind)),
      );
      return cli(context, ...args);
    }

    if (context.request.options.packageSource === PACKAGE_SOURCE.JSR) return cli(context, ...args);

    if (kind === PLUGIN.SAGA) {
      return ['deno', 'run', '-A', 'packages/cli/bin/netscript-dev.ts', ...args];
    }
    return cli(context, ...args);
  };
}

function pluginAddCwd(kind: PluginKind): WorkingDirectoryFactory {
  return (context) =>
    kind === PLUGIN.SAGA || kind === PLUGIN.TRIGGER || kind === PLUGIN.AUTH
      ? context.project.projectRoot
      : context.project.repoRoot;
}

/** Create scaffold gates that install every requested official plugin. */
export function createPluginAddGates(state: PluginSuiteState): readonly GateDefinition[] {
  return state.plugins.map((kind) =>
    commandGate(
      `scaffold.plugin.${kind}`,
      `Add official ${kind} plugin`,
      GATE_PHASE.SCAFFOLD,
      pluginAddCommand(kind, state),
      pluginAddCwd(kind),
    )
  );
}
