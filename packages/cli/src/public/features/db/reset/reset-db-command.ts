import { Command } from '@cliffy/command';
/**
 * @module public/features/db/reset/reset-db-command
 */

import {
  DbOperationCommand,
  type DbOperationCommandDependencies,
} from '../operations/db-operation-command.ts';

/** Public `db reset` command owner. */
export class ResetDbCommand extends DbOperationCommand {
  constructor(dependencies: DbOperationCommandDependencies) {
    super('reset', 'Reset database schema and data', dependencies);
  }
}

/** Create the public `db reset` command. */
export function createDbResetCommand(dependencies: DbOperationCommandDependencies) : Command<any, any, any, any, any, any, any, any> {
  return new ResetDbCommand(dependencies).define();
}
