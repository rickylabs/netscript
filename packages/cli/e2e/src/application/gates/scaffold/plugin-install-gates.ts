import { GATE, GATE_PHASE, SCAFFOLD } from '../../../domain/cli-surface.ts';
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
  if (kind === PLUGIN.AI) return 'ai';
  return `${kind}s`;
}

function localPluginDir(kind: PluginKind): string {
  if (kind === PLUGIN.WORKER) return 'workers';
  if (kind === PLUGIN.SAGA) return 'sagas';
  if (kind === PLUGIN.TRIGGER) return 'triggers';
  if (kind === PLUGIN.STREAM) return 'streams';
  if (kind === PLUGIN.AI) return 'ai';
  return 'auth';
}

function pluginInstallCommand(
  kind: PluginKind,
  state: PluginSuiteState,
  mcp = false,
): CommandFactory {
  return (context) => {
    const args = [
      'plugin',
      'install',
      kind,
      '--name',
      pluginName(kind),
      '--project-root',
      kind === PLUGIN.WORKER || kind === PLUGIN.STREAM ? context.project.projectRoot : '.',
      state.samples ? '--samples' : '--no-samples',
      '--force',
    ];

    if (kind === PLUGIN.AI && mcp) args.push('--mcp');

    if (context.request.suiteId === SCAFFOLD.USERLAND_INSTALL) {
      args.push(
        '--ci',
        '--local-path',
        join(context.project.repoRoot, 'plugins', localPluginDir(kind)),
      );
      return cli(context, ...args);
    }

    if (context.request.options.packageSource === PACKAGE_SOURCE.JSR) {
      return cli(context, ...args);
    }

    if (kind === PLUGIN.SAGA) {
      return [
        'deno',
        'run',
        '-A',
        'packages/cli/bin/netscript-dev.ts',
        ...args,
      ];
    }
    return cli(context, ...args);
  };
}

function pluginInstallCwd(kind: PluginKind): WorkingDirectoryFactory {
  return (context) =>
    kind === PLUGIN.SAGA || kind === PLUGIN.TRIGGER || kind === PLUGIN.AUTH ||
      kind === PLUGIN.AI
      ? context.project.projectRoot
      : context.project.repoRoot;
}

/** Create scaffold gates that install every requested official plugin. */
export function createPluginInstallGates(
  state: PluginSuiteState,
): readonly GateDefinition[] {
  const gates = state.plugins.map((kind) =>
    commandGate(
      `scaffold.plugin.${kind}`,
      `Install official ${kind} plugin`,
      GATE_PHASE.SCAFFOLD,
      pluginInstallCommand(kind, state),
      pluginInstallCwd(kind),
    )
  );
  if (state.aiMcp && state.plugins.includes(PLUGIN.AI)) {
    gates.push(commandGate(
      GATE.SCAFFOLD_PLUGIN_AI_MCP,
      'Install official AI plugin with MCP skill tool',
      GATE_PHASE.SCAFFOLD,
      pluginInstallCommand(PLUGIN.AI, state, true),
      pluginInstallCwd(PLUGIN.AI),
    ));
  }
  if (state.plugins.includes(PLUGIN.AI)) {
    gates.push(commandGate(
      GATE.SCAFFOLD_PLUGIN_AI_LIFECYCLE,
      'Add and self-wire an AI tool through the plugin CLI',
      GATE_PHASE.SCAFFOLD,
      (context) =>
        context.request.options.packageSource === PACKAGE_SOURCE.JSR
          ? [
            'deno',
            'x',
            '-A',
            'jsr:@netscript/plugin-ai/cli',
            'add',
            'tool',
            'e2e-tool',
            `--workspaceRoot=${context.project.projectRoot}`,
          ]
          : [
            'deno',
            'run',
            '-A',
            join(context.project.repoRoot, 'plugins', 'ai', 'cli.ts'),
            'add',
            'tool',
            'e2e-tool',
            `--workspaceRoot=${context.project.projectRoot}`,
          ],
      (context) => context.project.repoRoot,
    ));
  }
  return gates;
}
