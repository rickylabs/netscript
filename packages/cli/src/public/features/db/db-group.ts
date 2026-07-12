import { Command } from '@cliffy/command';

import { createDbAddCommand } from './add/add-db-command.ts';
import { createDbGenerateCommand } from './generate/generate-db-command.ts';
import { createDbInitCommand } from './init/init-db-command.ts';
import { createDbIntrospectCommand } from './introspect/introspect-db-command.ts';
import { createDbMigrateCommand } from './migrate/migrate-db-command.ts';
import { createDbResetCommand } from './reset/reset-db-command.ts';
import { createDbSeedCommand } from './seed/seed-db-command.ts';
import { createDbStatusCommand } from './status/status-db-command.ts';
import { createDbStudioCommand } from './studio/studio-db-command.ts';
import { createDbListCommand } from './list/list-db-command.ts';
import { createDbRemoveCommand } from './remove/remove-db-command.ts';
import { createDbDeployCommand } from './deploy/deploy-db-command.ts';
import { createDbValidateCommand } from './validate/validate-db-command.ts';
import { createDbResolveCommand } from './resolve/resolve-db-command.ts';
import type { PublicCliHost } from '../root/public-command-tree.ts';
import type { PublicCommandDependencies } from '../root/public-command-dependencies.ts';

/** Create the public database command group. */
export function createDbCommand(
  host: PublicCliHost,
  dependencies: PublicCommandDependencies,
): Command<any, any, any, any, any, any, any, any> {
  return new Command()
    .name('db')
    .description('Database lifecycle management')
    .action(function () {
      this.showHelp();
    })
    .command(
      'add',
      createDbAddCommand({
        resolvePath: host.resolvePath,
        addDbDependencies: dependencies.dbAddDependencies,
      }),
    )
    .command('list', createDbListCommand(dependencies.dbOperationDependencies))
    .command('remove', createDbRemoveCommand(dependencies))
    .command('init', createDbInitCommand(dependencies.dbOperationDependencies))
    .command('generate', createDbGenerateCommand(dependencies.dbOperationDependencies))
    .command('migrate', createDbMigrateCommand(dependencies.dbOperationDependencies))
    .command('seed', createDbSeedCommand(dependencies.dbOperationDependencies))
    .command('status', createDbStatusCommand(dependencies.dbOperationDependencies))
    .command('studio', createDbStudioCommand(dependencies.dbOperationDependencies))
    .command('introspect', createDbIntrospectCommand(dependencies.dbOperationDependencies))
    .command('reset', createDbResetCommand(dependencies.dbOperationDependencies))
    .command('deploy', createDbDeployCommand(dependencies.dbOperationDependencies))
    .command('validate', createDbValidateCommand(dependencies.dbOperationDependencies))
    .command('resolve', createDbResolveCommand(dependencies.dbOperationDependencies));
}
