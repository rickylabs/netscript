import { Command } from '@cliffy/command';
/**
 * @module public/features/db/seed/seed-db-command
 */

import {
  DbOperationCommand,
  type DbOperationCommandDependencies,
} from '../operations/db-operation-command.ts';

/** Public `db seed` command owner. */
export class SeedDbCommand extends DbOperationCommand {
  constructor(dependencies: DbOperationCommandDependencies) {
    super('seed', 'Seed database data', dependencies);
  }
}

/** Create the public `db seed` command. */
export function createDbSeedCommand(
  dependencies: DbOperationCommandDependencies,
): Command<any, any, any, any, any, any, any, any> {
  return new SeedDbCommand(dependencies).define();
}
