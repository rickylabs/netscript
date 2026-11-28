import { assertEquals, assertRejects } from '@std/assert';
import { baseContract } from '@netscript/contracts';
import { z } from 'zod';
import { createHttpClientLink } from '../../src/client/http-client-link.ts';
import { createServiceClient } from '../../src/client/service-client.ts';
import { defineSdkClientContribution } from '../../src/client/sdk-client-contribution.ts';
import { resolveTransportPolicy } from '../../src/internal/transport-policy.ts';

const contract = {
  mutate: baseContract
    .route({ method: 'POST', path: '/mutate' })
    .input(z.object({ secret: z.string() }))
    .output(z.object({ ok: z.boolean() })),
  read: baseContract
    .route({ method: 'GET', path: '/read' })
    .input(z.object({ id: z.string() }))
    .output(z.object({ ok: z.boolean() })),
};

const apiKeyContribution = defineSdkClientContribution<{ readonly apiKey: string }>()({
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: 'test:api-key',
  context: { apiKey: 'required' },
  headerKeys: ['x-api-key'],
  responseCache: { mode: 'direct-only' },
  prepare: ({ context }) => ({
    headers: { 'x-api-key': context.apiKey },
  }),
});

Deno.test({
  name:
    'createServiceClient enforces redirect: error on live cross-origin 307 redirects with zero foreign requests',
  sanitizeOps: true,
  sanitizeResources: true,
  sanitizeExit: true,
  fn: async () => {
    let foreignHits = 0;
    const foreignServer = Deno.serve(
      { hostname: '127.0.0.1', port: 0, onListen: () => {} },
      () => {
        foreignHits += 1;
        return new Response(JSON.stringify({ json: { ok: true } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      },
    );

    const foreignOrigin = `http://127.0.0.1:${foreignServer.addr.port}`;
    let redirectorHits = 0;
    const redirectServer = Deno.serve(
      { hostname: '127.0.0.1', port: 0, onListen: () => {} },
      async (request) => {
        redirectorHits += 1;
        await request.body?.cancel();
        return new Response(null, {
          status: 307,
          headers: {
            location: `${foreignOrigin}/stolen`,
          },
        });
      },
    );

    try {
      const redirectOrigin = `http://127.0.0.1:${redirectServer.addr.port}`;
      const client = createServiceClient({
        contract,
        serviceName: 'redirect-guard-test',
        resolveServiceUrl: () => redirectOrigin,
        contributions: [apiKeyContribution] as const,
      });

      // POST RPC call with body + custom contributed header + traceparent rejects with TypeError.
      await assertRejects(
        () =>
          client.mutate(
            { secret: 'do-not-leak' },
            {
              context: {
                apiKey: 'secret-api-key-123',
                traceHeaders: {
                  traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
                },
              },
            },
          ),
        TypeError,
      );

      // GET RPC call with custom contributed header also rejects with TypeError.
      await assertRejects(
        () =>
          client.read(
            { id: 'item-1' },
            {
              context: {
                apiKey: 'secret-api-key-123',
              },
            },
          ),
        TypeError,
      );

      assertEquals(redirectorHits, 2);
      assertEquals(foreignHits, 0);
    } finally {
      await redirectServer.shutdown();
      await foreignServer.shutdown();
    }
  },
});

Deno.test({
  name: 'createHttpClientLink enforces redirect: error after spreading init',
  sanitizeOps: true,
  sanitizeResources: true,
  sanitizeExit: true,
  fn: async () => {
    const observedRedirects: Array<RequestRedirect | undefined> = [];
    const link = createHttpClientLink({
      transportPolicy: resolveTransportPolicy(contract),
      serviceName: 'redirect-init-order',
      rpcPath: '/api/rpc',
      protocol: 'http',
      propagateTraceContext: false,
      getTraceHeaders: () => ({}),
      resolveServiceUrl: () => 'http://127.0.0.1:9',
      fetch: (_request, init) => {
        observedRedirects.push(init?.redirect);
        return Promise.resolve(
          new Response(JSON.stringify({ json: { ok: true } }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        );
      },
    });

    const result = await link.call(['mutate'], { secret: 'ok' }, {
      context: {},
    });
    assertEquals(result, { ok: true });
    assertEquals(observedRedirects, ['error']);
  },
});
