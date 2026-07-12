import { Command } from "@cliffy/command";
import type { AgentMcpInput } from "./agent-mcp-input.ts";

/** Dependencies for `netscript agent mcp`. */
export interface AgentMcpCommandDependencies {
  readonly resolvePath: (path?: string) => string;
  readonly run: (input: AgentMcpInput) => Promise<void>;
}

/** Create the stdio MCP server command. */
export function createAgentMcpCommand(
  dependencies: AgentMcpCommandDependencies,
): Command<any, any, any, any, any, any, any, any> {
  return new Command()
    .name("mcp")
    .description("Start the NetScript MCP server over standard input/output")
    .option("--endpoint <url:string>", "Telemetry endpoint URL")
    .option("--project-root <path:string>", "NetScript project root")
    .option("--docs-root <path:string>", "Public NetScript documentation root")
    .action(
      async (
        options: { endpoint?: string; projectRoot?: string; docsRoot?: string },
      ): Promise<void> => {
        const projectRoot = dependencies.resolvePath(options.projectRoot);
        await dependencies.run({
          endpoint: options.endpoint,
          projectRoot,
          docsRoot: options.docsRoot
            ? dependencies.resolvePath(options.docsRoot)
            : undefined,
        });
      },
    ) as unknown as Command<any, any, any, any, any, any, any, any>;
}
