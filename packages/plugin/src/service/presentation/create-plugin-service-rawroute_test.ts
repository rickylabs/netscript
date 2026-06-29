import { assertEquals } from '@std/assert';
import type { ServiceContext } from '@netscript/service';
import { createPluginService } from '../mod.ts';

// Slice S180a: prove the raw-route + serveRpc capability on createPluginService.
// Both tests boot a real listener via .serve({ port: 0 }) and exercise the app
// in-memory via running.app.request(...), then await running.stop().

Deno.test('proxy/passthrough mode: serveRpc=false routes everything through the catch-all', async () => {
  const running = await createPluginService(
    {},
    {
      name: 'proxy-test',
      serveRpc: false,
      rawRoutes: [
        {
          method: 'all',
          path: '/*',
          handler: (c: ServiceContext) => c.text('proxied:' + new URL(c.req.url).pathname),
        },
      ],
    },
  ).serve({ port: 0 });

  try {
    // Arbitrary path is handled by the catch-all proxy.
    const anything = await running.app.request('/anything');
    assertEquals(anything.status, 200);
    assertEquals(await anything.text(), 'proxied:/anything');

    // The local /health endpoint still wins over the catch-all.
    const health = await running.app.request('/health');
    assertEquals(health.status, 200);
    const healthBody = await health.json();
    assertEquals(healthBody.status, 'healthy');

    // With serveRpc:false, withRPC was skipped, so /api/rpc/* is NOT intercepted
    // by the oRPC handler and falls through to the catch-all proxy.
    const rpcPath = await running.app.request('/api/rpc/x');
    assertEquals(rpcPath.status, 200);
    assertEquals(await rpcPath.text(), 'proxied:/api/rpc/x');
  } finally {
    await running.stop();
  }
});

Deno.test('mixed mode: a raw webhook route coexists with the default withRPC wiring', async () => {
  const running = await createPluginService(
    {},
    {
      name: 'webhook-test',
      // serveRpc defaults to true here; withRPC is wired alongside the raw route.
      openApi: { title: 'Webhook Test API' },
      rawRoutes: [
        {
          method: 'post',
          path: '/webhook/:id',
          handler: async (c: ServiceContext) =>
            c.json({ id: c.req.param('id'), body: await c.req.text() }),
        },
      ],
    },
  ).serve({ port: 0 });

  try {
    // The raw POST route receives the UNPARSED request body (no oRPC Zod parse).
    const rawBody = 'plain-text-payload-not-json';
    const webhook = await running.app.request('/webhook/abc', {
      method: 'POST',
      body: rawBody,
    });
    assertEquals(webhook.status, 200);
    const webhookBody = await webhook.json();
    assertEquals(webhookBody.id, 'abc');
    assertEquals(webhookBody.body, rawBody);

    // The default withRPC path is still wired: /health coexists.
    const health = await running.app.request('/health');
    assertEquals(health.status, 200);
    const healthBody = await health.json();
    assertEquals(healthBody.status, 'healthy');
  } finally {
    await running.stop();
  }
});
