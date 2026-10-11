import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';
import { createPublicCommandDependencies } from '../root/public-command-dependencies.ts';
import { DenoAgentInitFileSystem } from '../agent/init/agent-init-file-system.ts';
import { initAgent } from '../agent/init/init-agent.ts';
import type { InitAgentInput, InitAgentResult } from '../agent/init/init-agent-input.ts';
import type { AgentEnvironment } from '../agent/init/hosts/agent-host-resolution.ts';
import { createInitCommand } from './init-command.ts';

async function fixture(
  run: (fixture: {
    root: string;
    parse: (args?: string[]) => Promise<void>;
    results: InitAgentResult[];
    inputs: InitAgentInput[];
    docsCalls: () => number;
  }) => Promise<void>,
  environment: AgentEnvironment = {},
): Promise<void> {
  const parent = await Deno.makeTempDir();
  const root = join(parent, 'agent-project');
  const dependencies = createPublicCommandDependencies({
    cwd: () => parent,
    resolvePath: (path = '.') => join(parent, path),
  }).initCommandDependencies;
  const results: InitAgentResult[] = [];
  const inputs: InitAgentInput[] = [];
  let docsCalls = 0;
  const command = () =>
    createInitCommand({
      ...dependencies,
      // Keep the real scaffold writers and installer; do not launch external processes.
      initContext: {
        ...dependencies.initContext,
        process: { exec: () => Promise.resolve({ code: 0, stdout: '', stderr: '' }) },
      },
      createInitContext: undefined,
      initAgent: async (input) => {
        inputs.push(input);
        assert(await new DenoAgentInitFileSystem().exists(join(root, 'deno.json')));
        const result = await initAgent(input, {
          fs: new DenoAgentInitFileSystem(),
          environment,
          aspireAgentInitializer: {
            initialize: () => Promise.resolve({ ok: false, reason: 'fixture unavailable' }),
          },
          docsGenerator: {
            generate: () => {
              docsCalls++;
              return Promise.resolve({
                frameworkVersion: 'fixture',
                proseFileCount: 1,
                apiPackageCount: 1,
                apiExportCount: 1,
                files: { 'llms.txt': 'fixture docs\n' },
              });
            },
          },
        });
        results.push(result);
        return result;
      },
    });
  try {
    await run({
      root,
      inputs,
      results,
      docsCalls: () => docsCalls,
      parse: async (args = []) => {
        await command().throwErrors().parse([
          'agent-project',
          '--path',
          parent,
          '--ci',
          '--no-git',
          '--no-aspire',
          '--force',
          ...args,
        ]);
      },
    });
  } finally {
    await Deno.remove(parent, { recursive: true });
  }
}

Deno.test('init integration: default installs detected invoking hosts in generated project', async () => {
  for (
    const [environment, host, configPath] of [
      [{ CLAUDECODE: '1' }, 'claude', '.mcp.json'],
      [{ OPENCODE: '1' }, 'opencode', 'opencode.json'],
      [{ TERM_PROGRAM: 'vscode' }, 'vscode', '.vscode/mcp.json'],
    ] as const
  ) {
    await fixture(async ({ root, parse, results, inputs, docsCalls }) => {
      await parse();
      assertEquals(inputs[0].projectRoot, root);
      assertEquals(results[0].hosts, [host]);
      assertEquals(results[0].resolution.hosts.source, 'environment');
      const config = await Deno.readTextFile(join(root, configPath));
      assertStringIncludes(config, root);
      assertStringIncludes(config, 'netscript');
      assert(
        await new DenoAgentInitFileSystem().exists(join(root, '.agents/skills/netscript/SKILL.md')),
      );
      assertEquals(docsCalls(), 0);
      assertEquals(
        await new DenoAgentInitFileSystem().exists(join(root, '.netscript/docs')),
        false,
      );
    }, environment);
  }
});

Deno.test('init integration: explicit host overrides invoking environment', async () => {
  await fixture(async ({ parse, results, root }) => {
    await parse(['--host', 'opencode']);
    assertEquals(results[0].hosts, ['opencode']);
    assertEquals(results[0].resolution.hosts.source, 'flag');
    assert(await new DenoAgentInitFileSystem().exists(join(root, 'opencode.json')));
    assertEquals(await new DenoAgentInitFileSystem().exists(join(root, '.mcp.json')), false);
  }, { CLAUDECODE: '1' });
});

Deno.test('init integration: no-agent writes no agent files even with with-docs', async () => {
  await fixture(async ({ parse, root, inputs, docsCalls }) => {
    await parse(['--no-agent', '--with-docs']);
    assertEquals(inputs.length, 0);
    assertEquals(docsCalls(), 0);
    const fs = new DenoAgentInitFileSystem();
    assert(await fs.exists(join(root, 'deno.json')));
    for (
      const path of [
        'AGENTS.md',
        'CLAUDE.md',
        '.agents',
        '.mcp.json',
        'opencode.json',
        '.llm',
        '.netscript/docs',
      ]
    ) {
      assertEquals(await fs.exists(join(root, path)), false, path);
    }
  });
});

Deno.test('init integration: with-docs independently opts into offline docs', async () => {
  await fixture(async ({ parse, root, docsCalls }) => {
    await parse(['--host', 'opencode', '--with-docs']);
    assertEquals(docsCalls(), 1);
    assertEquals(await Deno.readTextFile(join(root, '.netscript/docs/llms.txt')), 'fixture docs\n');
    assertStringIncludes(await Deno.readTextFile(join(root, 'opencode.json')), '--docs-root');
  });
});

Deno.test('init integration: default agent installation is idempotent on repeated init', async () => {
  await fixture(async ({ parse, root, results }) => {
    await parse();
    const before = await Deno.readTextFile(join(root, 'AGENTS.md'));
    await parse();
    assert(results[0].changedFiles.length > 0);
    assertEquals(results[1].changedFiles, []);
    assertEquals(await Deno.readTextFile(join(root, 'AGENTS.md')), before);
    assertStringIncludes(results[0].messages.join('\n'), 'fixture unavailable');
  });
});

Deno.test('init integration: dry-run never invokes the agent installer', async () => {
  await fixture(async ({ parse, inputs }) => {
    await parse(['--dry-run', '--with-docs']);
    assertEquals(inputs.length, 0);
  });
});

Deno.test('init integration: unsupported host fails before scaffolding', async () => {
  await fixture(async ({ parse, root }) => {
    await assertRejects(() => parse(['--host', 'unknown']), Error, '--host must be one of');
    assertEquals(await new DenoAgentInitFileSystem().exists(root), false);
  });
});

Deno.test('init integration: json emits one scaffold result while still installing agents', async () => {
  await fixture(async ({ parse, inputs }) => {
    const lines: string[] = [];
    const log = console.log;
    console.log = (message: string) => lines.push(message);
    try {
      await parse(['--json']);
    } finally {
      console.log = log;
    }
    assertEquals(inputs.length, 1);
    assertEquals(lines.length, 1);
    assertEquals(JSON.parse(lines[0]).name, 'agent-project');
  });
});
