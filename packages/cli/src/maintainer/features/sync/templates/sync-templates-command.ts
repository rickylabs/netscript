import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { Command } from '@cliffy/command';
import { syncTemplates, type SyncTemplatesDependencies } from './sync-templates.ts';
import {
  type MaintainerPathResolver,
  type MaintainerPrint,
  resolveOptionPath,
} from '../../../presentation/support.ts';

/** Dependencies for the maintainer `sync templates` command handler. */
export interface SyncTemplatesCommandDependencies {
  /** Template sync application service dependencies. */
  readonly syncTemplatesDependencies: SyncTemplatesDependencies;
  /** Resolve a path from the current working directory. */
  readonly resolvePath: MaintainerPathResolver;
  /** Print completion lines. */
  readonly print?: MaintainerPrint;
}

/** Create the maintainer `sync templates` command. */
export function createSyncTemplatesCommand(
  dependencies: SyncTemplatesCommandDependencies,
) {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('templates')
    .description('Rebuild derived template outputs for a workspace or fixture root')
    .option('--target-path <path:string>', 'Workspace or fixture root to refresh')
    .action(async (options): Promise<void> => {
      const result = await syncTemplates({
        targetPath: resolveOptionPath(dependencies.resolvePath, options.targetPath),
      }, dependencies.syncTemplatesDependencies);

      print(`Synced ${result.filesWritten} template files across ${result.steps.length} steps.`);
      for (const step of result.steps) {
        print(`- ${step.name}: ${step.filesWritten.length} files`);
      }
    });
}
