import { assert, assertEquals } from '@std/assert';
import { createMcpCliServer } from '@netscript/mcp/cli';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { FetchUiRegistry } from '../../../../kernel/adapters/ui/fetch-ui-registry.ts';
import { createPublicCommandDependencies } from '../../root/public-command-dependencies.ts';
import { createAgentMcpOptions } from './run-agent-mcp.ts';
import { createCliUiRegistryCatalog } from './create-cli-ui-registry-catalog.ts';

Deno.test('CLI MCP registry tools share app namespaces and environment-backed transport without writes', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/app/components.json',
    JSON.stringify({
      registries: {
        '@acme': {
          url: 'https://registry.example/{name}.json',
          headers: {
            Authorization: 'Bearer ${MCP_REGISTRY_TOKEN}',
          },
        },
      },
    }),
  );
  const secret = 'fixture-mcp-registry-secret';
  const authorization: Array<string | null> = [];
  const item = {
    name: 'x',
    type: 'registry:component',
    files: [{
      path: 'x.tsx',
      type: 'registry:component',
      target: '@ui/x.tsx',
      content: 'export const X = () => null;',
    }],
  };
  const transport = new FetchUiRegistry(
    (key) => key === 'MCP_REGISTRY_TOKEN' ? secret : undefined,
    (url, init) => {
      authorization.push(new Headers(init?.headers).get('Authorization'));
      return Promise.resolve(
        Response.json(
          String(url).endsWith('/registry.json')
            ? { name: 'acme', homepage: 'https://registry.example/', items: [item] }
            : item,
        ),
      );
    },
  );
  const before = new Map(fs.getFiles());
  const server = createMcpCliServer({
    projectRoot: '/app',
    uiRegistryCatalog: createCliUiRegistryCatalog('/app', fs, transport),
  });
  const results = [];
  for (
    const [name, input] of [
      ['search_registry_items', { query: '@acme/x' }],
      ['view_registry_item', { name: '@acme/x' }],
      ['get_registry_add_command', { name: '@acme/x' }],
    ] as const
  ) {
    results.push(
      await server.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name, arguments: input },
      }),
    );
  }
  assertEquals(results[0]?.result?.structuredContent, {
    items: [{ name: '@acme/x', type: 'registry:component' }],
    total: 1,
  });
  assertEquals(results[1]?.result?.structuredContent, { item });
  assertEquals(results[2]?.result?.structuredContent, {
    command: 'netscript',
    args: ['ui:add', '@acme/x'],
  });
  assertEquals(authorization, [`Bearer ${secret}`, `Bearer ${secret}`]);
  assert(!JSON.stringify(results).includes(secret));
  assertEquals(fs.getFiles(), before);
});

Deno.test('CLI MCP default composition wires an offline app catalog', async () => {
  const root = '/fixture-without-ui-config';
  const dependencies = createPublicCommandDependencies({
    cwd: () => root,
    resolvePath: () => root,
  });
  const options = createAgentMcpOptions({ projectRoot: root }, dependencies);
  assert(options.uiRegistryCatalog);
  const items = await options.uiRegistryCatalog.list();
  assert(items.some((item) => item.name === 'style-utility'));
  assertEquals(await options.uiRegistryCatalog.view('absent'), undefined);
  assertEquals((await options.uiRegistryCatalog.view('cn'))?.name, 'cn');
});
