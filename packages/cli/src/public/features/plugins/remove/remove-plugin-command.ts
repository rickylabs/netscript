/**
 * @module
 *
 * Public `netscript plugin remove <name>` command.
 *
 * F-9 permissions: host cleanup reads and writes project config, removes
 * `.netscript/generated/<plugin>` output, and dispatches through the process
 * port. The public CLI binary requires `--allow-read`, `--allow-write`, and
 * `--allow-run=deno`.
 */

import { Command } from '@cliffy/command';

import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { type ProjectRootResolver, requireProjectRoot } from '../../../presentation/support.ts';
import { removePlugin, type RemovePluginDependencies } from './remove-plugin.ts';

/** Dependencies for the public plugin remove command. */
export interface RemovePluginCommandDependencies {
  /** Application dependencies for host-side plugin removal. */
  readonly removePluginDependencies: RemovePluginDependencies;
  /** Resolve the project root from flags or environment. */
  readonly resolveProjectRoot: ProjectRootResolver;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Options accepted by the public plugin remove command. */
export interface RemovePluginCommandInput {
  /** Optional plugin package specifier for dispatch. */
  readonly pkg?: string;
  /** Optional project root. */
  readonly projectRoot?: string;
  /** Skip plugin CLI dispatch. */
  readonly skipDispatch?: boolean;
}

/** Create the public `plugin remove` command. */
export function createRemovePluginCommand(dependencies: RemovePluginCommandDependencies): Command<any, any, any, any, any, any, any, any> {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('remove')
    .description('Remove a configured NetScript plugin')
    .arguments('<name:string>')
    .option('--pkg <pkg:string>', 'Plugin package specifier to receive the remove verb')
    .option('--project-root <path:string>', 'Project root directory')
    .option('--skip-dispatch', 'Skip dispatching the remove verb to the plugin CLI', {
      default: false,
    })
    .action(async (options: RemovePluginCommandInput, name: string): Promise<void> => {
      const projectRoot = await requireProjectRoot(
        dependencies.resolveProjectRoot,
        options.projectRoot,
      );
      const result = await removePlugin({
        pluginName: name,
        packageName: options.pkg,
        projectRoot,
        skipDispatch: options.skipDispatch ?? false,
      }, dependencies.removePluginDependencies);

      const appsettingsCount = result.removedAppsettings.plugins.length +
        result.removedAppsettings.backgroundProcessors.length;
      print(`Removed plugin "${name}".`);
      print(`Removed ${appsettingsCount} appsettings entries.`);
      print(`Removed ${result.removedGeneratedDirs.length} generated directories.`);
    }) as unknown as Command;
}
