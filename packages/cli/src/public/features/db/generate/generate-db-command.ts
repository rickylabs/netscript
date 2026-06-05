/**
 * @module public/features/db/generate/generate-db-command
 */

import {
  DbOperationCommand,
  type DbOperationCommandDependencies,
} from '../operations/db-operation-command.ts';

/** Public `db generate` command owner. */
export class GenerateDbCommand extends DbOperationCommand {
  constructor(dependencies: DbOperationCommandDependencies) {
    super('generate', 'Generate Prisma client and Zod schemas', dependencies);
  }
}

/** Create the public `db generate` command. */
export function createDbGenerateCommand(dependencies: DbOperationCommandDependencies) {
  return new GenerateDbCommand(dependencies).define();
}
