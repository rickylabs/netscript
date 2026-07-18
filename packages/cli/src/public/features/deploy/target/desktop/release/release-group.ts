/** Public native release command group. */

import { Command } from '@cliffy/command';
import type { CliffyCommand } from '../../../../../../kernel/presentation/command-types.ts';
import {
  createPrepareReleaseCommand,
  type PrepareReleaseCommandDependencies,
} from './prepare-release-command.ts';
import { createServeReleaseCommand } from './server/serve-release-command.ts';

/** Create `netscript deploy desktop release`. */
export function createDesktopReleaseCommand(
  dependencies: PrepareReleaseCommandDependencies,
): CliffyCommand {
  return new Command()
    .name('release')
    .description('Prepare and serve native Deno Desktop releases')
    .action(function () {
      this.showHelp();
    })
    .command('prepare', createPrepareReleaseCommand(dependencies))
    .command(
      'serve',
      createServeReleaseCommand({ resolveProjectRoot: dependencies.resolveProjectRoot }),
    );
}
