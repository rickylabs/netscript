import { assertEquals, assertStringIncludes } from '@std/assert';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { StringTemplateAdapter } from '../../../../kernel/adapters/scaffold/template-adapter.ts';
import { loadResourceSliceTemplateAssets } from '../../../../kernel/adapters/templates/scaffold-template-assets.ts';
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
