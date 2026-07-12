/** Host command that forwards `plugin ai ...` to the AI plugin CLI. */

import { Command } from "@cliffy/command";
import { CliCommand } from "../../../../kernel/application/abstracts/cli-command.ts";
import type { ProcessPort } from "../../../../kernel/ports/process-port.ts";
import { outputText } from "../../../../kernel/presentation/output/default-output.ts";
import type { ProjectRootResolver } from "../../../presentation/support.ts";
import { requireProjectRoot } from "../../../presentation/support.ts";

const AI_CLI_SPECIFIER = "jsr:@netscript/plugin-ai/cli";

/** Dependencies for the AI plugin-owned command group. */
export interface AiPluginCommandDependencies {
  readonly resolveProjectRoot: ProjectRootResolver;
  readonly processRunner: ProcessPort;
  readonly dispatch?: (
    args: readonly string[],
    options: {
      readonly projectRoot: string;
      readonly processRunner: ProcessPort;
    },
  ) => Promise<
    { readonly code: number; readonly stdout: string; readonly stderr: string }
  >;
  readonly print?: (message: string, stream?: "stdout" | "stderr") => void;
}

/** Forward arbitrary AI lifecycle verbs to `@netscript/plugin-ai/cli`. */
export class AiPluginCommand extends CliCommand<Command> {
  readonly id = "plugin.ai";

  constructor(private readonly dependencies: AiPluginCommandDependencies) {
    super();
  }

  /** Build the `plugin ai` command. */
  define(): Command<any, any, any, any, any, any, any, any> {
    const dispatch = this.dependencies.dispatch ?? dispatchAiPluginCommand;
    const print = this.dependencies.print ?? outputText;
    return new Command()
      .name("ai")
      .description(
        "Configure AI tools, agents, models, providers, and MCP servers",
      )
      .useRawArgs()
      .action(async (_options: void, ...rawArgs: string[]) => {
        const { projectRoot: requestedRoot, args: forwarded } =
          extractProjectRoot(rawArgs);
        const [verb, ...args] = forwarded;
        if (!verb) throw new TypeError("Usage: plugin ai <verb> [...args]");
        const projectRoot = await requireProjectRoot(
          this.dependencies.resolveProjectRoot,
          requestedRoot,
        );
        const result = await dispatch([verb, ...args], {
          projectRoot,
          processRunner: this.dependencies.processRunner,
        });
        if (result.stdout) print(result.stdout, "stdout");
        if (result.stderr) print(result.stderr, "stderr");
        if (result.code !== 0) {
          throw new Error(`AI plugin command failed with code ${result.code}.`);
        }
      }) as unknown as Command;
  }
}

function extractProjectRoot(rawArgs: readonly string[]): {
  readonly projectRoot?: string;
  readonly args: readonly string[];
} {
  const args: string[] = [];
  let projectRoot: string | undefined;
  for (let index = 0; index < rawArgs.length; index++) {
    const value = rawArgs[index];
    if (value === "--project-root") {
      projectRoot = rawArgs[++index];
    } else if (value.startsWith("--project-root=")) {
      projectRoot = value.slice("--project-root=".length);
    } else {
      args.push(value);
    }
  }
  return { projectRoot, args };
}

/** Execute the published AI adapter CLI in the selected project. */
export async function dispatchAiPluginCommand(
  args: readonly string[],
  options: {
    readonly projectRoot: string;
    readonly processRunner: ProcessPort;
  },
): Promise<
  { readonly code: number; readonly stdout: string; readonly stderr: string }
> {
  return await options.processRunner.exec(
    "deno",
    ["x", "-A", AI_CLI_SPECIFIER, ...args],
    { cwd: options.projectRoot },
  );
}

/** Create the public `plugin ai` command. */
export function createAiPluginCommand(
  dependencies: AiPluginCommandDependencies,
): Command<any, any, any, any, any, any, any, any> {
  return new AiPluginCommand(dependencies).define();
}
