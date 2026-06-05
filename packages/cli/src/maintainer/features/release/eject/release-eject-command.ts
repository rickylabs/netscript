import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { Command } from '@cliffy/command';
import {
  type MaintainerPathResolver,
  type MaintainerPrint,
  resolveOptionPath,
} from '../../../presentation/support.ts';
import { releaseEject, type ReleaseEjectDependencies } from './release-eject.ts';

/** Dependencies for the maintainer `release eject` command handler. */
export interface ReleaseEjectCommandDependencies {
  /** Release eject application service dependencies. */
  readonly releaseEjectDependencies: ReleaseEjectDependencies;
  /** Resolve a path from the current working directory. */
  readonly resolvePath: MaintainerPathResolver;
  /** Print completion lines. */
  readonly print?: MaintainerPrint;
}

/** Create the maintainer `release eject` command. */
export function createReleaseEjectCommand(
  dependencies: ReleaseEjectCommandDependencies,
) {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('eject')
    .description('Eject the public NetScript producer repository')
    .option('--target <path:string>', 'Producer repository target path', {
      default: '.genesis/netscript',
    })
    .option('--source-root <path:string>', 'Explicit source monorepo root')
    .option('--branch <name:string>', 'Generated repository branch name', {
      default: 'feat/repo-genesis',
    })
    .option('--remote <url:string>', 'Generated repository Git remote', {
      default: 'https://github.com/rickylabs/netscript',
    })
    .option('--force', 'Remove an existing target before ejecting', { default: false })
    .option('--push', 'Push the generated branch after the genesis commit', { default: false })
    .option('--no-git', 'Skip git init and genesis commit')
    .option('--no-gitleaks', 'Skip gitleaks secret scan')
    .action(async (options): Promise<void> => {
      const result = await releaseEject({
        targetPath: resolveOptionPath(dependencies.resolvePath, options.target),
        sourceRoot: options.sourceRoot
          ? resolveOptionPath(dependencies.resolvePath, options.sourceRoot)
          : undefined,
        branch: options.branch,
        remote: options.remote,
        force: options.force ?? false,
        push: options.push ?? false,
        noGit: options.git === false,
        noGitleaks: options.gitleaks === false,
      }, dependencies.releaseEjectDependencies);

      print(`Ejected NetScript producer repo: ${result.targetPath}`);
      print(`Source root: ${result.sourceRoot}`);
      print(`Copied ${result.packagesCopied} packages.`);
      print(`Synced ${result.pluginsSynced.length} official plugins.`);
      if (result.gitCommit) {
        print(`Genesis commit: ${result.gitCommit}`);
      }
    });
}
