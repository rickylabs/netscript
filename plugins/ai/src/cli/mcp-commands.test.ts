import { assertEquals, assertRejects, assertStringIncludes, assertThrows } from '@std/assert';
import { artifactText, createPluginAdapter } from '@netscript/plugin/adapter';
import { aiAdapterPlugin } from '../adapter/plugin.ts';
import { emitMcpServer, type McpServerInput } from '../adapter/resources/mcp-server/mcp-server.ts';

Deno.test('MCP emission preserves URL and stdio and resolves service references only at runtime', () => {
  const source = (input: McpServerInput) => artifactText(emitMcpServer(input));
  const http = source({
    id: 'docs',
    transport: 'streamable-http',
    target: 'https://example.test/mcp',
  });
  assertStringIncludes(http, 'url: "https://example.test/mcp"');
  assertEquals(http.includes('getServiceUrl'), false);
  const stdio = source({ id: 'docs', transport: 'stdio', target: 'mcp-docs' });
  assertStringIncludes(stdio, "kind: 'stdio'");
  assertStringIncludes(stdio, 'command: "mcp-docs"');
  assertEquals(stdio.includes('getServiceUrl'), false);
  const service = source({ id: 'orders', transport: 'service', service: 'orders-mcp' });
  assertStringIncludes(service, "from '@netscript/sdk/discovery'");
  assertStringIncludes(service, 'new URL("/mcp", getServiceUrl("orders-mcp", "http")).href');
  assertStringIncludes(service, "kind: 'streamable-http'");
  const secure = source({
    id: 'orders',
    transport: 'service',
    service: 'orders-mcp',
    path: '/api/mcp',
    protocol: 'https',
    authEnv: 'ORDERS_MCP_TOKEN',
  });
  assertStringIncludes(secure, 'new URL("/api/mcp", getServiceUrl("orders-mcp", "https")).href');
  assertStringIncludes(secure, 'Deno.env.get("ORDERS_MCP_TOKEN")');
});

Deno.test('MCP generator rejects invalid service paths, names, protocols and transport targets', () => {
  for (
    const path of [
      '',
      'mcp',
      '//evil.test/mcp',
      '/\\evil',
      '/mcp?key=x',
      '/mcp#part',
      '/..',
      '/a/../mcp',
      '/%2e%2e/mcp',
      '/%2Fhost/mcp',
      '/%5chost',
      '/%zz',
      '/mcp\n',
      '/%00',
    ]
  ) {
    assertThrows(
      () => emitMcpServer({ id: 'orders', transport: 'service', service: 'orders-mcp', path }),
      TypeError,
      '--path',
    );
  }
  for (const service of ['', ' ', 'http://orders', 'orders/mcp', 'orders__http__0']) {
    assertThrows(
      () => emitMcpServer({ id: 'orders', transport: 'service', service }),
      TypeError,
      '--service',
    );
  }
  assertThrows(
    () =>
      emitMcpServer({
        id: 'orders',
        transport: 'service',
        service: 'orders-mcp',
        // @ts-expect-error Direct callers are also guarded at runtime.
        protocol: 'ftp',
      }),
    TypeError,
    '--protocol',
  );
  for (const target of ['', ' ', 'relative/path', 'file:///tmp/mcp', 'ftp://example.test']) {
    assertThrows(
      () => emitMcpServer({ id: 'orders', transport: 'streamable-http', target }),
      TypeError,
    );
  }
  assertThrows(
    () => emitMcpServer({ id: '../orders', transport: 'service', service: 'orders' }),
    TypeError,
  );
  assertThrows(() => emitMcpServer({ id: 'orders', transport: 'stdio', target: ' ' }), TypeError);
});

Deno.test('MCP CLI rejects ambiguous and invalid flags before writing or replacing existing files', async () => {
  const root = await Deno.makeTempDir();
  const cli = createPluginAdapter(aiAdapterPlugin).toCli();
  const invalid: ReadonlyArray<Record<string, string | boolean>> = [
    {},
    { url: '', service: 'orders' },
    { url: false, service: 'orders' },
    { stdio: 'run', service: 'orders' },
    { url: 'https://example.test', stdio: 'run' },
    { service: true },
    { service: '' },
    { service: ' ' },
    { service: 'https://orders' },
    { service: 'orders', path: true },
    { service: 'orders', path: '' },
    { service: 'orders', path: '//evil.test/mcp' },
    { service: 'orders', path: '/..' },
    { service: 'orders', protocol: 'ftp' },
    { service: 'orders', protocol: true },
    { service: 'orders', protocol: '' },
    { service: 'orders', auth: true },
    { url: 'https://example.test', path: '' },
    { stdio: 'run', protocol: false },
    { url: 'file:///tmp/mcp' },
    { stdio: '' },
  ];
  try {
    for (const populated of [false, true]) {
      if (populated) {
        await Deno.mkdir(`${root}/ai/mcp`, { recursive: true });
        await Deno.writeTextFile(`${root}/ai/mcp/orders.ts`, '// existing app config\n');
        await Deno.writeTextFile(`${root}/ai/mcp/registry.ts`, '// existing registry\n');
      }
      for (const flags of invalid) {
        const result = await cli({
          command: 'mcp',
          values: ['add', 'orders'],
          flags: { workspaceRoot: root, ...flags },
        }).catch((error: unknown) => {
          if (!(error instanceof TypeError)) throw error;
          return { code: 1, message: error.message };
        });
        assertEquals(result.code, 1, JSON.stringify(flags));
        assertEquals(typeof result.message, 'string');
        if (populated) {
          assertEquals(
            await Deno.readTextFile(`${root}/ai/mcp/orders.ts`),
            '// existing app config\n',
          );
          assertEquals(
            await Deno.readTextFile(`${root}/ai/mcp/registry.ts`),
            '// existing registry\n',
          );
        } else {
          await assertRejects(() => Deno.stat(`${root}/ai`), Deno.errors.NotFound);
        }
      }
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
