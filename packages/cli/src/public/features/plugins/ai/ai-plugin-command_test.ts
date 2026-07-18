import { assertEquals } from "@std/assert";
import { NETSCRIPT_RELEASE_VERSION } from "../../../../kernel/constants/jsr-specifiers.ts";
import {
  createAiPluginCommand,
  dispatchAiPluginCommand,
} from "./ai-plugin-command.ts";

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

Deno.test("plugin ai shells out to the lockstep-versioned plugin CLI", async () => {
  const calls: unknown[] = [];
  await dispatchAiPluginCommand(["doctor"], {
    projectRoot: "/workspace/app",
    processRunner: {
      exec: (command, args, options) => {
        calls.push({ command, args, cwd: options?.cwd });
        return Promise.resolve({ code: 0, stdout: "", stderr: "" });
      },
    },
  });

  assertEquals(calls, [{
    command: "deno",
    args: [
      "run",
      "--config",
      "/workspace/app/deno.json",
      "-A",
      `https://jsr.io/@netscript/plugin-ai/${NETSCRIPT_RELEASE_VERSION}/cli.ts`,
      "doctor",
    ],
    cwd: "/workspace/app",
  }]);
});
