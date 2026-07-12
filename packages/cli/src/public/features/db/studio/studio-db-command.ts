import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';
/**
 * @module public/features/db/studio/studio-db-command
 */

import {
  DbOperationCommand,
  type DbOperationCommandDependencies,
} from '../operations/db-operation-command.ts';

/** Public `db studio` command owner. */
export class StudioDbCommand extends DbOperationCommand {
  constructor(dependencies: DbOperationCommandDependencies) {
    super('studio', 'Open Prisma Studio', dependencies);
  }
}

/** Create the public `db studio` command. */
export function createDbStudioCommand(
  dependencies: DbOperationCommandDependencies,
): CliffyCommand {
  return new StudioDbCommand(dependencies).define();
}
