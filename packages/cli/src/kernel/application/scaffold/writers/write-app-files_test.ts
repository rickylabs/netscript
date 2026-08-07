import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { generateAppTsConfig } from '../../../adapters/templates/app/generate-app-tsconfig.ts';
import { generateRoutesSeed } from './app-route-seeds.ts';
import { emitSelectedBackendImports } from './write-app-files.ts';

Deno.test('selected cache backend is carried into the generated app runtime', () => {
  const emitted = emitSelectedBackendImports('export const app = {};\n', { cache: true });

  assertStringIncludes(emitted, "import '@netscript/sdk/cache';");
  assertEquals(emitSelectedBackendImports(emitted, { cache: true }), emitted);
});

Deno.test('cache registration import is omitted when cache is disabled', () => {
  const source = 'export const app = {};\n';
  assertEquals(emitSelectedBackendImports(source, { cache: false }), source);
});

Deno.test('app tsconfig is self-contained and Vite/Fresh compatible', () => {
  const result = JSON.parse(generateAppTsConfig());

  assertEquals(result.files, []);
  assert(!('extends' in result));
  assert(!('include' in result));
  assertEquals(result.compilerOptions, {
    allowImportingTsExtensions: true,
    jsx: 'react-jsx',
    jsxImportSource: 'preact',
    module: 'ESNext',
    moduleResolution: 'Bundler',
    noEmit: true,
  });
});

Deno.test('initial route references match the canonical generated leaf shape', () => {
  const routes = generateRoutesSeed();

  assertStringIncludes(
    routes,
    'crud: {\n      $route: createRouteReference(routePatterns.examples.crud.$route, {',
  );
  assertStringIncludes(
    routes,
    'tokens: {\n      $route: createRouteReference(routePatterns.design.tokens.$route, {',
  );
});
