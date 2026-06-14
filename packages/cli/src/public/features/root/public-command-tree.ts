import { Command } from '@cliffy/command';

import { contractCommand } from '../contracts/contracts-group.ts';
import { createDbCommand } from '../db/db-group.ts';
import { createDeployCommand } from '../deploy/deploy-group.ts';
import { createGenerateCommand } from '../generate/generate-group.ts';
import { createInitCommand } from '../init/init-command.ts';
import { createMarketplaceCommand } from '../marketplace/marketplace-group.ts';
import { createPluginCommand } from '../plugins/plugins-group.ts';
import { createServiceCommand } from '../services/services-group.ts';
import { createUiAddCommand } from '../ui/add/add-ui-command.ts';
import { createUiInitCommand } from '../ui/init/init-ui-command.ts';
import { createPublicCommandDependencies } from './public-command-dependencies.ts';

/** Host services supplied by the binary edge. */
export interface PublicCliHost {
  /** Return the current working directory. */
  readonly cwd: () => string;
  /** Resolve a path from the current working directory. */
  readonly resolvePath: (path?: string) => string;
}

/** Public command tree returned by `createPublicCli`. */
export interface PublicCliCommand {
  /** Parse command-line arguments. */
  readonly parse: (args?: string[]) => Promise<unknown> | unknown;
}

/** Create the public NetScript CLI command tree. */
export function createPublicCommandTree(host: PublicCliHost): PublicCliCommand {
  const dependencies = createPublicCommandDependencies(host);

  return new Command()
    .name('netscript')
    .version('1.0.0')
    .description('NetScript - enterprise-grade polyglot backend framework CLI')
    .action(function () {
      this.showHelp();
    })
    .command('deploy', createDeployCommand(dependencies))
    .command('init', createInitCommand(dependencies.initCommandDependencies))
    .command('contract', contractCommand)
    .command('db', createDbCommand(host, dependencies))
    .command('generate', createGenerateCommand(dependencies))
    .command('marketplace', createMarketplaceCommand())
    .command('plugin', createPluginCommand(dependencies))
    .command('service', createServiceCommand(dependencies))
    .command(
      'ui:add',
      createUiAddCommand({
        installDependencies: dependencies.uiInstallDependencies,
        resolveProjectRoot: dependencies.resolveProjectRoot,
      }),
    )
    .command(
      'ui:init',
      createUiInitCommand({
        installDependencies: dependencies.uiInstallDependencies,
        resolveProjectRoot: dependencies.resolveProjectRoot,
      }),
    );
}
