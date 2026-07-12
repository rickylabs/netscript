import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";
import { DenoAgentInitFileSystem } from "./agent-init-file-system.ts";
import { initAgent } from "./init-agent.ts";

Deno.test("agent init writes Claude config, skills, and marked AGENTS section idempotently", async () => {
  const root = await Deno.makeTempDir();
  try {
    const fs = new DenoAgentInitFileSystem();
    const first = await initAgent({ projectRoot: root, host: "claude" }, {
      fs,
    });
    const config = JSON.parse(await Deno.readTextFile(join(root, ".mcp.json")));
    assertEquals(config.mcpServers.netscript.command, "deno");
    assertEquals(config.mcpServers.netscript.args.slice(0, 5), [
      "run",
      "-A",
      "jsr:@netscript/cli",
      "agent",
      "mcp",
    ]);
    assertStringIncludes(
      await Deno.readTextFile(join(root, ".claude/skills/netscript/SKILL.md")),
      "NetScript",
    );
    assertStringIncludes(
      await Deno.readTextFile(join(root, "AGENTS.md")),
      "<!-- netscript-agent:start -->",
    );
    assertEquals(first.hosts, ["claude"]);
    const second = await initAgent({ projectRoot: root, host: "claude" }, {
      fs,
    });
    assertEquals(second.changedFiles, []);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("agent init selects VS Code and detect-or-all host table", async () => {
  const root = await Deno.makeTempDir();
  try {
    const fs = new DenoAgentInitFileSystem();
    const all = await initAgent({ projectRoot: root }, { fs });
    assertEquals(all.hosts, ["claude", "vscode"]);
    const vscode = JSON.parse(
      await Deno.readTextFile(join(root, ".vscode/mcp.json")),
    );
    assertEquals(vscode.servers.netscript.command, "deno");
    const only = await Deno.makeTempDir();
    try {
      await Deno.mkdir(join(only, ".vscode"));
      assertEquals((await initAgent({ projectRoot: only }, { fs })).hosts, [
        "vscode",
      ]);
    } finally {
      await Deno.remove(only, { recursive: true });
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("agent init rejects a bundle whose manifest hash does not match", async () => {
  const root = await Deno.makeTempDir();
  try {
    await assertRejects(
      () =>
        initAgent({ projectRoot: root, host: "claude" }, {
          fs: new DenoAgentInitFileSystem(),
          bundle: {
            files: { "manifest.json": '{"files":["manifest.json"]}' },
            hash: "not-the-real-hash",
          },
        }),
      Error,
      "Skill bundle hash mismatch",
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
