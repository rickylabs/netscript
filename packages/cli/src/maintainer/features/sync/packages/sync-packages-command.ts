import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { Command } from '@cliffy/command';
import type { DbEngine } from '../../../../kernel/domain/db-engine.ts';
import { syncPackages, type SyncPackagesDependencies } from './sync-packages.ts';
import {
  type MaintainerPathResolver,
  type MaintainerPrint,
  resolveOptionPath,
} from '../../../presentation/support.ts';

const DB_ENGINES: readonly DbEngine[] = ['postgres', 'mysql', 'mssql', 'sqlite'];

/** Dependencies for the maintainer `sync packages` command handler. */
export interface SyncPackagesCommandDependencies {
  /** Package sync application service dependencies. */
  readonly syncPackagesDependencies: SyncPackagesDependencies;
  /** Resolve a path from the current working directory. */
  readonly resolvePath: MaintainerPathResolver;
  /** Print completion lines. */
  readonly print?: MaintainerPrint;
}

function parseDbEngines(raw: string | undefined): readonly DbEngine[] | undefined {
  if (!raw) return undefined;
  const values = raw.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
  for (const value of values) {
    if (!DB_ENGINES.includes(value as DbEngine)) {
      throw new Error(`--db must contain only: ${DB_ENGINES.join(', ')}`);
    }
  }
  return values as readonly DbEngine[];
}

/** Create the maintainer `sync packages` command. */
export function createSyncPackagesCommand(
  dependencies: SyncPackagesCommandDependencies,
): Command<any, any, any, any, any, any, any, any> {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('packages')
    .description('Copy local monorepo packages into a scaffold workspace')
    .option('--project-root <path:string>', 'Scaffold project root directory')
    .option('--monorepo-root <path:string>', 'Explicit source monorepo root')
    .option('--db <engines:string>', 'Comma-separated database engines for extra local packages')
    .action(async (options): Promise<void> => {
      const result = await syncPackages({
        sourceRoot: resolveOptionPath(dependencies.resolvePath, options.monorepoRoot),
        targetPath: resolveOptionPath(dependencies.resolvePath, options.projectRoot),
        dbEngines: parseDbEngines(options.db),
      }, dependencies.syncPackagesDependencies);

      print(`Copied ${result.packagesCopied} packages.`);
      print(
        `Created ${result.filesCreated.length} files and ${result.directoriesCreated.length} directories.`,
      );
    });
}
