import { assertEquals } from '@std/assert';
import { definePage } from '../../builders/mod.ts';
import { defineRouteContract } from '../../route/mod.ts';
import { createMockDeferPolicy, createMockRouteContext } from '../../testing.ts';

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
