import { Command } from '@cliffy/command';

import { FRAMEWORK_VERBS } from './dispatch/dispatch-plugin-verb.ts';
import { createPluginVerbCommand } from './dispatch/plugin-verb-command.ts';
import type { FrameworkVerb } from './dispatch/dispatch-plugin-verb.ts';
import { createPluginInstallCommand } from './install/install-plugin-command.ts';
import { createDoctorPluginCommand } from './doctor/doctor-plugin-command.ts';
import { createHostPluginCommand } from './host/host-plugin-command.ts';
import { createInfoPluginCommand } from './info/info-plugin-command.ts';
import { createPluginListCommand } from './list/list-plugins-command.ts';
import { createRemovePluginCommand } from './remove/remove-plugin-command.ts';
import { createPluginScaffoldCommand } from './scaffold/scaffold-plugin-command.ts';
import { createUpdatePluginCommand } from './update/update-plugin-command.ts';
import type { PublicCommandDependencies } from '../root/public-command-dependencies.ts';

const CONCRETE_VERBS = new Set<FrameworkVerb>([
  'install',
  'sync',
  'info',
  'update',
  'remove',
  'doctor',
]);

/** Create the public plugin command group. */
export function createPluginCommand(
  dependencies: PublicCommandDependencies,
) {
  const command = new Command()
    .name('plugin')
    .description('Manage NetScript plugins')
    .action(function () {
      this.showHelp();
    })
    .command(
      'list',
      createPluginListCommand({ loadConfig: dependencies.loadConfig }),
    )
    .command(
      'scaffold',
      createPluginScaffoldCommand({
        scaffoldDependencies: dependencies.pluginScaffoldDependencies,
        resolveProjectRoot: dependencies.resolveProjectRoot,
      }),
    )
    .command(
      'install',
      createPluginInstallCommand({
        installPluginDependencies: dependencies.pluginInstallDependencies,
        resolveProjectRoot: dependencies.resolveProjectRoot,
      }),
    )
    .command('sync', createHostPluginCommand(dependencies.pluginHostDependencies))
    .command(
      'info',
      createInfoPluginCommand({
        resolveProjectRoot: dependencies.resolveProjectRoot,
        processRunner: dependencies.process,
        dispatch: async (verb, pkg, args, options) => {
          await dependencies.pluginDispatchDependencies.dispatchPort.dispatch({
            verb,
            pkg,
            args,
            projectRoot: options.projectRoot,
            processRunner: options.processRunner,
          });
        },
      }),
    )
    .command(
      'update',
      createUpdatePluginCommand({
        resolveProjectRoot: dependencies.resolveProjectRoot,
        processRunner: dependencies.process,
        dispatch: async (verb, pkg, args, options) => {
          await dependencies.pluginDispatchDependencies.dispatchPort.dispatch({
            verb,
            pkg,
            args,
            projectRoot: options.projectRoot,
            processRunner: options.processRunner,
          });
        },
      }),
    )
    .command(
      'remove',
      createRemovePluginCommand({
        removePluginDependencies: dependencies.pluginRemoveDependencies,
        resolveProjectRoot: dependencies.resolveProjectRoot,
      }),
    )
    .command(
      'doctor',
      createDoctorPluginCommand({
        ...dependencies.pluginDoctorDependencies,
        resolveProjectRoot: dependencies.resolveProjectRoot,
      }),
    );

  for (const verb of FRAMEWORK_VERBS.filter((candidate) => !CONCRETE_VERBS.has(candidate))) {
    command.command(
      verb,
      createPluginVerbCommand({
        verb,
        resolveProjectRoot: dependencies.resolveProjectRoot,
        processRunner: dependencies.process,
        dispatch: async (verb, pkg, args, options) => {
          await dependencies.pluginDispatchDependencies.dispatchPort.dispatch({
            verb,
            pkg,
            args,
            projectRoot: options.projectRoot,
            processRunner: options.processRunner,
          });
        },
      }),
    );
  }

  return command;
}
