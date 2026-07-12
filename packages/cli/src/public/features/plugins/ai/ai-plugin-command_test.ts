import { assertEquals } from "@std/assert";
import { createAiPluginCommand } from "./ai-plugin-command.ts";

Deno.test("plugin ai forwards nested lifecycle verbs and flags", async () => {
  const calls: unknown[] = [];
  const command = createAiPluginCommand({
    resolveProjectRoot: () => Promise.resolve("/workspace/app"),
    processRunner: {
      exec: () => Promise.resolve({ code: 0, stdout: "", stderr: "" }),
    },
    dispatch: (args, options) => {
      calls.push({ args, projectRoot: options.projectRoot });
      return Promise.resolve({ code: 0, stdout: '{"ok":true}', stderr: "" });
    },
    print: () => {},
  });

  await command.parse(["model", "add", "fast", "openrouter:model", "--json"]);
  assertEquals(calls, [{
    args: ["model", "add", "fast", "openrouter:model", "--json"],
    projectRoot: "/workspace/app",
  }]);
});
