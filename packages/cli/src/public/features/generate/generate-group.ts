import { Command } from '@cliffy/command';

import { createGeneratePluginRegistriesCommand } from './plugins/generate-plugin-registries-command.ts';
import { createGenerateRuntimeSchemasCommand } from './runtime-schemas/generate-runtime-schemas-command.ts';
import type { PublicCommandDependencies } from '../root/public-command-dependencies.ts';

/** Create the public code-generation command group. */
export function createGenerateCommand(dependencies: PublicCommandDependencies) : Command<any, any, any, any, any, any, any, any> {
  return new Command()
    .name('generate')
    .description('Code generation commands')
    .action(function () {
      this.showHelp();
    })
    .command(
      'runtime-schemas',
      createGenerateRuntimeSchemasCommand(
        dependencies.generateRuntimeSchemasCommandDependencies,
      ),
    )
    .command(
      'plugins',
      createGeneratePluginRegistriesCommand(
        dependencies.generatePluginRegistriesCommandDependencies,
      ),
    );
}
