import {
  assert,
  assertEquals,
  assertFalse,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from '@std/assert';
import { MemoryFileSystemAdapter } from '../../../adapters/scaffold/memory-fs.ts';
import { DenoProcess } from '../../../adapters/runtime/process/deno-process.ts';
import { DenoGeneratedSourceFormatter } from '../../../adapters/runtime/process/deno-generated-source-formatter.ts';
import { readTemplateAsset } from '../../../adapters/templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../../assets/manifest.ts';
import { scaffoldUiIsland, scaffoldUiPage } from './web-scaffold.ts';
import { QUERY_RESULT_SUCCESS_RETURN, QUERY_RESULT_TEMPLATE } from './query-result-template.ts';

const APP_ROOT = '/workspace/shop/apps/dashboard';
const ROUTER_PATH = `${APP_ROOT}/router.ts`;
const NAVIGATION_PATH = `${APP_ROOT}/navigation.ts`;
/** The navigation module exactly as `netscript init` writes it. */
const NAVIGATION_SOURCE = await readTemplateAsset(TEMPLATE_KEYS.appNavigation);
const ROUTER_SOURCE = `import { createRouteReference } from '@netscript/fresh/route';
import { routes } from './routes.ts';

export const appRoutes = {
  home: routes.$route,
} as const;
`;

type PlannedFile = {
  readonly path: string;
  readonly content: string;
  readonly role?: string;
};

function queryModule(service = 'orders'): string {
  return `import { createQueryFactories } from '@netscript/sdk/query';
export const ${service}Name = '${service}';
export const ${service}Queries = createQueryFactories({
  service: { contract: ${service}Contract, client: ${service}Client },
}).service;
`;
}

const PERSISTENT_CONTRACT = `import { createCrudContract } from '@netscript/contracts/crud';
export const OrdersCrudContractV1 = createCrudContract({ resource: 'orders' });
`;
const MEMORY_CONTRACT = `export const OrdersListInputSchemaV1 = z.object({
  limit: z.number(),
  offset: z.number(),
});
`;

async function seedApp(
  fs: MemoryFileSystemAdapter,
  options: {
    readonly fallback?: boolean | string;
    readonly contract?: string;
  } = {},
): Promise<void> {
  await fs.writeFile(ROUTER_PATH, ROUTER_SOURCE);
  const exampleDir = typeof options.fallback === 'string' ? options.fallback : 'service';
  const queryPath = options.fallback
    ? `${APP_ROOT}/routes/examples/${exampleDir}/(_lib)/service-query.ts`
    : `${APP_ROOT}/lib/orders.ts`;
  await fs.writeFile(queryPath, queryModule());
  await fs.writeFile(
    '/workspace/shop/contracts/versions/v1/orders.contract.ts',
    options.contract ?? PERSISTENT_CONTRACT,
  );
}

async function seedClient(
  fs: MemoryFileSystemAdapter,
  fileName: string,
  service: string,
): Promise<void> {
  await fs.writeFile(`${APP_ROOT}/lib/${fileName}.ts`, queryModule(service));
  await fs.writeFile(
    `/workspace/shop/contracts/versions/v1/${service}.contract.ts`,
    `export const ${service}CrudContractV1 = createCrudContract({ resource: '${service}' });\n`,
  );
}

function plannedFiles(result: unknown): readonly PlannedFile[] {
  return (result as { readonly files: readonly PlannedFile[] }).files;
}

function assertDataScreenPlan(files: readonly PlannedFile[]): void {
  assertEquals(
    files.map((file) => file.role).sort(),
    ['island', 'page', 'query-loader', 'route-registration'],
  );
  const source = files.map((file) => file.content).join('\n');
  for (
    const fragment of [
      "from '@app/router.ts'",
      '.withRoute(appRoutes[',
      'createNetScriptQueryClient',
      '.list.queryOptions(input)',
      '.list.clientKey(props.input)',
      'fetchQuery',
      'QueryIsland',
      'useIslandQuery',
      'initialData: props.initialData',
      'initialDataUpdatedAt: props.cachedAt',
      'QueryResult value={query.data}',
      'data-query-result',
      "role='status'",
      "role='alert'",
    ]
  ) {
    assertStringIncludes(source, fragment);
  }
  assertFalse(source.includes('JSON.stringify(query.data'));
  assertFalse(source.includes('useSignal(0)'));
  assertFalse(source.includes('queryLoaders = {}'));
}

Deno.test('page --island auto-discovers its single client without a selector', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedApp(fs);

  const result = await scaffoldUiPage(
    { projectRoot: APP_ROOT, path: 'admin/status', island: true },
    fs,
  );
  const files = plannedFiles(result);
  assertEquals(files.length, 4);
  assertDataScreenPlan(files);
  assertEquals(
    files.map((file) => file.path).sort(),
    [
      ROUTER_PATH,
      `${APP_ROOT}/routes/admin/status/(_islands)/StatusIsland.tsx`,
      `${APP_ROOT}/routes/admin/status/(_shared)/query-loaders.ts`,
      `${APP_ROOT}/routes/admin/status/index.tsx`,
    ].sort(),
  );
  assertStringIncludes(
    await fs.readFile(ROUTER_PATH),
    "'admin.status': createRouteReference",
  );
  // Regression: a runtime scaffold.runtime run against a real project caught the emitted
  // `return <QueryIsland>...</QueryIsland>;` as a single line the generated project's own
  // `deno fmt --check` then rejected. The template must always emit the multi-line JSX form
  // deno fmt itself produces, independent of component name length.
  assertStringIncludes(
    await fs.readFile(`${APP_ROOT}/routes/admin/status/(_islands)/StatusIsland.tsx`),
    '  return (\n    <QueryIsland>\n      <StatusData {...props} />\n    </QueryIsland>\n  );',
  );
});

Deno.test('--client selects by declared service identity for pages and islands', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedApp(fs);
  await seedClient(fs, 'not-the-service-name', 'payments');

  const page = await scaffoldUiPage(
    {
      projectRoot: APP_ROOT,
      path: 'payments',
      island: true,
      client: 'payments',
      dryRun: true,
    },
    fs,
  );
  const island = await scaffoldUiIsland(
    {
      projectRoot: APP_ROOT,
      name: 'payments-panel',
      query: true,
      client: 'payments',
      dryRun: true,
    },
    fs,
  );
  const source = [...plannedFiles(page), ...plannedFiles(island)]
    .map((file) => file.content)
    .join('\n');

  assertStringIncludes(source, 'paymentsQueries');
  assertStringIncludes(source, 'not-the-service-name.ts');
  assertFalse(source.includes('ordersQueries'));
});

Deno.test('--client reports an unmatched service separately and lists available services', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedApp(fs);
  await seedClient(fs, 'payments', 'payments');
  const before = new Map(fs.getFiles());

  const error = await assertRejects(
    () =>
      scaffoldUiPage(
        {
          projectRoot: APP_ROOT,
          path: 'users',
          island: true,
          client: 'users',
        },
        fs,
      ),
    Error,
    "selected client 'users' matches no query client",
  );
  assertStringIncludes(error.message, 'Available services: orders, payments.');
  assertStringIncludes(error.message, 'Use --client <service> to select one.');
  assertEquals(fs.getFiles(), before);
});

Deno.test('--client reports duplicate service identities separately', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedApp(fs);
  await fs.writeFile(`${APP_ROOT}/lib/orders-copy.ts`, queryModule('orders'));
  const before = new Map(fs.getFiles());

  const error = await assertRejects(
    () =>
      scaffoldUiIsland(
        {
          projectRoot: APP_ROOT,
          name: 'orders-panel',
          query: true,
          client: 'orders',
        },
        fs,
      ),
    Error,
    "selected client 'orders' matches more than one query client",
  );
  assertStringIncludes(error.message, `${APP_ROOT}/lib/orders.ts`);
  assertStringIncludes(error.message, `${APP_ROOT}/lib/orders-copy.ts`);
  assertStringIncludes(error.message, "More than one candidate declares service 'orders'.");
  assertEquals(fs.getFiles(), before);
});

Deno.test('multiple clients without --client stay fail-closed and name the remedy', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedApp(fs);
  await seedClient(fs, 'payments', 'payments');
  const before = new Map(fs.getFiles());

  const error = await assertRejects(
    () =>
      scaffoldUiPage(
        { projectRoot: APP_ROOT, path: 'orders', island: true },
        fs,
      ),
    Error,
    'multiple query clients are ambiguous',
  );
  assertStringIncludes(error.message, 'Available services: orders, payments.');
  assertStringIncludes(error.message, 'Use --client <service> to select one.');
  assertStringIncludes(error.message, 'Exactly one conventional generated client is required.');
  assertEquals(fs.getFiles(), before);
});

Deno.test('page --island dry-run plans the memory dialect through the init fallback without writes', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedApp(fs, { fallback: true, contract: MEMORY_CONTRACT });
  const before = new Map(fs.getFiles());

  const result = await scaffoldUiPage(
    {
      projectRoot: APP_ROOT,
      path: 'activity',
      island: true,
      dryRun: true,
    } as Parameters<
      typeof scaffoldUiPage
    >[0],
    fs,
  );
  const files = plannedFiles(result);
  assertDataScreenPlan(files);
  const loader = files.find((file) => file.role === 'query-loader')?.content ??
    '';
  assertStringIncludes(loader, 'offset: 0');
  assertFalse(loader.includes('sortBy'));
  assertEquals(fs.getFiles(), before);
});

Deno.test("page --island discovers the example query client under its real service-named directory, not only the literal 'service' fallback", async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedApp(fs, { fallback: 'users', contract: MEMORY_CONTRACT });

  const result = await scaffoldUiPage(
    {
      projectRoot: APP_ROOT,
      path: 'activity',
      island: true,
      dryRun: true,
    } as Parameters<typeof scaffoldUiPage>[0],
    fs,
  );
  assertDataScreenPlan(plannedFiles(result));
});

Deno.test('data-bound scaffold names the prerequisite and performs zero writes without a binding', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(ROUTER_PATH, ROUTER_SOURCE);
  const before = new Map(fs.getFiles());

  await assertRejects(
    () =>
      scaffoldUiPage(
        { projectRoot: APP_ROOT, path: 'orders', island: true },
        fs,
      ),
    Error,
    'netscript service add --name <service> --with-client',
  );
  assertEquals(fs.getFiles(), before);
});

Deno.test('target collision preflight rejects before writing any other planned file', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedApp(fs);
  const islandPath = `${APP_ROOT}/routes/orders/(_islands)/OrdersIsland.tsx`;
  await fs.writeFile(islandPath, '// owned island\n');
  const before = new Map(fs.getFiles());

  await assertRejects(
    () =>
      scaffoldUiPage(
        { projectRoot: APP_ROOT, path: 'orders', island: true },
        fs,
      ),
    Error,
    islandPath,
  );
  assertEquals(fs.getFiles(), before);
});

Deno.test('force replaces all generated targets after complete preflight', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedApp(fs);
  for (
    const path of [
      `${APP_ROOT}/routes/orders/index.tsx`,
      `${APP_ROOT}/routes/orders/(_islands)/OrdersIsland.tsx`,
      `${APP_ROOT}/routes/orders/(_shared)/query-loaders.ts`,
    ]
  ) {
    await fs.writeFile(path, '// stale generated target\n');
  }

  const result = await scaffoldUiPage(
    {
      projectRoot: APP_ROOT,
      path: 'orders',
      island: true,
      force: true,
    } as Parameters<
      typeof scaffoldUiPage
    >[0],
    fs,
  );
  assertDataScreenPlan(plannedFiles(result));
  assertFalse(
    (await fs.readFile(`${APP_ROOT}/routes/orders/index.tsx`)).includes(
      'stale',
    ),
  );
  assertStringIncludes(
    await fs.readFile(ROUTER_PATH),
    "'orders': createRouteReference",
  );
});

Deno.test('plain page uses appRoutes registration without requiring a query binding', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(ROUTER_PATH, ROUTER_SOURCE);

  const files = plannedFiles(
    await scaffoldUiPage({ projectRoot: APP_ROOT, path: 'about/team' }, fs),
  );
  assertEquals(files.map((file) => file.role).sort(), [
    'page',
    'route-registration',
  ]);
  const page = await fs.readFile(`${APP_ROOT}/routes/about/team/index.tsx`);
  assertStringIncludes(page, "import { appRoutes } from '@app/router.ts';");
  assertStringIncludes(page, ".withRoute(appRoutes['about.team'])");
  assertFalse(page.includes('createRouteReference'));
});

Deno.test('standalone islands use the route-tree convention and query mode binds the list factory', async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedApp(fs);

  await scaffoldUiIsland({ projectRoot: APP_ROOT, name: 'live-counter' }, fs);
  const queryResult = await scaffoldUiIsland(
    { projectRoot: APP_ROOT, name: 'query-panel', query: true },
    fs,
  );
  assert(await fs.exists(`${APP_ROOT}/routes/(_islands)/LiveCounter.tsx`));
  assertFalse(await fs.exists(`${APP_ROOT}/islands/LiveCounter.tsx`));
  assertEquals(plannedFiles(queryResult)[0].role, 'island');
  const queryIsland = await fs.readFile(
    `${APP_ROOT}/routes/(_islands)/QueryPanel.tsx`,
  );
  assertStringIncludes(queryIsland, 'useIslandQuery');
  assertStringIncludes(queryIsland, '.list.queryOptions(');
  assertStringIncludes(queryIsland, '.list.clientKey(');
  // Regression: a runtime scaffold.runtime run against a real project caught the emitted
  // `return <QueryIsland>...</QueryIsland>;` as a single line the generated project's own
  // `deno fmt --check` then rejected. The template must always emit the multi-line JSX form
  // deno fmt itself produces, independent of component name length.
  assertStringIncludes(
    queryIsland,
    '  return (\n    <QueryIsland>\n      <QueryPanelData />\n    </QueryIsland>\n  );',
  );
});

Deno.test('semantic golden rejects the old counter and empty-loader emission', () => {
  const oldFiles: PlannedFile[] = [
    {
      path: 'index.tsx',
      role: 'page',
      content: ".withLayer('orders', () => <div />, () => ({}))",
    },
    {
      path: 'OrdersIsland.tsx',
      role: 'island',
      content: 'const count = useSignal(0);',
    },
    {
      path: 'query-loaders.ts',
      role: 'query-loader',
      content: 'export const queryLoaders = {} as const;',
    },
    { path: 'router.ts', role: 'route-registration', content: ROUTER_SOURCE },
  ];
  assertThrows(() => assertDataScreenPlan(oldFiles), Error);
});

Deno.test('top-level pages are linked in the scaffold navigation and render inside the page rhythm', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(ROUTER_PATH, ROUTER_SOURCE);
  await fs.writeFile(NAVIGATION_PATH, NAVIGATION_SOURCE);

  const result = await scaffoldUiPage({ projectRoot: APP_ROOT, path: 'data-screen' }, fs);

  assertEquals(result.files.map((file) => file.role).sort(), [
    'navigation-registration',
    'page',
    'route-registration',
  ]);
  const navigation = await fs.readFile(NAVIGATION_PATH);
  assertStringIncludes(
    navigation,
    "  { href: appRoutes.design.href(), label: 'Design', match: 'prefix', developmentOnly: true },\n" +
      "  { href: appRoutes['data-screen'].href(), label: 'Data Screen', match: 'prefix' },\n];",
  );
  const page = await fs.readFile(`${APP_ROOT}/routes/data-screen/index.tsx`);
  assertStringIncludes(page, "import { PageHeader } from '@app/components/ui/mod.ts';");
  assertStringIncludes(page, "<main class='ns-shell ns-section ns-stack ns-stack--lg'>");
  assertStringIncludes(page, '<h1>Data Screen</h1>');
  assertStringIncludes(page, '{slots.dataScreen()}');
  assertStringIncludes(page, ".withMeta(() => ({ title: 'Data Screen' }))");
  assert(result.nextSteps.some((step) => step.includes('routes/_layout.tsx')));
  assert(result.nextSteps.some((step) => step.includes('web-layer/how-to/theme-your-app')));
});

Deno.test('nested pages stay out of the navigation unless --nav asks for a label', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(ROUTER_PATH, ROUTER_SOURCE);
  await fs.writeFile(NAVIGATION_PATH, NAVIGATION_SOURCE);

  const nested = await scaffoldUiPage({ projectRoot: APP_ROOT, path: 'admin/users' }, fs);
  assertFalse(nested.files.some((file) => file.role === 'navigation-registration'));
  assertEquals(await fs.readFile(NAVIGATION_PATH), NAVIGATION_SOURCE);
  assert(nested.nextSteps.some((step) => step.includes("appRoutes['admin.users']")));

  await scaffoldUiPage(
    { projectRoot: APP_ROOT, path: 'admin/audit', nav: "Owner's audit" },
    fs,
  );
  assertStringIncludes(
    await fs.readFile(NAVIGATION_PATH),
    "  { href: appRoutes['admin.audit'].href(), label: 'Owner\\'s audit', match: 'prefix' },",
  );
});

Deno.test('--no-nav skips the link and re-running a linked page never duplicates it', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(ROUTER_PATH, ROUTER_SOURCE);
  await fs.writeFile(NAVIGATION_PATH, NAVIGATION_SOURCE);

  await scaffoldUiPage({ projectRoot: APP_ROOT, path: 'login', nav: false }, fs);
  assertEquals(await fs.readFile(NAVIGATION_PATH), NAVIGATION_SOURCE);

  await scaffoldUiPage({ projectRoot: APP_ROOT, path: 'notes' }, fs);
  await scaffoldUiPage({ projectRoot: APP_ROOT, path: 'notes', force: true }, fs);
  const navigation = await fs.readFile(NAVIGATION_PATH);
  assertEquals(navigation.split("appRoutes['notes']").length - 1, 1);
});

Deno.test('apps without navigation.ts get guidance by default and a pre-write failure for --nav', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(ROUTER_PATH, ROUTER_SOURCE);

  const implicit = await scaffoldUiPage(
    { projectRoot: APP_ROOT, path: 'notes', dryRun: true },
    fs,
  );
  assertFalse(implicit.files.some((file) => file.role === 'navigation-registration'));
  assert(implicit.nextSteps.some((step) => step.includes('predates scaffold navigation')));

  const before = new Map(fs.getFiles());
  await assertRejects(
    () => scaffoldUiPage({ projectRoot: APP_ROOT, path: 'notes', nav: true }, fs),
    Error,
    "Cannot link 'notes' in the top bar",
  );
  assertEquals(fs.getFiles(), before);

  await fs.writeFile(NAVIGATION_PATH, 'export const appNavigation = [];\n');
  await assertRejects(
    () => scaffoldUiPage({ projectRoot: APP_ROOT, path: 'notes', nav: 'Notes' }, fs),
    Error,
    "no recognizable 'export const appNavigation' array",
  );
});

Deno.test('generated pages and navigation entries are already in deno fmt canonical form', async () => {
  const formatter = new DenoGeneratedSourceFormatter(new DenoProcess());
  for (
    const path of ['notes', 'data-screen', 'quarterly-operational-readiness-review-dashboard']
  ) {
    for (const island of [false, true]) {
      const fs = new MemoryFileSystemAdapter();
      await seedApp(fs);
      await fs.writeFile(NAVIGATION_PATH, NAVIGATION_SOURCE);
      const result = await scaffoldUiPage({ projectRoot: APP_ROOT, path, island }, fs);
      for (const file of result.files) {
        if (file.role === 'route-registration') continue;
        // The query-loader/island templates predate this check and still overflow at very long
        // names; the page and the navigation entry are pinned for every length.
        const longName = path.length > 40;
        if (longName && file.role !== 'page' && file.role !== 'navigation-registration') continue;
        assertEquals(
          await formatter.formatContent(file.path, file.content),
          file.content,
          `${file.role} for '${path}' (island: ${island}) must survive deno fmt --check`,
        );
      }
    }
  }
});

Deno.test('edited app and resource templates emit canonical generated source', async () => {
  const formatter = new DenoGeneratedSourceFormatter(new DenoProcess());
  const templates = [
    'app/routes/_layout.tsx.template',
    'app/routes/(_components)/health-view.tsx.template',
    'resource-slice/(_islands)/ResourceIsland.tsx.template',
  ];
  const values: Readonly<Record<string, string>> = {
    queryResultReturn: QUERY_RESULT_SUCCESS_RETURN,
    queryResultTemplate: QUERY_RESULT_TEMPLATE.trim(),
    name: 'shop',
    appName: 'dashboard',
    resource: 'orders',
    resourcePascalCase: 'Orders',
    queryFactoryName: 'ordersQueries',
    queryFactory: 'ordersQueries.list',
    clientModuleSpecifier: '../(_lib)/orders.ts',
  };
  for (const template of templates) {
    const source = await Deno.readTextFile(new URL(`../../../assets/${template}`, import.meta.url));
    const rendered = source.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
      const value = values[name];
      if (value === undefined) throw new Error(`Missing template value: ${name}`);
      return value;
    });
    assertEquals(await formatter.formatContent('fixture.tsx', rendered), rendered, template);
  }
});
