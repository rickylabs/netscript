/**
 * Smoke test for the converged streams connector serving surface.
 *
 * Boots `createPluginService({}, { serveRpc: false, rawRoutes, healthChecks })`
 * on an ephemeral port fronting a tiny local upstream (standing in for the
 * `DurableStreamTestServer`) and asserts:
 *   - `/health` reports healthy (upstream-reachability health check passes)
 *   - an arbitrary path is transparently proxied to the upstream
 *   - `GET /` returns NetScript service-info (the accepted behavior delta)
 *
 * @module
 */

import { getAvailablePort } from '@std/net';

function assertEquals<T>(actual: T, expected: T): void {
  if (actual !== expected) {
    throw new Error(`Assertion failed: expected ${String(expected)}, got ${String(actual)}`);
  }
}
import { type Context, Hono } from 'hono';
import { healthChecks } from '@netscript/service';
import { createPluginService } from '@netscript/plugin/service';

Deno.test('streams connector: health, proxy, and service-info delta', async () => {
  // ── Tiny local upstream standing in for DurableStreamTestServer ─────
  const internalPort = await getAvailablePort();
  const upstream = new Hono();
  upstream.get('/', (c: Context) => c.text('upstream-root'));
  upstream.all('/*', (c: Context) => c.json({ proxied: true, path: new URL(c.req.url).pathname }));
  const upstreamServer = Deno.serve({ port: internalPort, hostname: '127.0.0.1' }, upstream.fetch);

  const upstreamCheck = healthChecks.custom('durable-streams-server', async () => {
    const res = await fetch(`http://127.0.0.1:${internalPort}/`);
    await res.body?.cancel();
    return res.status < 500;
  });

  const proxyHandler = async (c: Context): Promise<Response> => {
    const url = new URL(c.req.url);
    const target = `http://127.0.0.1:${internalPort}${url.pathname}${url.search}`;
    const proxyReq = new Request(target, {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.raw.body,
      // @ts-ignore Deno supports duplex on Request
      duplex: c.req.raw.body ? 'half' : undefined,
    });
    return await fetch(proxyReq);
  };

  const front = await getAvailablePort();
  const running = await createPluginService({}, {
    name: 'streams',
    version: '0.0.0-test',
    port: front,
    serveRpc: false,
    cors: { origin: '*' },
    healthChecks: [upstreamCheck],
    rawRoutes: [{ method: 'all', path: '/*', handler: proxyHandler }],
    onShutdown: [async () => {
      await upstreamServer.shutdown();
    }],
  }).serve();

  try {
    const base = `http://127.0.0.1:${running.addr.port}`;

    // /health is served by withHealth and reports healthy.
    const health = await fetch(`${base}/health`);
    const healthBody = await health.json() as { status?: string };
    assertEquals(health.status, 200);
    assertEquals(healthBody.status, 'healthy');

    // An arbitrary path is transparently proxied to the upstream.
    const proxied = await fetch(`${base}/v1/stream/anything`);
    const proxiedBody = await proxied.json() as { proxied?: boolean; path?: string };
    assertEquals(proxied.status, 200);
    assertEquals(proxiedBody.proxied, true);
    assertEquals(proxiedBody.path, '/v1/stream/anything');

    // GET / now returns NetScript service-info (accepted delta), not the
    // upstream root.
    const root = await fetch(`${base}/`);
    const rootBody = await root.json() as { service?: string };
    assertEquals(root.status, 200);
    assertEquals(rootBody.service, 'streams');
  } finally {
    await running.stop();
  }
});
