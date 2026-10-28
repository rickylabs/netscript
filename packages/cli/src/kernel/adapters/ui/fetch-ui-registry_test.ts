import { assert, assertEquals, assertRejects } from '@std/assert';
import { FetchUiRegistry } from './fetch-ui-registry.ts';

Deno.test('registry HTTP adapter sends environment auth to the fixture but never exposes it on failures', async () => {
  const credential = crypto.randomUUID();
  const name = `S2_TEST_${crypto.randomUUID().replaceAll('-', '_')}`;
  Deno.env.set(name, credential);
  const headersSeen: string[] = [];
  const server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen: () => {} }, (request) => {
    headersSeen.push(request.headers.get('Authorization') ?? '');
    if (new URL(request.url).pathname === '/bad') return new Response(credential, { status: 403 });
    if (new URL(request.url).pathname === '/redirect') {
      return new Response(null, { status: 302, headers: { Location: '/bad' } });
    }
    return Response.json({ name: 'x', type: 'registry:ui' });
  });
  const transport = new FetchUiRegistry();
  const templates = { Authorization: `Bearer \${${name}}` };
  const base = `http://127.0.0.1:${server.addr.port}`;
  try {
    assertEquals(JSON.parse(await transport.read(base + '/x', templates)).name, 'x');
    for (const path of ['/bad', '/redirect']) {
      const error = await assertRejects(() => transport.read(base + path, templates));
      assert(!String(error).includes(credential));
    }
    assertEquals(headersSeen, Array(3).fill(`Bearer ${credential}`));
    assertEquals(templates.Authorization, `Bearer \${${name}}`);
  } finally {
    Deno.env.delete(name);
    await server.shutdown();
  }
});
