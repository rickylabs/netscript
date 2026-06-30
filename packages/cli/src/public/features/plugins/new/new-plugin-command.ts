/**
 * @module
 *
 * Public `netscript plugin new` command.
 */

import { Command } from '@cliffy/command';

import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { type ProjectRootResolver, requireProjectRoot } from '../../../presentation/support.ts';
import { createNewPlugin, type NewPluginDependencies } from './new-plugin-use-case.ts';

/** Dependencies for the public plugin new command. */
export interface NewPluginCommandDependencies {
  /** Use case dependencies for greenfield plugin generation. */
  readonly newPluginDependencies: NewPluginDependencies;
  /** Resolve the project root from flags or environment. */
  readonly resolveProjectRoot: ProjectRootResolver;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Options accepted by the public plugin new command. */
export interface NewPluginCommandInput {
  /** Optional project root. */
  readonly projectRoot?: string;
  /** Generate a route-backed feature connector instead of a proxy connector. */
  readonly feature?: boolean;
  /** Overwrite generated files if they already exist. */
  readonly force?: boolean;
}

/** Create the public `plugin new` command. */
export function createNewPluginCommand(
  dependencies: NewPluginCommandDependencies,
) {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('new')
    .description('Generate a dual-tier NetScript plugin')
    .arguments('<name:string>')
    .option('--project-root <path:string>', 'Project root directory')
    .option('--feature', 'Generate route-backed feature defaults', { default: false })
    .option('--force', 'Overwrite generated files if they already exist', { default: false })
    .action(async (options: NewPluginCommandInput, name: string): Promise<void> => {
      const projectRoot = await requireProjectRoot(
        dependencies.resolveProjectRoot,
        options.projectRoot,
      );
      const result = await createNewPlugin({
        name,
        projectRoot,
        kind: options.feature ? 'feature' : 'proxy',
        overwrite: options.force ?? false,
      }, dependencies.newPluginDependencies);

      print(`Generated ${result.descriptor.connectorPackage}.`);
      print(`Created ${result.filesCreated.length} files.`);
      if (result.filesSkipped.length > 0) {
        print(`Skipped ${result.filesSkipped.length} existing files.`);
      }
    });
}
