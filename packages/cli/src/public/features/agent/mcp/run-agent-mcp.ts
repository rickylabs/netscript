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
import { EMBEDDED_SKILL_FILES } from "../../../../kernel/assets/skills.generated.ts";
import { CLI_PACKAGE_VERSION } from "../../../../kernel/assets/publish-assets.generated.ts";
import { isCompiledBinary } from "../../../../kernel/adapters/runtime/platform/deno-platform.ts";

/** Runtime facts needed to re-enter the CLI process that hosts MCP. */
export interface HostCliRuntime {
  /** Whether the host is a compiled executable rather than a Deno-run module. */
  readonly compiled: boolean;
  /** Current executable path. */
  readonly execPath: string;
  /** Main CLI module URL used for a source or installed-script run. */
  readonly mainModule: string;
  /** Version of the hosting CLI. */
  readonly version: string;
}

/** Resolve the fixed command prefix that re-enters a hosting CLI. */
export function resolveHostCliCommand(runtime: HostCliRuntime): readonly string[] {
  return runtime.compiled
    ? Object.freeze([runtime.execPath])
    : Object.freeze([runtime.execPath, "run", "-A", runtime.mainModule]);
}

function currentHostCliRuntime(): HostCliRuntime {
  return {
    compiled: isCompiledBinary(),
    execPath: Deno.execPath(),
    mainModule: Deno.mainModule,
    version: CLI_PACKAGE_VERSION,
  };
}

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
  host: HostCliRuntime = currentHostCliRuntime(),
): McpCliOptions {
  const registry = createPublicCommandRegistry();
  const program = registry.program({
    name: "netscript",
    version: host.version,
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
    commandExecutor: new SpawnCommandExecutor({
      cliCommand: resolveHostCliCommand(host),
      mode: "host",
      version: host.version,
    }),
    projectDoctor: new CliProjectDoctor(
      dependencies.pluginDoctorDependencies.doctor,
    ),
    embeddedDocs: [{ slug: "help", source: EMBEDDED_SKILL_FILES["help.md"] }],
  };
}
