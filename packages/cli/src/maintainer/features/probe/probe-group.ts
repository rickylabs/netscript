import { Command } from '@cliffy/command';

import { createProbeMonorepoCommand } from './probe-monorepo-command.ts';
import type { MaintainerCliHost } from '../root/maintainer-command-tree.ts';
import type { MaintainerCommandDependencies } from '../root/maintainer-command-dependencies.ts';

/** Create the maintainer probe command group. */
export function createProbeCommand(
  host: MaintainerCliHost,
  dependencies: MaintainerCommandDependencies,
) {
  return new Command()
    .name('probe')
    .description('Discover maintainer-only repository capabilities')
    .action(function () {
      this.showHelp();
    })
    .command(
      'monorepo',
      createProbeMonorepoCommand({
        probeDependencies: dependencies.probeDependencies,
        resolvePath: host.resolvePath,
        cwd: host.cwd,
      }),
    );
}
