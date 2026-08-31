import { assertEquals, assertNotEquals } from '@std/assert';

import {
  type DynamicRouteResponseEvidence,
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
