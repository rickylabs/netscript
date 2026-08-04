import { Command } from "@cliffy/command";
import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import type { AgentMcpInput } from "./agent-mcp-input.ts";

/** Dependencies for `netscript agent mcp`. */
export interface AgentMcpCommandDependencies {
  readonly resolvePath: (path?: string) => string;
  readonly run: (input: AgentMcpInput) => Promise<void>;
  readonly isInteractive?: () => boolean;
  readonly writeGuidance?: (message: string) => void;
}

/** Human-facing explanation used only when stdin is a terminal. */
export const AGENT_MCP_INTERACTIVE_GUIDANCE = `NetScript MCP uses the stdio transport.

This command is started by your editor or MCP client; it is not meant to be run by hand.
Run "netscript agent init --editor zed" or "netscript agent init --editor vscode", or copy one of these entries:

Zed (.zed/settings.json → context_servers):
"netscript": { "command": "netscript", "args": ["agent", "mcp"] }

VS Code (.vscode/mcp.json → servers):
"netscript": { "type": "stdio", "command": "netscript", "args": ["agent", "mcp"] }

Client configuration: https://netscript.dev/ai/agent-tooling/
`;

/** Create the stdio MCP server command. */
export function createAgentMcpCommand(
  dependencies: AgentMcpCommandDependencies,
): CliffyCommand {
  return new Command()
    .name("mcp")
    .description(
      "Start the stdio MCP server for an MCP client; configuration: https://netscript.dev/ai/agent-tooling/",
    )
    .option("--endpoint <url:string>", "Telemetry endpoint URL")
    .option("--project-root <path:string>", "NetScript project root")
    .option("--docs-root <path:string>", "Public NetScript documentation root")
    .action(
      async (
        options: { endpoint?: string; projectRoot?: string; docsRoot?: string },
      ): Promise<void> => {
        const isInteractive = dependencies.isInteractive ?? (() => Deno.stdin.isTerminal());
        if (isInteractive()) {
          (dependencies.writeGuidance ?? console.error)(AGENT_MCP_INTERACTIVE_GUIDANCE);
          return;
        }
        const projectRoot = dependencies.resolvePath(options.projectRoot);
        await dependencies.run({
          endpoint: options.endpoint,
          projectRoot,
          docsRoot: options.docsRoot
            ? dependencies.resolvePath(options.docsRoot)
            : undefined,
        });
      },
    );
}
