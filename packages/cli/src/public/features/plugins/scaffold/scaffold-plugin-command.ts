/**
 * @module
 *
 * Public `netscript plugin scaffold` command.
 */

import { isAbsolute, join } from '@std/path';
import { Command } from '@cliffy/command';

import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../kernel/application/registries/template-registry.ts';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { type ProjectRootResolver, requireProjectRoot } from '../../../presentation/support.ts';
import {
  type PluginScaffoldDependencies,
  resolvePluginScaffoldTarget,
  scaffoldPluginPackage,
} from './scaffold-plugin-use-case.ts';

/** Dependencies for the public plugin scaffold command. */
export interface PluginScaffoldCommandDependencies {
  /** Use case dependencies for scaffolding plugin packages. */
  readonly scaffoldDependencies: PluginScaffoldDependencies;
  /** Resolve the project root from flags or environment. */
  readonly resolveProjectRoot: ProjectRootResolver;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Options accepted by the public plugin scaffold command. */
export interface PluginScaffoldCommandInput {
  /** Optional target directory. */
  readonly target?: string;
  /** Optional project root. */
  readonly projectRoot?: string;
  /** Overwrite generated files if they already exist. */
  readonly force?: boolean;
}

/** Create the public `plugin scaffold` command. */
export function createPluginScaffoldCommand(
  dependencies: PluginScaffoldCommandDependencies,
): Command<any, any, any, any, any, any, any, any> {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('scaffold')
    .description('Scaffold a NetScript plugin package')
    .arguments('<name:string>')
    .option('--target <path:string>', 'Target directory for the plugin package')
    .option('--project-root <path:string>', 'Project root directory')
    .option('--force', 'Overwrite generated files if they already exist', { default: false })
    .action(async (options: PluginScaffoldCommandInput, name: string): Promise<void> => {
      await DEFAULT_TEMPLATE_REGISTRY.hydrate();
      const projectRoot = await requireProjectRoot(
        dependencies.resolveProjectRoot,
        options.projectRoot,
      );
      const targetPath = resolveCommandTarget(projectRoot, name, options.target);
      const result = await scaffoldPluginPackage({
        pluginName: name,
        targetPath,
        overwrite: options.force ?? false,
      }, {
        fs: dependencies.scaffoldDependencies.fs,
        substitution: dependencies.scaffoldDependencies.substitution,
      });

      print(`Scaffolded ${name} at ${targetPath}.`);
      print(`Created ${result.filesCreated.length} plugin files.`);
      if (result.filesSkipped.length > 0) {
        print(`Skipped ${result.filesSkipped.length} existing plugin files.`);
      }
    }) as unknown as Command;
}

function resolveCommandTarget(projectRoot: string, pluginName: string, target?: string): string {
  if (!target) return resolvePluginScaffoldTarget(projectRoot, pluginName);
  return isAbsolute(target) ? target : join(projectRoot, target);
}
