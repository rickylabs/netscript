import { assert, assertEquals, assertRejects } from '@std/assert';
import { MemoryFileSystemAdapter } from '../../../adapters/scaffold/memory-fs.ts';
import { readTemplateAsset } from '../../../adapters/templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../../assets/manifest.ts';
import { removeUiPage } from './remove-ui-page.ts';
import { scaffoldUiPage } from './web-scaffold.ts';

const ROOT = '/workspace/app';
const ROUTER = `${ROOT}/router.ts`;
const PAGE = `${ROOT}/routes/admin/catalog/index.tsx`;
const FORMATTER = {
  formatContents: (files: readonly { readonly content: string }[]) =>
    Promise.resolve(files.map((file) => file.content)),
};

class InterruptedFileSystem extends MemoryFileSystemAdapter {
  failRouterWrite = false;
  failDelete = false;

  override writeFile(path: string, content: string): Promise<void> {
    if (this.failRouterWrite && path === ROUTER) {
      return Promise.reject(new Error('Interrupted write'));
    }
    return super.writeFile(path, content);
  }

  override remove(path: string): Promise<void> {
    if (this.failDelete && path === PAGE) return Promise.reject(new Error('Interrupted delete'));
    return super.remove(path);
  }
}

async function fixture(): Promise<InterruptedFileSystem> {
  const fs = new InterruptedFileSystem();
  await fs.writeFile(
    ROUTER,
    `import { createRouteReference } from '@netscript/fresh/route';
export const appRoutes = {
  home: routes.$route,
} as const;
`,
  );
  await scaffoldUiPage({ projectRoot: ROOT, path: 'admin/catalog' }, fs);
  return fs;
}

Deno.test('page removal writes router before deleting files and can retry that interruption boundary', async () => {
  const fs = await fixture();
  let manifests = 0;
  const remove = () =>
    removeUiPage({ projectRoot: ROOT, path: 'admin/catalog' }, fs, () => {
      manifests++;
      return Promise.resolve();
    }, FORMATTER);
  const before = new Map(fs.getFiles());
  fs.failRouterWrite = true;
  await assertRejects(remove, Error, 'Interrupted write');
  assertEquals(fs.getFiles(), before);
  assertEquals(manifests, 0);
  fs.failRouterWrite = false;
  fs.failDelete = true;
  await assertRejects(remove, Error, 'Interrupted delete');
  assert(await fs.exists(PAGE));
  assert(!(await fs.readFile(ROUTER)).includes('admin.catalog'));
  assertEquals(manifests, 0);
  fs.failDelete = false;
  assertEquals((await remove()).status, 'removed');
  assert(!await fs.exists(PAGE));
  assert(!await fs.exists(`${ROOT}/routes/admin`));
  assert(await fs.exists(`${ROOT}/routes`));
  assertEquals(manifests, 1);
});

Deno.test('missing page with a formatted registration still refuses without mutation', async () => {
  const fs = await fixture();
  await fs.remove(PAGE);
  await fs.writeFile(
    ROUTER,
    `export const appRoutes = {
  'admin.catalog': createRouteReference(
    "/admin/catalog",
    { id: 'admin.catalog', kind: 'page' },
  ),
} as const;
`,
  );
  const before = new Map(fs.getFiles());
  await assertRejects(
    () =>
      removeUiPage(
        { projectRoot: ROOT, path: 'admin/catalog' },
        fs,
        () => Promise.resolve(),
        FORMATTER,
      ),
    Error,
    'page is missing but its registration remains',
  );
  assertEquals(fs.getFiles(), before);
});

Deno.test('page removal unlinks the top-bar entry that ui:add page wrote', async () => {
  const fs = new MemoryFileSystemAdapter();
  const navigationPath = `${ROOT}/navigation.ts`;
  const navigation = await readTemplateAsset(TEMPLATE_KEYS.appNavigation);
  await fs.writeFile(
    ROUTER,
    `import { createRouteReference } from '@netscript/fresh/route';
export const appRoutes = {
  home: routes.$route,
} as const;
`,
  );
  await fs.writeFile(navigationPath, navigation);
  await scaffoldUiPage({ projectRoot: ROOT, path: 'notes' }, fs);
  assert((await fs.readFile(navigationPath)).includes("appRoutes['notes']"));

  const preview = await removeUiPage(
    { projectRoot: ROOT, path: 'notes', dryRun: true },
    fs,
    () => Promise.resolve(),
    FORMATTER,
  );
  assertEquals(preview.navigationChanged, true);
  assert((await fs.readFile(navigationPath)).includes("appRoutes['notes']"));

  const result = await removeUiPage(
    { projectRoot: ROOT, path: 'notes' },
    fs,
    () => Promise.resolve(),
    FORMATTER,
  );
  assertEquals(result.navigationChanged, true);
  assertEquals(await fs.readFile(navigationPath), navigation);
});

Deno.test('page removal works when the app has no navigation.ts', async () => {
  const fs = await fixture();
  const result = await removeUiPage(
    { projectRoot: ROOT, path: 'admin/catalog' },
    fs,
    () => Promise.resolve(),
    FORMATTER,
  );
  assertEquals(result.status, 'removed');
  assertEquals(result.navigationChanged, false);
  assert(!await fs.exists(`${ROOT}/navigation.ts`));
});

Deno.test('page removal ignores the route binding the Fresh generator injects', async () => {
  const fs = await fixture();
  const generated = await fs.readFile(PAGE);
  // What `generate routes` / the Vite plugin writes into every page module (WI-12 binding pass).
  await fs.writeFile(
    PAGE,
    generated
      .replace(
        "import { definePage } from '@app/utils.ts';\n",
        "import { definePage } from '@app/utils.ts';\nimport { routes } from '@app/.generated/routes.ts';\n",
      )
      .replace('definePage()\n', 'definePage()\n  .withRoute(routes.admin.catalog.$route)\n'),
  );
  const result = await removeUiPage(
    { projectRoot: ROOT, path: 'admin/catalog' },
    fs,
    () => Promise.resolve(),
    FORMATTER,
  );
  assertEquals(result.status, 'removed');
  assert(!await fs.exists(PAGE));
});

Deno.test('page removal still refuses a page the author edited', async () => {
  const fs = await fixture();
  await fs.writeFile(PAGE, (await fs.readFile(PAGE)).replace('Start building', 'My notes'));
  await assertRejects(
    () =>
      removeUiPage(
        { projectRoot: ROOT, path: 'admin/catalog' },
        fs,
        () => Promise.resolve(),
        FORMATTER,
      ),
    Error,
    'has diverged',
  );
});
