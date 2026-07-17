import { Command } from "@cliffy/command";
import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { outputText } from "../../../../kernel/presentation/output/default-output.ts";
import type { InitAgentInput, InitAgentResult } from "./init-agent-input.ts";

/** Dependencies for `netscript agent init`. */
export interface InitAgentCommandDependencies {
  readonly projectRoot: () => string;
  readonly init: (input: InitAgentInput) => Promise<InitAgentResult>;
}

/** Create the public agent integration installer command. */
export function createInitAgentCommand(
  dependencies: InitAgentCommandDependencies,
): CliffyCommand {
  return new Command()
    .name("init")
    .description("Install NetScript MCP and skills for detected agent hosts")
    .option("--host <host:string>", "Agent host: claude, vscode, or all")
    .action(async (options: { host?: string }): Promise<void> => {
      if (options.host && !["claude", "vscode", "all"].includes(options.host)) {
        throw new Error(`Unsupported agent host: ${options.host}`);
      }
      const result = await dependencies.init({
        projectRoot: dependencies.projectRoot(),
        host: options.host as InitAgentInput["host"],
      });
      outputText(
        result.changedFiles.length === 0
          ? "NetScript agent integration is already current."
          : `Installed NetScript agent integration for ${
            result.hosts.join(", ")
          }.`,
      );
    });
}
