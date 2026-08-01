import {
  assert,
  assertEquals,
  assertFalse,
  assertRejects,
  assertStringIncludes,
} from "@std/assert";
import { dirname, join } from "@std/path";
import { NETSCRIPT_RELEASE_VERSION } from "../../../../kernel/constants/jsr-specifiers.ts";
import { EMBEDDED_SKILL_FILES } from "../../../../kernel/assets/skills.generated.ts";
import { DenoAgentInitFileSystem } from "./agent-init-file-system.ts";
import type { AspireAgentInitializer } from "./aspire-agent-initializer.ts";
import { initAgent } from "./init-agent.ts";

const SUCCESSFUL_ASPIRE_INITIALIZER: AspireAgentInitializer = {
  initialize: () => Promise.resolve({ ok: true }),
};

Deno.test("agent init writes Claude config, skills, and marked AGENTS section idempotently", async () => {
  const root = await Deno.makeTempDir();
  try {
    const fs = new DenoAgentInitFileSystem();
    await fs.writeText(
      join(root, ".mcp.json"),
      '{"custom":true,"mcpServers":{"other":{"command":"other"}}}\n',
    );
    const first = await initAgent({ projectRoot: root, host: "claude" }, {
      fs,
      aspireAgentInitializer: SUCCESSFUL_ASPIRE_INITIALIZER,
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
    assertEquals(config.mcpServers.aspire, {
      command: "aspire",
      args: ["agent", "mcp"],
    });
    assertEquals(config.custom, true);
    assertEquals(config.mcpServers.other.command, "other");
    assertStringIncludes(
      await Deno.readTextFile(join(root, ".claude/skills/netscript/SKILL.md")),
      "NetScript",
    );
    assertStringIncludes(
      await Deno.readTextFile(join(root, "AGENTS.md")),
      "netscript plugin doctor",
    );
    const agents = await Deno.readTextFile(join(root, "AGENTS.md"));
    for (const expected of ["aspire", "deno", "help.md", "aspire otel"]) {
      assertStringIncludes(agents, expected);
    }
    assertEquals(first.hosts, ["claude"]);
    const second = await initAgent({ projectRoot: root, host: "claude" }, {
      fs,
      aspireAgentInitializer: SUCCESSFUL_ASPIRE_INITIALIZER,
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
    await fs.writeText(
      join(root, ".vscode/mcp.json"),
      '{"custom":true,"servers":{"other":{"command":"other"}}}\n',
    );
    const all = await initAgent({ projectRoot: root, host: "all" }, {
      fs,
      aspireAgentInitializer: SUCCESSFUL_ASPIRE_INITIALIZER,
    });
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
    assertEquals(vscode.servers.aspire, {
      command: "aspire",
      args: ["agent", "mcp"],
    });
    assertEquals(vscode.custom, true);
    assertEquals(vscode.servers.other.command, "other");
    const only = await Deno.makeTempDir();
    try {
      await Deno.mkdir(join(only, ".vscode"));
      assertEquals(
        (await initAgent({ projectRoot: only }, {
          fs,
          aspireAgentInitializer: SUCCESSFUL_ASPIRE_INITIALIZER,
        })).hosts,
        ["vscode"],
      );
    } finally {
      await Deno.remove(only, { recursive: true });
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("VS Code-only agent init never delegates to the Claude skill tree", async () => {
  const explicitRoot = await Deno.makeTempDir();
  const detectedRoot = await Deno.makeTempDir();
  try {
    const fs = new DenoAgentInitFileSystem();
    let calls = 0;
    const initializer: AspireAgentInitializer = {
      initialize() {
        calls++;
        return Promise.resolve({ ok: true });
      },
    };

    await initAgent({ projectRoot: explicitRoot, host: "vscode" }, {
      fs,
      aspireAgentInitializer: initializer,
    });
    assertEquals(calls, 0);
    assertFalse(await fs.exists(join(explicitRoot, ".claude")));
    assert(await fs.exists(join(explicitRoot, ".vscode/mcp.json")));

    await Deno.mkdir(join(detectedRoot, ".vscode"));
    const detected = await initAgent({ projectRoot: detectedRoot }, {
      fs,
      aspireAgentInitializer: initializer,
    });
    assertEquals(detected.hosts, ["vscode"]);
    assertEquals(calls, 0);
    assertFalse(await fs.exists(join(detectedRoot, ".claude")));
    assert(await fs.exists(join(detectedRoot, ".vscode/mcp.json")));
  } finally {
    await Deno.remove(explicitRoot, { recursive: true });
    await Deno.remove(detectedRoot, { recursive: true });
  }
});

Deno.test("agent init rejects a bundle whose manifest hash does not match", async () => {
  const root = await Deno.makeTempDir();
  try {
    await assertRejects(
      () =>
        initAgent({ projectRoot: root, host: "claude" }, {
          fs: new DenoAgentInitFileSystem(),
          aspireAgentInitializer: SUCCESSFUL_ASPIRE_INITIALIZER,
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

Deno.test("installed skill routing resolves to installed skills or help", async () => {
  const root = await Deno.makeTempDir();
  try {
    const fs = new DenoAgentInitFileSystem();
    await initAgent({ projectRoot: root, host: "claude" }, {
      fs,
      aspireAgentInitializer: SUCCESSFUL_ASPIRE_INITIALIZER,
    });
    const manifest = JSON.parse(EMBEDDED_SKILL_FILES["manifest.json"]) as {
      readonly skills: readonly string[];
    };
    const installed = new Set([...manifest.skills, "help.md"]);
    for (const skill of manifest.skills) {
      const installedPath = join(root, ".claude/skills", skill, "SKILL.md");
      assert(await fs.exists(installedPath), `${skill} was not installed`);
      const text = await Deno.readTextFile(installedPath);
      for (
        const section of text.matchAll(
          /## (?:Routing|Hand-offs)\n([\s\S]*?)(?=\n## |$)/g,
        )
      ) {
        for (const line of section[1].split("\n")) {
          const route = line.match(
            /^\|[^|]+\|\s*(?:`([^` ]+)`|\[(?:`([^` ]+)`|([^\]]+))\]\(([^)]+)\))\s*\|$/,
          );
          if (!route) continue;
          const target = route[1] ?? route[2] ?? route[3];
          const href = route[4];
          assert(installed.has(target), `${skill} routes to missing ${target}`);
          if (href) {
            const linkedPath = join(dirname(installedPath), href);
            assert(
              await fs.exists(linkedPath),
              `${skill} route ${target} links to missing ${href}`,
            );
          }
        }
      }
      for (const match of text.matchAll(/`([^` ]+)` skill/g)) {
        assert(
          installed.has(match[1]),
          `${skill} routes to missing ${match[1]}`,
        );
      }
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("aspire delegation is skipped when Playwright CLI is already installed", async () => {
  const root = await Deno.makeTempDir();
  try {
    const fs = new DenoAgentInitFileSystem();
    let calls = 0;
    const initializer: AspireAgentInitializer = {
      async initialize(projectRoot) {
        calls++;
        await fs.writeText(
          join(projectRoot, ".claude/skills/playwright-cli/SKILL.md"),
          "# Playwright CLI\n",
        );
        return { ok: true };
      },
    };
    await initAgent({ projectRoot: root, host: "claude" }, {
      fs,
      aspireAgentInitializer: initializer,
    });
    const second = await initAgent({ projectRoot: root, host: "claude" }, {
      fs,
      aspireAgentInitializer: initializer,
    });
    assertEquals(calls, 1);
    assertEquals(second.changedFiles, []);
    assertEquals(second.messages, []);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("aspire delegation timeout is swallowed after cancelling the fake", async () => {
  const root = await Deno.makeTempDir();
  try {
    let cancelled = false;
    const hanging: AspireAgentInitializer = {
      initialize(_projectRoot, signal) {
        return new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => {
            cancelled = true;
            reject(signal.reason);
          }, { once: true });
        });
      },
    };
    const result = await initAgent({ projectRoot: root, host: "claude" }, {
      fs: new DenoAgentInitFileSystem(),
      aspireAgentInitializer: hanging,
      aspireTimeoutMs: 1,
    });
    assert(cancelled);
    assertStringIncludes(result.messages[0], "timed out");
    const config = JSON.parse(await Deno.readTextFile(join(root, ".mcp.json")));
    assertEquals(config.mcpServers.aspire.command, "aspire");
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("aspire delegation errors are swallowed with unconditional MCP config", async () => {
  const root = await Deno.makeTempDir();
  try {
    const throwing: AspireAgentInitializer = {
      initialize: () => Promise.reject(new Error("aspire is unavailable")),
    };
    const result = await initAgent({ projectRoot: root, host: "claude" }, {
      fs: new DenoAgentInitFileSystem(),
      aspireAgentInitializer: throwing,
    });
    assertEquals(result.messages, [
      "Aspire agent wiring was skipped: aspire is unavailable.",
    ]);
    const config = JSON.parse(await Deno.readTextFile(join(root, ".mcp.json")));
    assertEquals(config.mcpServers.aspire.args, ["agent", "mcp"]);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("agent init installs the complete diagnostic surface", async () => {
  const root = await Deno.makeTempDir();
  try {
    await initAgent({ projectRoot: root, host: "claude" }, {
      fs: new DenoAgentInitFileSystem(),
      aspireAgentInitializer: SUCCESSFUL_ASPIRE_INITIALIZER,
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
    for (const path of ["aspire/SKILL.md", "deno/SKILL.md", "help.md"]) {
      assert(
        await new DenoAgentInitFileSystem().exists(
          join(root, ".claude", "skills", path),
        ),
      );
    }

    const installed = new Set(manifest.skills);
    const routingPaths = [
      ...manifest.skills.map((skill) => `${skill}/SKILL.md`),
      "help.md",
    ];
    const referenced = new Set<string>();
    const dangling = new Set<string>();
    for (const path of routingPaths) {
      const markdown = await Deno.readTextFile(
        join(root, ".claude", "skills", path),
      );
      for (const reference of extractSkillReferences(markdown)) {
        referenced.add(reference);
        if (!installed.has(reference)) dangling.add(`${path} -> ${reference}`);
      }
    }
    assertEquals([...dangling], []);
    assertEquals([...referenced].sort(), [
      "aspire",
      "deno",
      "netscript-build",
      "netscript-operate",
    ]);
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
    for (
      let row = index + 2;
      row < lines.length && /^\s*\|/.test(lines[row]);
      row++
    ) {
      const target = lines[row].split("|").at(-2) ?? "";
      for (const match of target.matchAll(/`([a-z][a-z0-9-]+)`/gi)) {
        references.add(match[1].toLowerCase());
      }
    }
  }
  return references;
}
