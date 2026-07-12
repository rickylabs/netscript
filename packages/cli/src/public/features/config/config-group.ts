import type { CliffyCommand } from "../../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';

import type { PublicCommandDependencies } from '../root/public-command-dependencies.ts';
import { createOverrideCommand } from './override/override-group.ts';
import { createRuntimeLifecycleCommands } from './override/runtime-lifecycle-command.ts';
import { createProjectConfigCommands } from './project/project-config-command.ts';

/** Create the public configuration operations group. */
export function createConfigCommand(
  dependencies: PublicCommandDependencies,
): CliffyCommand {
  const group = new Command().name('config').description('Inspect and mutate NetScript configuration')
    .action(function () {
      this.showHelp();
    });
  const [inspect, get, set] = createProjectConfigCommands(dependencies);
  group.command('inspect', inspect).command('get', get).command('set', set);
  group.command('override', createOverrideCommand(dependencies));

  const runtime = new Command().name('runtime')
    .description('Compatibility lifecycle aliases for runtime override snapshots')
    .action(function () {
      this.showHelp();
    });
  const [publish, rollback] = createRuntimeLifecycleCommands(dependencies);
  runtime.command('publish', publish).command('rollback', rollback);
  group.command('runtime', runtime);
  return group;
}
