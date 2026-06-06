/**
 * @module public/features/db/init/init-db-command
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

/** Public `db init` command owner. */
export class InitDbCommand extends CliCommand<AnyCliffyCommand> {
  readonly id = 'public.db.init';

  constructor(private readonly dependencies: DbOperationCommandDependencies) {
    super();
  }

  define(): AnyCliffyCommand {
    return new Command()
      .name('init')
      .description('Create and apply the initial Prisma migration')
      .option('--db <target:string>', 'Database target (config key, database name, or "all")')
      .option('--project-root <path:string>', 'Project root directory')
      .option('--name <name:string>', 'Initial migration name', { default: 'init' })
      .action(async (options: {
        readonly db?: string;
        readonly projectRoot?: string;
        readonly name?: string;
      }): Promise<void> => {
        const code = await runDbOperation('init', {
          ...options,
          migrationName: options.name ?? 'init',
        }, this.dependencies.cwd);
        exitWithCode(code);
      });
  }
}

/** Create the public `db init` command. */
export function createDbInitCommand(dependencies: DbOperationCommandDependencies) : Command<any, any, any, any, any, any, any, any> {
  return new InitDbCommand(dependencies).define();
}
