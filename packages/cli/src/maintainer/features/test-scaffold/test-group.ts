import { Command } from '@cliffy/command';

import { createTestScaffoldCommand } from './test-scaffold-command.ts';
import type { MaintainerCliHost } from '../root/maintainer-command-tree.ts';
import type { MaintainerCommandDependencies } from '../root/maintainer-command-dependencies.ts';

/** Create the maintainer test command group. */
export function createTestCommand(
  host: MaintainerCliHost,
  dependencies: MaintainerCommandDependencies,
) {
  return new Command()
    .name('test')
    .description('Run maintainer validation suites')
    .action(function () {
      this.showHelp();
    })
    .command(
      'scaffold',
      createTestScaffoldCommand({
        runScaffoldTestDependencies: dependencies.runScaffoldTestDependencies,
        resolvePath: host.resolvePath,
      }),
    );
}
