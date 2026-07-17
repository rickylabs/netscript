import { assert } from "@std/assert";
import { DEFAULT_COMMAND_POLICY } from "@netscript/mcp";

import { createPublicCommandDependencies } from "../../root/public-command-dependencies.ts";
import {
  createPublicCommandRegistry,
  type PublicCliHost,
} from "../../root/public-command-tree.ts";
import { PublicCliCommandCatalog } from "./cli-mcp-adapters.ts";

Deno.test("every default MCP command policy prefix exists in the public CLI tree", async () => {
  const host: PublicCliHost = {
    cwd: () => Deno.cwd(),
    resolvePath: (path) => path ?? Deno.cwd(),
  };
  const root = createPublicCommandRegistry().program({
    name: "netscript",
    version: "test",
    description: "NetScript CLI command-policy parity test",
    context: { host, dependencies: createPublicCommandDependencies(host) },
  });
  const catalog = await new PublicCliCommandCatalog(root).listCommands();
  const commandPaths = catalog.map((command) => command.path.split(" "));

  for (
    const rule of [
      ...DEFAULT_COMMAND_POLICY.allow,
      ...DEFAULT_COMMAND_POLICY.deny,
    ]
  ) {
    assert(
      commandPaths.some((path) =>
        path.length === rule.prefix.length &&
        rule.prefix.every((token, index) => path[index] === token)
      ),
      `MCP command policy rule "${rule.name}" references missing CLI command "${
        rule.prefix.join(" ")
      }"`,
    );
  }
});
