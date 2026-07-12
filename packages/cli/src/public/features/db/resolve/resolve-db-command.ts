import { Command } from "@cliffy/command";
import {
  type DbOperationCommandDependencies,
  exitWithCode,
  runDbOperation,
} from "../operations/db-operation-command.ts";
import { UsageError } from "../../../../kernel/domain/errors/cli-exit-error.ts";

interface ResolveDbOptions {
  readonly db?: string;
  readonly projectRoot?: string;
  readonly applied?: string;
  readonly rolledBack?: string;
}

/** Create `db resolve` for marking a failed migration applied or rolled back. */
export function createDbResolveCommand(
  dependencies: DbOperationCommandDependencies,
) {
  return new Command().name("resolve").description(
    "Resolve migration history state",
  )
    .option("--db <target:string>", "Database target")
    .option("--project-root <path:string>", "Project root directory")
    .option("--applied <migration:string>", "Mark migration as applied")
    .option("--rolled-back <migration:string>", "Mark migration as rolled back")
    .action(async (options: ResolveDbOptions): Promise<void> => {
      if (!!options.applied === !!options.rolledBack) {
        throw new UsageError(
          2,
          "Specify exactly one of --applied or --rolled-back.",
        );
      }
      const operation = options.applied
        ? "resolve-applied"
        : "resolve-rolled-back";
      const code = await runDbOperation(operation, {
        ...options,
        migrationName: options.applied ?? options.rolledBack,
      }, dependencies.cwd);
      exitWithCode(code);
    });
}
