import { Command } from "@cliffy/command";
import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { outputText } from "../../../../kernel/presentation/output/default-output.ts";
import {
  AGENT_HOSTS,
  type AgentHost,
  type InitAgentInput,
  type InitAgentResult,
} from "./init-agent-input.ts";
import { describeAgentInitResolution } from "./hosts/agent-host-resolution.ts";
import {
  EDITOR_CHOICES,
  type EditorChoice,
} from '../../../../kernel/domain/scaffold/workspace-config.ts';

const HOST_CHOICES: readonly (AgentHost | "all")[] = [...AGENT_HOSTS, "all"];

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
    .option(
      "--host <host:string>",
      `Agent host: ${HOST_CHOICES.join(", ")}; detected from the project, then the environment, when omitted`,
    )
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
      if (options.host && !HOST_CHOICES.includes(options.host as AgentHost | "all")) {
        throw new Error(
          `Unsupported agent host: ${options.host}. Supported hosts: ${HOST_CHOICES.join(", ")}.`,
        );
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
      for (const line of describeAgentInitResolution(result.resolution)) outputText(line);
      for (const message of result.messages) outputText(message);
    });
}
