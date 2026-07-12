import type { CliffyCommand } from "../../../kernel/presentation/command-types.ts";
import { outputText } from '../../../kernel/presentation/output/default-output.ts';
import { Command } from '@cliffy/command';
import { probeMonorepo, type ProbeMonorepoDependencies } from './probe-monorepo.ts';
import {
  type MaintainerCwd,
  type MaintainerPathResolver,
  type MaintainerPrint,
  resolveOptionPath,
} from '../../presentation/support.ts';

/** Dependencies for the maintainer `probe monorepo` command handler. */
export interface ProbeMonorepoCommandDependencies {
  /** Monorepo probe application service dependencies. */
  readonly probeDependencies: ProbeMonorepoDependencies;
  /** Resolve a path from the current working directory. */
  readonly resolvePath: MaintainerPathResolver;
  /** Current working directory provider. */
  readonly cwd: MaintainerCwd;
  /** Print completion lines. */
  readonly print?: MaintainerPrint;
}

/** Create the maintainer `probe monorepo` command. */
export function createProbeMonorepoCommand(
  dependencies: ProbeMonorepoCommandDependencies,
): CliffyCommand {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('monorepo')
    .description('Detect the local NetScript monorepo and available maintainer capabilities')
    .option('--start-dir <path:string>', 'Directory to start probing from')
    .option('--target-path <path:string>', 'Optional workspace path for localBase computation')
    .action(async (options): Promise<void> => {
      const startDir = options.startDir
        ? dependencies.resolvePath(options.startDir)
        : dependencies.cwd();
      const result = await probeMonorepo({
        startDir,
        targetPath: options.targetPath
          ? resolveOptionPath(dependencies.resolvePath, options.targetPath)
          : undefined,
      }, dependencies.probeDependencies);

      print(`startDir=${result.startDir}`);
      print(`sourceRoot=${result.sourceRoot ?? '(not found)'}`);
      print(`localBase=${result.localBase ?? '(n/a)'}`);
      print(`canSyncPackages=${String(result.canSyncPackages)}`);
      print(`canSyncPlugins=${String(result.canSyncPlugins)}`);
      print(`canResolveLocalImports=${String(result.canResolveLocalImports)}`);
    });
}
