import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { toFileUrl } from '@std/path';
import { createPluginAdapter } from '@netscript/plugin/adapter';
import { createMcpTransport, type McpTransportConfig } from '@netscript/ai/mcp';
import { aiAdapterPlugin } from '../adapter/plugin.ts';

Deno.test('generated MCP service config lists and calls tools over real HTTP discovery', async () => {
  const root = await Deno.makeTempDir();
  const service = `fixture-${crypto.randomUUID()}`;
  const envKey = `services__${service}__http__0`;
  const authKey = `MCP_FIXTURE_${crypto.randomUUID().replaceAll('-', '_')}`;
  const requests: { method: string; path: string; auth: string | null; params: unknown }[] = [];
  const server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen() {} }, async (request) => {
    if (request.method !== 'POST') return new Response(null, { status: 405 });
    const message = await request.json();
    requests.push({
      method: message.method,
      path: new URL(request.url).pathname,
      auth: request.headers.get('authorization'),
      params: message.params,
    });
    if (!('id' in message)) return new Response(null, { status: 202 });
    if (!['initialize', 'tools/list', 'tools/call'].includes(message.method)) {
      return Response.json({
        jsonrpc: '2.0',
        id: message.id,
        error: { code: -32601, message: 'Method not found' },
      });
    }
    const result = message.method === 'initialize'
      ? {
        protocolVersion: message.params.protocolVersion,
        capabilities: { tools: {} },
        serverInfo: { name: 'orders-fixture', version: '1.0.0' },
      }
      : message.method === 'tools/list'
      ? {
        tools: [{
          name: 'lookup-order',
          description: 'Read a fixture order',
          inputSchema: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] },
        }],
      }
      : message.method === 'tools/call'
      ? { content: [{ type: 'text', text: `Order ${message.params.arguments.id}` }] }
      : {};
    return Response.json({ jsonrpc: '2.0', id: message.id, result });
  });
  let transport: ReturnType<typeof createMcpTransport> | undefined;
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(new Error('MCP fixture timed out')), 15_000);
  try {
    const cli = createPluginAdapter(aiAdapterPlugin).toCli();
    assertEquals(
      (await cli({
        command: 'mcp',
        values: ['add', 'orders'],
        flags: {
          workspaceRoot: root,
          service,
          path: '/api/mcp',
          auth: authKey,
        },
      })).code,
      0,
    );
    // A trailing discovery path is deliberately replaced by the explicit MCP path.
    Deno.env.set(envKey, `http://127.0.0.1:${server.addr.port}/discovery-base/`);
    Deno.env.set(authKey, 'Bearer fixture-token');
    const { config } = await import(toFileUrl(`${root}/ai/mcp/orders.ts`).href) as {
      config: McpTransportConfig;
    };
    assertEquals(config.kind, 'streamable-http');
    assert(config.kind === 'streamable-http');
    assertEquals(config.url, `http://127.0.0.1:${server.addr.port}/api/mcp`);
    transport = createMcpTransport(config);
    const tools = await transport.listTools({ signal: abort.signal });
    assertEquals(tools.length, 1);
    assertEquals(tools[0].serverId, 'orders');
    assertEquals(tools[0].remoteName, 'lookup-order');
    assertStringIncludes(tools[0].name, 'orders');
    const result = await transport.callTool(tools[0].name, { id: 42 }, { signal: abort.signal });
    assertEquals(result.state, 'complete');
    assertStringIncludes(result.content, 'Order 42');
    const methods = requests.map((r) => r.method);
    assertEquals(methods.filter((method) => method === 'initialize').length, 1);
    assert(methods.includes('notifications/initialized'));
    assert(methods.includes('tools/list'));
    assertEquals(methods.filter((method) => method === 'tools/call').length, 1);
    assert(
      requests.every((r) => r.path === '/api/mcp' && r.auth === 'Bearer fixture-token'),
      JSON.stringify(requests),
    );
    assertEquals(requests.at(-1)?.params, { name: 'lookup-order', arguments: { id: 42 } });
  } finally {
    clearTimeout(timeout);
    abort.abort();
    try {
      await transport?.stop();
    } finally {
      await server.shutdown();
      Deno.env.delete(envKey);
      Deno.env.delete(authKey);
      await Deno.remove(root, { recursive: true });
    }
  }
});

Deno.test('generated service config selects HTTPS and fails missing discovery without fallback', async () => {
  const root = await Deno.makeTempDir();
  const service = `fixture-${crypto.randomUUID()}`;
  const envKey = `services__${service}__https__0`;
  try {
    const cli = createPluginAdapter(aiAdapterPlugin).toCli();
    const add = (id: string) =>
      cli({
        command: 'mcp',
        values: ['add', id],
        flags: {
          workspaceRoot: root,
          service,
          protocol: 'https',
        },
      });
    assertEquals((await add('missing')).code, 0);
    await assertRejects(() => import(toFileUrl(`${root}/ai/mcp/missing.ts`).href), Error, envKey);
    Deno.env.set(envKey, 'https://discovered.example.test:12345/base');
    assertEquals((await add('secure')).code, 0);
    const { config } = await import(toFileUrl(`${root}/ai/mcp/secure.ts`).href) as {
      config: McpTransportConfig;
    };
    assert(config.kind === 'streamable-http');
    assertEquals(config.url, 'https://discovered.example.test:12345/mcp');
  } finally {
    Deno.env.delete(envKey);
    await Deno.remove(root, { recursive: true });
  }
});
