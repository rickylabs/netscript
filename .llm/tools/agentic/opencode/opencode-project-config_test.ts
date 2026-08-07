import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import { join } from '@std/path';
import {
  discoverOpenCodeProjectAttachment,
  mergeOpenCodeInlineConfig,
  prepareOpenCodeProjectEnvironment,
  translateGeneratedMcp,
} from './opencode-project-config.ts';

Deno.test('generated MCP translation is stable, multi-server, and complete', () => {
  assertEquals(
    translateGeneratedMcp({
      mcpServers: {
        netscript: { command: 'deno', args: ['run', '-A', 'server.ts'], env: { MODE: 'docs' } },
        aspire: { command: 'aspire', args: ['agent', 'mcp'], disabled: false },
      },
    }),
    {
      aspire: { type: 'local', command: ['aspire', 'agent', 'mcp'], enabled: true },
      netscript: {
        type: 'local',
        command: ['deno', 'run', '-A', 'server.ts'],
        environment: { MODE: 'docs' },
      },
    },
  );
});

Deno.test('generated MCP translation rejects malformed or unsupported entries', () => {
  for (
    const fixture of [
      {},
      { mcpServers: {} },
      { mcpServers: { netscript: { command: '' } } },
      { mcpServers: { netscript: { command: 'deno', args: [1] } } },
      { mcpServers: { netscript: { command: 'deno', type: 'http' } } },
      { mcpServers: { netscript: { command: 'deno', env: { TOKEN: 1 } } } },
    ]
  ) assertThrows(() => translateGeneratedMcp(fixture));
});

Deno.test('inline overlay preserves isolation keys and project MCP wins collisions', () => {
  const merged = mergeOpenCodeInlineConfig(
    JSON.stringify({
      provider: { owned: { token: '{env:PRIVATE}' } },
      permission: { edit: 'deny' },
      model: 'owned/model',
      mcp: { netscript: { type: 'remote', url: 'https://wrong.test' }, other: { enabled: true } },
      plugin: ['file:///prior.ts'],
    }),
    { netscript: { type: 'local', command: ['deno', 'run', 'server.ts'] } },
  );
  assertEquals(merged.provider, { owned: { token: '{env:PRIVATE}' } });
  assertEquals(merged.permission, { edit: 'deny' });
  assertEquals(merged.model, 'owned/model');
  assertEquals(merged.mcp, {
    netscript: { type: 'local', command: ['deno', 'run', 'server.ts'] },
    other: { enabled: true },
  });
  assertEquals((merged.plugin as string[])[0], 'file:///prior.ts');
  assertEquals((merged.plugin as string[]).length, 2);
});

Deno.test('inline overlay rejects malformed and colliding non-object config', () => {
  assertThrows(() => mergeOpenCodeInlineConfig('{', {}), Error, 'malformed JSON');
  assertThrows(() => mergeOpenCodeInlineConfig('{"mcp":[]}', {}), Error, '.mcp');
  assertThrows(() => mergeOpenCodeInlineConfig('{"plugin":"bad"}', {}), Error, '.plugin');
});

Deno.test('discovery uses nearest config and stops at the project boundary', async () => {
  const root = await Deno.makeTempDir();
  try {
    const nested = join(root, 'src', 'feature');
    await Deno.mkdir(nested, { recursive: true });
    await Deno.writeTextFile(join(root, 'deno.json'), '{}');
    await Deno.writeTextFile(
      join(root, '.mcp.json'),
      JSON.stringify({ mcpServers: { root: { command: 'root' } } }),
    );
    await Deno.writeTextFile(
      join(root, 'src', '.mcp.json'),
      JSON.stringify({ mcpServers: { nearest: { command: 'near' } } }),
    );
    const found = await discoverOpenCodeProjectAttachment(nested);
    assertEquals(found?.projectRoot, join(root, 'src'));
    assertEquals(Object.keys(found?.servers ?? {}), ['nearest']);

    await Deno.remove(join(root, 'src', '.mcp.json'));
    assertEquals((await discoverOpenCodeProjectAttachment(nested))?.projectRoot, root);

    await Deno.remove(join(root, '.mcp.json'));
    assertEquals(await discoverOpenCodeProjectAttachment(nested), undefined);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('discovery fails closed on malformed nearest config', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(join(root, '.mcp.json'), '{broken');
    await assertRejects(
      () => discoverOpenCodeProjectAttachment(root),
      Error,
      'malformed JSON',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('prepared environment retains credential/provider isolation and adds owned receipt path', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(
      join(root, '.mcp.json'),
      JSON.stringify({ mcpServers: { netscript: { command: 'deno', args: ['server.ts'] } } }),
    );
    const env = await prepareOpenCodeProjectEnvironment(
      {
        OPENROUTER_API_KEY: 'opaque',
        OPENCODE_CONFIG: '/external/config.jsonc',
        OPENCODE_CONFIG_CONTENT: '{"permission":{"edit":"deny"}}',
      },
      { cwd: root, receiptPath: '.receipts/run.jsonl' },
    );
    assertEquals(env.OPENROUTER_API_KEY, 'opaque');
    assertEquals(env.OPENCODE_CONFIG, '/external/config.jsonc');
    assertEquals(env.NETSCRIPT_OPENCODE_RECEIPT, join(root, '.receipts/run.jsonl'));
    const inline = JSON.parse(env.OPENCODE_CONFIG_CONTENT);
    assertEquals(inline.permission, { edit: 'deny' });
    assertEquals(inline.mcp.netscript.command, ['deno', 'server.ts']);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
