import { assertEquals, assertRejects } from '@std/assert';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { resolvePluginAppReferences } from './plugin-app-references.ts';

Deno.test('plugin app selection defaults to enabled web apps and supports an explicit app', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/appsettings.json',
    JSON.stringify({
      NetScript: {
        Apps: {
          shop: { Type: 'app', PluginReferences: ['existing'] },
          admin: {},
          off: { Enabled: false },
          task: { Type: 'task' },
          desktop: { Type: 'desktop' },
        },
      },
    }),
  );
  const before = await fs.readFile('/project/appsettings.json');
  assertEquals(await resolvePluginAppReferences({ projectRoot: '/project' }, fs), [
    'admin',
    'shop',
  ]);
  assertEquals(await resolvePluginAppReferences({ projectRoot: '/project', app: 'shop' }, fs), [
    'shop',
  ]);
  for (const app of ['missing', 'off', 'task', 'desktop']) {
    await assertRejects(
      () => resolvePluginAppReferences({ projectRoot: '/project', app }, fs),
      Error,
      'must name an enabled web application',
    );
  }
  assertEquals(await fs.readFile('/project/appsettings.json'), before);
});

Deno.test('plugin app selection permits headless projects and rejects an explicit missing app', async () => {
  const fs = new MemoryFileSystemAdapter();
  assertEquals(await resolvePluginAppReferences({ projectRoot: '/project' }, fs), []);
  await assertRejects(() =>
    resolvePluginAppReferences({ projectRoot: '/project', app: 'shop' }, fs)
  );
});

Deno.test('explicit app overrides installed consumers and package defaults without overwriting settings', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/appsettings.json',
    JSON.stringify({ NetScript: { Apps: { web: {}, admin: {} } } }),
  );
  await fs.writeFile(
    '/project/workers/scaffold.plugin.json',
    JSON.stringify({ linking: { consumers: { apps: ['web'] } } }),
  );
  const request = { projectRoot: '/project', pluginName: 'workers', overwrite: true };
  assertEquals(await resolvePluginAppReferences(request, fs, ['admin']), ['web']);
  assertEquals(await resolvePluginAppReferences({ ...request, app: 'admin' }, fs, ['web']), [
    'admin',
  ]);
});
