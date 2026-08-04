import { Command } from "@cliffy/command";
import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { outputText } from "../../../../kernel/presentation/output/default-output.ts";
import type { InitAgentInput, InitAgentResult } from "./init-agent-input.ts";
import {
  EDITOR_CHOICES,
  type EditorChoice,
} from '../../../../kernel/domain/scaffold/workspace-config.ts';

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
    .description("Install NetScript MCP, consumer tools, and skills for detected agent hosts")
    .option("--host <host:string>", "Agent host: claude, vscode, or all")
    .option(
      '--editor <editor:string>',
      `Apply editor config and MCP wiring: ${EDITOR_CHOICES.join(', ')}`,
    )
    .option(
      "--with-docs",
      "Install the several-megabyte offline framework and exact-version API documentation bundle",
    )
    .action(async (options: {
      host?: string;
      editor?: string;
      withDocs?: boolean;
    }): Promise<void> => {
      if (options.host && !["claude", "vscode", "all"].includes(options.host)) {
        throw new Error(`Unsupported agent host: ${options.host}`);
      }
      const editor = options.editor?.toLowerCase() as EditorChoice | undefined;
      if (editor && !EDITOR_CHOICES.includes(editor)) {
        throw new Error(
          `Unsupported editor: ${options.editor}. Supported editors: ${EDITOR_CHOICES.join(', ')}. ` +
            'Use --editor none and configure MCP manually for another editor.',
        );
      }
      const result = await dependencies.init({
        projectRoot: dependencies.projectRoot(),
        host: options.host as InitAgentInput["host"],
        editor,
        withDocs: options.withDocs,
      });
      outputText(
        result.changedFiles.length === 0
          ? "NetScript agent integration is already current."
          : `Installed NetScript agent integration for ${
            result.hosts.join(", ")
          }.`,
      );
      for (const message of result.messages) outputText(message);
    });
}
