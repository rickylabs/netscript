import { Command } from "@cliffy/command";
import type { CliffyCommand } from "../../../kernel/presentation/command-types.ts";
import type { PublicCliHost } from "../root/public-command-tree.ts";
import type { PublicCommandDependencies } from "../root/public-command-dependencies.ts";
import { DenoAgentInitFileSystem } from "./init/agent-init-file-system.ts";
import { DenoAspireAgentInitializer } from "../../adapters/agent/deno-aspire-agent-initializer.ts";
import { DenoAgentDocsGenerator } from "../../adapters/agent/deno-agent-docs-generator.ts";
import { initAgent } from "./init/init-agent.ts";
import { createInitAgentCommand } from "./init/init-agent-command.ts";
import { createAgentMcpCommand } from "./mcp/agent-mcp-command.ts";
import { runAgentMcp } from "./mcp/run-agent-mcp.ts";
import { createRecordDriftCommand } from "./drift/record-drift-command.ts";

/** Create the public agent tooling command group. */
export function createAgentCommand(
  host: PublicCliHost,
  dependencies: PublicCommandDependencies,
): CliffyCommand {
  const fs = new DenoAgentInitFileSystem();
  const aspireAgentInitializer = new DenoAspireAgentInitializer();
  const docsGenerator = new DenoAgentDocsGenerator();
  return new Command()
    .name("agent")
    .description("Install and run NetScript agent tooling")
    .action(function () {
      this.showHelp();
    })
    .command(
      "mcp",
      createAgentMcpCommand({
        resolvePath: host.resolvePath,
        run: (input) => runAgentMcp(input, dependencies),
        isInteractive: () => Deno.stdin.isTerminal(),
        writeGuidance: (message) => console.error(message),
      }),
    )
    .command(
      "init",
      createInitAgentCommand({
        projectRoot: host.cwd,
        init: (input) => initAgent(input, { fs, aspireAgentInitializer, docsGenerator }),
      }),
    )
    .command(
      "drift",
      new Command()
        .description("Manage evidence-gated agent drift records")
        .action(function () {
          this.showHelp();
        })
        .command("record", createRecordDriftCommand(host.cwd)),
    );
}
