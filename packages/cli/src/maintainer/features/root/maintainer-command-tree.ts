import { Command } from '@cliffy/command';

import { createMaintainerInitCommand } from '../init/init-command.ts';
import { createProbeCommand } from '../probe/probe-group.ts';
import { createReleaseCommand } from '../release/release-group.ts';
import { createSyncCommand } from '../sync/sync-group.ts';
import { createTestCommand } from '../test-scaffold/test-group.ts';
import { createMaintainerCommandDependencies } from './maintainer-command-dependencies.ts';

/** Host services supplied by the maintainer binary edge. */
export interface MaintainerCliHost {
  /** Return the current working directory. */
  readonly cwd: () => string;
  /** Resolve a path from the current working directory. */
  readonly resolvePath: (path?: string) => string;
}

/** Maintainer command tree returned by `createMaintainerCli`. */
export interface MaintainerCliCommand {
  /** Parse command-line arguments. */
  readonly parse: (args?: string[]) => Promise<unknown> | unknown;
}

/** Create the maintainer NetScript CLI command tree. */
export function createMaintainerCommandTree(host: MaintainerCliHost): MaintainerCliCommand {
  const dependencies = createMaintainerCommandDependencies(host);

  return new Command()
    .name('netscript-dev')
    .version('1.0.0')
    .description('Local contributor and maintainer NetScript CLI')
    .action(function () {
      this.showHelp();
    })
    .command(
      'init',
      createMaintainerInitCommand({
        initDependencies: dependencies.initDependencies,
      }),
    )
    .command('sync', createSyncCommand(host, dependencies))
    .command('probe', createProbeCommand(host, dependencies))
    .command('test', createTestCommand(host, dependencies))
    .command('release', createReleaseCommand(host, dependencies));
}
