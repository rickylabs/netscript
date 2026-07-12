/** Host-owned installed-name plugin update and regeneration flow. */
import { Command } from "@cliffy/command";
import { join } from "@std/path";
import { outputText } from "../../../../kernel/presentation/output/default-output.ts";
import {
  type ProjectRootResolver,
  requireProjectRoot,
} from "../../../presentation/support.ts";
import {
  installPlugin,
  type InstallPluginDependencies,
} from "../install/install-plugin.ts";
import { resolveWalkerEmissions } from "../host/trigger-walker.ts";
import type { GeneratePluginRegistriesCommandDependencies } from "../../generate/plugins/generate-plugin-registries-command.ts";

export interface UpdatePluginCommandDependencies {
  readonly resolveProjectRoot: ProjectRootResolver;
  readonly installPluginDependencies: InstallPluginDependencies;
  readonly registryDependencies: GeneratePluginRegistriesCommandDependencies;
  readonly print?: (message: string) => void;
}

interface UpdateOptions {
  readonly projectRoot?: string;
}

/** Create `plugin update <installed-name>`. */
export function createUpdatePluginCommand(
  dependencies: UpdatePluginCommandDependencies,
) {
  const print = dependencies.print ?? outputText;
  return new Command().name("update").description(
    "Re-pin and regenerate an installed plugin",
  )
    .arguments("<name:string>")
    .option("--project-root <path:string>", "Project root directory")
    .action(async (options: UpdateOptions, name: string): Promise<void> => {
      const projectRoot = await requireProjectRoot(
        dependencies.resolveProjectRoot,
        options.projectRoot,
      );
      const result = await installPlugin({
        kind: name,
        pluginName: name,
        serviceReferences: [],
        pluginReferences: [],
        noDb: false,
        includeSamples: false,
        skipConfirmation: true,
        ci: true,
        projectRoot,
        overwrite: true,
      }, dependencies.installPluginDependencies);
      const generator = dependencies.registryDependencies;
      const emissions = await resolveWalkerEmissions({
        projectRoot,
        walker: generator.walker,
        extractor: generator.extractor,
        emitter: generator.emitter,
      });
      for (const emission of emissions) {
        await generator.fs.writeFile(
          join(projectRoot, emission.path),
          emission.text,
        );
      }
      const version = result.resolvedPlugin?.version ?? "local";
      print(
        `Updated ${name} to ${version}; generated ${emissions.length} registries.`,
      );
    });
}
