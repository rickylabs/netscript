import { assertEquals, assertRejects } from '@std/assert';
import { ConfigInvalidError } from '../../domain/errors.ts';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { writeInstalledAuthFixture } from '../../../../tests/installed-auth-fixture.ts';
import { readAuthServiceName, serviceAuthTemplate } from './auth-policy.ts';

Deno.test('service auth discovery uses the public installer manifest in configured directories', async () => {
  const fs = new MemoryFileSystemAdapter();
  await writeInstalledAuthFixture(fs, '/project');
  const settings = JSON.parse(await fs.readFile('/project/appsettings.json'));
  assertEquals('PackageSpecifier' in settings.NetScript.Plugins.auth, false);
  assertEquals(await readAuthServiceName('/project', fs), 'auth');

  // Relocate the actual installed manifest beyond the conventional one-level scan.
  await fs.copy(
    '/project/auth/scaffold.plugin.json',
    '/project/custom/plugins/auth/scaffold.plugin.json',
  );
  await fs.remove('/project/auth');
  const config = await fs.readFile('/project/netscript.config.ts');
  await fs.writeFile(
    '/project/netscript.config.ts',
    config.replace('./auth/plugin.ts', './custom/plugins/auth/plugin.ts'),
  );
  assertEquals(await readAuthServiceName('/project', fs), 'auth');
  settings.NetScript.Plugins.auth.Enabled = false;
  await fs.writeFile('/project/appsettings.json', JSON.stringify(settings));
  assertEquals(await readAuthServiceName('/project', fs), undefined);
});

Deno.test('service auth discovery rejects an installed manifest with a renamed config key', async () => {
  const fs = new MemoryFileSystemAdapter();
  await writeInstalledAuthFixture(fs, '/project');
  const settings = JSON.parse(await fs.readFile('/project/appsettings.json'));
  // Rename the real persisted entry without inventing installer fields. This is
  // an unsupported manual migration, not a claim that the CLI installed it.
  settings.NetScript.Plugins.identity = settings.NetScript.Plugins.auth;
  delete settings.NetScript.Plugins.auth;
  await fs.writeFile('/project/appsettings.json', JSON.stringify(settings));
  await assertRejects(
    () => readAuthServiceName('/project', fs),
    ConfigInvalidError,
    'Service add requires the canonical auth key; install auth with --name auth',
  );
});

for (
  const [name, settings] of [
    ['root null', null],
    ['root array', []],
    ['NetScript null', { NetScript: null }],
    ['plugins array', { NetScript: { Plugins: [] } }],
    ['plugin null', { NetScript: { Plugins: { auth: null } } }],
    ['invalid Enabled', { NetScript: { Plugins: { auth: { Enabled: 'yes' } } } }],
    ['background processors null', { NetScript: { BackgroundProcessors: null } }],
  ] as const
) {
  Deno.test(`service auth discovery rejects malformed appsettings: ${name}`, async () => {
    const fs = new MemoryFileSystemAdapter();
    await fs.writeFile('/project/appsettings.json', JSON.stringify(settings));
    await assertRejects(
      () => readAuthServiceName('/project', fs),
      ConfigInvalidError,
      'Invalid appsettings.json auth configuration:',
    );
  });
}

Deno.test('service auth discovery gives an actionable JSON error', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/project/appsettings.json', '{');
  await assertRejects(
    () => readAuthServiceName('/project', fs),
    ConfigInvalidError,
    'Invalid appsettings.json: expected valid JSON.',
  );
});

Deno.test('service scaffold exposes an explicit opt-out for lifecycle reconciliation', () => {
  assertEquals(serviceAuthTemplate().authImports, '');
  assertEquals(serviceAuthTemplate().authPolicy.includes('public: true'), true);
  assertEquals(serviceAuthTemplate().authPolicy.includes('createScopeAuthorizer'), false);
});
