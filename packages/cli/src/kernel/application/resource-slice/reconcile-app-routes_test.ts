import { assertEquals, assertStringIncludes } from '@std/assert';
import { reconcileAppRoutes } from './reconcile-app-routes.ts';

const STOCK_POST_SLICE_F_ROUTER = `import { createRouteReference } from '@netscript/fresh/route';
import { routePatterns } from './.generated/manifest.ts';
import { routes as generatedRoutes } from './.generated/routes.ts';

export { routePatterns };

export const routes = {
  ...generatedRoutes,
} as const;

export const appRoutes = {
  home: routes.$route,
  dashboard: routes.dashboard.$route,
  serviceExample: generatedRoutes.examples.orders.$route,
  designTokens: createRouteReference('/design/tokens', {
    id: 'design.tokens',
    kind: 'page',
  }),
} as const;

export const appRouter = { routePatterns, routes, appRoutes } as const;
`;

const REQUIREMENT = {
  alias: 'ordersHistory',
  routeKeyPath: ['orders', 'history', '$route'],
} as const;

Deno.test('recognizes the stock post-Slice-F router and inserts once at the stable anchor', () => {
  const result = reconcileAppRoutes(STOCK_POST_SLICE_F_ROUTER, REQUIREMENT);
  assertEquals(result.status, 'insert');
  if (result.status !== 'insert') return;
  assertStringIncludes(
    result.content,
    '  ordersHistory: generatedRoutes.orders.history.$route,\n} as const;',
  );
  assertStringIncludes(result.content, 'designTokens: createRouteReference');
  assertEquals(reconcileAppRoutes(result.content, REQUIREMENT), {
    status: 'exact',
    content: result.content,
  });
});

Deno.test('returns exact without changing bytes', () => {
  const source = STOCK_POST_SLICE_F_ROUTER.replace(
    '  home: routes.$route,',
    '  ordersHistory: generatedRoutes.orders.history.$route,\n  home: routes.$route,',
  );
  assertEquals(reconcileAppRoutes(source, REQUIREMENT), {
    status: 'exact',
    content: source,
  });
});

Deno.test('conflicts on alias reuse or a different alias for the same route key', () => {
  const aliasConflict = STOCK_POST_SLICE_F_ROUTER.replace(
    '  home: routes.$route,',
    '  ordersHistory: routes.orders.$route,\n  home: routes.$route,',
  );
  assertEquals(reconcileAppRoutes(aliasConflict, REQUIREMENT).status, 'conflict');

  const keyConflict = STOCK_POST_SLICE_F_ROUTER.replace(
    '  home: routes.$route,',
    '  history: generatedRoutes.orders.history.$route,\n  home: routes.$route,',
  );
  assertEquals(reconcileAppRoutes(keyConflict, REQUIREMENT).status, 'conflict');
});

Deno.test('fails closed for customized imports and appRoutes object shapes', () => {
  const fixtures = [
    STOCK_POST_SLICE_F_ROUTER.replace('routes as generatedRoutes', 'routes'),
    STOCK_POST_SLICE_F_ROUTER.replace(
      'export const appRoutes = {',
      'export const appRoutes = Object.freeze({',
    ),
    STOCK_POST_SLICE_F_ROUTER.replace(
      '  home: routes.$route,',
      '  ...customRoutes,\n  home: routes.$route,',
    ),
    STOCK_POST_SLICE_F_ROUTER.replace('  home: routes.$route,', "  ['home']: routes.$route,"),
    STOCK_POST_SLICE_F_ROUTER.replace(
      '} as const;\n\nexport const appRouter',
      '} satisfies AppRoutes;\n\nexport const appRouter',
    ),
  ];
  for (const fixture of fixtures) {
    assertEquals(reconcileAppRoutes(fixture, REQUIREMENT).status, 'conflict');
  }
});
