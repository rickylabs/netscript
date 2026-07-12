import { Command } from '@cliffy/command';

import { createDoctorPluginCommand } from '../../../public/features/plugins/doctor/doctor-plugin-command.ts';
import { createInfoPluginCommand } from '../../../public/features/plugins/info/info-plugin-command.ts';
import { createPluginListCommand } from '../../../public/features/plugins/list/list-plugins-command.ts';
import { createRemovePluginCommand } from '../../../public/features/plugins/remove/remove-plugin-command.ts';
import { createUpdatePluginCommand } from '../../../public/features/plugins/update/update-plugin-command.ts';
import { type PublicCommandDependencies } from '../../../public/features/root/public-command-dependencies.ts';
import { createLocalPluginInstallCommand } from './install/install-local-plugin-command.ts';

/** Create the local contributor plugin command group. */
export function createLocalPluginCommand(
  dependencies: PublicCommandDependencies,
  sourceRootStartDir: string,
) {
  return new Command()
    .name('plugin')
    .description('Manage NetScript plugins in a local contributor workspace')
    .action(function () {
      this.showHelp();
    })
    .command(
      'install',
      createLocalPluginInstallCommand({
        resolveProjectRoot: dependencies.resolveProjectRoot,
        sourceRootStartDir,
        installPluginDependencies: {
          fs: dependencies.fs,
          scaffolder: dependencies.scaffolder,
          templateAdapter: dependencies.templateAdapter,
          registry: dependencies.pluginRegistry,
          pluginScaffolder: dependencies.pluginInstallDependencies.pluginScaffolder,
          registryScaffolder: dependencies.pluginInstallDependencies.registryScaffolder,
          workspaceMutator: dependencies.pluginInstallDependencies.workspaceMutator,
          processRunner: dependencies.process,
          pluginValidator: dependencies.pluginInstallDependencies.pluginValidator,
          sourceRootStartDir,
        },
      }),
    )
    .command('list', createPluginListCommand({ loadConfig: dependencies.loadConfig }))
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
        installPluginDependencies: dependencies.pluginInstallDependencies,
        registryDependencies: dependencies.generatePluginRegistriesCommandDependencies,
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
}
