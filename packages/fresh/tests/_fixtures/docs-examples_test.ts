import { assertEquals } from '@std/assert';
import { definePage } from '../../src/application/builders/mod.ts';
import { defineRouteContract } from '../../src/application/route/mod.ts';
import { createMockDeferPolicy, createMockRouteContext } from '../../src/testing/mod.ts';

Deno.test('README quick-start symbols are importable', () => {
  const route = defineRouteContract().bind('/orders');
  const ordersPage = definePage()
    .withRoute(route)
    .withMeta(() => ({ title: 'Orders' }))
    .build();

  assertEquals(typeof ordersPage, 'object');
  assertEquals(createMockRouteContext().routePattern, '/');
  assertEquals(createMockDeferPolicy(), 'balanced');
});
