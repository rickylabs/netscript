import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { join, toFileUrl } from 'jsr:@std/path@^1';
import {
  discoverNetScriptRoutes,
  renderNetScriptRouteManifest,
  renderNetScriptRoutesModule,
  resolveNetScriptRouteManifestOptions,
} from '../../../../../../fresh/src/application/route/manifest.ts';
import { generateAppTsConfig } from '../../../adapters/templates/app/generate-app-tsconfig.ts';
import { generateRouteManifestSeed, generateRoutesSeed } from './app-route-seeds.ts';
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

Deno.test('initial route seeds include the generated dynamic order route shape', () => {
  const manifest = generateRouteManifestSeed();
  const routes = generateRoutesSeed();

  assertStringIncludes(
    manifest,
    'orders: {\n      $id: {\n        $route: \'/examples/orders/[id]\'',
  );
  assertStringIncludes(
    routes,
    'orders: {\n      $id: {\n        $route: createRouteReference(routePatterns.examples.orders.$id.$route, {',
  );
  assertStringIncludes(routes, "id: 'examples.orders.$id'");
});

interface DynamicRouteModuleShape {
  readonly routePatterns: {
    readonly examples: { readonly orders: { readonly $id: { readonly $route: string } } };
  };
}

interface DynamicRoutesModuleShape {
  readonly routes: {
    readonly examples: {
      readonly orders: {
        readonly $id: {
          readonly $route: {
            readonly routePattern: string;
            readonly $id?: string;
            readonly $kind?: string;
            href(input: { readonly path: { readonly id: string } }): string;
          };
        };
      };
    };
  };
}

async function importDynamicRouteShape(
  root: string,
  manifestSource: string,
  routesSource: string,
) {
  await Deno.mkdir(root, { recursive: true });
  const manifestPath = join(root, 'manifest.ts');
  const routesPath = join(root, 'routes.ts');
  await Deno.writeTextFile(manifestPath, manifestSource);
  await Deno.writeTextFile(routesPath, routesSource);

  const manifest = await import(`${toFileUrl(manifestPath).href}?scope=${crypto.randomUUID()}`) as
    DynamicRouteModuleShape;
  const routes = await import(`${toFileUrl(routesPath).href}?scope=${crypto.randomUUID()}`) as
    DynamicRoutesModuleShape;
  const reference = routes.routes.examples.orders.$id.$route;

  return {
    pattern: manifest.routePatterns.examples.orders.$id.$route,
    routePattern: reference.routePattern,
    id: reference.$id,
    kind: reference.$kind,
    href: reference.href({ path: { id: 'parity-nonce' } }),
  };
}

Deno.test('dynamic route seed equals the current manifest generator output', async () => {
  const appRoot = await Deno.makeTempDir({ prefix: 'netscript-dynamic-route-seed-' });
  try {
    const routeDir = join(appRoot, 'routes', 'examples', 'orders');
    await Deno.mkdir(routeDir, { recursive: true });
    await Deno.writeTextFile(
      join(routeDir, '[id].tsx'),
      'export default function OrderPage() { return null; }\n',
    );

    const discovered = discoverNetScriptRoutes(resolveNetScriptRouteManifestOptions(appRoot, {}));
    assertEquals(discovered.length, 1);
    assertEquals(discovered[0].relativeRouteFilePath, 'examples/orders/[id].tsx');

    const generatedShape = await importDynamicRouteShape(
      join(appRoot, 'generator-output'),
      renderNetScriptRouteManifest(discovered),
      renderNetScriptRoutesModule(discovered),
    );
    const seedShape = await importDynamicRouteShape(
      join(appRoot, 'seed-output'),
      generateRouteManifestSeed(),
      generateRoutesSeed(),
    );

    assertEquals(seedShape, generatedShape);
    assertEquals(generatedShape, {
      pattern: '/examples/orders/[id]',
      routePattern: '/examples/orders/[id]',
      id: 'examples.orders.$id',
      kind: 'page',
      href: '/examples/orders/parity-nonce',
    });
  } finally {
    await Deno.remove(appRoot, { recursive: true });
  }
});
