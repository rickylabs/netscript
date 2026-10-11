import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { createUiRemoveCommand } from './remove-ui-command.ts';
import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { dirname, join, resolve } from '@std/path';
import { createPublicCommandDependencies } from '../../root/public-command-dependencies.ts';
import {
  createPublicCommandRegistry,
  createPublicCommandTree,
} from '../../root/public-command-tree.ts';

async function fixture(
  run: (root: string, command: (...args: string[]) => Promise<void>) => Promise<void>,
): Promise<void> {
  const root = await Deno.makeTempDir({ prefix: 'page-removal-' });
  try {
    await Deno.mkdir(join(root, 'routes'));
    await Deno.mkdir(join(root, 'lib'));
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({ workspace: ['apps/dashboard'], fmt: { singleQuote: true, lineWidth: 100 } }),
    );
    await Deno.writeTextFile(join(root, 'appsettings.json'), '{}');
    await Deno.writeTextFile(
      join(root, 'router.ts'),
      `import { createRouteReference } from '@netscript/fresh/route';
export const appRoutes = {
  home: createRouteReference('/', { id: 'home', kind: 'page' }),
  authored: customRoute({ nested: { keep: true } }),
} as const;
// authored trailing content
`,
    );
    await Deno.writeTextFile(
      join(root, 'lib/orders.ts'),
      `export const ordersName = 'orders';
export const ordersQueries = createQueryFactories({}).service;
`,
    );
    // selectClientBinding follows the app's conventional workspace-relative contract path.
    // Use a workspace fixture within this temp directory, rather than touching a shared temp parent.
    const app = join(root, 'apps/dashboard');
    await Deno.mkdir(join(app, 'routes'), { recursive: true });
    await Deno.writeTextFile(join(app, 'deno.json'), '{}');
    for (const file of ['router.ts']) await Deno.copyFile(join(root, file), join(app, file));
    await Deno.mkdir(join(app, 'lib'));
    await Deno.copyFile(join(root, 'lib/orders.ts'), join(app, 'lib/orders.ts'));
    await Deno.mkdir(join(root, 'contracts/versions/v1'), { recursive: true });
    await Deno.writeTextFile(
      join(root, 'contracts/versions/v1/orders.contract.ts'),
      'export const contract = createCrudContract({});\n',
    );
    const command = async (...args: string[]) => {
      await createPublicCommandTree({
        cwd: () => app,
        resolvePath: (path) => resolve(app, path ?? '.'),
      }).parse([...args, '--project-root', app]);
    };
    await run(app, command);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test('ui:remove page removes generated triad and reconstructs manifest while preserving authored routes', async () => {
  await fixture(async (root, run) => {
    await run('ui:add', 'page', 'catalog', '--island', '--client', 'orders');
    await Deno.writeTextFile(join(root, 'routes/catalog/notes.txt'), '// authored sibling\n');
    await Deno.mkdir(join(root, 'routes/other'));
    await Deno.writeTextFile(join(root, 'routes/other/index.tsx'), 'export default {};\n');
    const routerBefore = await Deno.readTextFile(join(root, 'router.ts'));
    await run('generate', 'routes');
    assertStringIncludes(await Deno.readTextFile(join(root, '.generated/manifest.ts')), '/catalog');
    await run('ui:remove', 'page', 'catalog', '--client', 'orders');
    for (
      const file of ['index.tsx', '(_shared)/query-loaders.ts', '(_islands)/CatalogIsland.tsx']
    ) {
      await assertRejects(
        () => Deno.stat(join(root, 'routes/catalog', file)),
        Deno.errors.NotFound,
      );
    }
    assertEquals(
      await Deno.readTextFile(join(root, 'routes/catalog/notes.txt')),
      '// authored sibling\n',
    );
    assertEquals(
      await Deno.readTextFile(join(root, 'routes/other/index.tsx')),
      'export default {};\n',
    );
    const router = await Deno.readTextFile(join(root, 'router.ts'));
    assertEquals(
      router.replace(/\n\n/g, '\n'),
      routerBefore.replace(/ {2}'catalog':[^\n]+\n/, '').replace(/\n\n/g, '\n'),
    );
    for (const file of ['manifest.ts', 'routes.ts']) {
      const source = await Deno.readTextFile(join(root, '.generated', file));
      assert(!source.includes('catalog'));
      assertStringIncludes(source, 'other');
    }
    await Deno.remove(join(root, '.generated'), { recursive: true });
    await run('ui:remove', 'page', 'catalog');
    assertEquals(await Deno.readTextFile(join(root, 'router.ts')), router);
    assertStringIncludes(await Deno.readTextFile(join(root, '.generated/manifest.ts')), '/other');
  });
});

Deno.test('ui:remove page dry run preserves all scaffold and manifest bytes', async () => {
  await fixture(async (root, run) => {
    await run('ui:add', 'page', 'catalog', '--island');
    await run('generate', 'routes');
    const paths = [
      'router.ts',
      'routes/catalog/index.tsx',
      'routes/catalog/(_shared)/query-loaders.ts',
      'routes/catalog/(_islands)/CatalogIsland.tsx',
      '.generated/manifest.ts',
      '.generated/routes.ts',
    ];
    const before = await Promise.all(paths.map((path) => Deno.readTextFile(join(root, path))));
    await run('ui:remove', 'page', 'catalog', '--dry-run');
    assertEquals(
      await Promise.all(paths.map((path) => Deno.readTextFile(join(root, path)))),
      before,
    );
  });
});

for (
  const target of [
    'index.tsx',
    '(_shared)/query-loaders.ts',
    '(_islands)/CatalogIsland.tsx',
    'router',
  ]
) {
  Deno.test(`ui:remove page refuses divergent ${target} before any mutation`, async () => {
    await fixture(async (root, run) => {
      await run('ui:add', 'page', 'catalog', '--island');
      const path = target === 'router'
        ? join(root, 'router.ts')
        : join(root, 'routes/catalog', target);
      const original = await Deno.readTextFile(path);
      await Deno.writeTextFile(
        path,
        target === 'router'
          ? original.replace("id: 'catalog', kind: 'page'", "id: 'catalog', kind: 'handler'")
          : original + '// authored change\n',
      );
      const before = await Deno.readTextFile(join(root, 'router.ts'));
      await assertRejects(() => run('ui:remove', 'page', 'catalog'), Error, 'Refusing removal');
      assertEquals(await Deno.readTextFile(join(root, 'router.ts')), before);
      await Deno.stat(join(root, 'routes/catalog/index.tsx'));
      await assertRejects(() => Deno.stat(join(root, '.generated')), Deno.errors.NotFound);
    });
  });
}

Deno.test('ui:remove page supports plain pages, custom route ids, nested paths and idempotent reruns', async () => {
  await fixture(async (root, run) => {
    await run('ui:add', 'page', 'admin/catalog', '--route', 'inventory');
    await run('ui:remove', 'page', 'admin/catalog');
    const router = await Deno.readTextFile(join(root, 'router.ts'));
    assert(!router.includes('inventory'));
    await assertRejects(() => Deno.stat(join(root, 'routes/admin')), Deno.errors.NotFound);
    assert((await Deno.stat(join(root, 'routes'))).isDirectory);
    await run('ui:remove', 'page', 'admin/catalog');
    assertEquals(await Deno.readTextFile(join(root, 'router.ts')), router);
    await assertRejects(() => run('ui:remove', 'page', '../catalog'), Error, 'Invalid page path');
    await assertRejects(() => run('ui:remove', 'page'), Error, 'requires <path>');
  });
});

Deno.test('ui:remove live help explains page safety and preview options', () => {
  const host = { cwd: () => Deno.cwd(), resolvePath: (path?: string) => resolve(path ?? '.') };
  const command = createPublicCommandRegistry().program({
    name: 'netscript',
    version: 'test',
    description: 'public CLI',
    context: { host, dependencies: createPublicCommandDependencies(host) },
  });
  command.getHelp({ colors: false });
  const remove = command.getCommands().find((entry) => entry.getName() === 'ui:remove');
  assert(remove);
  const help = remove.getHelp({ colors: false, width: 160 });
  for (
    const text of [
      'page triad',
      '--dry-run',
      '--client',
      '--app',
      '--project-root',
      'ui:remove page catalog',
    ]
  ) assertStringIncludes(help, text);
});

async function formatApp(root: string): Promise<void> {
  const result = await new Deno.Command(Deno.execPath(), {
    args: ['fmt', '--config', join(dirname(dirname(root)), 'deno.json'), root],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
}

for (const island of [false, true]) {
  Deno.test(`ui:remove page accepts project-formatted ${island ? 'triad' : 'plain page'} and wrapped route ids`, async () => {
    await fixture(async (root, run) => {
      const path = 'admin/order-history';
      const route =
        'admin.order-history.with-a-deliberately-long-route-id-to-exercise-formatter-wrapping';
      await run('ui:add', 'page', path, '--route', route, ...(island ? ['--island'] : []));
      const originalRouter = await Deno.readTextFile(join(root, 'router.ts'));
      const originalPage = await Deno.readTextFile(join(root, 'routes', path, 'index.tsx'));
      await formatApp(root);
      const formattedRouter = await Deno.readTextFile(join(root, 'router.ts'));
      const formattedPage = await Deno.readTextFile(join(root, 'routes', path, 'index.tsx'));
      assert(formattedRouter !== originalRouter);
      if (!island) assert(formattedPage !== originalPage);
      await run('ui:remove', 'page', path, '--dry-run');
      assertEquals(await Deno.readTextFile(join(root, 'router.ts')), formattedRouter);
      assertEquals(await Deno.readTextFile(join(root, 'routes', path, 'index.tsx')), formattedPage);
      await run('ui:remove', 'page', path);
      await assertRejects(() => Deno.stat(join(root, 'routes/admin')), Deno.errors.NotFound);
      const router = await Deno.readTextFile(join(root, 'router.ts'));
      assert(!router.includes(route));
      assertStringIncludes(router, 'authored: customRoute({ nested: { keep: true } })');
      assertStringIncludes(router, '// authored trailing content');
      assert(!(await Deno.readTextFile(join(root, '.generated/manifest.ts'))).includes(path));
    });
  });
}

Deno.test('ui:remove page preserves nested authored siblings and refuses formatted code edits', async () => {
  await fixture(async (root, run) => {
    await run('ui:add', 'page', 'admin/catalog');
    await Deno.writeTextFile(join(root, 'routes/admin/notes.txt'), 'authored parent sibling');
    await formatApp(root);
    const pagePath = join(root, 'routes/admin/catalog/index.tsx');
    const page = await Deno.readTextFile(pagePath);
    await Deno.writeTextFile(pagePath, page.replace('<h1>Catalog</h1>', '<h1>Authored</h1>'));
    const router = await Deno.readTextFile(join(root, 'router.ts'));
    await assertRejects(() => run('ui:remove', 'page', 'admin/catalog'), Error, 'Refusing removal');
    assertEquals(await Deno.readTextFile(join(root, 'router.ts')), router);
    await Deno.writeTextFile(pagePath, page);
    await run('ui:remove', 'page', 'admin/catalog');
    assertEquals(
      await Deno.readTextFile(join(root, 'routes/admin/notes.txt')),
      'authored parent sibling',
    );
    await assertRejects(() => Deno.stat(join(root, 'routes/admin/catalog')), Deno.errors.NotFound);
  });
});

Deno.test('ui:remove page gives a removal-specific missing router diagnostic', async () => {
  await fixture(async (root, run) => {
    await Deno.remove(join(root, 'router.ts'));
    await assertRejects(
      () => run('ui:remove', 'page', 'catalog'),
      Error,
      'Cannot remove page: router.ts is missing',
    );
  });
});

Deno.test('absent page reports nothing to remove, refreshes manifests only outside dry run', async () => {
  const root = '/workspace/app';
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(`${root}/router.ts`, 'export const appRoutes = {\n} as const;\n');
  const before = new Map(fs.getFiles());
  const output: string[] = [];
  let manifests = 0;
  const command = () =>
    createUiRemoveCommand({
      installDependencies: { fs },
      resolveUiAppRoot: () => Promise.resolve(root),
      formatter: { formatContents: (files) => Promise.resolve(files.map((file) => file.content)) },
      writeManifest: () => {
        manifests++;
        return Promise.resolve();
      },
      print: (message) => output.push(message),
    });
  await command().parse(['page', 'typo']);
  assertEquals(output, ["Nothing to remove for page 'typo'. Derived route modules refreshed."]);
  assertEquals(manifests, 1);
  output.length = 0;
  await command().parse(['page', 'typo', '--dry-run']);
  assertEquals(output, ["Nothing to remove for page 'typo'."]);
  assertEquals(manifests, 1);
  assertEquals(fs.getFiles(), before);
});
