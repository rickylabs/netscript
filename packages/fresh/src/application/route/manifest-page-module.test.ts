import { computePageModuleRewrite, scanPageModuleRouteBinding } from './manifest-page-module.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const MANIFEST_SPECIFIER = '@app/.generated/manifest.ts';
const ROUTES_SPECIFIER = '@app/.generated/routes.ts';

Deno.test('scanPageModuleRouteBinding extracts the inline contract body and strips $route', () => {
  const result = scanPageModuleRouteBinding(
    [
      'definePage()',
      '  .withRouteContract({',
      '    $route: routePatterns.orders.$id.$route,',
      '    pathSchema: z.object({ id: z.string() }),',
      '  })',
      '  .build();',
    ].join('\n'),
  );

  assert(result.hasInlineContract, 'Expected inline contract detection');
  assert(!result.hasWithRoute, 'Did not expect a .withRoute call');
  assert(
    result.inlineContractBody === 'pathSchema: z.object({ id: z.string() })',
    `Unexpected inline body: ${result.inlineContractBody}`,
  );
  assert(
    result.prefilledRoute === 'routePatterns.orders.$id.$route',
    `Unexpected prefilled $route: ${result.prefilledRoute}`,
  );
});

Deno.test('scanPageModuleRouteBinding distinguishes .withRoute from .withRouteContract', () => {
  const withRoute = scanPageModuleRouteBinding(
    'definePage().withRoute(routes.about.$route).build()',
  );
  assert(withRoute.hasWithRoute, 'Expected .withRoute detection');
  assert(!withRoute.hasInlineContract, 'Did not expect .withRouteContract detection');

  const none = scanPageModuleRouteBinding('definePage().withMeta(() => ({})).build()');
  assert(!none.hasWithRoute, 'Did not expect a .withRoute call');
  assert(!none.hasInlineContract, 'Did not expect a .withRouteContract call');
});

Deno.test('computePageModuleRewrite (Form A) inserts $route as the first field and the manifest import', () => {
  const source = [
    "import { z } from 'zod';",
    "import { definePage } from '@app/utils.ts';",
    'export const p = definePage()',
    '  .withRouteContract({ pathSchema: z.object({ id: z.string().min(1) }) })',
    '  .build();',
  ].join('\n');

  const result = computePageModuleRewrite({
    source,
    form: 'inline',
    routeKey: 'dashboard.orders.$id.$route',
    manifestImportSpecifier: MANIFEST_SPECIFIER,
    routesImportSpecifier: ROUTES_SPECIFIER,
  });

  assert(result.changed, 'Expected Form A rewrite to change the source');
  assert(
    result.content.includes(
      '.withRouteContract({ $route: routePatterns.dashboard.orders.$id.$route, pathSchema:',
    ),
    `Expected $route inserted as the first field: ${result.content}`,
  );
  assert(
    result.content.includes(`import { routePatterns } from '${MANIFEST_SPECIFIER}';`),
    'Expected the routePatterns import to be inserted',
  );
});

Deno.test('computePageModuleRewrite (Form C) inserts .withRoute after definePage() and the routes import', () => {
  const source = [
    "import { definePage } from '@app/utils.ts';",
    'export const aboutPage = definePage()',
    "  .withMeta(() => ({ title: 'About' }))",
    '  .build();',
  ].join('\n');

  const result = computePageModuleRewrite({
    source,
    form: 'default',
    routeKey: 'about.$route',
    manifestImportSpecifier: MANIFEST_SPECIFIER,
    routesImportSpecifier: ROUTES_SPECIFIER,
  });

  assert(result.changed, 'Expected Form C rewrite to change the source');
  assert(
    result.content.includes('definePage()\n  .withRoute(routes.about.$route)'),
    `Expected .withRoute inserted after definePage(): ${result.content}`,
  );
  assert(
    result.content.includes(`import { routes } from '${ROUTES_SPECIFIER}';`),
    'Expected the routes import to be inserted',
  );
});

Deno.test('computePageModuleRewrite (Form B) is a no-op when the binding is already present', () => {
  const source = [
    "import { routes } from '@app/.generated/routes.ts';",
    "import { definePage } from '@app/utils.ts';",
    'export const p = definePage()',
    '  .withRoute(routes.dashboard.orders.$id.$route)',
    '  .build();',
  ].join('\n');

  const result = computePageModuleRewrite({
    source,
    form: 'sidecar',
    routeKey: 'dashboard.orders.$id.$route',
    manifestImportSpecifier: MANIFEST_SPECIFIER,
    routesImportSpecifier: ROUTES_SPECIFIER,
  });

  assert(!result.changed, 'Expected an already-bound page to be left untouched');
  assert(result.content === source, 'Expected the source to be unchanged');
});

Deno.test('computePageModuleRewrite is idempotent across all forms', () => {
  const cases: Array<{ source: string; form: 'inline' | 'sidecar' | 'default'; key: string }> = [
    {
      source: [
        "import { z } from 'zod';",
        "import { definePage } from '@app/utils.ts';",
        'export const p = definePage()',
        '  .withRouteContract({ pathSchema: z.object({ id: z.string() }) })',
        '  .build();',
      ].join('\n'),
      form: 'inline',
      key: 'orders.$id.$route',
    },
    {
      source: [
        "import { definePage } from '@app/utils.ts';",
        'export const p = definePage().withMeta(() => ({})).build();',
      ].join('\n'),
      form: 'default',
      key: 'about.$route',
    },
  ];

  for (const testCase of cases) {
    const first = computePageModuleRewrite({
      source: testCase.source,
      form: testCase.form,
      routeKey: testCase.key,
      manifestImportSpecifier: MANIFEST_SPECIFIER,
      routesImportSpecifier: ROUTES_SPECIFIER,
    });
    const second = computePageModuleRewrite({
      source: first.content,
      form: testCase.form,
      routeKey: testCase.key,
      manifestImportSpecifier: MANIFEST_SPECIFIER,
      routesImportSpecifier: ROUTES_SPECIFIER,
    });

    assert(first.changed, `Expected the first ${testCase.form} rewrite to change`);
    assert(!second.changed, `Expected the second ${testCase.form} rewrite to be a no-op`);
    assert(
      second.content === first.content,
      `Expected idempotent output for ${testCase.form}`,
    );
  }
});

Deno.test('computePageModuleRewrite emits the inline-precedence warning when a sidecar also exists', () => {
  const source = [
    "import { z } from 'zod';",
    "import { definePage } from '@app/utils.ts';",
    'export const p = definePage()',
    '  .withRouteContract({ pathSchema: z.object({ id: z.string() }) })',
    '  .build();',
  ].join('\n');

  const result = computePageModuleRewrite({
    source,
    form: 'inline',
    routeKey: 'orders.$id.$route',
    manifestImportSpecifier: MANIFEST_SPECIFIER,
    routesImportSpecifier: ROUTES_SPECIFIER,
    hasSidecar: true,
  });

  assert(result.warning !== undefined, 'Expected an inline-precedence warning');
  assert(
    result.warning.includes('Inline form') && result.warning.includes('Delete the sidecar'),
    `Unexpected warning text: ${result.warning}`,
  );
});
