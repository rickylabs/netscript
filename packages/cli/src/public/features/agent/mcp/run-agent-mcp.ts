import { SpawnCommandExecutor } from "@netscript/mcp";
import { type McpCliOptions, runMcpStdioServer } from "@netscript/mcp/cli";
import { resolve } from "@std/path";
import type { PublicCommandDependencies } from "../../root/public-command-dependencies.ts";
import { createPublicCommandRegistry } from "../../root/public-command-tree.ts";
import type { AgentMcpInput } from "./agent-mcp-input.ts";
import {
  CliProjectDoctor,
  PublicCliCommandCatalog,
} from "./cli-mcp-adapters.ts";

/** Start the batteries-included MCP server with real CLI adapters. */
export async function runAgentMcp(
  input: AgentMcpInput,
  dependencies: PublicCommandDependencies,
): Promise<void> {
  await runMcpStdioServer(createAgentMcpOptions(input, dependencies));
}

/** Build MCP CLI options from public NetScript CLI dependencies. */
export function createAgentMcpOptions(
  input: AgentMcpInput,
  dependencies: PublicCommandDependencies,
): McpCliOptions {
  const registry = createPublicCommandRegistry();
  const program = registry.program({
    name: "netscript",
    version: "current",
    description: "NetScript CLI",
    context: {
      dependencies,
      host: {
        cwd: () => input.projectRoot,
        resolvePath: (path?: string) => resolve(input.projectRoot, path ?? "."),
      },
    },
  });
  return {
    endpoint: input.endpoint,
    projectRoot: input.projectRoot,
    docsRoot: input.docsRoot,
    commandCatalog: new PublicCliCommandCatalog(program),
    commandExecutor: new SpawnCommandExecutor(),
    projectDoctor: new CliProjectDoctor(
      dependencies.pluginDoctorDependencies.doctor,
    ),
  };
}
