import { Command } from '@cliffy/command';
import {
  createMaintainerCli,
  type MaintainerCliHost,
} from '../../maintainer/composition/create-maintainer-cli.ts';
import { createLocalPluginCommand } from '../features/plugins/plugins-group.ts';
import { createPublicCommandDependencies } from '../../public/features/root/public-command-dependencies.ts';
import { createPublicCli } from '../../public/composition/create-public-cli.ts';

/** Compose the local contributor CLI from maintainer and public command trees. */
export function composeLocalContributorCommandTree(host: MaintainerCliHost): Command<any, any, any, any, any, any, any, any> {
  const maintainerCli = createMaintainerCli(host) as Command;
  const publicCli = createPublicCli(host) as Command;
  const publicDependencies = createPublicCommandDependencies(host);
  const existing = new Set(maintainerCli.getCommands().map((command) => command.getName()));

  for (const command of publicCli.getCommands()) {
    if (existing.has(command.getName())) continue;
    if (command.getName() === 'plugin') {
      maintainerCli.command('plugin', createLocalPluginCommand(publicDependencies, host.cwd()));
      continue;
    }
    maintainerCli.command(command.getName(), command);
  }

  return maintainerCli;
}
