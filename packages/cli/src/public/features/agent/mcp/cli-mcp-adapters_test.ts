import { assertEquals, assertStringIncludes } from "@std/assert";
import { createMcpCliServer } from "@netscript/mcp/cli";
import { CliProjectDoctor } from "./cli-mcp-adapters.ts";
import { createAgentMcpOptions } from "./run-agent-mcp.ts";
import { createPublicCommandDependencies } from "../../root/public-command-dependencies.ts";

Deno.test("agent MCP adapters expose real verbs and non-stub plugin doctor results", async () => {
  const root = Deno.cwd();
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
      checks: [{
        id: "manifest",
        title: "Manifest resolved",
        status: "healthy",
        message: "workers",
      }],
    }])
  );
  const server = createMcpCliServer({
    projectRoot: Deno.cwd(),
    commandCatalog: catalog,
    projectDoctor: doctor,
    environment: {},
  } as never);
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
  assertEquals((listed?.result as { tools: unknown[] }).tools.length, 13);
  const commands = await server.handle({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "list_commands", arguments: {} },
  });
  const commandText = JSON.stringify(commands?.result);
  assertStringIncludes(commandText, "db");
  assertStringIncludes(commandText, "plugin");
  const diagnosis = await server.handle({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: { name: "doctor", arguments: {} },
  });
  const doctorText = JSON.stringify(diagnosis?.result);
  assertStringIncludes(doctorText, "workers:manifest");
  if (doctorText.includes("not wired")) {
    throw new Error("doctor used the unwired project stub");
  }
});
