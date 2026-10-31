import { Command } from '@cliffy/command';
import { join, resolve } from '@std/path';
import { resolveUiAppRoot } from '../../../../kernel/application/ui/resolve-ui-app-root.ts';
import { CliCommand } from '../../../../kernel/application/abstracts/cli-command.ts';
import type { CliffyCommand } from '../../../../kernel/presentation/command-types.ts';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import type { GeneratedSourceFormatterPort } from '../../../../kernel/ports/generated-source-formatter-port.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import { requireUiAppRoot, type UiAppRootResolver } from '../../../presentation/support.ts';
import { MigrateUiVariantsUseCase } from './migrate-ui-variants-use-case.ts';

/** Services supplied by the public composition root. */
export interface MigrateUiCommandDependencies {
  readonly fs: FileSystemPort;
  readonly formatter?: GeneratedSourceFormatterPort;
  readonly resolveUiAppRoot: UiAppRootResolver;
  readonly print?: (message: string) => void;
}

/** Public migration command edge; app resolution and IO stay injected. */
export class MigrateUiCommand extends CliCommand<CliffyCommand> {
  readonly id = 'public.ui.migrate';
  constructor(private readonly deps: MigrateUiCommandDependencies) {
    super();
  }
  define(): CliffyCommand {
    const print = this.deps.print ?? outputText;
    return new Command().name('ui:migrate').description('Migrate app-owned Fresh UI copies')
      .action(function () {
        this.showHelp();
      })
      .command('variants', 'Migrate 0.0.8 Utility modifiers and anatomy to data attributes')
      .option('--project-root <path:string>', 'Workspace or Fresh app root')
      .option('--app <name:string>', 'Fresh app workspace name')
      .option('--dry-run', 'Preflight and list changes without writing')
      .action(async (options: { projectRoot?: string; app?: string; dryRun?: boolean }) => {
        let appRoot = await requireUiAppRoot(this.deps.resolveUiAppRoot, options);
        // The shared resolver treats an explicit root as final. Resolve a selected workspace
        // through the same application resolver again so sibling apps cannot be rewritten.
        if (await this.deps.fs.exists(join(appRoot, 'apps'))) {
          const workspaceRoot = appRoot;
          appRoot = await requireUiAppRoot((input) =>
            resolveUiAppRoot(input, {
              fs: this.deps.fs,
              cwd: () => workspaceRoot,
              resolvePath: (path) => resolve(workspaceRoot, path),
              resolveWorkspaceRoot: () => Promise.resolve(workspaceRoot),
            }), { app: options.app });
        }
        const result = await new MigrateUiVariantsUseCase(this.deps.fs, this.deps.formatter)
          .execute({
            appRoot,
            dryRun: options.dryRun,
          });
        for (const path of result.changed) {
          print(`${result.dryRun ? 'would migrate' : 'migrated'}\t${path}`);
        }
        print(`${result.dryRun ? 'Would migrate' : 'Migrated'} ${result.changed.length} files.`);
      });
  }
}

/** Create `ui:migrate variants` without changing the registry lifecycle commands. */
export function createUiMigrateCommand(deps: MigrateUiCommandDependencies): CliffyCommand {
  return new MigrateUiCommand(deps).define();
}
