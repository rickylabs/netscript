import type { CliffyCommand } from "../../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';

import { createReleaseEjectCommand } from './eject/release-eject-command.ts';
import type { MaintainerCliHost } from '../root/maintainer-command-tree.ts';
import type { MaintainerCommandDependencies } from '../root/maintainer-command-dependencies.ts';

/** Create the maintainer release command group. */
export function createReleaseCommand(
  host: MaintainerCliHost,
  dependencies: MaintainerCommandDependencies,
): CliffyCommand {
  return new Command()
    .name('release')
    .description('Release and public-repository maintainer workflows')
    .action(function () {
      this.showHelp();
    })
    .command(
      'eject',
      createReleaseEjectCommand({
        releaseEjectDependencies: dependencies.releaseEjectDependencies,
        resolvePath: host.resolvePath,
      }),
    );
}
