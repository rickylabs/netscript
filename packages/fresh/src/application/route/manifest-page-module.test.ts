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

Deno.test('computePageModuleRewrite inserts generated imports after a complete multi-line import', () => {
  const source = [
    "import { definePage } from '@app/utils.ts';",
    'import {',
    '  alpha,',
    '  beta,',
    "} from './multi-line.ts';",
    'export const aboutPage = definePage()',
    '  .build();',
  ].join('\n');

  const result = computePageModuleRewrite({
    source,
    form: 'default',
    routeKey: 'about.$route',
    manifestImportSpecifier: MANIFEST_SPECIFIER,
    routesImportSpecifier: ROUTES_SPECIFIER,
  });

  const expectedImport = `} from './multi-line.ts';\nimport { routes } from '${ROUTES_SPECIFIER}';`;
  assert(result.changed, 'Expected the multi-line import rewrite to change the source');
  assert(
    result.content.includes(expectedImport),
    `Expected generated import after the complete multi-line import: ${result.content}`,
  );
  assertParseable(result.content);
});

Deno.test('computePageModuleRewrite inserts generated imports after side-effect imports', () => {
  const source = [
    "import { definePage } from '@app/utils.ts';",
    "import './side-effect.ts';",
    'export const aboutPage = definePage()',
    '  .build();',
  ].join('\n');

  const result = computePageModuleRewrite({
    source,
    form: 'default',
    routeKey: 'about.$route',
    manifestImportSpecifier: MANIFEST_SPECIFIER,
    routesImportSpecifier: ROUTES_SPECIFIER,
  });

  const expectedImport =
    `import './side-effect.ts';\nimport { routes } from '${ROUTES_SPECIFIER}';`;
  assert(result.changed, 'Expected the side-effect import rewrite to change the source');
  assert(
    result.content.includes(expectedImport),
    `Expected generated import after the side-effect import: ${result.content}`,
  );
  assertParseable(result.content);
});

Deno.test('computePageModuleRewrite handles default and namespace imports as the final import', () => {
  const source = [
    "import definePage from '@app/define-page.ts';",
    "import * as pageTools from './page-tools.ts';",
    'export const aboutPage = definePage()',
    '  .build();',
  ].join('\n');

  const result = computePageModuleRewrite({
    source,
    form: 'default',
    routeKey: 'about.$route',
    manifestImportSpecifier: MANIFEST_SPECIFIER,
    routesImportSpecifier: ROUTES_SPECIFIER,
  });

  const expectedImport =
    `import * as pageTools from './page-tools.ts';\nimport { routes } from '${ROUTES_SPECIFIER}';`;
  assert(result.changed, 'Expected the namespace import rewrite to change the source');
  assert(
    result.content.includes(expectedImport),
    `Expected generated import after the namespace import: ${result.content}`,
  );
  assertParseable(result.content);
});

Deno.test('computePageModuleRewrite prepends generated imports when the module has no imports', () => {
  const source = [
    'export const aboutPage = definePage()',
    '  .build();',
  ].join('\n');

  const result = computePageModuleRewrite({
    source,
    form: 'default',
    routeKey: 'about.$route',
    manifestImportSpecifier: MANIFEST_SPECIFIER,
    routesImportSpecifier: ROUTES_SPECIFIER,
  });

  const generatedImport = `import { routes } from '${ROUTES_SPECIFIER}';`;
  assert(result.changed, 'Expected the no-import rewrite to change the source');
  assert(
    result.content.startsWith(`${generatedImport}\n`),
    `Expected generated import prepended: ${result.content}`,
  );
  assertParseable(result.content);
});

Deno.test('computePageModuleRewrite keeps multi-line import rewrites idempotent', () => {
  const source = [
    'import type {',
    '  PageData,',
    '  PageMeta,',
    "} from './types.ts';",
    'export const aboutPage = definePage()',
    '  .build();',
  ].join('\n');

  const first = computePageModuleRewrite({
    source,
    form: 'default',
    routeKey: 'about.$route',
    manifestImportSpecifier: MANIFEST_SPECIFIER,
    routesImportSpecifier: ROUTES_SPECIFIER,
  });
  const second = computePageModuleRewrite({
    source: first.content,
    form: 'default',
    routeKey: 'about.$route',
    manifestImportSpecifier: MANIFEST_SPECIFIER,
    routesImportSpecifier: ROUTES_SPECIFIER,
  });

  const generatedImport = `import { routes } from '${ROUTES_SPECIFIER}';`;
  assert(first.changed, 'Expected the first multi-line type import rewrite to change');
  assert(!second.changed, 'Expected the second multi-line type import rewrite to be unchanged');
  assert(
    second.content === first.content,
    'Expected the second rewrite to preserve the first output',
  );
  assert(
    [...second.content.matchAll(new RegExp(escapeRegExp(generatedImport), 'g'))].length === 1,
    `Expected a single generated routes import: ${second.content}`,
  );
  assertParseable(second.content);
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

function assertParseable(source: string): void {
  new Function(stripStaticImports(source).replaceAll(/\bexport\s+/g, ''));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripStaticImports(source: string): string {
  return source.replaceAll(
    /import\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+['"][^'"]+['"]|['"][^'"]+['"])\s*;?\n?/g,
    '',
  );
}
