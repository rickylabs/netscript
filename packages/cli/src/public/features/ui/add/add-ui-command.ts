import { Command } from "@cliffy/command";

import { outputText } from "../../../../kernel/presentation/output/default-output.ts";
import { installUiRegistryItems, type UiInstallDependencies } from "../registry.ts";
import { type UiAppRootResolver, requireUiAppRoot } from "../../../presentation/support.ts";
import type { UiAddCommandInput } from "./add-ui-input.ts";
import {
  scaffoldUiIsland,
  scaffoldUiPage,
  type UiGeneratedFileRole,
  type UiScaffoldResult,
} from '../../../../kernel/application/ui/web-scaffold.ts';

/** Semantic roles emitted by the public data-screen scaffold. */
export const UI_DATA_SCREEN_FILE_ROLES = [
  'page',
  'query-loader',
  'island',
  'route-registration',
] as const satisfies readonly UiGeneratedFileRole[];

const DATA_SCREEN_HELP =
  `Data-screen roles: ${UI_DATA_SCREEN_FILE_ROLES.join(', ')}. New island output uses routes/**/(_islands)/; existing top-level islands remain compatible.`;

/** Dependencies for the public `ui:add` command handler. */
export interface UiAddCommandDependencies {
  /** Application dependencies for installing Fresh UI registry files. */
  readonly installDependencies: UiInstallDependencies;
  /** Resolve the Fresh application root from flags or environment. */
  readonly resolveUiAppRoot: UiAppRootResolver;
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
    .description(
      `Scaffold a Fresh data screen or copy an app-owned UI registry item. ${DATA_SCREEN_HELP}`,
    )
    .example(
      "Data-screen triad",
      "netscript ui:add page incidents --island\nCreates one data-screen unit: typed page route + colocated hydrating island + query loader. Use it when a route will load data and hydrate an interactive region.",
    )
    .example(
      "Registry item",
      "netscript ui:add data-table\nUse a registry item when the route already exists and you only need an app-owned component and its styles.",
    )
    .arguments("<kind:string> [name:string]")
    .option("--project-root <path:string>", "Project root directory")
    .option("--app <name:string>", "Fresh app workspace name")
    .option("--registry-root <path:string>", "Fresh UI package root override")
    .option("--theme <name:string>", "Theme registry item (defaults to the official theme)")
    .option("--force", "Overwrite existing copied UI or scaffold files", { default: false })
    .option(
      '--dry-run',
      'For page and island scaffolds, report the complete file plan without writing it',
      { default: false },
    )
    .option("--route <id:string>", "Override the generated page's typed route id")
    .option(
      "--island",
      "For page scaffolds, add the colocated hydrating island and query-loader parts of the triad",
      { default: false },
    )
    .option(
      "--query",
      "For island scaffolds, generate a QueryIsland-based surface for contract-derived queries",
      { default: false },
    )
    .action(async (options: UiAddCommandInput, kind: string, name?: string): Promise<void> => {
      const projectRoot = await requireUiAppRoot(
        dependencies.resolveUiAppRoot,
        { projectRoot: options.projectRoot, app: options.app },
      );
      if (kind === 'page') {
        if (!name) throw new Error('ui:add page requires <path>.');
        const result = await scaffoldUiPage({
          projectRoot,
          path: name,
          route: options.route,
          island: options.island,
          force: options.force,
          dryRun: options.dryRun,
        }, dependencies.installDependencies.fs);
        reportScaffold(result, options.dryRun ?? false, print);
        return;
      }
      if (kind === 'island') {
        if (!name) throw new Error('ui:add island requires <Name>.');
        const result = await scaffoldUiIsland({
          projectRoot,
          name,
          query: options.query,
          force: options.force,
          dryRun: options.dryRun,
        }, dependencies.installDependencies.fs);
        reportScaffold(result, options.dryRun ?? false, print);
        return;
      }
      if (options.dryRun) {
        throw new Error('--dry-run is supported only for page and island scaffolds.');
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

function reportScaffold(
  result: UiScaffoldResult,
  dryRun: boolean,
  print: (message: string) => void,
): void {
  const verb = dryRun ? 'Planned' : 'Generated';
  for (const file of result.files) print(`${verb} ${file.role}: ${file.path}`);
}
