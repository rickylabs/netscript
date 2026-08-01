import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";
import { NETSCRIPT_RELEASE_VERSION } from "../../../../kernel/constants/jsr-specifiers.ts";
import { EMBEDDED_SKILL_FILES } from "../../../../kernel/assets/skills.generated.ts";
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
    assertEquals(config.mcpServers.netscript.args, [
      "run",
      "--config",
      join(root, "deno.json"),
      "-A",
      `jsr:@netscript/cli@${NETSCRIPT_RELEASE_VERSION}`,
      "agent",
      "mcp",
      "--project-root",
      root,
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
    assertEquals(vscode.servers.netscript.args, [
      "run",
      "--config",
      join(root, "deno.json"),
      "-A",
      `jsr:@netscript/cli@${NETSCRIPT_RELEASE_VERSION}`,
      "agent",
      "mcp",
      "--project-root",
      root,
    ]);
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

Deno.test("agent init installs the diagnostic surface with no dangling skill routes", async () => {
  const root = await Deno.makeTempDir();
  try {
    await initAgent({ projectRoot: root, host: "claude" }, {
      fs: new DenoAgentInitFileSystem(),
    });
    const manifest = JSON.parse(EMBEDDED_SKILL_FILES["manifest.json"]) as {
      readonly skills: readonly string[];
    };
    assertEquals(manifest.skills, [
      "netscript",
      "netscript-operate",
      "netscript-build",
      "aspire",
      "deno",
    ]);
    for (const path of [
      "aspire/SKILL.md",
      "deno/SKILL.md",
      "help.md",
    ]) {
      assertEquals(
        await Deno.stat(join(root, ".claude", "skills", path)).then(() => true),
        true,
      );
    }

    const installed = new Set(manifest.skills);
    const routingPaths = [
      ...manifest.skills.map((skill) => `${skill}/SKILL.md`),
      "help.md",
    ];
    const scannedFiles = new Set<string>();
    const referenced = new Set<string>();
    const dangling = new Set<string>();
    for (const path of routingPaths) {
      const markdown = await Deno.readTextFile(
        join(root, ".claude", "skills", path),
      );
      scannedFiles.add(path);
      for (const reference of extractSkillReferences(markdown)) {
        referenced.add(reference);
        if (!installed.has(reference)) dangling.add(`${path} -> ${reference}`);
      }
    }
    assertEquals([...scannedFiles], routingPaths);
    assertEquals([...dangling], []);
    assertEquals([...referenced].sort(), [
      "aspire",
      "deno",
      "netscript-build",
      "netscript-operate",
    ]);

    const agents = await Deno.readTextFile(join(root, "AGENTS.md"));
    assertStringIncludes(agents, "`aspire`");
    assertStringIncludes(agents, "`deno`");
    assertStringIncludes(agents, ".claude/skills/help.md");
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

function extractSkillReferences(markdown: string): ReadonlySet<string> {
  const references = new Set<string>();
  for (
    const match of markdown.matchAll(
      /\buse (?:the )?`?([a-z][a-z0-9-]+)`? skill\b/gi,
    )
  ) {
    references.add(match[1].toLowerCase());
  }
  for (
    const match of markdown.matchAll(
      /\(use (?:the )?`?([a-z][a-z0-9-]+)`?\)/gi,
    )
  ) {
    references.add(match[1].toLowerCase());
  }

  const lines = markdown.split("\n");
  for (let index = 0; index < lines.length; index++) {
    if (!/\|\s*(?:Skill|Go to)\s*\|/i.test(lines[index])) continue;
    for (let row = index + 2; row < lines.length && /^\s*\|/.test(lines[row]); row++) {
      const target = lines[row].split("|").at(-2) ?? "";
      for (const match of target.matchAll(/`([a-z][a-z0-9-]+)`/gi)) {
        references.add(match[1].toLowerCase());
      }
    }
  }
  return references;
}
