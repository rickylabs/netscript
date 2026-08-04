import {
  assert,
  assertEquals,
  assertFalse,
  assertMatch,
  assertRejects,
  assertStringIncludes,
} from "@std/assert";
import { dirname, join } from "@std/path";
import { format, increment, parse } from "@std/semver";
import { NETSCRIPT_RELEASE_VERSION } from "../../../../kernel/constants/jsr-specifiers.ts";
import { EMBEDDED_SKILL_FILES } from "../../../../kernel/assets/skills.generated.ts";
import { DenoAgentInitFileSystem } from "./agent-init-file-system.ts";
import type { AspireAgentInitializer } from "./aspire-agent-initializer.ts";
import { initAgent } from "./init-agent.ts";
import type { AgentDocsGenerator } from "./agent-docs-generator.ts";

const SUCCESSFUL_ASPIRE_INITIALIZER: AspireAgentInitializer = {
  initialize: () => Promise.resolve({ ok: true }),
};

const OPENAPI_TOOL_TRIAD = [
  "list_api_services",
  "list_service_operations",
  "get_operation_schema",
] as const;
const MIGRATION_TARGET_SPECIFIER =
  `jsr:@netscript/cli@${format(increment(parse(NETSCRIPT_RELEASE_VERSION), "patch", {}))}`;

const FIXTURE_DOCS_GENERATOR: AgentDocsGenerator = {
  generate: () =>
    Promise.resolve({
      frameworkVersion: NETSCRIPT_RELEASE_VERSION,
      proseFileCount: 2,
      apiPackageCount: 1,
      apiExportCount: 2,
      files: {
        "llms.txt": "# NetScript\n\n## Task router\n",
        "llms-full.txt": "complete docs\n",
        "deno-doc/config.txt": "config API\n",
        "MANIFEST.md": "Start at `.netscript/docs/llms.txt`.\n",
      },
    }),
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

Deno.test('agent init applies native editor configuration for none, Zed, and VS Code', async () => {
  const fs = new DenoAgentInitFileSystem();
  const roots = await Promise.all([
    Deno.makeTempDir(),
    Deno.makeTempDir(),
    Deno.makeTempDir(),
  ]);
  const [noneRoot, zedRoot, vscodeRoot] = roots;
  try {
    await initAgent({ projectRoot: noneRoot, host: 'claude', editor: 'none' }, {
      fs,
      aspireAgentInitializer: SUCCESSFUL_ASPIRE_INITIALIZER,
    });
    assertFalse(await fs.exists(join(noneRoot, '.zed')));
    assertFalse(await fs.exists(join(noneRoot, '.vscode')));

    await fs.writeText(
      join(zedRoot, '.zed/settings.json'),
      '{"custom":true,"context_servers":{"other":{"command":"other"}}}\n',
    );
    await initAgent({ projectRoot: zedRoot, host: 'claude', editor: 'zed' }, {
      fs,
      aspireAgentInitializer: SUCCESSFUL_ASPIRE_INITIALIZER,
    });
    const zed = JSON.parse(await Deno.readTextFile(join(zedRoot, '.zed/settings.json')));
    assertEquals(zed.custom, true);
    assertEquals(zed.context_servers.other.command, 'other');
    assertEquals(zed.context_servers.netscript.command, 'deno');
    assertEquals(zed.context_servers.aspire.command, 'aspire');
    assert(zed.lsp.deno.settings.deno.enable);
    assert(await fs.exists(join(zedRoot, '.zed/debug.json')));
    assertFalse(await fs.exists(join(zedRoot, '.vscode/mcp.json')));

    await initAgent({ projectRoot: vscodeRoot, host: 'claude', editor: 'vscode' }, {
      fs,
      aspireAgentInitializer: SUCCESSFUL_ASPIRE_INITIALIZER,
    });
    const vscode = JSON.parse(
      await Deno.readTextFile(join(vscodeRoot, '.vscode/mcp.json')),
    );
    assertEquals(vscode.servers.netscript.command, 'deno');
    assertEquals(vscode.servers.aspire.command, 'aspire');
    assert(await fs.exists(join(vscodeRoot, '.vscode/settings.json')));
    assertFalse(await fs.exists(join(vscodeRoot, '.zed/settings.json')));
  } finally {
    await Promise.all(roots.map((root) => Deno.remove(root, { recursive: true })));
  }
});

Deno.test('agent init detects one existing editor and rejects an ambiguous project', async () => {
  const detectedRoot = await Deno.makeTempDir();
  const ambiguousRoot = await Deno.makeTempDir();
  const fs = new DenoAgentInitFileSystem();
  try {
    await Deno.mkdir(join(detectedRoot, '.zed'));
    await initAgent({ projectRoot: detectedRoot, host: 'claude' }, {
      fs,
      aspireAgentInitializer: SUCCESSFUL_ASPIRE_INITIALIZER,
    });
    assert(await fs.exists(join(detectedRoot, '.zed/settings.json')));

    await Deno.mkdir(join(ambiguousRoot, '.zed'));
    await Deno.mkdir(join(ambiguousRoot, '.vscode'));
    await assertRejects(
      () =>
        initAgent({ projectRoot: ambiguousRoot, host: 'claude' }, {
          fs,
          aspireAgentInitializer: SUCCESSFUL_ASPIRE_INITIALIZER,
        }),
      Error,
      'pass --editor zed, --editor vscode, or --editor none',
    );
  } finally {
    await Deno.remove(detectedRoot, { recursive: true });
    await Deno.remove(ambiguousRoot, { recursive: true });
  }
});

Deno.test("S-18 prior-release host stays pinned until agent init and restart exposes the tool triad", async () => {
  const root = await Deno.makeTempDir();
  try {
    const fs = new DenoAgentInitFileSystem();
    const fixtureRoot = new URL("./fixtures/", import.meta.url);
    await fs.writeText(
      join(root, ".mcp.json"),
      await Deno.readTextFile(new URL("prior-release.mcp.json", fixtureRoot)),
    );
    await fs.writeText(join(root, "deno.json"), '{"workspace":[]}\n');
    const priorTools = JSON.parse(
      await Deno.readTextFile(new URL("prior-release-tools.json", fixtureRoot)),
    ) as readonly string[];
    const before = JSON.parse(await Deno.readTextFile(join(root, ".mcp.json")));
    const priorSpecifier = before.mcpServers.netscript.args[4] as string;
    assertMatch(priorSpecifier, /^jsr:@netscript\/cli@\d+\.\d+\.\d+$/);
    assertFalse(priorSpecifier === MIGRATION_TARGET_SPECIFIER);
    for (const tool of OPENAPI_TOOL_TRIAD) assertFalse(priorTools.includes(tool));

    await initAgent({ projectRoot: root, host: "claude" }, {
      fs,
      aspireAgentInitializer: SUCCESSFUL_ASPIRE_INITIALIZER,
      cliSpecifier: MIGRATION_TARGET_SPECIFIER,
    });
    const after = JSON.parse(await Deno.readTextFile(join(root, ".mcp.json")));
    assertEquals(after.project, "prior-release-fixture");
    assertEquals(after.mcpServers.other.command, "other");
    assertEquals(after.mcpServers.netscript.args[4], MIGRATION_TARGET_SPECIFIER);

    const restartedTools = await listToolsAfterHostRestart(root);
    assertEquals(restartedTools.length, 21);
    for (const tool of OPENAPI_TOOL_TRIAD) assert(restartedTools.includes(tool));
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

Deno.test("agent init installs the consumer tool surface for every host", async () => {
  const root = await Deno.makeTempDir();
  try {
    await initAgent({ projectRoot: root, host: "all" }, {
      fs: new DenoAgentInitFileSystem(),
      aspireAgentInitializer: SUCCESSFUL_ASPIRE_INITIALIZER,
    });
    for (
      const path of [
        "consumer-tools.json",
        "README.md",
        "release.json",
        "run-deno-check.ts",
        "run-deno-lint.ts",
        "run-deno-doc-lint.ts",
        "validation/check-aspire-host-ports.ts",
        "quality/scan-code-quality.ts",
        "deps/outdated.ts",
        "deps/why.ts",
        "e2e/scaffold-e2e-test.ts",
      ]
    ) {
      assert(
        await new DenoAgentInitFileSystem().exists(
          join(root, ".llm", "tools", path),
        ),
        `missing installed consumer tool file: ${path}`,
      );
    }

    const referenceFiles = [
      join(root, "AGENTS.md"),
      ...Object.keys(EMBEDDED_SKILL_FILES)
        .filter((path) => path.endsWith(".md"))
        .map((path) => join(root, ".claude", "skills", path)),
      join(root, ".llm", "tools", "README.md"),
    ];
    for (const referenceFile of referenceFiles) {
      if (!await new DenoAgentInitFileSystem().exists(referenceFile)) continue;
      const content = await Deno.readTextFile(referenceFile);
      for (const match of content.matchAll(/\.llm\/tools\/[A-Za-z0-9_./-]+/g)) {
        const relativePath = match[0].replace(/[.,;:)]+$/, "");
        assert(
          await new DenoAgentInitFileSystem().exists(join(root, relativePath)),
          `${referenceFile} names missing ${relativePath}`,
        );
      }
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("installed consumer tools resolve from the project when process CWD differs", async () => {
  const root = await Deno.makeTempDir();
  const foreignCwd = await Deno.makeTempDir();
  try {
    await initAgent({ projectRoot: root, host: "vscode" }, {
      fs: new DenoAgentInitFileSystem(),
      aspireAgentInitializer: SUCCESSFUL_ASPIRE_INITIALIZER,
    });
    const manifest = JSON.parse(
      await Deno.readTextFile(join(root, ".llm", "tools", "consumer-tools.json")),
    ) as { readonly tools: readonly { path: string }[] };
    for (const tool of manifest.tools) {
      const output = await new Deno.Command(Deno.execPath(), {
        args: [
          "run",
          "--allow-read",
          "--allow-run",
          "--allow-env",
          "--allow-net",
          join(root, ".llm", "tools", tool.path),
          "--help",
        ],
        cwd: foreignCwd,
        stdout: "piped",
        stderr: "piped",
      }).output();
      assertEquals(output.code, 0, `${tool.path} --help failed`);
    }
    const reportPath = join(root, "consumer-smoke-plan.json");
    const smokeTool = manifest.tools.find((tool) =>
      tool.path === "e2e/scaffold-e2e-test.ts"
    );
    assert(smokeTool);
    const smokeOutput = await new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "--allow-read",
        "--allow-write",
        "--allow-run",
        "--allow-env",
        "--allow-net",
        join(root, ".llm", "tools", smokeTool.path),
        "--repo",
        root,
        "--dry-run",
        "--format",
        "json",
        "--report",
        reportPath,
      ],
      cwd: foreignCwd,
      stdout: "piped",
      stderr: "piped",
    }).output();
    assertEquals(
      smokeOutput.code,
      0,
      `consumer scaffold smoke dry-run failed: ${new TextDecoder().decode(smokeOutput.stderr)} ${
        new TextDecoder().decode(smokeOutput.stdout)
      }`,
    );
    const report = JSON.parse(await Deno.readTextFile(reportPath)) as {
      readonly project: { readonly smokeRoot: string; readonly logFile: string };
    };
    assert(report.project.smokeRoot.startsWith(root));
    assert(report.project.logFile.startsWith(root));
    assertEquals([...(await Array.fromAsync(Deno.readDir(foreignCwd)))], []);
  } finally {
    await Deno.remove(root, { recursive: true });
    await Deno.remove(foreignCwd, { recursive: true });
  }
});

Deno.test("agent init leaves the offline docs corpus absent unless requested", async () => {
  const root = await Deno.makeTempDir();
  let calls = 0;
  try {
    await initAgent({ projectRoot: root, host: "vscode" }, {
      fs: new DenoAgentInitFileSystem(),
      aspireAgentInitializer: SUCCESSFUL_ASPIRE_INITIALIZER,
      docsGenerator: {
        generate: () => {
          calls += 1;
          return FIXTURE_DOCS_GENERATOR.generate(root);
        },
      },
    });
    assertEquals(calls, 0);
    assertFalse(await new DenoAgentInitFileSystem().exists(join(root, ".netscript", "docs")));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("agent init --with-docs installs a path-closed local corpus", async () => {
  const root = await Deno.makeTempDir();
  try {
    const result = await initAgent({ projectRoot: root, host: "claude", withDocs: true }, {
      fs: new DenoAgentInitFileSystem(),
      aspireAgentInitializer: SUCCESSFUL_ASPIRE_INITIALIZER,
      docsGenerator: FIXTURE_DOCS_GENERATOR,
    });
    for (const path of ["llms.txt", "llms-full.txt", "deno-doc/config.txt", "MANIFEST.md"]) {
      assert(await new DenoAgentInitFileSystem().exists(join(root, ".netscript", "docs", path)));
    }
    const agents = await Deno.readTextFile(join(root, "AGENTS.md"));
    assertStringIncludes(agents, ".netscript/docs/llms.txt");
    const manifest = await Deno.readTextFile(join(root, ".netscript", "docs", "MANIFEST.md"));
    for (const match of manifest.matchAll(/\.netscript\/docs\/[A-Za-z0-9_./-]+/g)) {
      assert(await new DenoAgentInitFileSystem().exists(join(root, match[0])));
    }
    assert(result.messages.some((message) => message.includes("1 API packages / 2 export subpaths")));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("offline docs failure occurs before any project write", async () => {
  const root = await Deno.makeTempDir();
  try {
    await assertRejects(
      () =>
        initAgent({ projectRoot: root, host: "all", withDocs: true }, {
          fs: new DenoAgentInitFileSystem(),
          aspireAgentInitializer: SUCCESSFUL_ASPIRE_INITIALIZER,
          docsGenerator: { generate: () => Promise.reject(new Error("version mismatch")) },
        }),
      Error,
      "version mismatch",
    );
    assertEquals([...(await Array.fromAsync(Deno.readDir(root)))], []);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

async function listToolsAfterHostRestart(projectRoot: string): Promise<readonly string[]> {
  const cliPath = new URL("../../../../../bin/netscript.ts", import.meta.url).pathname;
  const child = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "-A",
      cliPath,
      "agent",
      "mcp",
      "--project-root",
      projectRoot,
      "--endpoint",
      "http://127.0.0.1:1",
    ],
    cwd: projectRoot,
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  }).spawn();
  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(
    `${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" })}\n`,
  ));
  await writer.close();
  const output = await child.output();
  assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
  const response = JSON.parse(new TextDecoder().decode(output.stdout)) as {
    readonly result: { readonly tools: readonly { readonly name: string }[] };
  };
  return response.result.tools.map((tool) => tool.name);
}

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
