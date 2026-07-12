import { assertEquals, assertStringIncludes } from '@std/assert';
import { createPluginAdapter } from '@netscript/plugin/adapter';
import type { PluginCliEntrypoint } from '@netscript/plugin/adapter';
import { aiAdapterPlugin } from '../adapter/plugin.ts';

Deno.test('AI CLI self-wires add/list/remove tool and agent resources', async () => {
  await withProject(async (root, cli) => {
    assertEquals((await cli({ command: 'install', flags: { workspaceRoot: root } })).code, 0);
    assertEquals(
      (await cli({ command: 'add', values: ['tool', 'search'], flags: { workspaceRoot: root } }))
        .code,
      0,
    );
    assertEquals(
      (await cli({
        command: 'add',
        values: ['agent', 'researcher'],
        flags: { workspaceRoot: root },
      })).code,
      0,
    );

    const tools = await cli({
      command: 'list',
      values: ['tools'],
      flags: { workspaceRoot: root, json: true },
    });
    assertEquals(tools.data, ['echo', 'search']);
    const agents = await cli({
      command: 'list',
      values: ['agents'],
      flags: { workspaceRoot: root },
    });
    assertEquals(agents.data, ['assistant', 'researcher']);
    assertStringIncludes(await Deno.readTextFile(`${root}/ai/ai.ts`), 'toolRegistry.values()');
    assertStringIncludes(
      await Deno.readTextFile(`${root}/.netscript/generated/plugin-ai/tools.registry.ts`),
      'ai/tools/search.ts',
    );

    assertEquals(
      (await cli({ command: 'remove', values: ['tool', 'search'], flags: { workspaceRoot: root } }))
        .code,
      0,
    );
    assertEquals(await exists(`${root}/ai/tools/search.ts`), false);
    assertEquals(
      (await Deno.readTextFile(`${root}/.netscript/generated/plugin-ai/tools.registry.ts`))
        .includes('search.ts'),
      false,
    );
  });
});

Deno.test('AI CLI manages providers/models and emits compiling configuration shape', async () => {
  await withProject(async (root, cli) => {
    await cli({ command: 'install', flags: { workspaceRoot: root } });
    assertEquals(
      (await cli({
        command: 'provider',
        values: ['add', 'openrouter'],
        flags: { workspaceRoot: root },
      })).code,
      0,
    );
    assertEquals(
      (await cli({
        command: 'model',
        values: ['add', 'reasoning', 'openrouter:openai/gpt-5'],
        flags: { workspaceRoot: root },
      })).code,
      0,
    );
    const listed = await cli({
      command: 'model',
      values: ['list'],
      flags: { workspaceRoot: root, json: true },
    });
    assertEquals(
      (listed.data as { models: Record<string, string> }).models.reasoning,
      'openrouter:openai/gpt-5',
    );
    const source = await Deno.readTextFile(`${root}/ai/models.ts`);
    assertStringIncludes(source, "import '@netscript/ai/openrouter';");
    assertStringIncludes(source, '"reasoning": "openrouter:openai/gpt-5"');
  });
});

Deno.test('AI CLI adds and lists MCP servers whose registry initializes tools', async () => {
  await withProject(async (root, cli) => {
    await cli({ command: 'install', flags: { workspaceRoot: root } });
    const added = await cli({
      command: 'mcp',
      values: ['add', 'docs'],
      flags: { workspaceRoot: root, url: 'https://mcp.example.test', auth: 'DOCS_MCP_TOKEN' },
    });
    assertEquals(added.code, 0);
    assertEquals(
      (await cli({ command: 'mcp', values: ['list'], flags: { workspaceRoot: root } })).data,
      ['docs'],
    );
    assertStringIncludes(
      await Deno.readTextFile(`${root}/ai/mcp/docs.ts`),
      "kind: 'streamable-http'",
    );
    const registry = await Deno.readTextFile(`${root}/ai/mcp/registry.ts`);
    assertStringIncludes(registry, 'registerMcpTools(tools, pool)');
    assertStringIncludes(registry, "from './docs.ts'");
  });
});

async function withProject(
  run: (root: string, cli: PluginCliEntrypoint) => Promise<void>,
): Promise<void> {
  const root = await Deno.makeTempDir();
  try {
    await run(root, createPluginAdapter(aiAdapterPlugin).toCli());
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}
