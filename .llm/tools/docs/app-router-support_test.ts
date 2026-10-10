import {
  assert,
  assertEquals,
  assertNotEquals,
  assertStringIncludes,
  assertThrows,
} from '@std/assert';
import { fromFileUrl, join, relative, toFileUrl } from '@std/path';
import { MemoryFileSystemAdapter } from '../../../packages/cli/src/kernel/adapters/scaffold/memory-fs.ts';
import { Scaffolder } from '../../../packages/cli/src/kernel/adapters/scaffold/scaffolder.ts';
import {
  renderTemplate,
  StringTemplateAdapter,
} from '../../../packages/cli/src/kernel/adapters/scaffold/template-adapter.ts';
import { readTemplateAssetSync } from '../../../packages/cli/src/kernel/adapters/templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../../packages/cli/src/kernel/assets/manifest.ts';
import type { ProcessPort } from '../../../packages/cli/src/kernel/ports/process-port.ts';
import {
  APP_ROUTER_TEMPLATE_VARS,
  DOCUMENTED_READER_ROUTES,
  materializeAppRouterSupport,
  shippedAppRouteAssets,
} from './app-router-support.ts';
import { resolveWorkspaceSurface } from './snippet-workspace.ts';

const repositoryRoot = fromFileUrl(new URL('../../../', import.meta.url));
const SCAFFOLD_APP_DIR = '/workspace/docs-app/apps/dashboard';

/**
 * The scaffold app writer, loaded by URL as `check-accuracy-and-discoverability.ts` loads the CLI
 * command tree. The computed import keeps its module graph out of this test's type check, where the
 * root `isolatedDeclarations` setting would reject it; `packages/cli` checks it under its own
 * compiler options.
 */
interface AppWriterModule {
  readonly writeNormalizedAppFiles: (
    context: unknown,
    options: unknown,
    appDir: string,
    overwrite: boolean,
    filesCreated: string[],
    filesSkipped: string[],
    directoriesCreated: string[],
  ) => Promise<void>;
}
const appWriterUrl = new URL(
  '../../../packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts',
  import.meta.url,
).href;

/** Pin `@netscript/*` imports to one exact release, as the writer's closure check requires. */
function pinNetScriptImport(specifier: string): string {
  return specifier.replace(/^@netscript\/([^/]+)(.*)$/, 'jsr:@netscript/$1@0.0.0$2');
}

/**
 * The files the real scaffold app writer emits for an app without the example service, written to
 * an in-memory filesystem. This is the independent oracle: it computes its own router placeholders,
 * sharing no input with `app-router-support.ts`.
 */
async function scaffoldAppWithoutExampleService(): Promise<ReadonlyMap<string, string>> {
  const fs = new MemoryFileSystemAdapter();
  const templateAdapter = new StringTemplateAdapter(fs);
  const process: ProcessPort = {
    exec: () => Promise.reject(new Error('the app writer must not spawn processes')),
  };
  const context = {
    fs,
    process,
    templateAdapter,
    scaffolder: new Scaffolder(templateAdapter, fs),
    jsrResolver: {
      resolveImport: pinNetScriptImport,
      resolveImports: (specifiers: readonly string[]) =>
        Object.fromEntries(
          specifiers.map((specifier) => [specifier, pinNetScriptImport(specifier)]),
        ),
    },
    cwd: () => '/workspace',
    resolveModeFields: () => ({}),
    packagesAsWorkspaceMembers: () => false,
    scaffoldWorkspacePackages: () => Promise.reject(new Error('not part of the app writer')),
  };
  const options = {
    name: 'docs-app',
    appName: 'dashboard',
    targetPath: '/workspace/docs-app',
    importMode: 'jsr',
    editor: 'none',
    force: false,
    ci: true,
    // Dry run keeps the writer off the real disk; it still renders every file into `fs`.
    dryRun: true,
    noGit: true,
    noAspire: false,
    dbEngine: 'none',
    cache: false,
    cacheBackend: 'redis',
    includeExampleService: false,
    modelName: 'User',
  };
  const { writeNormalizedAppFiles } = await import(appWriterUrl) as AppWriterModule;
  await writeNormalizedAppFiles(context, options, SCAFFOLD_APP_DIR, true, [], [], []);
  return fs.getFiles();
}

async function scaffoldRouter(): Promise<string> {
  const router = (await scaffoldAppWithoutExampleService()).get(`${SCAFFOLD_APP_DIR}/router.ts`);
  assert(router !== undefined, 'expected the scaffold writer to emit router.ts');
  return router;
}

/** Type-check a probe that consumes the materialized router the way README fences do. */
async function checkRouterProbe(tempRoot: string, routerPath: string): Promise<Deno.CommandOutput> {
  const probePath = join(tempRoot, 'probe.ts');
  await Deno.writeTextFile(
    probePath,
    `import { appRouter, appRoutes, routes } from '${toFileUrl(routerPath).href}';
export const partial = routes.partials.orders.$id.$route;
export const order = appRoutes.order;
export const patterns = appRouter.routePatterns;
`,
  );
  const workspace = await resolveWorkspaceSurface(repositoryRoot);
  const configPath = join(tempRoot, 'deno.json');
  await Deno.writeTextFile(
    configPath,
    JSON.stringify({
      compilerOptions: { strict: true, jsx: 'precompile', jsxImportSource: 'preact' },
      imports: workspace.imports,
      catalog: workspace.catalog,
    }),
  );
  // A private lock copy keeps the tracked root deno.lock untouched, as the snippet compiler does.
  const lockPath = join(tempRoot, 'deno.lock');
  await Deno.copyFile(join(repositoryRoot, 'deno.lock'), lockPath);
  return await new Deno.Command(Deno.execPath(), {
    cwd: repositoryRoot,
    args: ['check', '--unstable-kv', '--lock', lockPath, '--config', configPath, probePath],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
}

async function withTempRoot(run: (tempRoot: string) => Promise<void>): Promise<void> {
  const tempRoot = await Deno.makeTempDir({ prefix: 'netscript-app-router-support-' });
  try {
    await run(tempRoot);
  } finally {
    await Deno.remove(tempRoot, { recursive: true });
  }
}

Deno.test('the support router is byte-identical to the router the scaffold writer emits', async () => {
  await withTempRoot(async (tempRoot) => {
    const routerPath = await materializeAppRouterSupport(join(tempRoot, 'app'));

    assertEquals(await Deno.readTextFile(routerPath), await scaffoldRouter());
  });
});

Deno.test('negative control: a valid but wrong placeholder value fails the scaffold comparison', async () => {
  await withTempRoot(async (tempRoot) => {
    // Still a real route, so the type-check probe alone accepts it; only the scaffold oracle catches it.
    const routerPath = await materializeAppRouterSupport(join(tempRoot, 'app'), {
      routerTemplateVars: {
        ...APP_ROUTER_TEMPLATE_VARS,
        serviceExampleRouteReference: 'routes.dashboard.$route',
      },
    });
    const output = await checkRouterProbe(tempRoot, routerPath);

    assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
    assertNotEquals(await Deno.readTextFile(routerPath), await scaffoldRouter());
  });
});

Deno.test('every route file the scaffold writer emits is in the support route tree', async () => {
  await withTempRoot(async (tempRoot) => {
    const appRoot = join(tempRoot, 'app');
    await materializeAppRouterSupport(appRoot);
    const scaffoldRoutesDir = `${SCAFFOLD_APP_DIR}/routes`;
    const scaffoldRouteFiles = [...(await scaffoldAppWithoutExampleService()).keys()]
      .filter((path) => path.startsWith(`${scaffoldRoutesDir}/`))
      .map((path) => relative(scaffoldRoutesDir, path));

    assert(scaffoldRouteFiles.includes('examples/orders/[id].tsx'));
    for (const routeFile of scaffoldRouteFiles) {
      const info = await Deno.stat(join(appRoot, 'routes', routeFile)).catch(() => undefined);
      assert(info?.isFile, `scaffold route ${routeFile} is missing from the support route tree`);
    }
  });
});

Deno.test('every router template placeholder is supplied, and nothing else', () => {
  // The scaffold writer fills these per app; if the template gains or drops one, this fails before
  // a stale variable set can render a router the scaffold would never emit.
  const placeholders = [
    ...readTemplateAssetSync(TEMPLATE_KEYS.appRouter).matchAll(/\{\{\s*(\w+)/g),
  ].map((match) => match[1]);

  assertEquals([...new Set(placeholders)].sort(), Object.keys(APP_ROUTER_TEMPLATE_VARS).sort());
  assertThrows(
    () => renderTemplate(readTemplateAssetSync(TEMPLATE_KEYS.appRouter), {}),
    Error,
    'is not defined in context',
  );
});

Deno.test('route modules are generated from the shipped route assets, not restated', async () => {
  await withTempRoot(async (tempRoot) => {
    const appRoot = join(tempRoot, 'app');
    await materializeAppRouterSupport(appRoot);
    const generatedRoutes = await Deno.readTextFile(join(appRoot, '.generated/routes.ts'));

    assert(shippedAppRouteAssets().includes(TEMPLATE_KEYS.appRouter) === false);
    assert(shippedAppRouteAssets().includes('app/routes/examples/orders/[id].tsx.template'));
    assertStringIncludes(generatedRoutes, 'auto-generated by @netscript/fresh/vite');
    assertStringIncludes(
      generatedRoutes,
      `createRouteReference(routePatterns.partials.orders.$id.$route, { id: "partials.orders.$id", kind: "partial" })`,
    );
    assertEquals(Object.keys(DOCUMENTED_READER_ROUTES), ['partials/orders/[id].tsx']);
  });
});

Deno.test('the support router type-checks for the README partial consumer', async () => {
  await withTempRoot(async (tempRoot) => {
    const routerPath = await materializeAppRouterSupport(join(tempRoot, 'app'));
    const output = await checkRouterProbe(tempRoot, routerPath);

    assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
  });
});

Deno.test('negative control: a route tree drifted from the router template fails the check', async () => {
  await withTempRoot(async (tempRoot) => {
    // Drop the scaffold's order route, which the shipped router binds as `appRoutes.order`.
    const routerPath = await materializeAppRouterSupport(join(tempRoot, 'app'), {
      routeAssets: shippedAppRouteAssets().filter((asset) => !asset.includes('/orders/')),
    });
    const output = await checkRouterProbe(tempRoot, routerPath);
    const diagnostics = new TextDecoder().decode(output.stderr);

    assert(output.code !== 0, 'expected the drifted router to fail type-checking');
    assertStringIncludes(diagnostics, "Property 'orders' does not exist");
  });
});
