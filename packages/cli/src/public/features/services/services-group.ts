import type { CliffyCommand } from "../../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';

import { createServiceAddCommand } from './add/add-service-command.ts';
import { createServiceGenerateCommand } from './generate/generate-service-command.ts';
import { serviceListCommand } from './list/list-services-command.ts';
import { createServiceConfigCommands } from './configure/service-config-command.ts';
import type { PublicCommandDependencies } from '../root/public-command-dependencies.ts';
import { createServiceRemoveCommand } from './remove/remove-service-command.ts';
import { createServiceAddHandlerCommand } from './add-handler/add-service-handler-command.ts';

/** Create the public service command group. */
export function createServiceCommand(
  dependencies: PublicCommandDependencies,
): CliffyCommand {
  const mutations = createServiceConfigCommands(dependencies);
  return new Command()
    .name('service')
    .description('Manage NetScript services')
    .action(function () {
      this.showHelp();
    })
    .command(
      'add',
      createServiceAddCommand({
        resolveProjectRoot: dependencies.resolveProjectRoot,
        addServiceDependencies: dependencies.serviceAddDependencies,
      }),
    )
    .command('list', serviceListCommand)
    .command('ref', mutations.ref)
    .command('set', mutations.set)
    .command(
      'remove',
      createServiceRemoveCommand({
        fs: dependencies.fs,
        scaffolder: dependencies.scaffolder,
        templateAdapter: dependencies.templateAdapter,
        resolveProjectRoot: dependencies.resolveProjectRoot,
      }),
    )
    .command(
      'add-handler',
      createServiceAddHandlerCommand({
        fs: dependencies.fs,
        resolveProjectRoot: dependencies.resolveProjectRoot,
      }),
    )
    .command(
      'generate',
      createServiceGenerateCommand({
        resolveProjectRoot: dependencies.resolveProjectRoot,
        generateAspireDependencies: {
          fs: dependencies.fs,
          scaffolder: dependencies.scaffolder,
          templateAdapter: dependencies.templateAdapter,
        },
      }),
    );
}
