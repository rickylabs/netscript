import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  type CommandExecutorPort,
  createMcpCliServer,
  SpawnCommandExecutor,
  TOOL_NAMES,
} from "@netscript/mcp/cli";
import { CliProjectDoctor } from "./cli-mcp-adapters.ts";
import { createAgentMcpOptions } from "./run-agent-mcp.ts";
import { createPublicCommandDependencies } from "../../root/public-command-dependencies.ts";

Deno.test("an injected host executor reports identity distinct from standalone MCP", () => {
  const executor = new SpawnCommandExecutor({
    cliCommand: ["/fixture/netscript-host"],
    mode: "host",
    version: "9.9.9-host",
  });
  assertEquals(executor.identity, {
    mode: "host",
    version: "9.9.9-host",
    command: ["/fixture/netscript-host"],
  });
});

Deno.test("agent MCP adapters expose real verbs and non-stub plugin doctor results", async () => {
  const root = await Deno.makeTempDir({ prefix: "netscript-cli-mcp-adapters-" });
  try {
  const dependencies = createPublicCommandDependencies({
    cwd: () => root,
    resolvePath: (path?: string) => path ?? root,
  });
  const catalog = createAgentMcpOptions({ projectRoot: root }, dependencies)
    .commandCatalog!;
  const doctor = new CliProjectDoctor(() =>
    Promise.resolve([{
      pluginName: "workers",
      status: "healthy",
      checks: Array.from({ length: 25 }, (_, index) => ({
        id: `manifest-${index}`,
        title: `Manifest ${index} resolved`,
        status: "healthy" as const,
        message: "workers",
      })),
    }])
  );
  const executed: Array<{ path: readonly string[]; args: readonly string[] }> =
    [];
  const executor: CommandExecutorPort = {
    identity: { mode: "host", version: "9.9.9", command: ["netscript"] },
    execute: (request) => {
      executed.push(request);
      return Promise.resolve({
        executor: { mode: "host", version: "9.9.9", command: ["netscript"] },
        exitCode: 0,
        durationMs: 1,
        outputTail: "plugins listed",
        truncated: false,
        timedOut: false,
      });
    },
  };
  const server = createMcpCliServer({
    projectRoot: root,
    commandCatalog: catalog,
    commandExecutor: executor,
    projectDoctor: doctor,
  });
  const initialized = await server.handle({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
  });
  assertEquals(
    (initialized?.result as { serverInfo: { name: string } }).serverInfo.name,
    "@netscript/mcp",
  );
  const listed = await server.handle({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
  });
  assertEquals(
    (listed?.result as { tools: Array<{ name: string }> }).tools.map((tool) =>
      tool.name
    ),
    [...TOOL_NAMES],
  );
  const commands = await server.handle({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "list_commands", arguments: { filter: "plugin" } },
  });
  const commandText = JSON.stringify(commands?.result);
  assertStringIncludes(commandText, "plugin");
  assertStringIncludes(commandText, "plugin enable");
  if (commandText.includes("catalog not wired")) {
    throw new Error("list_commands used the standalone MCP fallback instead of the public CLI registry");
  }
  const allowed = await server.handle({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "execute_command",
      arguments: { command: "plugin", args: ["list", "--project-root", root] },
    },
  });
  assertEquals(allowed?.result?.isError, false);
  assertEquals(executed, [{
    path: ["plugin"],
    args: ["list", "--project-root", root],
  }]);
  const denied = await server.handle({
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "execute_command",
      arguments: { command: "deploy", args: [] },
    },
  });
  assertEquals(denied?.result?.isError, true);
  assertStringIncludes(JSON.stringify(denied?.result), "deny_deploy");
  assertEquals(executed.length, 1);
  const diagnosis = await server.handle({
    jsonrpc: "2.0",
    id: 6,
    method: "tools/call",
    params: { name: "doctor", arguments: {} },
  });
  const doctorText = JSON.stringify(diagnosis?.result);
  assertEquals(diagnosis?.error, undefined);
  assertStringIncludes(doctorText, "workers:manifest-0");
  assertStringIncludes(doctorText, "plugins_additional_checks");
  if (doctorText.includes("not wired")) {
    throw new Error("doctor used the unwired project stub");
  }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
