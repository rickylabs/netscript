import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { basename } from '@std/path';
import { Command } from '@cliffy/command';
import { syncPlugin, type SyncPluginDependencies } from './sync-plugin.ts';
import {
  type MaintainerPathResolver,
  type MaintainerPrint,
  resolveOptionPath,
} from '../../../presentation/support.ts';

/** Dependencies for the maintainer `sync plugin` command handler. */
export interface SyncPluginCommandDependencies {
  /** Plugin sync application service dependencies. */
  readonly syncPluginDependencies: SyncPluginDependencies;
  /** Resolve a path from the current working directory. */
  readonly resolvePath: MaintainerPathResolver;
  /** Print completion lines. */
  readonly print?: MaintainerPrint;
  /** Optional project-name resolver override. */
  readonly resolveProjectName?: (projectRoot: string) => string;
}

/** Create the maintainer `sync plugin` command. */
export function createSyncPluginCommand(
  dependencies: SyncPluginCommandDependencies,
): Command<any, any, any, any, any, any, any, any> {
  const print = dependencies.print ?? outputText;
  const resolveProjectName = dependencies.resolveProjectName ??
    ((projectRoot: string) => basename(projectRoot));
  return new Command()
    .name('plugin')
    .description('Copy an official plugin implementation from the local monorepo')
    .arguments('<kind:string> [name:string]')
    .option('--project-root <path:string>', 'Target project root directory')
    .option('--source-root <path:string>', 'Explicit source monorepo root')
    .option('--import-mode <mode:string>', 'Target import mode: local or jsr', { default: 'local' })
    .option('--force', 'Overwrite existing generated files', { default: false })
    .option('--samples', 'Keep sample jobs, tasks, sagas, and triggers', { default: true })
    .option('--no-samples', 'Skip sample jobs, tasks, sagas, and triggers')
    .action(async (options, rawKind: string, name?: string): Promise<void> => {
      const projectRoot = resolveOptionPath(dependencies.resolvePath, options.projectRoot);
      const result = await syncPlugin({
        startDir: projectRoot,
        sourceRoot: options.sourceRoot
          ? resolveOptionPath(dependencies.resolvePath, options.sourceRoot)
          : undefined,
        targetPath: projectRoot,
        projectName: resolveProjectName(projectRoot),
        kind: rawKind,
        pluginName: name,
        importMode: options.importMode === 'jsr' ? 'jsr' : 'local',
        force: options.force ?? false,
        includeSamples: options.samples !== false,
      }, dependencies.syncPluginDependencies);

      print(`Synced plugin "${result.pluginName}" from ${result.sourceRoot}.`);
      print(
        `Created ${result.filesCreated.length} files and ${result.directoriesCreated.length} directories.`,
      );
    });
}
