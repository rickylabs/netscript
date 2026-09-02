import { assertEquals, assertStringIncludes } from '@std/assert';
import { resolve } from '@std/path';
import { writeFreshRouteManifestSync } from './fresh-route-manifest.ts';

function withRouteFixture(run: (appRoot: string, routesDir: string) => void): void {
  const appRoot = Deno.makeTempDirSync({ prefix: 'netscript-cli-fresh-manifest-' });
  const routesDir = resolve(appRoot, 'staged-routes');

  try {
    Deno.mkdirSync(resolve(routesDir, 'orders/history'), { recursive: true });
    Deno.writeTextFileSync(
      resolve(routesDir, 'orders/history/index.tsx'),
      'export default function Page() { return null; }\n',
    );
    Deno.writeTextFileSync(
      resolve(routesDir, 'orders/history/index.route.ts'),
      'export default {};\n',
    );
    run(appRoot, routesDir);
  } finally {
    Deno.removeSync(appRoot, { recursive: true });
  }
}

Deno.test('writeFreshRouteManifestSync returns stable generated content for comparison', () => {
  withRouteFixture((appRoot, routesDir) => {
    const outputPath = resolve(appRoot, 'staged-output/routes.ts');
    const first = writeFreshRouteManifestSync(appRoot, { routesDir, outputPath });
    const second = writeFreshRouteManifestSync(appRoot, { routesDir, outputPath });

    assertEquals(first.result.changed, true);
    assertEquals(first.result.manifestChanged, true);
    assertEquals(first.result.routesChanged, true);
    assertEquals(second.result.changed, false);
    assertEquals(second.manifestSource, first.manifestSource);
    assertEquals(second.routesSource, first.routesSource);
    assertEquals(Deno.readTextFileSync(second.result.manifestOutputPath), first.manifestSource);
    assertEquals(Deno.readTextFileSync(second.result.routesOutputPath), first.routesSource);
  });
});

Deno.test('writeFreshRouteManifestSync preserves Fresh sidecar discovery metadata', () => {
  withRouteFixture((appRoot, routesDir) => {
    const write = writeFreshRouteManifestSync(appRoot, {
      routesDir,
      outputPath: resolve(appRoot, 'staged-output/routes.ts'),
    });

    assertEquals(write.discoveredRoutes.length, 1);
    assertEquals(write.discoveredRoutes[0].relativeRouteFilePath, 'orders/history/index.tsx');
    assertEquals(write.discoveredRoutes[0].routePattern, '/orders/history');
    assertEquals(write.discoveredRoutes[0].routeKeyPath, ['orders', 'history', '$route']);
    assertEquals(write.discoveredRoutes[0].pageModuleForm, 'sidecar');
    assertStringIncludes(
      write.discoveredRoutes[0].routeContractImportPath ?? '',
      '../staged-routes/orders/history/index.route.ts',
    );
    assertStringIncludes(
      write.routesSource,
      'bindRoutePattern(routeContract0, routePatterns.orders.history.$route',
    );
  });
});
