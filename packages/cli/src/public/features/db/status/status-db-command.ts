import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';
/**
 * @module public/features/db/status/status-db-command
 */

import {
  DbOperationCommand,
  type DbOperationCommandDependencies,
} from '../operations/db-operation-command.ts';

/** Public `db status` command owner. */
export class StatusDbCommand extends DbOperationCommand {
  constructor(dependencies: DbOperationCommandDependencies) {
    super('status', 'Show migration status', dependencies);
  }
}

/** Create the public `db status` command. */
export function createDbStatusCommand(
  dependencies: DbOperationCommandDependencies,
): CliffyCommand {
  return new StatusDbCommand(dependencies).define();
}
