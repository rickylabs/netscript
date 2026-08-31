import { assertEquals, assertNotEquals, assertRejects } from '@std/assert';

import {
  type DynamicRouteResponseEvidence,
  probeAppDynamicRoute,
  validateDynamicRouteResponse,
} from '../../../src/application/gates/scaffold/runtime/probe-app-dynamic-route.ts';

const nonce = `order-${crypto.randomUUID()}`;
assertNotEquals(nonce, 'order-42');

function evidence(
  mode: DynamicRouteResponseEvidence['mode'],
  status: number,
  body: string,
): DynamicRouteResponseEvidence {
  return { mode, nonce, status, body };
}

for (const mode of ['plain', 'partial'] as const) {
  Deno.test(`dynamic route validator accepts a valid ${mode} response`, () => {
    const result = validateDynamicRouteResponse(
      evidence(
        mode,
        200,
        `<main data-order-id="${nonce}"><a href="/examples/orders/${nonce}">self</a></main>`,
      ),
    );

    assertEquals(result, { ok: true });
  });
}

Deno.test('dynamic route validator rejects an href-only response as missing the path marker', () => {
  const result = validateDynamicRouteResponse(
    evidence('plain', 200, `<a href="/examples/orders/${nonce}">self</a>`),
  );

  assertEquals(result.ok, false);
  if (result.ok) throw new Error('expected a semantic rejection');
  assertEquals(result.failure, 'path-marker');
});

Deno.test('dynamic route validator rejects an id-only response as missing the href marker', () => {
  const result = validateDynamicRouteResponse(
    evidence('partial', 200, `<main data-order-id="${nonce}">order</main>`),
  );

  assertEquals(result.ok, false);
  if (result.ok) throw new Error('expected a semantic rejection');
  assertEquals(result.failure, 'href-marker');
});

Deno.test('dynamic route validator rejects HTTP 500 before inspecting markers', () => {
  const result = validateDynamicRouteResponse(
    evidence(
      'plain',
      500,
      `<main data-order-id="${nonce}"><a href="/examples/orders/${nonce}">self</a></main>`,
    ),
  );

  assertEquals(result.ok, false);
  if (result.ok) throw new Error('expected a semantic rejection');
  assertEquals(result.failure, 'status');
});

Deno.test('dynamic route probe uses one nonce for plain and Fresh partial GETs', async () => {
  const requestNonce = `order-${crypto.randomUUID()}`;
  assertNotEquals(requestNonce, 'order-42');
  const observed: Array<{ readonly url: string; readonly headers: Headers }> = [];
  let nonceCalls = 0;

  await probeAppDynamicRoute('/workspace/project', 'inventory-web', '/workspace/apphost.mts', {
    resolveLiveUrls: () => Promise.resolve(['http://localhost:41234/']),
    createNonce: () => {
      nonceCalls++;
      return requestNonce;
    },
    fetchUrl: (input, init) => {
      const url = String(input);
      observed.push({ url, headers: new Headers(init?.headers) });
      return Promise.resolve(
        new Response(
          `<main data-order-id="${requestNonce}"><a href="/examples/orders/${requestNonce}">self</a></main>`,
          { status: 200, headers: { 'content-type': 'text/html' } },
        ),
      );
    },
    log: () => {},
  });

  assertEquals(nonceCalls, 1);
  assertEquals(observed.map((request) => request.url), [
    `http://localhost:41234/examples/orders/${requestNonce}`,
    `http://localhost:41234/examples/orders/${requestNonce}?fresh-partial=true`,
  ]);
  assertEquals(observed.every((request) => request.headers.get('accept') === 'text/html'), true);
  assertEquals(observed.every((request) => request.headers.get('fresh-partial') === null), true);
});

Deno.test('dynamic route probe fails when endpoint resolution yields zero candidates', async () => {
  await assertRejects(
    () =>
      probeAppDynamicRoute('/workspace/project', 'inventory-web', '/workspace/apphost.mts', {
        resolveLiveUrls: () => Promise.resolve([]),
      }),
    Error,
    'No live URL resolved for generated app inventory-web.',
  );
});
