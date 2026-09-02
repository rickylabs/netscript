import { assertEquals, assertFalse } from '@std/assert';
import {
  normalizeResourceSliceInput,
  type ResourceSliceOptionalVariant,
} from './resource-slice-contract.ts';
import { planResourceSlice } from './plan-resource-slice.ts';

function plan(variants: readonly ResourceSliceOptionalVariant[] = []) {
  return planResourceSlice(normalizeResourceSliceInput({
    resource: 'orders',
    app: 'dashboard',
    route: '/orders/history',
    variants,
    client: {
      serviceName: 'orders',
      moduleSpecifier: '@app/lib/orders.ts',
      queryFactoryName: 'ordersQueries',
    },
    procedure: { path: ['admin', 'list'], kind: 'query' },
  }));
}

Deno.test('core plan emits the six always-on leaves and no State edit', () => {
  const output = plan();
  assertEquals(
    output.leaves.map((leaf) => [leaf.role, leaf.path]),
    [
      ['view', 'routes/orders/history/(_components)/orders-view.tsx'],
      ['island', 'routes/orders/history/(_islands)/OrdersIsland.tsx'],
      ['loaders', 'routes/orders/history/(_shared)/orders-loaders.ts'],
      ['layout', 'routes/orders/history/index.layout.tsx'],
      ['route-contract', 'routes/orders/history/index.route.ts'],
      ['page', 'routes/orders/history/index.tsx'],
    ],
  );
  assertEquals(output.appRoutes, {
    path: 'router.ts',
    alias: 'orders',
    route: '/orders/history',
  });
  assertEquals(output.state, undefined);
  assertEquals(output.query, {
    factory: 'ordersQueries.admin.list',
    queryOptions: 'ordersQueries.admin.list.queryOptions(input)',
    clientKey: 'ordersQueries.admin.list.clientKey(input)',
  });
});

Deno.test('form adds only form leaves and page/view option transitions', () => {
  assertDelta('form', [
    ['form-component', 'routes/orders/history/(_components)/orders-form.tsx'],
    ['form-contract', 'routes/orders/history/(_lib)/orders-form.ts'],
  ]);
});

Deno.test('partial adds nested summary leaves and page/view option transitions', () => {
  assertDelta('partial', [
    ['summary-component', 'routes/orders/history/(_components)/orders-summary.tsx'],
    ['partial-route', 'routes/partials/orders/history/summary.tsx'],
  ]);
});

Deno.test('stream adds only its island and page/view option transitions', () => {
  assertDelta('stream', [
    ['stream-island', 'routes/orders/history/(_islands)/OrdersStream.tsx'],
  ]);
});

Deno.test('every shipped option plan leaves utils.ts byte-identical', () => {
  for (
    const variants of [[], ['form'], ['partial'], ['stream'], [
      'form',
      'partial',
      'stream',
    ]] as const
  ) {
    assertEquals(plan(variants).state, undefined);
  }
});

Deno.test('query bindings and plan data contain no forbidden generated-content pattern', () => {
  const source = JSON.stringify(plan(['form', 'partial', 'stream']));
  for (
    const forbidden of [
      /\bany\b/,
      /\bfetch\s*\(/,
      /queryKey\s*:\s*\[/,
      /JSON\.parse\s*\(/,
    ]
  ) assertFalse(forbidden.test(source));
});

function assertDelta(
  variant: ResourceSliceOptionalVariant,
  expectedAdded: readonly (readonly [string, string])[],
): void {
  const core = plan();
  const selected = plan([variant]);
  const corePaths = new Set(core.leaves.map((leaf) => leaf.path));
  assertEquals(
    selected.leaves.filter((leaf) => !corePaths.has(leaf.path)).map((
      leaf,
    ) => [leaf.role, leaf.path]),
    expectedAdded.map(([role, path]) => [role, path]),
  );
  assertEquals(
    selected.leaves.filter((leaf) => leaf.options.includes(variant)).map((leaf) => leaf.role)
      .sort(),
    [...expectedAdded.map(([role]) => role), 'page', 'view'].sort(),
  );
}
