import { Command } from '@cliffy/command';
/**
 * @module public/features/db/introspect/introspect-db-command
 */

import {
  DbOperationCommand,
  type DbOperationCommandDependencies,
} from '../operations/db-operation-command.ts';

/** Public `db introspect` command owner. */
export class IntrospectDbCommand extends DbOperationCommand {
  constructor(dependencies: DbOperationCommandDependencies) {
    super('introspect', 'Introspect database schema', dependencies);
  }
}

/** Create the public `db introspect` command. */
export function createDbIntrospectCommand(
  dependencies: DbOperationCommandDependencies,
): Command<any, any, any, any, any, any, any, any> {
  return new IntrospectDbCommand(dependencies).define();
}
