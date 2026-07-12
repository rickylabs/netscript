import type { CliffyCommand } from "../../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';

import { createSyncPackagesCommand } from './packages/sync-packages-command.ts';
import { createSyncPluginCommand } from './plugin/sync-plugin-command.ts';
import { createSyncTemplatesCommand } from './templates/sync-templates-command.ts';
import type { MaintainerCliHost } from '../root/maintainer-command-tree.ts';
import type { MaintainerCommandDependencies } from '../root/maintainer-command-dependencies.ts';

/** Create the maintainer sync command group. */
export function createSyncCommand(
  host: MaintainerCliHost,
  dependencies: MaintainerCommandDependencies,
): CliffyCommand {
  return new Command()
    .name('sync')
    .description('Sync local monorepo assets into a scaffolded workspace')
    .action(function () {
      this.showHelp();
    })
    .command(
      'packages',
      createSyncPackagesCommand({
        syncPackagesDependencies: dependencies.syncPackagesDependencies,
        resolvePath: host.resolvePath,
      }),
    )
    .command(
      'plugin',
      createSyncPluginCommand({
        syncPluginDependencies: dependencies.syncPluginDependencies,
        resolvePath: host.resolvePath,
        resolveProjectName: (projectRoot) => projectRoot.split(/[/\\]/).pop() ?? 'workspace',
      }),
    )
    .command(
      'templates',
      createSyncTemplatesCommand({
        syncTemplatesDependencies: dependencies.syncTemplatesDependencies,
        resolvePath: host.resolvePath,
      }),
    );
}
