import { Command } from "@cliffy/command";

import { outputText } from "../../../../kernel/presentation/output/default-output.ts";
import { installUiRegistryItems, type UiInstallDependencies } from "../registry.ts";
import { type ProjectRootResolver, requireProjectRoot } from "../../../presentation/support.ts";
import type { UiAddCommandInput } from "./add-ui-input.ts";
import { scaffoldUiIsland, scaffoldUiPage } from '../../../../kernel/application/ui/web-scaffold.ts';

/** Dependencies for the public `ui:add` command handler. */
export interface UiAddCommandDependencies {
  /** Application dependencies for installing Fresh UI registry files. */
  readonly installDependencies: UiInstallDependencies;
  /** Resolve the project root from flags or environment. */
  readonly resolveProjectRoot: ProjectRootResolver;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Create the public `ui:add <item|collection>` command. */
export function createUiAddCommand(
  dependencies: UiAddCommandDependencies,
) {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name("ui:add")
    .description("Add a Fresh page, island, registry item, or collection")
    .arguments("<kind:string> [name:string]")
    .option("--project-root <path:string>", "Project root directory")
    .option("--registry-root <path:string>", "Fresh UI package root override")
    .option("--theme <name:string>", "Theme registry item (defaults to the official theme)")
    .option("--force", "Overwrite existing copied UI files", { default: false })
    .option("--route <id:string>", "Typed route id override")
    .option("--island", "Add a colocated hydrating island", { default: false })
    .option("--query", "Use the query-aware island template", { default: false })
    .action(async (options: UiAddCommandInput & { route?: string; island?: boolean; query?: boolean }, kind: string, name?: string): Promise<void> => {
      const projectRoot = await requireProjectRoot(
        dependencies.resolveProjectRoot,
        options.projectRoot,
      );
      if (kind === 'page') {
        if (!name) throw new Error('ui:add page requires <path>.');
        const result = await scaffoldUiPage({ projectRoot, path: name, route: options.route, island: options.island }, dependencies.installDependencies.fs);
        print(`Generated ${result.files.length} Fresh page files.`);
        return;
      }
      if (kind === 'island') {
        if (!name) throw new Error('ui:add island requires <Name>.');
        const result = await scaffoldUiIsland({ projectRoot, name, query: options.query }, dependencies.installDependencies.fs);
        print(`Generated ${result.files.length} Fresh island file.`);
        return;
      }
      const result = await installUiRegistryItems({
        projectRoot,
        registryRoot: options.registryRoot,
        names: [kind],
        overwrite: options.force ?? false,
        theme: options.theme,
      }, dependencies.installDependencies);

      print(`Installed ${result.installedItems.length} Fresh UI registry items.`);
      print(`Copied ${result.copiedFiles.length} files.`);
      print(`Wrote ${result.stylesPath}.`);
      print(`Merged ${result.dependenciesMerged.length} deno.json imports.`);
    });
}
