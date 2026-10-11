import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { join, resolve } from '@std/path';
import { createPublicCommandDependencies } from '../../root/public-command-dependencies.ts';
import {
  createPublicCommandRegistry,
  createPublicCommandTree,
} from '../../root/public-command-tree.ts';

interface Fixture {
  readonly root: string;
  readonly app: (name: string) => string;
  readonly run: (args?: string[], cwd?: string) => Promise<void>;
}

async function withFixture(run: (fixture: Fixture) => Promise<void>): Promise<void> {
  const root = await Deno.makeTempDir({ prefix: 'netscript-generate-routes-' });
  const app = (name: string) => join(root, 'apps', name);
  try {
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({
        workspace: ['apps/alpha', 'apps/beta'],
      }),
    );
    await Deno.writeTextFile(join(root, 'appsettings.json'), '{}');
    for (const name of ['alpha', 'beta']) {
      await Deno.mkdir(join(app(name), 'routes'), { recursive: true });
      await Deno.writeTextFile(join(app(name), 'routes', 'index.tsx'), 'export default {}\n');
      await Deno.writeTextFile(join(app(name), 'router.ts'), '// authored router\n');
    }
    await run({
      root,
      app,
      run: async (args = [], cwd = root) => {
        const command = createPublicCommandTree({
          cwd: () => cwd,
          resolvePath: (path) => resolve(cwd, path ?? '.'),
        });
        await command.parse(['generate', 'routes', ...args]);
      },
    });
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

async function generated(appRoot: string): Promise<readonly string[]> {
  return await Promise.all(
    ['manifest.ts', 'routes.ts'].map((file) =>
      Deno.readTextFile(join(appRoot, '.generated', file))
    ),
  );
}

Deno.test('generate routes selects the named app and leaves other apps and authored files alone', async () => {
  await withFixture(async ({ app, run }) => {
    await run(['--app', 'beta']);
    assertStringIncludes((await generated(app('beta')))[0], '"/"');
    assertEquals(await Deno.readTextFile(join(app('beta'), 'router.ts')), '// authored router\n');
    assertEquals(
      await Deno.readTextFile(join(app('beta'), 'routes/index.tsx')),
      'export default {}\n',
    );
    await assertRejects(() => Deno.stat(join(app('alpha'), '.generated')), Deno.errors.NotFound);
  });
});

Deno.test('generate routes accepts an explicit app root and prefers it over the app selector', async () => {
  await withFixture(async ({ app, run, root }) => {
    await run(['--project-root', 'apps/alpha', '--app', 'missing'], root);
    assertEquals((await generated(app('alpha'))).length, 2);
    await assertRejects(() => Deno.stat(join(app('beta'), '.generated')), Deno.errors.NotFound);
  });
});

Deno.test('generate routes infers the current app and the sole remaining workspace app', async () => {
  await withFixture(async ({ app, run, root }) => {
    await run([], join(app('beta'), 'routes'));
    assertEquals((await generated(app('beta'))).length, 2);
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({ workspace: ['apps/alpha'] }),
    );
    await run();
    assertEquals((await generated(app('alpha'))).length, 2);
  });
});

Deno.test('generate routes rejects ambiguous, unknown, and invalid targets before writing', async () => {
  await withFixture(async ({ app, run, root }) => {
    await assertRejects(() => run(), Error, 'Multiple Fresh apps');
    await assertRejects(() => run(['--app', 'missing']), Error, 'was not found');
    await assertRejects(() => run(['--project-root', root]), Deno.errors.NotFound);
    for (const target of [root, app('alpha'), app('beta')]) {
      await assertRejects(() => Deno.stat(join(target, '.generated')), Deno.errors.NotFound);
    }
  });
});

Deno.test('generate routes is byte deterministic and idempotent without rewriting derived modules', async () => {
  await withFixture(async ({ app, run }) => {
    await run(['--app', 'alpha']);
    const first = await generated(app('alpha'));
    const paths = ['manifest.ts', 'routes.ts'].map((file) =>
      join(app('alpha'), '.generated', file)
    );
    // An old timestamp distinguishes a skipped write without depending on clock resolution.
    const sentinel = new Date('2000-01-01T00:00:00Z');
    for (const path of paths) await Deno.utime(path, sentinel, sentinel);
    await run(['--app', 'alpha']);
    assertEquals(await generated(app('alpha')), first);
    for (const path of paths) assertEquals((await Deno.stat(path)).mtime, sentinel);
    await Deno.remove(join(app('alpha'), '.generated'), { recursive: true });
    await run(['--app', 'alpha']);
    assertEquals(await generated(app('alpha')), first);
  });
});

Deno.test('generate routes reconstructs added, moved, and deleted routes without a Vite build', async () => {
  await withFixture(async ({ app, run }) => {
    const routes = join(app('alpha'), 'routes');
    await Deno.mkdir(join(routes, 'catalog'));
    await Deno.writeTextFile(join(routes, 'catalog/index.tsx'), 'export default {}\n');
    await run(['--app', 'alpha']);
    assertStringIncludes((await generated(app('alpha')))[0], '/catalog');
    await Deno.rename(join(routes, 'catalog'), join(routes, 'inventory'));
    await run(['--app', 'alpha']);
    const moved = await generated(app('alpha'));
    assertStringIncludes(moved[0], '/inventory');
    assertStringIncludes(moved[1], 'inventory');
    for (const source of moved) assert(!source.includes('catalog'));
    await Deno.remove(join(routes, 'inventory'), { recursive: true });
    await run(['--app', 'alpha']);
    for (const source of await generated(app('alpha'))) assert(!source.includes('inventory'));
    assertEquals(await Deno.readTextFile(join(app('alpha'), 'router.ts')), '// authored router\n');
  });
});

Deno.test('generate routes live help exposes application selectors on the public command tree', () => {
  const host = { cwd: () => Deno.cwd(), resolvePath: (path?: string) => resolve(path ?? '.') };
  const root = createPublicCommandRegistry().program({
    name: 'netscript',
    version: 'test',
    description: 'public CLI',
    context: { host, dependencies: createPublicCommandDependencies(host) },
  });
  root.getHelp({ colors: false });
  const group = root.getCommands().find((command) => command.getName() === 'generate');
  assert(group);
  const routes = group.getCommands().find((command) => command.getName() === 'routes');
  assert(routes);
  const help = routes.getHelp({ colors: false, width: 160 });
  assertStringIncludes(help, '--app');
  assertStringIncludes(help, '--project-root');
  assertStringIncludes(help, 'without a Vite build');
});
