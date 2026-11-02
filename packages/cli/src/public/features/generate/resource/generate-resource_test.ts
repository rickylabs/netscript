import { assertEquals, assertStringIncludes } from '@std/assert';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { StringTemplateAdapter } from '../../../../kernel/adapters/scaffold/template-adapter.ts';
import { loadResourceSliceTemplateAssets } from '../../../../kernel/adapters/templates/scaffold-template-assets.ts';
import { renderResourceSlice } from '../../../../kernel/application/resource-slice/render-resource-slice.ts';
import { planResourceSlice } from '../../../../kernel/application/resource-slice/plan-resource-slice.ts';
import {
  normalizeResourceSliceInput,
  parseOwnedResourceSliceLeaf,
} from '../../../../kernel/application/resource-slice/resource-slice-contract.ts';
import { generateResource, type GenerateResourceDependencies } from './generate-resource.ts';
import { toGenerateResourceRequest } from './generate-resource-input.ts';

const APP_ROOT = '/workspace/apps/dashboard';
const ROUTER = `import { routePatterns } from './.generated/manifest.ts';
import { routes as generatedRoutes } from './.generated/routes.ts';

export const appRoutes = {
} as const;
`;

Deno.test('resource input maps the optional layers without changing selector text', () => {
  assertEquals(
    toGenerateResourceRequest('orders', {
      procedure: 'admin.list',
      client: 'billing-v2',
      app: 'dashboard',
      route: '/orders/history',
      form: true,
      stream: true,
      dryRun: true,
    }),
    {
      resource: 'orders',
      procedure: 'admin.list',
      client: 'billing-v2',
      app: 'dashboard',
      route: '/orders/history',
      projectRoot: undefined,
      variants: ['form', 'stream'],
      dryRun: true,
      force: false,
    },
  );
});

Deno.test('resource use case resolves, stages, preflights, then applies deterministic paths', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(`${APP_ROOT}/router.ts`, ROUTER);
  const events: string[] = [];
  const dependencies = await createDependencies(fs, events);

  const result = await generateResource({
    resource: 'orders',
    app: 'dashboard',
    client: 'billing',
    procedure: 'admin.list',
    route: '/orders/history',
    variants: [],
    dryRun: false,
    force: false,
  }, dependencies);

  assertEquals(events, [
    'app:dashboard',
    'client:billing',
    'procedure:admin.list',
    'stage:/orders/history:6',
  ]);
  assertEquals(result.status, 'applied');
  assertEquals(result.exitCode, 0);
  assertEquals(result.written.length, 9);
  assertEquals(result.conflicts, []);
  assertStringIncludes(
    await fs.readFile(`${APP_ROOT}/router.ts`),
    'orders: generatedRoutes.orders.history.$route',
  );
  assertStringIncludes(
    await fs.readFile(`${APP_ROOT}/routes/orders/history/index.tsx`),
    '// @netscript/resource-slice ',
  );
});

Deno.test('resource use case carries prior marker options into a later request', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(`${APP_ROOT}/router.ts`, ROUTER);
  const dependencies = await createDependencies(fs);
  const base = {
    resource: 'orders',
    procedure: 'list',
    variants: ['form'] as const,
    dryRun: false,
    force: false,
  };
  await generateResource(base, dependencies);

  const next = await generateResource({ ...base, variants: ['stream'] }, dependencies);

  assertEquals(next.status, 'applied');
  assertEquals(
    next.report.some((entry) => entry.path.endsWith('/orders-form.tsx') && entry.action === 'skip'),
    true,
  );
  assertStringIncludes(
    await fs.readFile(`${APP_ROOT}/routes/orders/index.tsx`),
    '"options":["core","form","stream"]',
  );
});

async function createDependencies(
  fs: MemoryFileSystemAdapter,
  events: string[] = [],
): Promise<GenerateResourceDependencies> {
  return {
    fs,
    templateRenderer: new StringTemplateAdapter(fs),
    templates: await loadResourceSliceTemplateAssets(),
    resolveAppRoot: (input) => {
      events.push(`app:${input.app ?? ''}`);
      return Promise.resolve(APP_ROOT);
    },
    resolveClient: (_appRoot, client) => {
      events.push(`client:${client ?? ''}`);
      return Promise.resolve({
        serviceName: client ?? 'orders',
        moduleSpecifier: '@app/lib/orders.ts',
        queryFactoryName: 'ordersQueries',
      });
    },
    resolveProcedure: (input) => {
      events.push(`procedure:${input.procedure}`);
      return Promise.resolve({
        path: input.procedure.split('.') as [string, ...string[]],
        kind: 'query',
      });
    },
    stage: (input) => {
      events.push(`stage:${input.route}:${input.leaves.length}`);
      return Promise.resolve({
        routeKeyPath: routeKeyPath(input.route),
        shared: [
          { path: '.generated/manifest.ts', content: 'manifest\n', role: 'fresh-derived' },
          { path: '.generated/routes.ts', content: 'routes\n', role: 'fresh-derived' },
        ],
      });
    },
  };
}

function routeKeyPath(route: string): [string, ...string[]] {
  const [first, ...rest] = route.slice(1).split('/');
  if (!first) throw new Error('Expected a normalized route.');
  return [first, ...rest, '$route'];
}

Deno.test('resource rerun preserves proven initial input in dry-run and apply', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(`${APP_ROOT}/router.ts`, ROUTER);
  const dependencies = await createDependencies(fs);
  const request = {
    resource: 'orders',
    procedure: 'list',
    variants: [] as const,
    dryRun: false,
    force: false,
  };
  await generateResource(request, {
    ...dependencies,
    resolveProcedure: async (input) => ({
      ...await dependencies.resolveProcedure(input),
      initialInput: { offset: 0, limit: 25 },
    }),
  });
  const path = 'routes/orders/(_shared)/orders-loaders.ts';
  const original = await fs.readFile(`${APP_ROOT}/${path}`);
  for (const dryRun of [true, false]) {
    const result = await generateResource({ ...request, dryRun }, dependencies);
    assertEquals(result.exitCode, 0);
    assertEquals(result.report.find((entry) => entry.path === path), {
      path,
      action: 'skip',
      classification: 'exact',
    });
    assertEquals(await fs.readFile(`${APP_ROOT}/${path}`), original);
  }
});

Deno.test('resource rerun refuses edited, unowned or mismatched initial input provenance', async () => {
  for (const scenario of ['marker', 'body', 'unowned', 'procedure', 'client', 'explicit']) {
    const fs = new MemoryFileSystemAdapter();
    await fs.writeFile(`${APP_ROOT}/router.ts`, ROUTER);
    const dependencies = await createDependencies(fs);
    const request = {
      resource: 'orders',
      procedure: 'list',
      variants: [] as const,
      dryRun: false,
      force: false,
    };
    await generateResource(request, {
      ...dependencies,
      resolveProcedure: async (input) => ({
        ...await dependencies.resolveProcedure(input),
        initialInput: { limit: 25, offset: 0 },
      }),
    });
    const path = 'routes/orders/(_shared)/orders-loaders.ts';
    const original = await fs.readFile(`${APP_ROOT}/${path}`);
    const edited = scenario === 'marker'
      ? original.replace('"limit":25', '"limit":50')
      : scenario === 'body'
      ? original + '// authored edit\n'
      : scenario === 'unowned'
      ? original.slice(original.indexOf('\n') + 1)
      : original;
    await fs.writeFile(`${APP_ROOT}/${path}`, edited);
    const result = await generateResource({
      ...request,
      procedure: scenario === 'procedure' ? 'search' : 'list',
    }, {
      ...dependencies,
      resolveClient: async (...args) => ({
        ...await dependencies.resolveClient(...args),
        ...(scenario === 'client' ? { moduleSpecifier: '@app/lib/other.ts' } : {}),
      }),
      resolveProcedure: async (input) => ({
        ...await dependencies.resolveProcedure(input),
        ...(scenario === 'explicit' ? { initialInput: { limit: 100, offset: 0 } } : {}),
      }),
    });
    assertEquals(result.exitCode, 1, scenario);
    assertEquals(result.conflicts.includes(path), true, scenario);
    assertEquals(await fs.readFile(`${APP_ROOT}/${path}`), edited, scenario);
  }
});

/** Seed the same canonical island authority used by init, without a public currency assumption. */
async function presentationFixture(amountUnit: 'minor' | 'major') {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(`${APP_ROOT}/router.ts`, ROUTER);
  const dependencies = await createDependencies(fs);
  const plan = planResourceSlice(normalizeResourceSliceInput({
    resource: 'orders',
    app: 'dashboard',
    client: await dependencies.resolveClient(APP_ROOT, 'orders'),
    procedure: { path: ['list'], kind: 'query' },
  }));
  for (
    const leaf of await renderResourceSlice(
      plan,
      dependencies.templates,
      dependencies.templateRenderer,
      { amountUnit },
    )
  ) {
    await fs.writeFile(`${APP_ROOT}/${leaf.path}`, leaf.content);
  }
  return {
    fs,
    dependencies,
    request: {
      resource: 'orders',
      procedure: 'list',
      variants: [] as const,
      dryRun: false,
      force: false,
    },
    path: 'routes/orders/(_islands)/OrdersIsland.tsx',
  };
}

Deno.test('resource rerun preserves proven amount units in dry-run, apply and layer additions', async () => {
  for (const unit of ['minor', 'major'] as const) {
    const { fs, dependencies, request, path } = await presentationFixture(unit);
    const original = await fs.readFile(`${APP_ROOT}/${path}`);
    assertEquals(parseOwnedResourceSliceLeaf(original)?.amountUnit, unit);
    for (const dryRun of [true, false]) {
      const result = await generateResource(
        { ...request, dryRun, variants: ['form'] },
        dependencies,
      );
      assertEquals(result.exitCode, 0);
      assertEquals(result.report.find((entry) => entry.path === path), {
        path,
        action: 'skip',
        classification: 'exact',
      });
      assertEquals(await fs.readFile(`${APP_ROOT}/${path}`), original);
    }
  }
});

Deno.test('resource rerun refuses edited or mismatched amount-unit provenance', async () => {
  for (const scenario of ['marker', 'body', 'unowned', 'client', 'procedure']) {
    const { fs, dependencies, request, path } = await presentationFixture('minor');
    const original = await fs.readFile(`${APP_ROOT}/${path}`);
    const edited = scenario === 'marker'
      ? original.replace('"amountUnit":"minor"', '"amountUnit":"major"')
      : scenario === 'body'
      ? original + '// authored edit\n'
      : scenario === 'unowned'
      ? original.slice(original.indexOf('\n') + 1)
      : original;
    await fs.writeFile(`${APP_ROOT}/${path}`, edited);
    const result = await generateResource({
      ...request,
      procedure: scenario === 'procedure' ? 'search' : 'list',
    }, {
      ...dependencies,
      resolveClient: async (...args) => ({
        ...await dependencies.resolveClient(...args),
        ...(scenario === 'client' ? { moduleSpecifier: '@app/lib/other.ts' } : {}),
      }),
    });
    assertEquals(result.exitCode, 1, scenario);
    assertEquals(result.conflicts.includes(path), true, scenario);
    assertEquals(await fs.readFile(`${APP_ROOT}/${path}`), edited, scenario);
  }
});

Deno.test('forcing a different client never carries the old currency interpretation', async () => {
  const { fs, dependencies, request, path } = await presentationFixture('minor');
  const result = await generateResource({ ...request, force: true }, {
    ...dependencies,
    resolveClient: async (...args) => ({
      ...await dependencies.resolveClient(...args),
      moduleSpecifier: '@app/lib/other.ts',
    }),
  });
  assertEquals(result.exitCode, 0);
  assertEquals(
    parseOwnedResourceSliceLeaf(await fs.readFile(`${APP_ROOT}/${path}`))?.amountUnit,
    undefined,
  );
});
