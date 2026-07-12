import {
  createDbOperationCommand,
  type DbOperationCommandDependencies,
} from "../operations/db-operation-command.ts";
export function createDbDeployCommand(
  dependencies: DbOperationCommandDependencies,
) {
  return createDbOperationCommand(
    "deploy",
    "Apply pending migrations without creating one",
    dependencies,
  );
}
