import { resolve } from "@std/path";
import { Command } from "@cliffy/command";
import { DenoFileSystem } from "../../../../kernel/adapters/runtime/file-system/deno-file-system.ts";
import { DbWorkspaceResolver } from "../../../../kernel/adapters/database/workspace-resolver.ts";
import { outputText } from "../../../../kernel/presentation/output/default-output.ts";
import type { DbOperationCommandDependencies } from "../operations/db-operation-command.ts";

interface ListDbOptions {
  readonly projectRoot?: string;
  readonly json?: boolean;
}

/** Create `db list`, including the stable dashboard JSON projection. */
export function createDbListCommand(
  dependencies: DbOperationCommandDependencies,
) {
  return new Command().name("list").description(
    "List registered database targets",
  )
    .option("--project-root <path:string>", "Project root directory")
    .option("--json", "Emit machine-readable JSON", { default: false })
    .action(async (options: ListDbOptions): Promise<void> => {
      const projectRoot = resolve(options.projectRoot ?? dependencies.cwd());
      const databases = await new DbWorkspaceResolver(new DenoFileSystem())
        .discoverDatabases(projectRoot);
      const rows = databases.map((
        { configKey, engine, databaseName, enabled },
      ) => ({
        configKey,
        engine,
        databaseName,
        enabled,
        migrationState: enabled ? "unknown" : "disabled",
      }));
      if (options.json) outputText(JSON.stringify(rows));
      else {for (const row of rows) {
          outputText(
            `${row.configKey}\t${row.engine}\t${row.databaseName}\t${
              row.enabled ? "enabled" : "disabled"
            }\t${row.migrationState}`,
          );
        }}
    });
}
