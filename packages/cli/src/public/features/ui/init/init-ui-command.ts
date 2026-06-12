import { Command } from "@cliffy/command";

import { outputText } from "../../../../kernel/presentation/output/default-output.ts";
import {
  DEFAULT_UI_INIT_ITEMS,
  installUiRegistryItems,
  type UiInstallDependencies,
} from "../registry.ts";
import { type ProjectRootResolver, requireProjectRoot } from "../../../presentation/support.ts";
import type { UiInitCommandInput } from "./init-ui-input.ts";

/** Dependencies for the public `ui:init` command handler. */
export interface UiInitCommandDependencies {
  /** Application dependencies for installing Fresh UI registry files. */
  readonly installDependencies: UiInstallDependencies;
  /** Resolve the project root from flags or environment. */
  readonly resolveProjectRoot: ProjectRootResolver;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Create the public `ui:init` command. */
export function createUiInitCommand(
  dependencies: UiInitCommandDependencies,
) {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name("ui:init")
    .description("Install the NetScript Fresh UI foundation into an app workspace")
    .option("--project-root <path:string>", "Project root directory")
    .option("--registry-root <path:string>", "Fresh UI package root override")
    .option("--theme <name:string>", "Theme registry item (defaults to the official theme)")
    .option("--force", "Overwrite existing copied UI files", { default: false })
    .action(async (options: UiInitCommandInput): Promise<void> => {
      const projectRoot = await requireProjectRoot(
        dependencies.resolveProjectRoot,
        options.projectRoot,
      );
      const result = await installUiRegistryItems({
        projectRoot,
        registryRoot: options.registryRoot,
        names: DEFAULT_UI_INIT_ITEMS,
        overwrite: options.force ?? false,
        theme: options.theme,
      }, dependencies.installDependencies);

      print(`Installed ${result.installedItems.length} Fresh UI registry items.`);
      print(`Copied ${result.copiedFiles.length} files.`);
      print(`Wrote ${result.stylesPath}.`);
      print(`Merged ${result.dependenciesMerged.length} deno.json imports.`);
    });
}
