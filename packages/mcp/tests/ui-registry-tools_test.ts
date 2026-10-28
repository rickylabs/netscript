import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { createMcpCliServer } from '../cli.ts';
import { createMcpServer, createUiRegistryFlows, type UiRegistryCatalogPort } from '../mod.ts';
import { FreshUiRegistryCatalog } from '../src/infrastructure/fresh-ui-registry-catalog.ts';
import { isRecord } from '../src/domain/schema.ts';

const catalog: UiRegistryCatalogPort = {
  list: () =>
    Promise.resolve(Array.from({ length: 25 }, (_, index) => ({
      name: `widget-${index}`,
      type: 'registry:ui',
      description: 'Useful widget',
    }))),
  view: (name) =>
    Promise.resolve(
      name === 'widget-1'
        ? {
          name,
          type: 'registry:ui',
          files: [{ path: 'widget.ts', content: 'export const widget = 1;' }],
        }
        : undefined,
    ),
};

function server(port: UiRegistryCatalogPort = catalog) {
  return createMcpServer({
    probe: { probe: () => Promise.resolve({ reachable: false, message: 'offline fixture' }) },
    flows: createUiRegistryFlows(port),
  });
}

async function call(name: string, input: unknown = {}, port: UiRegistryCatalogPort = catalog) {
  const response = await server(port).handle({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name, arguments: input },
  });
  assert(response);
  return response;
}

Deno.test('registry tools advertise input and output schemas in tools/list', async () => {
  const response = await server().handle({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
  assert(response?.result && Array.isArray(response.result.tools));
  for (
    const name of [
      'list_registry_items',
      'search_registry_items',
      'view_registry_item',
      'get_registry_add_command',
    ]
  ) {
    const tool = response.result.tools.find((value: unknown) =>
      isRecord(value) && value.name === name
    );
    assert(isRecord(tool) && isRecord(tool.inputSchema) && isRecord(tool.outputSchema));
  }
});

Deno.test('registry list and search paginate bounded metadata without source bytes', async () => {
  const first = await call('list_registry_items');
  assertEquals(first.result?.structuredContent, {
    items: (await catalog.list()).slice(0, 20),
    total: 25,
    nextOffset: 20,
  });
  const second = await call('list_registry_items', { offset: 20, limit: 10 });
  assertEquals(second.result?.structuredContent, {
    items: (await catalog.list()).slice(20),
    total: 25,
  });
  const search = await call('search_registry_items', { query: 'WIDGET-24' });
  assertEquals(search.result?.structuredContent, { items: [(await catalog.list())[24]], total: 1 });
  for (const input of [{ limit: 21 }, { offset: -1 }, { unexpected: true }]) {
    assertEquals((await call('list_registry_items', input)).error?.code, -32602);
  }
  assertEquals((await call('search_registry_items', { query: '' })).error?.code, -32602);
});

Deno.test('registry view returns portable payloads and structured not-found errors', async () => {
  assertEquals((await call('view_registry_item', { name: 'widget-1' })).result?.structuredContent, {
    item: await catalog.view('widget-1'),
  });
  assertEquals((await call('view_registry_item', { name: 'absent' })).result?.structuredContent, {
    code: 'REGISTRY_ITEM_NOT_FOUND',
    message: 'Registry item not found.',
  });
});

Deno.test('registry add tool returns argv for names, namespaces and URLs without catalog reads', async () => {
  const noReads: UiRegistryCatalogPort = {
    list: () => {
      throw new Error('Unexpected registry read');
    },
    view: () => {
      throw new Error('Unexpected registry read');
    },
  };
  for (const name of ['button', '@acme/x', 'https://registry.example/items/x.json']) {
    assertEquals(
      (await call('get_registry_add_command', { name }, noReads)).result?.structuredContent,
      { command: 'netscript', args: ['ui:add', name] },
    );
  }
  for (
    const name of [
      '--force',
      'x;touch secret',
      '$(pwd)',
      'file:///etc/passwd',
      'https://user:password@example.com/x.json',
      'https://registry.example/x.json?token=secret',
      'https://registry.example/x.json#secret',
    ]
  ) {
    assertEquals((await call('get_registry_add_command', { name })).result?.isError, true);
  }
});

Deno.test('registry catalog errors never expose transport authentication details', async () => {
  const secret = 'fixture-secret-value';
  const broken: UiRegistryCatalogPort = {
    list: () => Promise.reject(new Error(secret)),
    view: () => Promise.reject(new Error(secret)),
  };
  for (const name of ['list_registry_items', 'search_registry_items', 'view_registry_item']) {
    const response = await call(
      name,
      name === 'search_registry_items'
        ? { query: 'x' }
        : name === 'view_registry_item'
        ? { name: 'x' }
        : {},
      broken,
    );
    assertEquals(response.result?.isError, true);
    assert(!JSON.stringify(response).includes(secret));
  }
});

Deno.test('default MCP composition serves embedded registry metadata and exact copy bytes offline', async () => {
  const embedded = new FreshUiRegistryCatalog();
  const items = await embedded.list();
  assert(items.some((item) => item.name === 'style-utility'));
  const view = await embedded.view('cn');
  assert(isRecord(view));
  assertStringIncludes(JSON.stringify(view), 'clsx');
  const composed = createMcpCliServer();
  const response = await composed.handle({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: 'view_registry_item', arguments: { name: 'cn' } },
  });
  assertEquals(response?.result?.isError, false);
});

Deno.test('default MCP registry view preserves full component and stylesheet bytes', async () => {
  const { FRESH_UI_REGISTRY_CONTENT } = await import('@netscript/fresh-ui/registry');
  const composed = createMcpCliServer();
  const response = await composed.handle({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: { name: 'view_registry_item', arguments: { name: 'button' } },
  });
  assertEquals(response?.result?.isError, false);
  const value = response?.result?.structuredContent;
  assert(isRecord(value) && isRecord(value.item) && Array.isArray(value.item.files));
  let longFiles = 0;
  for (const file of value.item.files) {
    assert(isRecord(file) && typeof file.path === 'string');
    const source = FRESH_UI_REGISTRY_CONTENT[file.path.replace(/^packages\/fresh-ui\//, '')];
    assertEquals(file.content, source);
    if (source && source.length > 2000) longFiles++;
  }
  assert(longFiles >= 2, 'The fixture must cover both long component and stylesheet sources.');
});

Deno.test('registry view fails structurally rather than truncating an oversized item', async () => {
  for (const byteCount of [40000, 100000]) {
    const oversized: UiRegistryCatalogPort = {
      list: () => Promise.resolve([]),
      view: () =>
        Promise.resolve({
          name: 'large',
          type: 'registry:file',
          files: [
            { path: 'large.ts', content: 'x'.repeat(byteCount) },
          ],
        }),
    };
    const response = await call('view_registry_item', { name: 'large' }, oversized);
    assertEquals(response.error?.code, -32603);
    assert(isRecord(response.error?.data));
    assertEquals(response.error.data.code, 'tool_result_too_large');
    assertEquals(response.result, undefined);
  }
});
