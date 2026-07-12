import {
  createDbOperationCommand,
  type DbOperationCommandDependencies,
} from "../operations/db-operation-command.ts";
export function createDbValidateCommand(
  dependencies: DbOperationCommandDependencies,
) {
  return createDbOperationCommand(
    "validate",
    "Validate database schemas",
    dependencies,
  );
}
