import { resolve } from '@std/path';
import {
  discoverNetScriptRoutes,
  isRouteManifestRelevantPath,
  isRouteManifestWatchPath,
  renderNetScriptRouteManifest,
  renderNetScriptRoutesModule,
  resolveNetScriptRouteManifestOptions,
  writeNetScriptRouteManifestSync,
} from './manifest.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

Deno.test('discoverNetScriptRoutes infers Fresh patterns, keys, and sidecar imports', () => {
  const appRoot = Deno.makeTempDirSync();
  const routeDir = resolve(appRoot, 'routes/(dashboard)/dashboard/framework/wi-09');
  Deno.mkdirSync(routeDir, { recursive: true });
  Deno.writeTextFileSync(
    resolve(routeDir, '[section].tsx'),
    'export default function Page() { return null; }',
  );
  Deno.writeTextFileSync(resolve(routeDir, '[section].route.ts'), 'export default {};');
  Deno.writeTextFileSync(
    resolve(appRoot, 'routes/index.tsx'),
    'export default function Home() { return null; }',
  );

  const options = resolveNetScriptRouteManifestOptions(appRoot, {});
  const routes = discoverNetScriptRoutes(options);
  const wi09Route = routes.find((route) => route.relativeRouteFilePath.endsWith('[section].tsx'));

  assert(wi09Route !== undefined, 'Expected WI-09 route to be discovered');
  assert(
    wi09Route.routePattern === '/dashboard/framework/wi-09/[section]',
    `Unexpected route pattern: ${wi09Route.routePattern}`,
  );
  assert(
    wi09Route.routeKeyPath.join('.') === 'dashboard.framework.wi09.$section.$route',
    `Unexpected route key path: ${wi09Route.routeKeyPath.join('.')}`,
  );
  assert(
    wi09Route.routeContractImportPath ===
      '../routes/(dashboard)/dashboard/framework/wi-09/[section].route.ts',
    `Unexpected route contract import path: ${wi09Route.routeContractImportPath}`,
  );
});

Deno.test('discoverNetScriptRoutes only binds route contracts from sibling sidecars', () => {
  const appRoot = Deno.makeTempDirSync();
  const routeDir = resolve(appRoot, 'routes/(dashboard)/dashboard/framework/wi-09');
  Deno.mkdirSync(routeDir, { recursive: true });
  Deno.writeTextFileSync(
    resolve(routeDir, '[section].tsx'),
    [
      "import { definePage } from '@netscript/fresh';",
      "export default definePage().build('/dashboard/framework/wi-09/[section]');",
    ].join('\n'),
  );

  const options = resolveNetScriptRouteManifestOptions(appRoot, {});
  const routes = discoverNetScriptRoutes(options);
  const wi09Route = routes.find((route) => route.relativeRouteFilePath.endsWith('[section].tsx'));

  assert(wi09Route !== undefined, 'Expected WI-09 route to be discovered');
  assert(
    wi09Route.routeContractImportPath === undefined,
    `Did not expect a route contract import path: ${String(wi09Route.routeContractImportPath)}`,
  );
});

Deno.test('discoverNetScriptRoutes preserves key semantics for grouped, nested, catch-all, and optional catch-all routes', () => {
  const appRoot = Deno.makeTempDirSync();

  Deno.mkdirSync(resolve(appRoot, 'routes/(dashboard)/(tenant)/dashboard/[company]/users/[id]'), {
    recursive: true,
  });
  Deno.mkdirSync(resolve(appRoot, 'routes/dashboard'), { recursive: true });
  Deno.mkdirSync(resolve(appRoot, 'routes/docs'), { recursive: true });

  Deno.writeTextFileSync(
    resolve(appRoot, 'routes/(dashboard)/(tenant)/dashboard/[company]/users/[id]/edit.tsx'),
    'export default function Page() { return null; }',
  );
  Deno.writeTextFileSync(
    resolve(appRoot, 'routes/dashboard/[...admin].tsx'),
    'export default function AdminCatchAll() { return null; }',
  );
  Deno.writeTextFileSync(
    resolve(appRoot, 'routes/docs/[[...slug]].tsx'),
    'export default function DocsCatchAll() { return null; }',
  );

  const options = resolveNetScriptRouteManifestOptions(appRoot, {});
  const routes = discoverNetScriptRoutes(options);

  const editRoute = routes.find((route) =>
    route.relativeRouteFilePath.endsWith('[company]/users/[id]/edit.tsx')
  );
  const catchAllRoute = routes.find((route) =>
    route.relativeRouteFilePath.endsWith('dashboard/[...admin].tsx')
  );
  const optionalCatchAllRoute = routes.find((route) =>
    route.relativeRouteFilePath.endsWith('docs/[[...slug]].tsx')
  );

  assert(editRoute !== undefined, 'Expected grouped edit route to be discovered');
  assert(
    editRoute.routePattern === '/dashboard/[company]/users/[id]/edit',
    `Unexpected grouped route pattern: ${editRoute.routePattern}`,
  );
  assert(
    editRoute.routeKeyPath.join('.') === 'dashboard.$company.users.$id.edit.$route',
    `Unexpected grouped route key path: ${editRoute.routeKeyPath.join('.')}`,
  );

  assert(catchAllRoute !== undefined, 'Expected catch-all route to be discovered');
  assert(
    catchAllRoute.routePattern === '/dashboard/[...admin]',
    `Unexpected catch-all route pattern: ${catchAllRoute.routePattern}`,
  );
  assert(
    catchAllRoute.routeKeyPath.join('.') === 'dashboard.$adminAll.$route',
    `Unexpected catch-all route key path: ${catchAllRoute.routeKeyPath.join('.')}`,
  );

  assert(optionalCatchAllRoute !== undefined, 'Expected optional catch-all route to be discovered');
  assert(
    optionalCatchAllRoute.routePattern === '/docs/[[...slug]]',
    `Unexpected optional catch-all route pattern: ${optionalCatchAllRoute.routePattern}`,
  );
  assert(
    optionalCatchAllRoute.routeKeyPath.join('.') === 'docs.$slugOptional.$route',
    `Unexpected optional catch-all route key path: ${optionalCatchAllRoute.routeKeyPath.join('.')}`,
  );
});

Deno.test('discoverNetScriptRoutes skips helper dirs, underscore files, and dynamic side-files', () => {
  const appRoot = Deno.makeTempDirSync();
  const routeDir = resolve(appRoot, 'routes/(dashboard)/dashboard/framework/wi-09');
  const helperComponentsDir = resolve(routeDir, '(_components)');
  const helperIslandsDir = resolve(routeDir, '(_islands)');

  Deno.mkdirSync(helperComponentsDir, { recursive: true });
  Deno.mkdirSync(helperIslandsDir, { recursive: true });
  Deno.writeTextFileSync(
    resolve(routeDir, '[section].tsx'),
    'export default function Page() { return null; }',
  );
  Deno.writeTextFileSync(resolve(routeDir, '[section].route.ts'), 'export default {};');
  Deno.writeTextFileSync(resolve(routeDir, '[section].contract.ts'), 'export const contract = {};');
  Deno.writeTextFileSync(
    resolve(routeDir, '_helper.tsx'),
    'export default function Helper() { return null; }',
  );
  Deno.writeTextFileSync(
    resolve(helperComponentsDir, 'widget.tsx'),
    'export default function Widget() { return null; }',
  );
  Deno.writeTextFileSync(
    resolve(helperIslandsDir, 'counter.tsx'),
    'export default function Counter() { return null; }',
  );
  Deno.writeTextFileSync(
    resolve(appRoot, 'routes/index.tsx'),
    'export default function Home() { return null; }',
  );

  const options = resolveNetScriptRouteManifestOptions(appRoot, {});
  const routes = discoverNetScriptRoutes(options);
  const routePaths = routes.map((route) => route.relativeRouteFilePath).sort();

  assert(
    routePaths.length === 2,
    `Expected only home + WI-09 page routes, received: ${routePaths.join(', ')}`,
  );
  assert(
    routePaths.includes('(dashboard)/dashboard/framework/wi-09/[section].tsx'),
    'Expected real WI-09 route',
  );
  assert(
    !routePaths.some((path) => path.endsWith('[section].contract.ts')),
    'Did not expect .contract helper route',
  );
  assert(
    !routePaths.some((path) => path.endsWith('_helper.tsx')),
    'Did not expect underscore helper route',
  );
  assert(
    !routePaths.some((path) => path.includes('(_components)') || path.includes('(_islands)')),
    'Did not expect route-scoped helper directory files to become routes',
  );
  assert(
    !isRouteManifestRelevantPath(resolve(routeDir, '[section].contract.ts'), options),
    'Did not expect .contract helper file to trigger manifest regeneration',
  );
  assert(
    !isRouteManifestRelevantPath(resolve(helperComponentsDir, 'widget.tsx'), options),
    'Did not expect route-scoped helper component to trigger manifest regeneration',
  );
  assert(
    !isRouteManifestRelevantPath(resolve(helperIslandsDir, 'counter.tsx'), options),
    'Did not expect route-scoped helper island to trigger manifest regeneration',
  );
  assert(
    isRouteManifestRelevantPath(resolve(routeDir, '[section].tsx'), options),
    'Expected real route module to remain relevant',
  );
  assert(
    isRouteManifestWatchPath(resolve(routeDir, '(_shared)/constants.ts'), options),
    'Expected helper TypeScript files under routes/ to trigger a manifest resync during watch',
  );
});

Deno.test('renderNetScriptRouteManifest renders the pure routePatterns tree', () => {
  const source = renderNetScriptRouteManifest([
    {
      routeFilePath:
        'C:/repo/apps/playground/routes/(dashboard)/dashboard/framework/wi-09/[section].tsx',
      relativeRouteFilePath: '(dashboard)/dashboard/framework/wi-09/[section].tsx',
      routePattern: '/dashboard/framework/wi-09/[section]',
      routeKeyPath: ['dashboard', 'framework', 'wi09', '$section', '$route'],
      routeContractImportPath: '../routes/(dashboard)/dashboard/framework/wi-09/[section].route.ts',
    },
  ]);

  assert(
    source.includes('$route: "/dashboard/framework/wi-09/[section]"'),
    'Expected route pattern leaf',
  );
  assert(
    !source.includes('bindRoutePattern('),
    'Did not expect typed route bindings in manifest.ts',
  );
});

Deno.test('renderNetScriptRoutesModule renders routes bindings backed by manifest.ts', () => {
  const source = renderNetScriptRoutesModule([
    {
      routeFilePath:
        'C:/repo/apps/playground/routes/(dashboard)/dashboard/framework/wi-09/[section].tsx',
      relativeRouteFilePath: '(dashboard)/dashboard/framework/wi-09/[section].tsx',
      routePattern: '/dashboard/framework/wi-09/[section]',
      routeKeyPath: ['dashboard', 'framework', 'wi09', '$section', '$route'],
      routeContractImportPath: '../routes/(dashboard)/dashboard/framework/wi-09/[section].route.ts',
    },
  ]);

  assert(
    source.includes(
      "import { createRouteReference, bindRoutePattern } from '@netscript/fresh/route';",
    ),
    'Expected routes helper imports',
  );
  assert(
    source.includes("import { routePatterns } from './manifest.ts';"),
    'Expected manifest.ts import for route patterns',
  );
  assert(
    source.includes('routePatterns.dashboard.framework.wi09.$section.$route'),
    'Expected nested route pattern access',
  );
  assert(source.includes('export const routes = {'), 'Expected routes export');
});

Deno.test('writeNetScriptRouteManifestSync writes sibling manifest.ts and routes.ts outputs', () => {
  const appRoot = Deno.makeTempDirSync();
  const routeDir = resolve(appRoot, 'routes/(dashboard)/dashboard/framework/wi-09');

  Deno.mkdirSync(routeDir, { recursive: true });
  Deno.writeTextFileSync(
    resolve(routeDir, '[section].tsx'),
    'export default function Page() { return null; }',
  );
  Deno.writeTextFileSync(resolve(routeDir, '[section].route.ts'), 'export default {};');

  const result = writeNetScriptRouteManifestSync(resolveNetScriptRouteManifestOptions(appRoot, {}));
  const manifestSource = Deno.readTextFileSync(result.manifestOutputPath);
  const routesSource = Deno.readTextFileSync(result.routesOutputPath);

  assert(result.changed, 'Expected first manifest write to report a change');
  assert(result.manifestChanged, 'Expected manifest.ts to be written');
  assert(result.routesChanged, 'Expected routes.ts to be written');
  assert(
    manifestSource.includes('export const routePatterns = {'),
    'Expected manifest.ts routePatterns export',
  );
  assert(
    routesSource.includes("import { routePatterns } from './manifest.ts';"),
    'Expected routes.ts to consume manifest.ts',
  );
  assert(
    routesSource.includes(
      'bindRoutePattern(routeContract0, routePatterns.dashboard.framework.wi09.$section.$route,',
    ),
    'Expected routes.ts to bind sidecar route contracts directly',
  );
  assert(
    routesSource.includes('export const routes = {'),
    'Expected routes.ts routes export',
  );
});
