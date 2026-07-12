import { join, resolve } from "@std/path";
import { Command } from "@cliffy/command";
import { DenoFileSystem } from "../../../../kernel/adapters/runtime/file-system/deno-file-system.ts";
import { DbWorkspaceResolver } from "../../../../kernel/adapters/database/workspace-resolver.ts";
import { outputText } from "../../../../kernel/presentation/output/default-output.ts";
import type { PublicCommandDependencies } from "../../root/public-command-dependencies.ts";

interface RemoveDbOptions {
  readonly projectRoot?: string;
  readonly purge?: boolean;
}

/** Create `db remove`, preserving shared engine workspaces unless they are unused. */
export function createDbRemoveCommand(dependencies: PublicCommandDependencies) {
  return new Command().name("remove").description(
    "Deregister a database target",
  )
    .arguments("<configKey:string>")
    .option("--project-root <path:string>", "Project root directory")
    .option(
      "--purge",
      "Delete the database workspace when no target still uses it",
      { default: false },
    )
    .action(
      async (options: RemoveDbOptions, configKey: string): Promise<void> => {
        const projectRoot = resolve(
          options.projectRoot ?? dependencies.dbOperationDependencies.cwd(),
        );
        const fs = new DenoFileSystem();
        const resolver = new DbWorkspaceResolver(fs, dependencies.dbRegistry);
        const databases = await resolver.discoverDatabases(projectRoot);
        const database = databases.find((entry) =>
          entry.configKey === configKey
        );
        if (!database) throw new Error(`Unknown database target: ${configKey}`);
        await dependencies.dbAddDependencies.workspaceMutator
          .removeDatabaseFromAppsettings(projectRoot, configKey);
        const remaining = databases.filter((entry) =>
          entry.configKey !== configKey
        );
        if (
          options.purge &&
          !remaining.some((entry) =>
            entry.workspaceDir === database.workspaceDir
          )
        ) {
          const provider = dependencies.dbRegistry.get(database.engine);
          const workspace = join(projectRoot, database.workspaceDir);
          if (await fs.exists(workspace)) await fs.remove(workspace);
          await dependencies.dbAddDependencies.workspaceMutator
            .removeDatabaseWorkspaceMember(projectRoot, provider.dirName);
        }
        await dependencies.dbAddDependencies.workspaceMutator
          .regenerateAspireConfig(projectRoot);
        await dependencies.dbAddDependencies.workspaceMutator
          .regenerateAppHostHelpers(projectRoot);
        outputText(
          `Removed database ${configKey}${
            options.purge ? " (purge requested)" : ""
          }.`,
        );
      },
    );
}
