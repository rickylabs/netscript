import { Command } from '@cliffy/command';

import { createServiceAddCommand } from './add/add-service-command.ts';
import { createServiceGenerateCommand } from './generate/generate-service-command.ts';
import { serviceListCommand } from './list/list-services-command.ts';
import type { PublicCommandDependencies } from '../root/public-command-dependencies.ts';

/** Create the public service command group. */
export function createServiceCommand(dependencies: PublicCommandDependencies) : Command<any, any, any, any, any, any, any, any> {
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
