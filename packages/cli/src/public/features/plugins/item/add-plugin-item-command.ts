import { Command } from "@cliffy/command";
import { join } from "@std/path";
import { toFileUrl } from "@std/path/to-file-url";
import type { PluginCliEntrypoint } from "@netscript/plugin/adapter";
import { RemoteError } from "../../../../kernel/domain/errors/cli-exit-error.ts";
import { outputText } from "../../../../kernel/presentation/output/default-output.ts";
import { requireProjectRoot } from "../../../presentation/support.ts";
import type { PublicCommandDependencies } from "../../root/public-command-dependencies.ts";
import { resolveWalkerEmissions } from "../host/trigger-walker.ts";

interface AddPluginItemOptions {
  readonly projectRoot?: string;
}

/** Internal normalized target for `plugin <name> add <item>`. */
export function createAddPluginItemCommand(
  dependencies: PublicCommandDependencies,
) {
  return new Command().name("item-add").description(
    "Scaffold an item with a custom plugin",
  )
    .arguments("<name:string> <item:string> [...args:string]")
    .option("--project-root <path:string>", "Project root directory")
    .action(
      async (
        options: AddPluginItemOptions,
        name: string,
        item: string,
        ...args: string[]
      ) => {
        const projectRoot = await requireProjectRoot(
          dependencies.resolveProjectRoot,
          options.projectRoot,
        );
        const cliPath = join(projectRoot, "plugins", name, "cli.ts");
        if (!await dependencies.fs.exists(cliPath)) {
          throw new RemoteError(
            69,
            `Custom plugin "${name}" does not expose ${cliPath}.`,
          );
        }
        const module = await import(toFileUrl(cliPath).href) as {
          default?: PluginCliEntrypoint;
        };
        if (typeof module.default !== "function") {
          throw new RemoteError(
            69,
            `Plugin ${name} CLI has no default entrypoint.`,
          );
        }
        const result = await module.default({
          command: "add",
          values: [item, ...args],
        });
        if (result.code !== 0) {
          throw new RemoteError(
            result.code,
            result.message ??
              `Plugin item scaffolding failed: ${name} add ${item}`,
          );
        }
        const generator =
          dependencies.generatePluginRegistriesCommandDependencies;
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
        if (result.message) outputText(result.message);
        outputText(`Generated ${emissions.length} plugin registries.`);
      },
    );
}
