/**
 * @module public/features/db/migrate/migrate-db-command
 */

import { Command } from '@cliffy/command';
import { CliCommand } from '../../../../kernel/application/abstracts/cli-command.ts';
import {
  type DbOperationCommandDependencies,
  exitWithCode,
  runDbOperation,
} from '../operations/db-operation-command.ts';

// deno-lint-ignore no-explicit-any
type AnyCliffyCommand = Command<any, any, any, any, any, any, any, any>;

/** Public `db migrate` command owner. */
export class MigrateDbCommand extends CliCommand<AnyCliffyCommand> {
  readonly id = 'public.db.migrate';

  constructor(private readonly dependencies: DbOperationCommandDependencies) {
    super();
  }

  define(): AnyCliffyCommand {
    return new Command()
      .name('migrate')
      .description('Create and apply a Prisma migration')
      .option('--db <target:string>', 'Database target (config key, database name, or "all")')
      .option('--project-root <path:string>', 'Project root directory')
      .option('--name <name:string>', 'Migration name')
      .action(async (options: {
        readonly db?: string;
        readonly projectRoot?: string;
        readonly name?: string;
      }): Promise<void> => {
        const code = await runDbOperation('migrate', {
          db: options.db,
          projectRoot: options.projectRoot,
          migrationName: options.name,
        }, this.dependencies.cwd);
        exitWithCode(code);
      });
  }
}

/** Create the public `db migrate` command. */
export function createDbMigrateCommand(dependencies: DbOperationCommandDependencies) : Command<any, any, any, any, any, any, any, any> {
  return new MigrateDbCommand(dependencies).define();
}
